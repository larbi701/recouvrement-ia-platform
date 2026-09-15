import Link from "next/link";
import type { WorklistItem } from "@/lib/types";

const PRIORITY_STYLES: Record<WorklistItem["priority"], string> = {
  URGENT: "bg-corail/10 text-indigo-deep ring-corail/40",
  A_TRAITER: "bg-sky/15 text-azur ring-sky/40",
  SURVEILLANCE: "bg-lavande-struct text-graphite/70 ring-lavande-struct",
};

const PRIORITY_LABELS: Record<WorklistItem["priority"], string> = {
  URGENT: "Urgent",
  A_TRAITER: "À traiter",
  SURVEILLANCE: "Surveillance",
};

const NEXT_ACTION_LABELS: Record<WorklistItem["nextAction"]["kind"], string> = {
  EMAIL: "→ Relance email à générer",
  WHATSAPP: "→ Message WhatsApp à générer",
  CALL_TASK: "→ Appel humain à préparer/traiter",
  WAIT_HUMAN: "→ Réponse client à traiter",
  LEGAL_ESCALATION: "→ Plafond légal dépassé",
};

export function DossierCards({ items }: { items: WorklistItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">
        Aucun dossier dans ce niveau pour l&apos;instant.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.invoiceId}>
          <Link
            href={`/dossiers/${item.invoiceId}`}
            className="block rounded-xl border border-lavande-struct bg-white p-4 transition hover:border-violet-velos/40 hover:bg-lavande-struct/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-indigo-deep">{item.clientName}</span>
                  {item.strategic && (
                    <span title="Client stratégique" className="text-violet-velos">
                      ★
                    </span>
                  )}
                  {item.callTasks.some((c) => c.status === "A_FAIRE") && (
                    <span className="rounded-full bg-corail/10 px-2 py-0.5 text-[11px] font-medium text-indigo-deep ring-1 ring-corail/30">
                      Appel à faire
                    </span>
                  )}
                  {item.replies.length > 0 && (
                    <span className="rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur ring-1 ring-azur/30">
                      Réponse à traiter
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-graphite/70">{item.reasoning}</p>
                <p className="mt-1 text-xs font-medium text-violet-velos">
                  {NEXT_ACTION_LABELS[item.nextAction.kind]}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold text-indigo-deep">{item.amountMad.toLocaleString("fr-FR")} MAD</div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
                >
                  {PRIORITY_LABELS[item.priority]}
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
