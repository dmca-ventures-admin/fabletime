import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/anthropic';

export const runtime = 'edge';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { logApiCall } from '@/lib/cost-logger';
import { MODELS } from '@/lib/models';

export async function POST(request: NextRequest) {
  // Rate limit: 20 question generations per minute per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`questions:${ip}`, 20, 60_000);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { story, characters, theme } = await request.json();

    if (!story || !characters || !theme) {
      return Response.json(
        { error: 'Missing required fields: story, characters, theme' },
        { status: 400 }
      );
    }

    if (typeof story !== 'string') {
      return Response.json({ error: 'story must be a string' }, { status: 400 });
    }
    if (story.length > 10000) {
      return Response.json({ error: 'story must be 10000 characters or fewer' }, { status: 400 });
    }
    if (!Array.isArray(characters) || characters.some((c) => typeof c !== 'string')) {
      return Response.json({ error: 'characters must be an array of strings' }, { status: 400 });
    }
    if (typeof theme !== 'string') {
      return Response.json({ error: 'theme must be a string' }, { status: 400 });
    }

    const characterList = characters.join(', ');

    const t0 = Date.now();
    const response = await anthropic.messages.create({
      model: MODELS.fast,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Based on this children's story, generate exactly 3 discussion questions for a parent to ask their child (ages 8 and under). The questions should be warm, simple, and encourage conversation.

Characters: ${characterList}
Learning theme: ${theme}

Questions must be:
1. A question about what the child enjoyed or found interesting about the story
2. A question about how the character(s) demonstrated the learning theme (${theme})
3. A question about how the learning theme (${theme}) helped lead to a better outcome in the story

Return ONLY a JSON array of exactly 3 strings. No other text, no markdown, no code fences.

Story:
${story.slice(0, 4000)}`,
        },
      ],
    });

    logApiCall({ endpoint: '/api/questions', model: MODELS.fast, usage: response.usage, durationMs: Date.now() - t0 });
    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

    let questions: string[];
    try {
      questions = JSON.parse(cleaned);
    } catch {
      console.error('[Q] Failed to parse AI response:', cleaned);
      return Response.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length !== 3) {
      console.error('[Q] Unexpected questions format:', text);
      return Response.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }

    return Response.json({ questions });
  } catch (error) {
    console.error('[Q] Error generating questions:', error);
    return Response.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
