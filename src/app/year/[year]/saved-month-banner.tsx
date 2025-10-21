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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("savedMonth");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", nextUrl);
    } catch (e) {
      // Log the error to help with debugging URL manipulation issues
      console.error("Error updating URL in SavedMonthBanner:", e);
    }
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
