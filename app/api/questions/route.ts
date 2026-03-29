import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { story, characters, theme } = await request.json();

    if (!story || !characters || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields: story, characters, theme' },
        { status: 400 }
      );
    }

    const characterList = Array.isArray(characters) ? characters.join(', ') : characters;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
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

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON array from the response
    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const questions: string[] = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length !== 3) {
      console.error('[Q] Unexpected questions format:', text);
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[Q] Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
