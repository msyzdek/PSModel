"use client";

import { useEffect, useState } from "react";

interface ImportedYearBannerProps {
  importedYear: string | null;
}

export default function ImportedYearBanner({ importedYear }: ImportedYearBannerProps) {
  const [visible, setVisible] = useState(() => Boolean(importedYear));

  useEffect(() => {
    if (!importedYear) {
      setVisible(false);
      return;
    }
    setVisible(true);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("importedYear");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", nextUrl);
    } catch (e) {
      console.error("Error updating URL in ImportedYearBanner:", e);
    }
  }, [importedYear]);

  if (!visible || !importedYear) return null;

  return (
    <div className="rounded-2xl border border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 px-6 py-4 text-sm text-[var(--brand-primary)] shadow-md">
      Imported QuickBooks data for {importedYear}.
    </div>
  );
}

