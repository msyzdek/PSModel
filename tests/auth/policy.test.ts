import { describe, it, expect, beforeEach, vi } from "vitest";
import { authOptions } from "@/lib/auth";
import type { User } from "next-auth";

type SignInParams = { user: User; account: null };

describe("Auth policy (domain and allowlist)", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_ALLOWED_DOMAIN", "example.com");
    vi.stubEnv("AUTH_ALLOWED_EMAILS", "");
  });

  it("allows email matching allowed domain", async () => {
    const ok = await authOptions.callbacks!.signIn!({
      user: { email: "alice@example.com" } as User,
      account: null,
    } as SignInParams);
    expect(ok).toBe(true);
  });

  it("denies email outside domain unless allowlisted", async () => {
    const denied = await authOptions.callbacks!.signIn!({
      user: { email: "bob@other.com" } as User,
      account: null,
    } as SignInParams);
    expect(denied).toBe(false);

    process.env.AUTH_ALLOWED_EMAILS = "bob@other.com";
    const allowed = await authOptions.callbacks!.signIn!({
      user: { email: "bob@other.com" } as User,
      account: null,
    } as SignInParams);
    expect(allowed).toBe(true);
  });
});
