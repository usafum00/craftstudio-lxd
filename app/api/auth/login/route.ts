import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enteredPasscode = String(body.passcode || '').trim();
    const correctPasscode = (process.env.AUTHOR_PASSCODE || 'lxd2026').trim();

    if (!enteredPasscode) {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
    }

    if (enteredPasscode !== correctPasscode) {
      return NextResponse.json({ error: 'Incorrect author passcode' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: 'Authentication successful' });

    // Set auth cookie valid for 30 days
    response.cookies.set({
      name: 'rise_author_session',
      value: 'lxd_authenticated_2026',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: String(error) },
      { status: 500 }
    );
  }
}
