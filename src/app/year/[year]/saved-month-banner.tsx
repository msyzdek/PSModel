"use client";

import { useEffect, useState } from "react";

interface SavedMonthBannerProps {
  savedMonth: string | null;
  label: string | null;
}

export default function SavedMonthBanner({ savedMonth, label }: SavedMonthBannerProps) {
  const [visible, setVisible] = useState(() => Boolean(savedMonth && label));

  useEffect(() => {
    if (!savedMonth || !label) {
      setVisible(false);
      return;
    }
    setVisible(true);

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("savedMonth");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", nextUrl);
    } catch {}
  }, [label, savedMonth]);

  if (!visible || !label) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 px-6 py-4 text-sm text-[var(--brand-primary)] shadow-md">
      Saved changes for {label}.
    </div>
  );
}
