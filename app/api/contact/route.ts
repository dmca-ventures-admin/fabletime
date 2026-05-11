import { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'dmca-ventures-admin';
const REPO_NAME = 'fabletime';
const LABEL_NAME = 'Contact Us';
const LABEL_COLOR = '0075ca';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions per hour per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { name, email, message } = await request.json();

    // Validate required fields
    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Length guards
    if (name.trim().length > MAX_NAME_LENGTH) {
      return Response.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (email.trim().length > MAX_EMAIL_LENGTH) {
      return Response.json(
        { error: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (!GITHUB_TOKEN) {
      console.error('[contact] GITHUB_TOKEN not set');
      return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };

    // Ensure the label exists (silently ignore 422 = already exists)
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/labels`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: LABEL_NAME, color: LABEL_COLOR }),
    });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    // Title: "Contact Us: <name> — <first 60 chars of message>"
    const messagePreview =
      trimmedMessage.length > 60
        ? trimmedMessage.slice(0, 60) + '…'
        : trimmedMessage;
    const issueTitle = `Contact Us: ${trimmedName} — ${messagePreview}`;

    const issueBody = [
      `**Name:** ${trimmedName}`,
      `**Email:** ${trimmedEmail}`,
      '',
      trimmedMessage,
    ].join('\n');

    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: [LABEL_NAME],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('[contact] GitHub API error:', err);
      return Response.json({ error: 'Failed to submit. Please try again.' }, { status: 502 });
    }

    const issue = await res.json();
    return Response.json({ success: true, issueNumber: issue.number });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
