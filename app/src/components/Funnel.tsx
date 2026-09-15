import Link from "next/link";
import type { WorklistItem } from "@/lib/types";

export type StageKey = "auto" | "appel" | "reponse" | "urgent";

const STAGES: { key: StageKey; label: string; description: string; match: (i: WorklistItem) => boolean }[] = [
  {
    key: "auto",
    label: "Relance automatique",
    description: "Email / WhatsApp — le parcours standard, géré seul par Yas",
    match: (i) => i.nextAction.kind === "EMAIL" || i.nextAction.kind === "WHATSAPP",
  },
  {
    key: "appel",
    label: "Appel humain requis",
    description: "Yas a préparé une fiche, un humain doit appeler",
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

// Largeurs fixes pour dessiner la silhouette d'un entonnoir (pas liées au volume réel) —
// le compte réel de chaque niveau s'affiche en chiffre, la forme donne le sens de parcours.
const TAPER = [100, 78, 56, 36]; // % de largeur au sommet de chaque segment
const STAGE_FILL = ["#DBDCF9", "#63B3ED", "#156C9C", "#FF6868"]; // lavande-struct -> sky -> azur -> corail
const STAGE_TEXT = ["text-indigo-deep", "text-indigo-deep", "text-white", "text-white"];

function segmentClipPath(topPct: number, bottomPct: number): string {
  const topLeft = (100 - topPct) / 2;
  const topRight = 100 - topLeft;
  const bottomLeft = (100 - bottomPct) / 2;
  const bottomRight = 100 - bottomLeft;
  return `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;
}

export function Funnel({ items }: { items: WorklistItem[] }) {
  return (
    <div className="flex flex-col">
      {STAGES.map((stage, i) => {
        const matched = items.filter(stage.match);
        const totalMad = matched.reduce((sum, item) => sum + item.amountMad, 0);
        const topPct = TAPER[i];
        const bottomPct = TAPER[i + 1] ?? TAPER[i] - 14;

        return (
          <Link key={stage.key} href={`/dossiers?stage=${stage.key}`} className="group block">
            <div
              className="relative mx-auto flex h-20 items-center justify-center transition group-hover:opacity-90"
              style={{
                clipPath: segmentClipPath(topPct, bottomPct),
                backgroundColor: STAGE_FILL[i],
                width: "100%",
              }}
            >
              <div className={`flex items-center gap-3 px-4 ${STAGE_TEXT[i]}`}>
                <span className="text-2xl font-bold">{matched.length}</span>
                <span className="text-left text-sm leading-tight">
                  <span className="block font-semibold">{stage.label}</span>
                  <span className="block text-xs opacity-80">
                    {matched.length > 0 ? `${totalMad.toLocaleString("fr-FR")} MAD` : "—"}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      <p className="mt-3 text-center text-xs text-graphite/50">
        Du parcours automatique (large, en haut) au plus critique (étroit, en bas) — clique un niveau pour voir les
        dossiers.
      </p>
    </div>
  );
}

export { STAGES };
