// Décide la prochaine action du parcours de recouvrement — canal + escalade —
// en s'inspirant du comportement d'un chargé de recouvrement humain :
// il n'utilise pas le même canal pour tout le monde, il l'adapte à la situation.
import { suggestedTone, type Tone } from "@/lib/scoring";

export type NextAction =
  | { kind: "WAIT_HUMAN" } // réponse client non résolue -> agent Négociateur, pas d'action automatique
  | { kind: "LEGAL_ESCALATION" } // >= 120 jours, plafond légal marocain dépassé (loi 69-21)
  | { kind: "CALL_TASK"; reason: string } // besoin d'un appel humain, l'agent prépare la fiche
  | { kind: "EMAIL"; tone: Tone; reason: string }
  | { kind: "WHATSAPP"; tone: Tone; reason: string };

export type WorkflowInput = {
  daysOverdue: number;
  hasUnresolvedReply: boolean;
  emailCount: number;
  whatsappCount: number;
  hasPendingCallTask: boolean;
  hasAnyCallTask: boolean;
  strategic: boolean;
  chronicLatePayer: boolean;
};

const LEGAL_CEILING_DAYS = 120;

export function computeNextAction(input: WorkflowInput): NextAction {
  const {
    daysOverdue,
    hasUnresolvedReply,
    emailCount,
    whatsappCount,
    hasPendingCallTask,
    hasAnyCallTask,
    strategic,
    chronicLatePayer,
  } = input;

  const reminderCount = emailCount + whatsappCount;

  if (hasUnresolvedReply) return { kind: "WAIT_HUMAN" };
  if (hasPendingCallTask) {
    return {
      kind: "CALL_TASK",
      reason: "Une fiche d'appel est déjà en attente — à traiter avant toute nouvelle relance écrite.",
    };
  }
  if (daysOverdue >= LEGAL_CEILING_DAYS) return { kind: "LEGAL_ESCALATION" };

  // Client stratégique, jamais contacté : un humain appelle en premier, pas d'automatisation pure.
  if (strategic && reminderCount === 0 && !hasAnyCallTask) {
    return {
      kind: "CALL_TASK",
      reason: "Client stratégique — premier contact recommandé par téléphone plutôt que par relance automatique.",
    };
  }

  // Entre 16 et 30 jours de retard, avec au moins une relance déjà sans effet : on tente un appel avant d'insister par écrit.
  if (daysOverdue >= 16 && daysOverdue <= 45 && reminderCount >= 1 && !hasAnyCallTask) {
    return {
      kind: "CALL_TASK",
      reason: `${reminderCount} relance(s) écrite(s) sans réponse — un appel direct est plus efficace à ce stade.`,
    };
  }

  const tone = suggestedTone(reminderCount);
  const toneLabel =
    tone === "AMICALE" ? "amical (premier contact)" : tone === "FERME" ? "ferme (relances précédentes restées sans effet)" : "dernier avertissement (avant mise en demeure)";

  // Dernier avertissement avant le plafond légal : toujours l'email, même pour un client
  // chronique habituellement contacté sur WhatsApp — c'est la trace écrite qui compte juridiquement.
  if (tone === "MISE_EN_DEMEURE") {
    return {
      kind: "EMAIL",
      tone,
      reason: `Ton ${toneLabel} : email choisi même si ce client est habituellement contacté sur WhatsApp — c'est la trace écrite qui compte juridiquement à ce stade, à l'approche du plafond légal.`,
    };
  }

  // Client chronique qui ignore les emails : on saute directement WhatsApp.
  if (chronicLatePayer && emailCount === 0) {
    return {
      kind: "WHATSAPP",
      tone,
      reason: `Client chronique (n'ouvre pas ses emails d'après l'historique) : WhatsApp dès le premier contact, ton ${toneLabel}.`,
    };
  }
  if (daysOverdue >= 8 || chronicLatePayer) {
    return {
      kind: "WHATSAPP",
      tone,
      reason: `${daysOverdue} jours de retard (≥ 8) ou client chronique : WhatsApp est plus direct qu'un email à ce stade, ton ${toneLabel}.`,
    };
  }
  return {
    kind: "EMAIL",
    tone,
    reason: `Retard encore léger (${daysOverdue} jours) sur un client sans historique de retard chronique : email standard, ton ${toneLabel}.`,
  };
}
