"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CHANNEL_LABELS: Record<string, string> = { EMAIL: "Email", WHATSAPP: "WhatsApp" };
const TONE_LABELS: Record<string, string> = {
  AMICALE: "amicale",
  FERME: "ferme",
  MISE_EN_DEMEURE: "dernier avertissement",
};

type RunResult = { clientName: string; channel: string; tone: string; snippet: string };
type DraftedResult = { clientName: string; reason: string };

export function PortfolioAutopilot({
  pendingCount,
  suspended,
  proposeOnly,
}: {
  pendingCount: number;
  suspended: boolean;
  proposeOnly: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);
  const [drafted, setDrafted] = useState<DraftedResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResults(null);
    setDrafted(null);
    try {
      const res = await fetch("/api/portfolio/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec du pilotage automatique");
      setResults(data.results);
      setDrafted(data.drafted);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setRunning(false);
    }
  }

  const blocked = suspended || pendingCount === 0;

  return (
    <div className="rounded-xl border border-violet-velos/30 bg-lavande/20 p-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">Pilotage automatique</h2>
          <p className="mt-0.5 text-sm text-graphite/70">
            {suspended
              ? "Le Communication Specialist est suspendu : Yas ne rédige ni n'envoie rien. Reprenez-le dans Agents IA."
              : pendingCount > 0
              ? proposeOnly
                ? `Yas prépare en brouillon les ${pendingCount} relance(s) dues aujourd'hui — vous validez dans Messages (mode « propose seulement »).`
                : `Yas traite d'affilée les ${pendingCount} dossier(s) dont la relance ne demande pas de validation — sans ouvrir chaque dossier un par un.`
              : "Aucun dossier n'a de relance automatique due pour l'instant. Avancez la démo de quelques jours pour voir arriver de nouvelles relances."}
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running || blocked}
          className="shrink-0 rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Yas travaille…" : "Lancer Yas sur le portefeuille"}
        </button>
      </div>

      {running && <p className="mt-3 text-xs text-violet-velos">Analyse, rédaction et contrôle en cours, dossier par dossier…</p>}
      {error && <p className="mt-3 text-sm text-corail">{error}</p>}

      {results && results.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-violet-velos/20 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">{results.length} dossier(s) traité(s) et envoyé(s)</p>
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

      {drafted && drafted.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-azur/30 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-azur">
            {drafted.length} brouillon(s) à valider dans{" "}
            <Link href="/messages" className="underline">
              Messages
            </Link>
          </p>
          {drafted.map((b, i) => (
            <div key={i} className="rounded-lg border border-azur/30 bg-white p-2.5 text-sm">
              <p className="font-medium text-indigo-deep">{b.clientName}</p>
              <p className="mt-0.5 text-xs text-graphite/60">{b.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
