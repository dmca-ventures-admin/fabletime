#!/usr/bin/env ts-node
/**
 * scripts/check-models.ts
 *
 * Weekly model freshness checker (run via HEARTBEAT.md).
 * 1. Lists available Anthropic models
 * 2. Finds the latest claude-opus-4-x and claude-haiku-4-x versions
 * 3. Compares to what's in lib/models.ts
 * 4. If newer versions exist: updates models.ts, commits, and pushes
 * 5. Posts a Discord notification if models were updated
 *
 * Run via:
 *   doppler run --project fabletime --config prd -- npx ts-node --project tsconfig.json scripts/check-models.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DISCORD_CHANNEL_ID = '1485963277342085190';
const MODELS_FILE = path.resolve(__dirname, '../lib/models.ts');

interface CurrentModels {
  story: string;
  fast: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readCurrentModels(): CurrentModels {
  const content = fs.readFileSync(MODELS_FILE, 'utf-8');
  const storyMatch = content.match(/story:\s*'([^']+)'/);
  const fastMatch = content.match(/fast:\s*'([^']+)'/);
  if (!storyMatch || !fastMatch) {
    throw new Error('Could not parse current model IDs from lib/models.ts');
  }
  return { story: storyMatch[1], fast: fastMatch[1] };
}

function updateModelsFile(story: string, fast: string): void {
  const content = fs.readFileSync(MODELS_FILE, 'utf-8');
  const updated = content
    .replace(/(story:\s*')[^']+(')/,    `$1${story}$2`)
    .replace(/(fast:\s*')[^']+(')/,     `$1${fast}$2`);
  fs.writeFileSync(MODELS_FILE, updated, 'utf-8');
}

/**
 * Pick the "best" model ID from a list of IDs matching a prefix pattern.
 * Prefers dated versions (longer IDs with dates) and returns the most recent one.
 * Falls back to the shortest alias if no dated version exists.
 */
function pickBest(ids: string[], prefixPattern: RegExp): string | null {
  const matching = ids.filter((id) => prefixPattern.test(id));
  if (matching.length === 0) return null;

  // Dated versions look like claude-opus-4-5-20251101 — they have a date suffix
  const dated = matching.filter((id) => /\d{8}$/.test(id));
  if (dated.length > 0) {
    // Sort descending by date suffix → most recent first
    dated.sort((a, b) => {
      const dateA = a.match(/(\d{8})$/)?.[1] ?? '00000000';
      const dateB = b.match(/(\d{8})$/)?.[1] ?? '00000000';
      return dateB.localeCompare(dateA);
    });
    return dated[0];
  }

  // No dated versions — fall back to first match (shortest / most stable alias)
  matching.sort((a, b) => a.length - b.length);
  return matching[0];
}

async function sendDiscordMessage(token: string, channelId: string, content: string): Promise<void> {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[check-models] Discord notification failed:', res.status, body);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[check-models] Starting model freshness check…');

  const client = new Anthropic();
  const discordToken = process.env.DISCORD_BOT_TOKEN ?? '';

  // 1. List all available models
  const page = await client.models.list();
  const allIds: string[] = page.data.map((m: { id: string }) => m.id);
  console.log('[check-models] Available models:', allIds.join(', '));

  // 2. Pick best opus and haiku
  const bestOpus  = pickBest(allIds, /^claude-opus-4/);
  const bestHaiku = pickBest(allIds, /^claude-haiku-4/);

  if (!bestOpus || !bestHaiku) {
    console.error('[check-models] Could not determine best model IDs. Aborting.');
    process.exit(1);
  }

  console.log(`[check-models] Best opus:  ${bestOpus}`);
  console.log(`[check-models] Best haiku: ${bestHaiku}`);

  // 3. Compare to current
  const current = readCurrentModels();
  console.log(`[check-models] Current story: ${current.story}`);
  console.log(`[check-models] Current fast:  ${current.fast}`);

  const storyChanged = bestOpus  !== current.story;
  const fastChanged  = bestHaiku !== current.fast;

  if (!storyChanged && !fastChanged) {
    console.log('[check-models] Models are up to date. No changes needed.');
    return;
  }

  // 4. Update models.ts
  const changes: string[] = [];
  if (storyChanged) changes.push(`story: ${current.story} → ${bestOpus}`);
  if (fastChanged)  changes.push(`fast:  ${current.fast}  → ${bestHaiku}`);

  console.log('[check-models] Updating models.ts:', changes.join(', '));
  updateModelsFile(bestOpus, bestHaiku);

  // 5. Commit and push
  try {
    const repoRoot = path.resolve(__dirname, '..');
    execSync('git add lib/models.ts', { cwd: repoRoot, stdio: 'inherit' });
    execSync(
      `git commit -m "chore: update AI models to latest version [skip ci]"`,
      { cwd: repoRoot, stdio: 'inherit' }
    );
    execSync('git push', { cwd: repoRoot, stdio: 'inherit' });
    console.log('[check-models] Committed and pushed changes.');
  } catch (err) {
    console.error('[check-models] Git operations failed:', err);
    // Still send the Discord notification — human can push manually
  }

  // 6. Discord notification
  if (discordToken) {
    const msg = [
      '📦 **Fabletime model update**',
      changes.map((c) => `• ${c}`).join('\n'),
      '_lib/models.ts updated, committed, and pushed._',
    ].join('\n');
    await sendDiscordMessage(discordToken, DISCORD_CHANNEL_ID, msg);
    console.log('[check-models] Discord notification sent.');
  } else {
    console.warn('[check-models] DISCORD_BOT_TOKEN not set — skipping notification.');
  }

  console.log('[check-models] Done.');
}

main().catch((err) => {
  console.error('[check-models] Fatal error:', err);
  process.exit(1);
});
