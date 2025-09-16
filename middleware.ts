import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard']);

export default clerkMiddleware(async (auth, req) => {
  // Get user data first
  const { userId, orgId } = await auth();

  // Protect routes that need authentication
  if (isProtectedRoute(req) && !userId) {
    // Redirect to sign-in if user is not authenticated
    const signInUrl = new URL('/sign-in', req.url);
    // Clerk expects 'redirect_url' for post-auth redirect
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If a user is logged in, prevent them from visiting sign-in/sign-up pages
  if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    let path = '/dashboard';
    if (orgId) {
      path = `/organization/${orgId}`;
    }
    const redirectUrl = new URL(path, req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Continue with the request
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};