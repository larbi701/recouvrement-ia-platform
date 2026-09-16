import Link from "next/link";
import type { WorklistItem } from "@/lib/types";
import { DEFAULT_THRESHOLDS } from "@/lib/workflow";

// §12.03 des specs : Work Queues, inspirées de Growfin. Un dossier peut apparaître dans
// plusieurs files à la fois (ex: urgent ET high value) — ce ne sont pas des catégories
// exclusives, ce sont des angles de lecture du même portefeuille.
export type QueueKey = "urgent" | "high_value" | "promises" | "strategic" | "disputes" | "validation";

// Le seuil "High Value" suit le seuil de validation configuré dans Paramètres (§12.10),
// d'où une fonction plutôt qu'un tableau statique — le défaut ne sert qu'en secours.
export function getWorkQueues(
  hitlAmountThreshold: number = DEFAULT_THRESHOLDS.hitlAmountThreshold
): {
  key: QueueKey;
  label: string;
  description: string;
  match: (i: WorklistItem) => boolean;
}[] {
  return [
    {
      key: "urgent",
      label: "Urgent Cases",
      description: "Priorité haute ou playbook avancé (intensif, pré-contentieux, transmission avocat)",
      match: (i) => i.priority === "URGENT" || ["INTENSIVE", "PRE_LEGAL", "LEGAL_TRANSFER"].includes(i.playbook),
    },
    {
      key: "high_value",
      label: "High Value",
      description: `Factures de plus de ${hitlAmountThreshold.toLocaleString("fr-FR")} MAD`,
      match: (i) => i.amountMad > hitlAmountThreshold,
    },
    {
      key: "promises",
      label: "Promises Due",
      description: "Promesse de paiement en cours, suivie par le Promise To Pay Manager",
      match: (i) => i.promises.some((p) => p.status === "EN_COURS"),
    },
    {
      key: "strategic",
      label: "Strategic Accounts",
      description: "Comptes stratégiques — traités avec tact, jamais en pur automatique",
      match: (i) => i.strategic,
    },
    {
      key: "disputes",
      label: "Disputes",
      description: "Litige signalé par le client, analysé par le Dispute Specialist",
      match: (i) => i.replies.some((r) => r.classifiedIntent === "CONTESTATION"),
    },
    {
      key: "validation",
      label: "Pending Validation",
      description: "Action proposée par Yas, en attente de validation humaine",
      match: (i) =>
        i.nextAction.kind === "LEGAL_TRANSFER" ||
        (("requiresValidation" in i.nextAction) && i.nextAction.requiresValidation),
    },
  ];
}

const QUEUE_STYLES: Record<QueueKey, string> = {
  urgent: "border-corail/40 bg-corail/10",
  high_value: "border-violet-velos/30 bg-lavande/20",
  promises: "border-azur/30 bg-azur/5",
  strategic: "border-violet-velos/30 bg-lavande/20",
  disputes: "border-corail/30 bg-corail/5",
  validation: "border-sky/40 bg-sky/10",
};

export function WorkQueueGrid({ items, hitlAmountThreshold }: { items: WorklistItem[]; hitlAmountThreshold: number }) {
  const queues = getWorkQueues(hitlAmountThreshold);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {queues.map((queue) => {
        const matched = items.filter(queue.match);
        const totalMad = matched.reduce((sum, i) => sum + i.amountMad, 0);
        return (
          <Link
            key={queue.key}
            href={`/dossiers?queue=${queue.key}`}
            className={`rounded-xl border p-4 transition hover:border-violet-velos/50 ${QUEUE_STYLES[queue.key]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-graphite/60">{queue.label}</p>
            <p className="mt-1 text-3xl font-bold text-indigo-deep">{matched.length}</p>
            <p className="text-xs text-graphite/50">{queue.description}</p>
            {matched.length > 0 && (
              <p className="mt-2 text-xs font-medium text-violet-velos">{totalMad.toLocaleString("fr-FR")} MAD</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
