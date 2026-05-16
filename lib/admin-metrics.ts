// NOTE: This module is server-only by virtue of using getServiceSupabase()
// and process.env.GITHUB_TOKEN. It is never imported from a "use client"
// boundary. We don't pull in the 'server-only' marker package to avoid
// adding a dependency (issue #136 constraint).
import { getServiceSupabase } from './supabase';

/**
 * Server-only metrics aggregation for the admin dashboard (issue #136).
 *
 * Each helper returns a typed result that the dashboard page can render
 * directly. Failures are logged and surfaced as a typed { error } payload —
 * the page renders a "data unavailable" state for that card rather than
 * blowing up the whole dashboard. Keeps internal tooling resilient when the
 * DB is partially degraded.
 */

export interface AdminMetrics {
  totalStories: number;
  storiesToday: number;
  storiesThisWeek: number;
  storiesThisMonth: number;
  uniqueUsersTotal: number;
  uniqueUsersToday: number;
  uniqueUsersThisWeek: number;
  uniqueUsersThisMonth: number;
  topCharacters: Array<{ value: string; count: number }>;
  topThemes: Array<{ value: string; count: number }>;
  ratingsDistribution: Array<{ stars: number; count: number }>;
  averageRating: number | null;
  totalRatings: number;
  feedbackCount: number;
  bugCount: number;
  errors: string[];
}

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoUtc(n: number): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function countSince(date: Date | null): Promise<number> {
  const sb = getServiceSupabase();
  let q = sb.from('stories').select('id', { count: 'exact', head: true });
  if (date) q = q.gte('created_at', date.toISOString());
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function loadStoryCounts(errors: string[]) {
  try {
    const [total, today, week, month] = await Promise.all([
      countSince(null),
      countSince(startOfTodayUtc()),
      countSince(daysAgoUtc(7)),
      countSince(daysAgoUtc(30)),
    ]);
    return { total, today, week, month };
  } catch (err) {
    errors.push(
      `story counts: ${err instanceof Error ? err.message : String(err)}`
    );
    return { total: 0, today: 0, week: 0, month: 0 };
  }
}

/**
 * Top N values from a TEXT[] column on the stories table. Implemented in JS
 * because Supabase's PostgREST surface doesn't expose unnest+group_by directly
 * and the volume here (thousands of rows worst case) is small enough that
 * client-side aggregation is fine. If volume grows we can move this into a
 * SQL function.
 */
async function topArrayValues(
  column: 'characters',
  limit: number,
  errors: string[]
): Promise<Array<{ value: string; count: number }>> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('stories')
      .select(column)
      .limit(10000); // cap to avoid pulling unbounded rows
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const arr = (row as Record<string, unknown>)[column];
      if (!Array.isArray(arr)) continue;
      for (const raw of arr) {
        if (typeof raw !== 'string') continue;
        const v = raw.trim().toLowerCase();
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  } catch (err) {
    errors.push(
      `top ${column}: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

async function topThemes(
  limit: number,
  errors: string[]
): Promise<Array<{ value: string; count: number }>> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('stories')
      .select('theme')
      .limit(10000);
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ theme: string | null }>) {
      const v = (row.theme ?? '').trim().toLowerCase();
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  } catch (err) {
    errors.push(
      `top themes: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

async function loadRatings(errors: string[]) {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('ratings')
      .select('stars')
      .limit(10000);
    if (error) throw error;

    const dist = new Map<number, number>([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);
    let total = 0;
    let sum = 0;
    for (const row of (data ?? []) as Array<{ stars: number | null }>) {
      const s = row.stars;
      if (typeof s !== 'number' || s < 1 || s > 5) continue;
      dist.set(s, (dist.get(s) ?? 0) + 1);
      total += 1;
      sum += s;
    }
    return {
      distribution: [...dist.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([stars, count]) => ({ stars, count })),
      total,
      average: total > 0 ? sum / total : null,
    };
  } catch (err) {
    errors.push(
      `ratings: ${err instanceof Error ? err.message : String(err)}`
    );
    return { distribution: [], total: 0, average: null as number | null };
  }
}

/**
 * Unique-user counts based on stories.session_id (issue #140).
 *
 * Pulls every (session_id, created_at) pair in one round-trip and aggregates
 * distinct session ids per window in JS. Same approach as topThemes — at
 * thousands of rows the cost is negligible, and it avoids needing a SQL
 * function on the Supabase side. Rows without a session_id (older rows, or
 * clients with localStorage disabled) are skipped — they're real activity
 * but not attributable to a unique user.
 */
async function loadUniqueUserCounts(errors: string[]) {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('stories')
      .select('session_id, created_at')
      .not('session_id', 'is', null)
      .limit(50000); // generous cap; we only need distinct counts
    if (error) throw error;

    const todayStart = startOfTodayUtc().getTime();
    const weekStart = daysAgoUtc(7).getTime();
    const monthStart = daysAgoUtc(30).getTime();

    const total = new Set<string>();
    const today = new Set<string>();
    const week = new Set<string>();
    const month = new Set<string>();

    for (const row of (data ?? []) as Array<{ session_id: string | null; created_at: string }>) {
      const sid = row.session_id;
      if (!sid) continue;
      total.add(sid);
      const ts = Date.parse(row.created_at);
      if (Number.isNaN(ts)) continue;
      if (ts >= monthStart) month.add(sid);
      if (ts >= weekStart) week.add(sid);
      if (ts >= todayStart) today.add(sid);
    }

    return {
      total: total.size,
      today: today.size,
      week: week.size,
      month: month.size,
    };
  } catch (err) {
    errors.push(
      `unique users: ${err instanceof Error ? err.message : String(err)}`
    );
    return { total: 0, today: 0, week: 0, month: 0 };
  }
}

async function loadIssueCountsFromGitHub(errors: string[]) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    errors.push('github counts: GITHUB_TOKEN not configured');
    return { feedback: 0, bug: 0 };
  }
  const repo = 'dmca-ventures-admin/fabletime';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  async function countLabel(label: string): Promise<number> {
    // Search API returns total_count cheaply without pulling pages of issues.
    const q = encodeURIComponent(`repo:${repo} label:"${label}" is:issue`);
    const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=1`, {
      headers,
      // Always re-fetch — dashboard data must be fresh.
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`GitHub search ${label}: HTTP ${res.status}`);
    }
    const json = (await res.json()) as { total_count?: number };
    return json.total_count ?? 0;
  }

  try {
    const [feedback, bug] = await Promise.all([
      countLabel('feedback'),
      countLabel('bug'),
    ]);
    return { feedback, bug };
  } catch (err) {
    errors.push(
      `github counts: ${err instanceof Error ? err.message : String(err)}`
    );
    return { feedback: 0, bug: 0 };
  }
}

export async function loadAdminMetrics(): Promise<AdminMetrics> {
  const errors: string[] = [];

  const [stories, uniqueUsers, chars, themes, ratings, issues] = await Promise.all([
    loadStoryCounts(errors),
    loadUniqueUserCounts(errors),
    topArrayValues('characters', 10, errors),
    topThemes(10, errors),
    loadRatings(errors),
    loadIssueCountsFromGitHub(errors),
  ]);

  return {
    totalStories: stories.total,
    storiesToday: stories.today,
    storiesThisWeek: stories.week,
    storiesThisMonth: stories.month,
    uniqueUsersTotal: uniqueUsers.total,
    uniqueUsersToday: uniqueUsers.today,
    uniqueUsersThisWeek: uniqueUsers.week,
    uniqueUsersThisMonth: uniqueUsers.month,
    topCharacters: chars,
    topThemes: themes,
    ratingsDistribution: ratings.distribution,
    averageRating: ratings.average,
    totalRatings: ratings.total,
    feedbackCount: issues.feedback,
    bugCount: issues.bug,
    errors,
  };
}
