import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk runs ONLY on authenticated areas, auth pages, and the API — never on the
 * marketing site. Marketing routes (`/`, etc.) load no auth and are fully public,
 * so the first experience stays fast and dependency-free. Within the matched set,
 * app/dashboard routes require a signed-in user.
 */
const isProtected = createRouteMatcher(["/app(.*)", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/:path*",
  ],
};
