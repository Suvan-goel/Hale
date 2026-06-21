import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit } from '@/lib/rate-limit';
import { persistSignup } from '@/lib/signup-store';
import { validateSignupRequest } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, message: 'Too many signup attempts. Please wait a little and try again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 });
  }

  const result = validateSignupRequest(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, field: result.field }, { status: 400 });
  }

  try {
    await persistSignup({
      signup: result.value,
      consentAt: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? '',
    });
    return NextResponse.json({
      ok: true,
      message: 'You are on the Hale beta list. We will send the next access step by email.',
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'We could not save your signup right now. Please try again later.' },
      { status: 503 }
    );
  }
}
