import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import type { User, Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

describe("Auth JWT/session mapping", () => {
  beforeEach(async () => {
    await prisma.shareholder.deleteMany();
  });

  it("adds shareholderId to token and session when email matches", async () => {
    const holder = await prisma.shareholder.create({
      data: { name: "Test User", email: "holder@example.com" },
    });

    const tokenIn: JWT = {} as JWT;
    const user: User = { name: "TU", email: "holder@example.com" } as User;
    const tokenOut = await authOptions.callbacks!.jwt!({ token: tokenIn, user, account: null });
    expect((tokenOut as JWT & { shareholderId?: string }).shareholderId).toBe(holder.id);

    const sessionIn: Session = { user, expires: new Date(Date.now() + 3600_000).toISOString() };
    const session = await authOptions.callbacks!.session!({
      session: sessionIn,
      token: tokenOut,
      user: {} as AdapterUser,
      // Provide fields expected by the "update" overload to satisfy types
      newSession: {},
      trigger: "update",
    } as { session: Session; token: JWT; user: AdapterUser; newSession: unknown; trigger: "update" });
    expect((session as Session & { shareholderId?: string }).shareholderId).toBe(holder.id);
  });
});
