import Link from "next/link";
import type { WorklistItem } from "@/lib/types";

export type StageKey = "auto" | "appel" | "reponse" | "urgent";

const STAGES: { key: StageKey; label: string; description: string; match: (i: WorklistItem) => boolean }[] = [
  {
    key: "auto",
    label: "Relance automatique",
    description: "Email / WhatsApp — le parcours standard",
    match: (i) => i.nextAction.kind === "EMAIL" || i.nextAction.kind === "WHATSAPP",
  },
  {
    key: "appel",
    label: "Appel humain requis",
    description: "Yasmine a préparé une fiche, un humain doit appeler",
    match: (i) => i.nextAction.kind === "CALL_TASK",
  },
  {
    key: "reponse",
    label: "Réponse client à traiter",
    description: "Le client a répondu — décision humaine en attente",
    match: (i) => i.nextAction.kind === "WAIT_HUMAN",
  },
  {
    key: "urgent",
    label: "Urgent / plafond légal",
    description: "Priorité haute ou proche des 120 jours (loi 69-21)",
    match: (i) => i.priority === "URGENT" || i.nextAction.kind === "LEGAL_ESCALATION",
  },
];

const STAGE_STYLES: Record<StageKey, string> = {
  auto: "border-lavande-struct bg-white",
  appel: "border-corail/30 bg-corail/5",
  reponse: "border-azur/30 bg-azur/5",
  urgent: "border-corail/40 bg-corail/10",
};

export function Funnel({ items }: { items: WorklistItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STAGES.map((stage) => {
        const matched = items.filter(stage.match);
        const totalMad = matched.reduce((sum, i) => sum + i.amountMad, 0);
        return (
          <Link
            key={stage.key}
            href={`/dossiers?stage=${stage.key}`}
            className={`rounded-xl border p-4 transition hover:border-violet-velos/40 ${STAGE_STYLES[stage.key]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">{stage.label}</p>
            <p className="mt-1 text-3xl font-bold text-indigo-deep">{matched.length}</p>
            <p className="text-xs text-graphite/50">{stage.description}</p>
            {matched.length > 0 && (
              <p className="mt-2 text-xs font-medium text-violet-velos">
                {totalMad.toLocaleString("fr-FR")} MAD →
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export { STAGES };
