import type { SpecialistKey } from "@/lib/activity";

// §7 Organisation hybride — Digital Workforce. "Yas" est le visage unique présenté aux
// écrans du quotidien (comme Léa chez NAIOM) ; ces 7 spécialistes sont les collaborateurs
// qui composent réellement l'orchestrateur, visibles dans l'Agent Hub et en attribution
// sur chaque action.
export type AgentDefinition = {
  key: SpecialistKey;
  name: string;
  role: string;
  responsibility: string;
  icon: string;
};

export const AGENT_ROSTER: AgentDefinition[] = [
  {
    key: "PORTFOLIO_ANALYST",
    name: "Portfolio Intelligence Analyst",
    role: "Analyse portefeuille",
    responsibility:
      "Calcule les 6 scores de chaque créance (Collection, Risk, Payment Probability, Promise Reliability, Customer Health, Cash Impact) en continu, sur tout le portefeuille.",
    icon: "🧭",
  },
  {
    key: "COLLECTION_STRATEGIST",
    name: "Collection Strategist",
    role: "Choisit la stratégie optimale",
    responsibility:
      "Détermine le playbook et la prochaine action (canal, ton, appel) pour chaque dossier selon son ancienneté et son profil.",
    icon: "🧠",
  },
  {
    key: "COMMUNICATION_SPECIALIST",
    name: "Communication Specialist",
    role: "Produit les relances",
    responsibility: "Rédige les emails et messages WhatsApp, adaptés au contexte et au ton recommandé.",
    icon: "✉️",
  },
  {
    key: "PROMISE_MANAGER",
    name: "Promise To Pay Manager",
    role: "Suit les engagements",
    responsibility: "Enregistre les promesses de paiement, suit leur échéance, et signale les promesses rompues.",
    icon: "🤝",
  },
  {
    key: "DISPUTE_SPECIALIST",
    name: "Dispute Specialist",
    role: "Analyse les litiges",
    responsibility: "Classe les réponses clients, identifie les contestations, et bloque l'automatisation en cas de litige.",
    icon: "⚖️",
  },
  {
    key: "CASH_FORECAST_ANALYST",
    name: "Cash Forecast Analyst",
    role: "Prévoit les encaissements",
    responsibility: "Projette les encaissements à J+7/30/60/90 à partir des promesses et de la probabilité de paiement.",
    icon: "📈",
  },
  {
    key: "COLLECTION_SUPERVISOR",
    name: "Collection Supervisor",
    role: "Contrôle qualité",
    responsibility: "Déclenche la validation humaine obligatoire sur les dossiers sensibles (montant, stratégique, litige, pré-contentieux).",
    icon: "🛡️",
  },
];

export const SPECIALIST_LABELS: Record<SpecialistKey, string> = Object.fromEntries(
  AGENT_ROSTER.map((a) => [a.key, a.name])
) as Record<SpecialistKey, string>;
