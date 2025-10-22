import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Optional rollout flag: when disabled, skip auth enforcement
  const enabled = (process.env.AUTH_ENABLED ?? "true").toLowerCase();
  if (enabled === "false" || enabled === "0") {
    return NextResponse.next();
  }

  // Allowlist public paths
  const publicPaths = ["/signin", "/api/auth/"];
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/") ||
    publicPaths.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    // For API requests (non-browser), return 401 instead of redirect
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths; handler itself skips public ones
  matcher: ["/(.*)"],
};
