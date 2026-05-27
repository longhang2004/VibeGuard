import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth session cookie (set client-side when user logs in)
  const hasSession = request.cookies.get('vibeguard_session')?.value === 'true';

  // Redirect unauthenticated users away from protected routes
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register
  const isAuthPath = authPaths.some((path) => pathname === path);
  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
