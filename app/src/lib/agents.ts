import type { SpecialistKey } from "@/lib/activity";

// §7 Organisation hybride — Digital Workforce. "Yas" est le visage unique présenté aux
// écrans du quotidien ; ces 7 spécialistes composent réellement l'orchestrateur, visibles
// dans Agents IA et en attribution sur chaque action.
// engine "IA" : appelle Claude (pilotable : suspension, autonomie). engine "CALCUL" : règle
// déterministe du moteur, toujours active — c'est une garantie, pas une limite.
export type AgentDefinition = {
  key: SpecialistKey;
  name: string;
  role: string;
  responsibility: string;
  initials: string;
  engine: "IA" | "CALCUL";
  does: string[];
  never: string[];
  where: { label: string; href: string };
};

export const AGENT_ROSTER: AgentDefinition[] = [
  {
    key: "PORTFOLIO_ANALYST",
    name: "Portfolio Intelligence Analyst",
    role: "Analyse portefeuille",
    responsibility:
      "Calcule les 6 scores de chaque créance (Collection, Risk, Payment Probability, Promise Reliability, Customer Health, Cash Impact) en continu, sur tout le portefeuille.",
    initials: "PA",
    engine: "CALCUL",
    does: ["Score de priorité de 0 à 100, détaillé critère par critère", "Probabilité d'encaissement, santé client, impact trésorerie", "Recalcul instantané à chaque changement (paiement, relance, date)"],
    never: ["Ne modifie aucun dossier", "N'envoie aucun message"],
    where: { label: "Voir les scores dans le Portefeuille", href: "/portfolio" },
  },
  {
    key: "COLLECTION_STRATEGIST",
    name: "Collection Strategist",
    role: "Choisit la stratégie optimale",
    responsibility:
      "Détermine le playbook et la prochaine action (canal, ton, appel) pour chaque dossier selon son ancienneté et son profil. Prépare les fiches d'appel pour l'équipe.",
    initials: "CS",
    engine: "IA",
    does: ["Prépare la fiche d'appel (points clés, question à poser, engagement à obtenir)", "Recommande canal et ton selon l'ancienneté, le profil et l'historique"],
    never: ["N'appelle jamais lui-même : un humain passe l'appel", "Ne peut pas abaisser un niveau de validation"],
    where: { label: "Voir les appels à passer", href: "/cockpit" },
  },
  {
    key: "COMMUNICATION_SPECIALIST",
    name: "Communication Specialist",
    role: "Produit les relances",
    responsibility: "Rédige les emails et messages WhatsApp, adaptés au contexte et au ton recommandé.",
    initials: "CO",
    engine: "IA",
    does: ["Rédige email et WhatsApp, ton amical, ferme ou dernier avertissement", "Respecte les consignes de style et les termes interdits des Paramètres", "En mode « propose seulement », dépose tout en brouillon pour validation"],
    never: ["N'envoie rien si le garde-fou détecte un terme interdit ou un montant faux", "Ne contacte pas un client en litige, un compte stratégique ou un débiteur public sans validation"],
    where: { label: "Voir les messages à valider", href: "/messages" },
  },
  {
    key: "PROMISE_MANAGER",
    name: "Promise To Pay Manager",
    role: "Suit les engagements",
    responsibility: "Enregistre les promesses de paiement, suit leur échéance, et signale les promesses rompues.",
    initials: "PM",
    engine: "CALCUL",
    does: ["Enregistre chaque promesse (appel ou réponse client)", "Suspend les relances tant que le délai promis court", "Signale une promesse non tenue et recommande un appel"],
    never: ["Ne relance pas avant l'échéance promise"],
    where: { label: "Voir les promesses en cours", href: "/portfolio?queue=promises" },
  },
  {
    key: "DISPUTE_SPECIALIST",
    name: "Dispute Specialist",
    role: "Analyse les litiges",
    responsibility: "Classe les réponses clients, identifie les contestations, et bloque l'automatisation en cas de litige.",
    initials: "DS",
    engine: "IA",
    does: ["Classe chaque réponse : demande de délai, contestation, confirmation, autre", "Résume la réponse et propose l'action à l'équipe"],
    never: ["Ne relance jamais automatiquement un client qui conteste", "Si sa sortie est invalide, replie sur « autre » et force une lecture humaine"],
    where: { label: "Voir les réponses clients", href: "/messages?tab=replies" },
  },
  {
    key: "CASH_FORECAST_ANALYST",
    name: "Cash Forecast Analyst",
    role: "Prévoit les encaissements",
    responsibility: "Projette les encaissements à J+7/30/60/90 à partir des promesses et de la probabilité de paiement.",
    initials: "CF",
    engine: "CALCUL",
    does: ["Projection cumulée à J+7, J+30, J+60, J+90", "Promesses en cours d'abord, sinon horizon typique du playbook pondéré par la probabilité de paiement"],
    never: ["N'utilise pas de modèle d'apprentissage : formule explicable"],
    where: { label: "Voir les prévisions dans le Pilotage", href: "/dashboard" },
  },
  {
    key: "COLLECTION_SUPERVISOR",
    name: "Collection Supervisor",
    role: "Contrôle qualité",
    responsibility: "Déclenche la validation humaine obligatoire sur les dossiers sensibles (montant, stratégique, litige, pré-contentieux) et contrôle chaque message avant envoi.",
    initials: "SV",
    engine: "CALCUL",
    does: ["Exige une validation au-delà du seuil de montant, pour les comptes stratégiques, les débiteurs publics et le pré-contentieux", "Garde-fou de contenu : termes interdits, montants et références vérifiés dans le dossier"],
    never: ["Ne peut pas être désactivé : c'est la garantie du dispositif"],
    where: { label: "Voir les dossiers à valider", href: "/portfolio?queue=validation" },
  },
];

export const SPECIALIST_LABELS: Record<SpecialistKey, string> = Object.fromEntries(
  AGENT_ROSTER.map((a) => [a.key, a.name])
) as Record<SpecialistKey, string>;
