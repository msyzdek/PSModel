"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const params = useSearchParams();
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") || "/";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--brand-primary)]">Sign in</h1>
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error === "AccessDenied"
            ? "Your account is not authorized to access this app."
            : "Sign-in failed. Please try again."}
        </div>
      )}

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="inline-flex items-center gap-2 rounded bg-[var(--brand-primary)] px-4 py-2 font-medium text-white hover:bg-[var(--brand-accent)]"
      >
        Continue with Google
      </button>
    </div>
  );
}

