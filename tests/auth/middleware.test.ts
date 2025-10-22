import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Auth middleware", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = process.env.AUTH_SECRET || "testsecret";
  });

  it("redirects unauthenticated browser requests to /signin with callback", async () => {
    const req = new NextRequest("http://localhost:3000/year/2025", { headers: { accept: "text/html" } });
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    const loc = res.headers.get("location");
    expect(loc).toBeTruthy();
    const url = new URL(loc!);
    expect(url.pathname).toBe("/signin");
    expect(url.searchParams.get("callbackUrl")).toBe("/year/2025");
  });

  it("returns 401 for unauthenticated API requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/qbo/connect", { headers: { accept: "application/json" } });
    const res = await middleware(req);
    expect(res.status).toBe(401);
  });

  it("allows public sign-in route without session", async () => {
    const req = new NextRequest("http://localhost:3000/signin");
    const res = await middleware(req);
    // NextResponse.next() has status 200 and no Location header
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
