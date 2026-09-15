"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CHANNEL_LABELS: Record<string, string> = { EMAIL: "Email", WHATSAPP: "WhatsApp" };
const TONE_LABELS: Record<string, string> = {
  AMICALE: "amicale",
  FERME: "ferme",
  MISE_EN_DEMEURE: "dernier avertissement",
};

type RunResult = { clientName: string; channel: string; tone: string; snippet: string };

export function PortfolioAutopilot({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/portfolio/run", { method: "POST" });
      if (!res.ok) throw new Error("Échec du pilotage automatique");
      const data: { results: RunResult[] } = await res.json();
      setResults(data.results);
      router.refresh();
    } catch {
      setError("Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-velos/30 bg-lavande/20 p-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Pilotage automatique
          </h2>
          <p className="mt-0.5 text-sm text-graphite/70">
            {pendingCount > 0
              ? `Yasmine traite d'affilée les ${pendingCount} dossier(s) qui ont une relance due aujourd'hui — sans ouvrir chaque dossier un par un.`
              : "Aucun dossier n'a de relance automatique due pour l'instant — tout est à jour."}
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running || pendingCount === 0}
          className="shrink-0 rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Yasmine travaille…" : `Lancer Yasmine sur le portefeuille`}
        </button>
      </div>

      {running && (
        <p className="mt-3 text-xs text-violet-velos">
          Analyse, rédaction et journalisation en cours, dossier par dossier…
        </p>
      )}

      {error && <p className="mt-3 text-sm text-corail">{error}</p>}

      {results && (
        <div className="mt-4 flex flex-col gap-2 border-t border-violet-velos/20 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">
            {results.length} dossier(s) traité(s)
          </p>
          {results.map((r, i) => (
            <div key={i} className="rounded-lg bg-white p-2.5 text-sm">
              <p className="font-medium text-indigo-deep">
                ✓ {r.clientName} — {CHANNEL_LABELS[r.channel] ?? r.channel} ({TONE_LABELS[r.tone] ?? r.tone})
              </p>
              <p className="mt-0.5 text-xs text-graphite/60">{r.snippet}…</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
