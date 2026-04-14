import { NextResponse, NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Supabase session refresh for /channels routes
  if (request.nextUrl.pathname.startsWith('/channels') || request.nextUrl.pathname.startsWith('/auth/callback')) {
    return updateSession(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/auth/:path*', '/channels/:path*'],
};
