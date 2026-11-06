import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/thumbnails') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Always allow login page and auth APIs
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2b. Stream large uploads directly to route handler without middleware buffering
  if (pathname === '/api/upload' || pathname === '/api/upload-project') {
    return NextResponse.next();
  }

  // 3. Always allow Reviewer routes for co-instructional designers (/review/[courseId])
  if (pathname.startsWith('/review')) {
    return NextResponse.next();
  }

  // 4. Always allow Learner Preview routes (/courses/[courseId]/preview)
  if (pathname.includes('/preview')) {
    return NextResponse.next();
  }

  // 5. Allow review comments API so reviewers can view and submit feedback
  if (pathname.includes('/review-comments')) {
    return NextResponse.next();
  }

  // 6. Allow read-only GET requests to courses & characters API so review & preview can load course/lesson data
  if (request.method === 'GET' && (pathname.startsWith('/api/courses') || pathname.startsWith('/api/characters'))) {
    return NextResponse.next();
  }

  // Check for author session cookie
  const sessionCookie = request.cookies.get('rise_author_session')?.value;
  const isAuthenticated = sessionCookie === 'lxd_authenticated_2026';

  if (!isAuthenticated) {
    // If it's an API request, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Author passcode required to access authoring studio APIs' },
        { status: 401 }
      );
    }

    // For page requests, redirect to /login with return destination
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and direct streaming upload routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/upload|api/upload-project).*)',
  ],
};
