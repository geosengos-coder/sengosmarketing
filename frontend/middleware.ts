import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk authenticates users. Everything except explicitly public routes requires
 * a signed-in user; organization/permission checks happen in route handlers via
 * the helpers in src/lib/auth (Clerk handles identity; our DB owns authorization).
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|woff2?|ttf)).*)",
    // ...and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
