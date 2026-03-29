import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { value, type } = await request.json();

    if (!value || !type || !['character', 'theme'].includes(type)) {
      return NextResponse.json(
        { error: 'Missing required fields: value, type (character|theme)' },
        { status: 400 }
      );
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 50) {
      return NextResponse.json({ valid: true, suggestion: null });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `You are validating user input for a children's story generator. The user entered "${trimmed}" as a ${type}.

Check if this is:
1. A valid, recognizable ${type} for a children's story (ages 4-8)
2. Correctly spelled

Reply with ONLY a JSON object (no markdown, no code fences):
{"valid": true/false, "suggestion": "corrected spelling or null"}

If valid and correctly spelled: {"valid": true, "suggestion": null}
If misspelled but recognizable: {"valid": false, "suggestion": "correct spelling"}
If nonsensical/gibberish: {"valid": false, "suggestion": null}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      valid: !!result.valid,
      suggestion: result.suggestion || null,
    });
  } catch (error) {
    console.error('[V] Error validating input:', error);
    // Fail open — don't block the user
    return NextResponse.json({ valid: true, suggestion: null });
  }
}
