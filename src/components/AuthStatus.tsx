"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded border border-[var(--brand-primary)] px-3 py-1 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white"
      >
        Sign in
      </button>
    );
  }

  const name = session.user?.name || session.user?.email || "Account";

  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--brand-primary)]/80">{name}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="rounded bg-[var(--brand-primary)] px-3 py-1 text-white hover:bg-[var(--brand-accent)]"
      >
        Sign out
      </button>
    </div>
  );
}
