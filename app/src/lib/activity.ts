import type { WorklistItem } from "@/lib/types";

export type SpecialistKey =
  | "PORTFOLIO_ANALYST"
  | "COLLECTION_STRATEGIST"
  | "COMMUNICATION_SPECIALIST"
  | "PROMISE_MANAGER"
  | "DISPUTE_SPECIALIST"
  | "CASH_FORECAST_ANALYST"
  | "COLLECTION_SUPERVISOR";

export type ActivityItem = {
  id: string;
  at: string; // ISO
  icon: string;
  actor: "AGENT" | "HUMAIN";
  agent: SpecialistKey | null; // quel spécialiste, si actor === AGENT
  title: string;
  detail: string;
  clientName: string;
  invoiceId: string;
};

const CHANNEL_LABELS: Record<string, string> = { EMAIL: "email", WHATSAPP: "WhatsApp" };
const TONE_LABELS: Record<string, string> = {
  AMICALE: "amicale",
  FERME: "ferme",
  MISE_EN_DEMEURE: "dernier avertissement",
};
const INTENT_LABELS: Record<string, string> = {
  DEMANDE_DELAI: "demande de délai",
  CONTESTATION: "contestation",
  CONFIRMATION: "confirmation de paiement",
  AUTRE: "autre",
};
const OUTCOME_LABELS: Record<string, string> = {
  PROMESSE_PAIEMENT: "promesse de paiement",
  NE_REPOND_PAS: "ne répond pas",
  CONTESTE: "conteste",
  PAYE: "a payé pendant l'appel",
  AUTRE: "autre",
};

// Reconstitue un fil d'activité unifié à partir des relances, appels et réponses —
// pour montrer l'agent en train de travailler, pas juste un tableau de données statique.
export function buildActivityFeed(items: WorklistItem[], limit = 8): ActivityItem[] {
  const events: ActivityItem[] = [];

  for (const item of items) {
    for (const r of item.reminders) {
      events.push({
        id: `reminder-${r.id}`,
        at: r.sentAt,
        icon: r.channel === "WHATSAPP" ? "💬" : "✉️",
        actor: r.createdBy === "HUMAIN" ? "HUMAIN" : "AGENT",
        agent: r.createdBy === "HUMAIN" ? null : "COMMUNICATION_SPECIALIST",
        title: `Relance ${CHANNEL_LABELS[r.channel] ?? r.channel} envoyée — ${item.clientName}`,
        detail: `Ton ${TONE_LABELS[r.tone] ?? r.tone}`,
        clientName: item.clientName,
        invoiceId: item.invoiceId,
      });
    }
    for (const c of item.callTasks) {
      events.push({
        id: `call-created-${c.id}`,
        at: c.createdAt,
        icon: "📞",
        actor: "AGENT",
        agent: "COLLECTION_STRATEGIST",
        title: `Fiche d'appel préparée — ${item.clientName}`,
        detail: c.reason,
        clientName: item.clientName,
        invoiceId: item.invoiceId,
      });
      if (c.status === "FAIT" && c.completedAt) {
        events.push({
          id: `call-done-${c.id}`,
          at: c.completedAt,
          icon: "✅",
          actor: "HUMAIN",
          agent: null,
          title: `Appel enregistré — ${item.clientName}`,
          detail: c.outcome ? OUTCOME_LABELS[c.outcome] ?? c.outcome : "résultat non précisé",
          clientName: item.clientName,
          invoiceId: item.invoiceId,
        });
      }
    }
    for (const rep of item.replies) {
      const promiseFlavored = rep.classifiedIntent === "DEMANDE_DELAI" || rep.classifiedIntent === "CONFIRMATION";
      events.push({
        id: `reply-${rep.id}`,
        at: rep.receivedAt,
        icon: "🧭",
        actor: "AGENT",
        agent: promiseFlavored ? "PROMISE_MANAGER" : "DISPUTE_SPECIALIST",
        title: `Réponse client analysée — ${item.clientName}`,
        detail: rep.classifiedIntent ? INTENT_LABELS[rep.classifiedIntent] ?? rep.classifiedIntent : "",
        clientName: item.clientName,
        invoiceId: item.invoiceId,
      });
    }
    for (const p of item.promises) {
      if (p.status !== "EN_COURS") {
        events.push({
          id: `promise-${p.id}`,
          at: p.resolvedAt ?? p.createdAt,
          icon: p.status === "TENUE" ? "✅" : "⚠️",
          actor: "AGENT",
          agent: "PROMISE_MANAGER",
          title: `Promesse de paiement ${p.status === "TENUE" ? "tenue" : "rompue"} — ${item.clientName}`,
          detail: `${p.amountMad.toLocaleString("fr-FR")} MAD attendus le ${new Date(p.promisedDate).toLocaleDateString("fr-FR")}`,
          clientName: item.clientName,
          invoiceId: item.invoiceId,
        });
      }
    }
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}
