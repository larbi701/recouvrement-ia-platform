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

const CHANNEL_LABELS: Record<string, string> = { EMAIL: "Email", WHATSAPP: "WhatsApp" };
const TONE_LABELS: Record<string, string> = {
  AMICALE: "Amicale",
  FERME: "Ferme",
  MISE_EN_DEMEURE: "Dernier avertissement",
};
const INTENT_LABELS: Record<string, string> = {
  DEMANDE_DELAI: "Demande de délai",
  CONTESTATION: "Contestation",
  CONFIRMATION: "Confirmation de paiement",
  AUTRE: "Autre",
};

function CriterionBar({ points, maxPoints }: { points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-lavande-struct">
      <div className="h-full rounded-full bg-violet-velos" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ClassificationCard({
  item,
  validated,
  onValidate,
}: {
  item: WorklistItem;
  validated: boolean;
  onValidate: () => void;
}) {
  const needsGate =
    item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP" || item.nextAction.kind === "CALL_TASK";

  return (
    <div className="rounded-xl border border-lavande-struct bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-velos">
          Agent · Analyste — comment ce dossier a été classé
        </span>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
        >
          {PRIORITY_LABELS[item.priority]} · {item.score}/100
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2.5">
        {item.breakdown.map((c) => (
          <li key={c.label}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-graphite">{c.label}</span>
              <span className="text-graphite/50">
                {c.points}/{c.maxPoints} pts
              </span>
            </div>
            <p className="text-xs text-graphite/60">{c.value}</p>
            <div className="mt-1">
              <CriterionBar points={c.points} maxPoints={c.maxPoints} />
            </div>
          </li>
        ))}
      </ul>

      {item.replies.length > 0 && (
        <div className="mt-4 border-t border-lavande-struct pt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-azur">
            Agent · Négociateur — analyse de la réponse client
          </span>
          <p className="mt-2 text-sm text-graphite/80">
            {item.replies[0].classifiedIntent && (
              <span className="mr-2 rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur">
                {INTENT_LABELS[item.replies[0].classifiedIntent] ?? item.replies[0].classifiedIntent}
              </span>
            )}
            {item.replies[0].agentSummary}
          </p>
        </div>
      )}

      {(item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP") && (
        <div className="mt-4 rounded-lg border border-violet-velos/30 bg-lavande/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-velos">
            Approche recommandée par Yas
          </p>
          <p className="mt-1 text-sm font-medium text-indigo-deep">
            {CHANNEL_LABELS[item.nextAction.kind]} · Ton {TONE_LABELS[item.nextAction.tone]}
          </p>
          <p className="mt-1 text-xs text-graphite/70">{item.nextAction.reason}</p>
        </div>
      )}

      {item.nextAction.kind === "CALL_TASK" && (
        <div className="mt-4 rounded-lg border border-corail/30 bg-corail/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-corail">Approche recommandée par Yas</p>
          <p className="mt-1 text-sm font-medium text-indigo-deep">Appel téléphonique humain</p>
          <p className="mt-1 text-xs text-graphite/70">{item.nextAction.reason}</p>
        </div>
      )}

      {needsGate && (
        <div className="mt-4 border-t border-lavande-struct pt-4">
          {validated ? (
            <p className="text-sm font-medium text-indigo-deep">✓ Approche validée — action disponible ci-dessous.</p>
          ) : (
            <button
              onClick={onValidate}
              className="w-full rounded-lg border-2 border-indigo-deep px-4 py-2 text-sm font-semibold text-indigo-deep transition hover:bg-indigo-deep hover:text-white"
            >
              ✓ Valider cette approche avant que Yas agisse
            </button>
          )}
        </div>
      )}
    </div>
  );
}
