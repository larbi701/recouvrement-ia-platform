"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Traitement humain d'une réponse client : accorder un délai (crée une promesse de paiement
// suivie) ou simplement la marquer traitée — le dossier est alors débloqué.
export function ReplyResolver({ replyId, intent }: { replyId: string; intent: string | null }) {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolve(action: "HANDLED" | "GRANT_DELAY") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/replies/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyId, action, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {intent === "DEMANDE_DELAI" && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-graphite/70">
              Accorder
              <input
                type="number"
                min={1}
                max={180}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-16 rounded-lg border border-lavande-struct p-1.5 text-sm"
              />
              jours
            </label>
            <button
              onClick={() => resolve("GRANT_DELAY")}
              disabled={busy}
              className="rounded-lg bg-indigo-deep px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Accorder le délai
            </button>
          </>
        )}
        <button
          onClick={() => resolve("HANDLED")}
          disabled={busy}
          className="rounded-lg border border-lavande-struct px-3 py-1.5 text-sm font-medium text-graphite hover:bg-perle disabled:opacity-50"
        >
          Marquer comme traité
        </button>
      </div>
      {intent === "DEMANDE_DELAI" && (
        <p className="text-[11px] text-graphite/50">
          Accorder le délai crée une promesse de paiement : les relances sont suspendues jusqu&apos;à l&apos;échéance.
        </p>
      )}
      {error && <p className="text-xs text-corail">{error}</p>}
    </div>
  );
}
