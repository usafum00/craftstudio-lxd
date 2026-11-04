import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('rise_author_session')?.value;
  const isAuthenticated = session === 'lxd_authenticated_2026';
  return NextResponse.json({ isAuthenticated });
}
