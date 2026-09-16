// Moteur de décision du recouvrement — suit les 6 playbooks officiels par ancienneté
// (PROJECT_CHARTER_AND_FUNCTIONAL_SPECIFICATIONS.md §10) et les règles de validation
// humaine obligatoire (§11). Niveau d'autonomie retenu pour le MVP : Niveau 2 (Semi-Autonome)
// — l'IA exécute les actions standards, l'humain valide les actions sensibles.
import { suggestedTone, type Tone } from "@/lib/scoring";

export type PlaybookKey = "PRE_DUE" | "EARLY" | "STANDARD" | "INTENSIVE" | "PRE_LEGAL" | "LEGAL_TRANSFER";

export const PLAYBOOK_LABELS: Record<PlaybookKey, string> = {
  PRE_DUE: "Pré-échéance",
  EARLY: "Recouvrement précoce (0-30j)",
  STANDARD: "Recouvrement standard (31-60j)",
  INTENSIVE: "Recouvrement intensif (61-90j)",
  PRE_LEGAL: "Pré-contentieux (91-120j)",
  LEGAL_TRANSFER: "Transmission avocat (120j+)",
};

// Seuils réglables depuis l'écran Paramètres (§10 Administration) — plus de constantes
// figées : computeNextAction() et computePlaybook() reçoivent ces valeurs en entrée.
export type PlaybookThresholds = {
  hitlAmountThreshold: number;
  earlyMaxDays: number;
  standardMaxDays: number;
  intensiveMaxDays: number;
  preLegalMaxDays: number;
};

export const DEFAULT_THRESHOLDS: PlaybookThresholds = {
  hitlAmountThreshold: 100_000,
  earlyMaxDays: 30,
  standardMaxDays: 60,
  intensiveMaxDays: 90,
  preLegalMaxDays: 120,
};

export type NextAction =
  | { kind: "WAIT_HUMAN"; playbook: PlaybookKey } // réponse client non résolue -> Dispute Specialist / humain
  | { kind: "WAIT_PROMISE"; playbook: PlaybookKey; promisedDate: string } // promesse de paiement en cours, pas encore échue
  | { kind: "LEGAL_TRANSFER"; playbook: "LEGAL_TRANSFER" } // >= 120 jours, transmission avocat obligatoire
  | { kind: "CALL_TASK"; playbook: PlaybookKey; reason: string; requiresValidation: boolean }
  | { kind: "EMAIL"; playbook: PlaybookKey; tone: Tone; reason: string; requiresValidation: boolean }
  | { kind: "WHATSAPP"; playbook: PlaybookKey; tone: Tone; reason: string; requiresValidation: boolean };

export type WorkflowInput = {
  daysOverdue: number; // peut être négatif : jours restants avant échéance (PRE_DUE)
  amountMad: number;
  hasUnresolvedReply: boolean;
  emailCount: number;
  whatsappCount: number;
  hasPendingCallTask: boolean;
  hasAnyCallTask: boolean;
  lastCallOutcome: string | null; // dernier résultat d'appel connu (ex: NE_REPOND_PAS)
  strategic: boolean;
  chronicLatePayer: boolean;
  activePromise: { promisedDate: string; overdue: boolean } | null; // promesse EN_COURS la plus récente
  thresholds: PlaybookThresholds;
};

export function computePlaybook(daysOverdue: number, thresholds: PlaybookThresholds = DEFAULT_THRESHOLDS): PlaybookKey {
  if (daysOverdue < 0) return "PRE_DUE";
  if (daysOverdue <= thresholds.earlyMaxDays) return "EARLY";
  if (daysOverdue <= thresholds.standardMaxDays) return "STANDARD";
  if (daysOverdue <= thresholds.intensiveMaxDays) return "INTENSIVE";
  if (daysOverdue <= thresholds.preLegalMaxDays) return "PRE_LEGAL";
  return "LEGAL_TRANSFER";
}

function toneLabel(tone: Tone): string {
  return tone === "AMICALE"
    ? "amical (premier contact)"
    : tone === "FERME"
    ? "ferme (relances précédentes restées sans effet)"
    : "dernier avertissement (avant mise en demeure)";
}

export function computeNextAction(input: WorkflowInput): NextAction {
  const {
    daysOverdue,
    amountMad,
    hasUnresolvedReply,
    emailCount,
    whatsappCount,
    hasPendingCallTask,
    hasAnyCallTask,
    lastCallOutcome,
    strategic,
    chronicLatePayer,
    activePromise,
    thresholds,
  } = input;

  const playbook = computePlaybook(daysOverdue, thresholds);
  const reminderCount = emailCount + whatsappCount;
  const sensitiveByDefault = strategic || amountMad > thresholds.hitlAmountThreshold;

  // §11 : litige en attente -> toujours un humain, quel que soit le playbook.
  if (hasUnresolvedReply) return { kind: "WAIT_HUMAN", playbook };

  // Une promesse de paiement en cours et pas encore échue : on respecte le délai donné, pas de relance.
  if (activePromise && !activePromise.overdue) {
    return { kind: "WAIT_PROMISE", playbook, promisedDate: activePromise.promisedDate };
  }

  if (hasPendingCallTask) {
    return {
      kind: "CALL_TASK",
      playbook,
      reason: "Une fiche d'appel est déjà en attente — à traiter avant toute nouvelle relance écrite.",
      requiresValidation: sensitiveByDefault,
    };
  }

  // LEGAL TRANSFER (120j+) : validation obligatoire, sort de l'amiable.
  if (playbook === "LEGAL_TRANSFER") return { kind: "LEGAL_TRANSFER", playbook };

  // Promesse rompue (échue et toujours EN_COURS) : on relance par appel avant d'écrire, validation requise.
  if (activePromise?.overdue) {
    return {
      kind: "CALL_TASK",
      playbook,
      reason: `Promesse de paiement du ${new Date(activePromise.promisedDate).toLocaleDateString(
        "fr-FR"
      )} non tenue — à clarifier par téléphone avant d'escalader.`,
      requiresValidation: true,
    };
  }

  // PRE_DUE : rappel préventif, jamais sensible.
  if (playbook === "PRE_DUE") {
    return {
      kind: "EMAIL",
      playbook,
      tone: "AMICALE",
      reason: `Facture pas encore échue (échéance dans ${Math.abs(daysOverdue)} jour(s)) : rappel préventif standard.`,
      requiresValidation: false,
    };
  }

  // Client stratégique jamais contacté : appel humain en premier, quel que soit le playbook.
  if (strategic && reminderCount === 0 && !hasAnyCallTask) {
    return {
      kind: "CALL_TASK",
      playbook,
      reason: "Client stratégique — premier contact recommandé par téléphone plutôt que par relance automatique.",
      requiresValidation: true,
    };
  }

  // PRE_LEGAL (91-120j) : validation humaine obligatoire par définition du playbook, ton dernier avertissement.
  if (playbook === "PRE_LEGAL") {
    return {
      kind: "EMAIL",
      playbook,
      tone: "MISE_EN_DEMEURE",
      reason:
        "Pré-contentieux (91-120 jours) : dernier avertissement écrit avant transmission avocat, validation humaine obligatoire à ce stade.",
      requiresValidation: true,
    };
  }

  // INTENSIVE (61-90j) : téléphone puis escalade commerciale si l'appel échoue.
  if (playbook === "INTENSIVE") {
    if (!hasAnyCallTask || lastCallOutcome === "NE_REPOND_PAS") {
      return {
        kind: "CALL_TASK",
        playbook,
        reason: "Recouvrement intensif (61-90j) : tentative d'appel avant escalade au commercial référent.",
        requiresValidation: true,
      };
    }
    const tone = suggestedTone(reminderCount);
    return {
      kind: "EMAIL",
      playbook,
      tone,
      reason: `Recouvrement intensif : appel(s) déjà tenté(s), email de suivi avec escalade commerciale en parallèle. Ton ${toneLabel(
        tone
      )}.`,
      requiresValidation: true,
    };
  }

  // STANDARD (31-60j) : un appel si aucun n'a encore été tenté, sinon email/WhatsApp classique.
  if (playbook === "STANDARD" && !hasAnyCallTask) {
    return {
      kind: "CALL_TASK",
      playbook,
      reason: "Recouvrement standard (31-60j), aucun appel tenté — un contact direct est plus efficace à ce stade.",
      requiresValidation: sensitiveByDefault,
    };
  }

  // EARLY / STANDARD (suite) : email ou WhatsApp selon le profil client.
  const tone = suggestedTone(reminderCount);
  if (chronicLatePayer && emailCount === 0) {
    return {
      kind: "WHATSAPP",
      playbook,
      tone,
      reason: `Client chronique (n'ouvre pas ses emails d'après l'historique) : WhatsApp dès le premier contact, ton ${toneLabel(tone)}.`,
      requiresValidation: sensitiveByDefault,
    };
  }
  if (daysOverdue >= 8 || chronicLatePayer) {
    return {
      kind: "WHATSAPP",
      playbook,
      tone,
      reason: `${daysOverdue} jours de retard (≥ 8) ou client chronique : WhatsApp est plus direct qu'un email à ce stade, ton ${toneLabel(tone)}.`,
      requiresValidation: sensitiveByDefault,
    };
  }
  return {
    kind: "EMAIL",
    playbook,
    tone,
    reason: `Retard encore léger (${daysOverdue} jours), playbook ${PLAYBOOK_LABELS[playbook]} : email standard, ton ${toneLabel(tone)}.`,
    requiresValidation: sensitiveByDefault,
  };
}
