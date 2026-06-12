import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedApiRoute = createRouteMatcher([
  "/api/ai/(.*)",
  "/api/billing/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
