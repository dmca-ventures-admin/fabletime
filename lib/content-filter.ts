import { anthropic } from '@/lib/anthropic';

/**
 * Classifies whether the given text is appropriate as a character name or
 * story theme for a children's storytelling app (ages 4-8).
 *
 * Uses Claude Haiku for fast, cheap classification.  The result is intended
 * to be cached in the `child_friendly` column on `custom_entries` so each
 * entry is only classified once.
 *
 * Fails closed: returns `false` on any error so inappropriate content is
 * never surfaced as a suggestion.
 */
export async function isChildFriendly(text: string): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3,
      system:
        'You are a content filter for a children\'s storytelling app (ages 4-8). ' +
        'Respond with only "yes" or "no". Is the following text appropriate as a ' +
        'character name or story theme for young children?',
      messages: [{ role: 'user', content: text }],
    });

    const answer =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim().toLowerCase()
        : '';

    return answer.startsWith('yes');
  } catch (error) {
    console.error('[S03] Content filter failed for entry:', text, error);
    return false; // fail-closed
  }
}
