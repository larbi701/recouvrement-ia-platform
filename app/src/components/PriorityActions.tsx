import Link from "next/link";
import type { WorklistItem } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  EMAIL: "Envoyer un email",
  WHATSAPP: "Envoyer un WhatsApp",
  CALL_TASK: "Passer un appel",
};

const ACTION_DOT: Record<string, string> = {
  EMAIL: "bg-azur",
  WHATSAPP: "bg-violet-velos",
  CALL_TASK: "bg-corail",
};

// §12.02 Action Center : jamais un tableau analytique — une to-do list dictée par l'IA.
// "Voici les 3 actions prioritaires pour sécuriser 120 000 MAD aujourd'hui."
export function PriorityActions({ items, limit = 5 }: { items: WorklistItem[]; limit?: number }) {
  const actionable = items
    .filter((i) => i.nextAction.kind === "EMAIL" || i.nextAction.kind === "WHATSAPP" || i.nextAction.kind === "CALL_TASK")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const totalMad = actionable.reduce((sum, i) => sum + i.amountMad, 0);

  if (actionable.length === 0) {
    return (
      <div className="rounded-xl border border-lavande-struct bg-white p-5 text-sm text-graphite/60">
        Aucune action prioritaire pour l&apos;instant — tout le portefeuille est à jour ou en attente d&apos;un
        humain.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-velos/30 bg-lavande/20 p-5">
      <h2 className="text-lg font-bold text-indigo-deep">
        Voici les {actionable.length} actions prioritaires pour sécuriser {totalMad.toLocaleString("fr-FR")} MAD
        aujourd&apos;hui
      </h2>
      <ul className="mt-4 flex flex-col gap-2">
        {actionable.map((item) => {
          const kind = item.nextAction.kind;
          const badge =
            kind === "CALL_TASK"
              ? "Suggéré par Collection Strategist"
              : `Suggéré par Communication Specialist${
                  "reason" in item.nextAction ? " · " + item.nextAction.reason.split(" — ")[0] : ""
                }`;
          return (
            <li key={item.invoiceId}>
              <Link
                href={`/dossiers/${item.invoiceId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-lavande-struct bg-white p-3 transition hover:border-violet-velos/40"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${ACTION_DOT[kind]}`} aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-indigo-deep">
                      {item.clientName} — {ACTION_LABELS[kind]}
                      {"tone" in item.nextAction && (
                        <span className="ml-1 font-normal text-graphite/50">({item.nextAction.tone})</span>
                      )}
                    </p>
                    <p className="text-xs text-graphite/50">{badge}</p>
                  </div>
                </div>
                <span className="shrink-0 font-bold text-indigo-deep">
                  {item.amountMad.toLocaleString("fr-FR")} MAD
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
