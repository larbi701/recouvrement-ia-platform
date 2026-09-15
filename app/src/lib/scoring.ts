// Agent "Analyste" : calcule un score de risque simple et explicable (0-100)
// à partir de signaux directement lisibles par un humain non technique.

export type ScoringInput = {
  daysOverdue: number;
  amountMad: number;
  reminderCount: number;
  hasUnresolvedReply: boolean; // le client a répondu mais rien n'est encore tranché
};

export type ScoringResult = {
  score: number; // 0-100
  priority: "URGENT" | "A_TRAITER" | "SURVEILLANCE";
  reasoning: string; // phrase courte affichée à l'écran, façon "raisonnement de l'agent"
};

const AMOUNT_CAP_MAD = 150_000;
// Plafond calé sur la réalité marocaine : délai moyen PME 2024 = 88 jours (Inforisk),
// plafond légal entre partenaires commerciaux = 120 jours (loi 69-21).
const DAYS_CAP = 120;
const LEGAL_CEILING_DAYS = 120;
const REMINDERS_CAP = 4;

export function computeRiskScore(input: ScoringInput): ScoringResult {
  const { daysOverdue, amountMad, reminderCount, hasUnresolvedReply } = input;

  const overdueScore = Math.min(daysOverdue / DAYS_CAP, 1) * 40;
  const amountScore = Math.min(amountMad / AMOUNT_CAP_MAD, 1) * 30;
  const reminderScore = Math.min(reminderCount / REMINDERS_CAP, 1) * 20;
  const silenceBonus = reminderCount >= 2 && !hasUnresolvedReply ? 10 : 0;

  const rawScore = overdueScore + amountScore + reminderScore + silenceBonus;
  const score = Math.round(Math.min(rawScore, 100));

  const priority: ScoringResult["priority"] =
    score >= 60 ? "URGENT" : score >= 35 ? "A_TRAITER" : "SURVEILLANCE";

  const reasoning = buildReasoning({ daysOverdue, amountMad, reminderCount, hasUnresolvedReply, priority });

  return { score, priority, reasoning };
}

function buildReasoning(args: {
  daysOverdue: number;
  amountMad: number;
  reminderCount: number;
  hasUnresolvedReply: boolean;
  priority: ScoringResult["priority"];
}): string {
  const { daysOverdue, amountMad, reminderCount, hasUnresolvedReply, priority } = args;
  const amountLabel = `${amountMad.toLocaleString("fr-FR")} MAD`;

  const legalNote =
    daysOverdue >= LEGAL_CEILING_DAYS
      ? ` — dépasse le plafond légal marocain de ${LEGAL_CEILING_DAYS} jours (loi 69-21)`
      : daysOverdue >= LEGAL_CEILING_DAYS - 15
      ? ` — approche le plafond légal marocain de ${LEGAL_CEILING_DAYS} jours (loi 69-21)`
      : "";

  if (hasUnresolvedReply) {
    return `${daysOverdue} jours de retard sur ${amountLabel}, le client a répondu — une action humaine est en attente.${legalNote}`;
  }
  if (reminderCount === 0) {
    return `${daysOverdue} jours de retard sur ${amountLabel}, aucune relance envoyée pour l'instant.${legalNote}`;
  }
  if (priority === "URGENT") {
    return `${daysOverdue} jours de retard sur ${amountLabel}, ${reminderCount} relance(s) sans réponse → priorité haute.${legalNote}`;
  }
  return `${daysOverdue} jours de retard sur ${amountLabel}, ${reminderCount} relance(s) envoyée(s).${legalNote}`;
}

export function suggestedTone(reminderCount: number): "AMICALE" | "FERME" | "MISE_EN_DEMEURE" {
  if (reminderCount <= 1) return "AMICALE";
  if (reminderCount <= 3) return "FERME";
  return "MISE_EN_DEMEURE";
}
