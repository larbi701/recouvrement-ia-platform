"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bandeau transverse : date simulée + avance rapide. Rejoue en quelques clics ce qu'un
// vrai portefeuille vivrait en plusieurs semaines — utile en démo, mais aussi la seule
// horloge que le moteur de décision lit réellement (settings.simulatedDate).
export function ClockControl({ simulatedDate }: { simulatedDate: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  async function advance(days: number) {
    setLoading(days);
    try {
      const res = await fetch("/api/clock/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const label = new Date(simulatedDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-lavande-struct bg-perle px-2 py-0.5 text-xs font-medium text-graphite/70">
      <span className="text-graphite/50">Démo au</span>
      <span className="font-semibold text-indigo-deep">{label}</span>
      <button
        onClick={() => advance(1)}
        disabled={loading !== null}
        className="ml-1 rounded-full px-1.5 text-[11px] font-semibold text-violet-velos hover:bg-lavande-struct disabled:opacity-40"
        title="Avancer la démo d'un jour"
      >
        {loading === 1 ? "…" : "+1j"}
      </button>
      <button
        onClick={() => advance(7)}
        disabled={loading !== null}
        className="rounded-full px-1.5 text-[11px] font-semibold text-violet-velos hover:bg-lavande-struct disabled:opacity-40"
        title="Avancer la démo de sept jours"
      >
        {loading === 7 ? "…" : "+7j"}
      </button>
    </span>
  );
}
