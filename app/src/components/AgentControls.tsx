"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(body: unknown) {
  const res = await fetch("/api/agents/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Échec");
}

// Interrupteur + niveau d'autonomie d'un agent. Effets réels : un agent suspendu n'est plus
// appelé par aucune route (génération, pilotage automatique, classification).
export function AgentControls({
  agentKey,
  enabled,
  autonomy,
  showAutonomy,
}: {
  agentKey: string;
  enabled: boolean;
  autonomy: "AUTO" | "PROPOSE";
  showAutonomy: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await post({ key: agentKey, ...body });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lavande-struct bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-indigo-deep">{enabled ? "Agent actif" : "Agent suspendu"}</p>
          <p className="text-xs text-graphite/60">
            {enabled
              ? "Il travaille sur le portefeuille selon ses règles."
              : "Il n'est plus appelé : aucune génération, aucun traitement automatique."}
          </p>
        </div>
        <button
          onClick={() => update({ enabled: !enabled })}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            enabled ? "border-2 border-corail text-corail hover:bg-corail hover:text-white" : "bg-indigo-deep text-white hover:opacity-90"
          }`}
        >
          {enabled ? "Suspendre l'agent" : "Reprendre l'agent"}
        </button>
      </div>

      {showAutonomy && (
        <div className="rounded-xl border border-lavande-struct bg-white p-4">
          <p className="text-sm font-semibold text-indigo-deep">Niveau d&apos;autonomie</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                ["AUTO", "Exécute seul les actions standard", "Les relances qui ne demandent pas de validation partent seules ; le reste attend votre feu vert."],
                ["PROPOSE", "Propose seulement", "Yas prépare tout en brouillon. Rien ne part sans votre validation dans Messages."],
              ] as const
            ).map(([value, title, desc]) => (
              <button
                key={value}
                onClick={() => update({ autonomy: value })}
                disabled={busy}
                className={`rounded-lg border p-3 text-left transition ${
                  autonomy === value ? "border-violet-velos bg-lavande/30" : "border-lavande-struct hover:border-violet-velos/40"
                }`}
              >
                <p className="text-sm font-medium text-indigo-deep">
                  {autonomy === value ? "● " : "○ "}
                  {title}
                </p>
                <p className="mt-0.5 text-xs text-graphite/60">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-corail">{error}</p>}
    </div>
  );
}

export function EmergencyStop({ anyEnabled }: { anyEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await post({ all: !anyEnabled });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        anyEnabled ? "border-2 border-corail text-corail hover:bg-corail hover:text-white" : "bg-indigo-deep text-white hover:opacity-90"
      }`}
    >
      {anyEnabled ? "Arrêt d'urgence : tout suspendre" : "Reprendre tous les agents"}
    </button>
  );
}
