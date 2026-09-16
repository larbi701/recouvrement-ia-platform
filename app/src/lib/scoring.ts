// Agent "Analyste" : calcule un score de risque simple et explicable (0-100)
// à partir de signaux directement lisibles par un humain non technique.

export type ScoringInput = {
  daysOverdue: number;
  amountMad: number;
  reminderCount: number;
  hasUnresolvedReply: boolean; // le client a répondu mais rien n'est encore tranché
};

export type ScoreCriterion = {
  label: string;
  value: string; // ce qui a été observé, en clair (ex: "112 jours de retard")
  points: number; // points attribués sur ce critère
  maxPoints: number;
};

export type ScoringResult = {
  score: number; // 0-100
  priority: "URGENT" | "A_TRAITER" | "SURVEILLANCE";
  reasoning: string; // phrase courte affichée à l'écran, façon "raisonnement de l'agent"
  breakdown: ScoreCriterion[]; // détail des critères, pour que l'humain voie comment le score a été construit
};

const AMOUNT_CAP_MAD = 150_000;
// Plafond calé sur la réalité marocaine : délai moyen PME 2024 = 88 jours (Inforisk),
// plafond légal entre partenaires commerciaux = 120 jours (loi 69-21).
const DAYS_CAP = 120;
const LEGAL_CEILING_DAYS = 120;
const REMINDERS_CAP = 4;

export function computeRiskScore(input: ScoringInput): ScoringResult {
  const { amountMad, reminderCount, hasUnresolvedReply } = input;
  const daysOverdue = Math.max(0, input.daysOverdue); // une facture pas encore échue (PRE_DUE) n'ajoute aucun point ici

  const overdueScore = Math.min(daysOverdue / DAYS_CAP, 1) * 40;
  const amountScore = Math.min(amountMad / AMOUNT_CAP_MAD, 1) * 30;
  const reminderScore = Math.min(reminderCount / REMINDERS_CAP, 1) * 20;
  const silenceBonus = reminderCount >= 2 && !hasUnresolvedReply ? 10 : 0;

  const rawScore = overdueScore + amountScore + reminderScore + silenceBonus;
  const score = Math.round(Math.min(rawScore, 100));

  const priority: ScoringResult["priority"] =
    score >= 60 ? "URGENT" : score >= 35 ? "A_TRAITER" : "SURVEILLANCE";

  const reasoning = buildReasoning({
    daysOverdue: input.daysOverdue, // valeur signée d'origine, pour un phrasé correct si pas encore échue
    amountMad,
    reminderCount,
    hasUnresolvedReply,
    priority,
  });

  const breakdown: ScoreCriterion[] = [
    {
      label: "Ancienneté du retard",
      value: `${daysOverdue} jour(s) sur ${DAYS_CAP} (plafond légal marocain)`,
      points: Math.round(overdueScore),
      maxPoints: 40,
    },
    {
      label: "Montant de la facture",
      value: `${amountMad.toLocaleString("fr-FR")} MAD (plafond de barème : ${AMOUNT_CAP_MAD.toLocaleString("fr-FR")} MAD)`,
      points: Math.round(amountScore),
      maxPoints: 30,
    },
    {
      label: "Relances déjà envoyées",
      value: `${reminderCount} relance(s) sur ${REMINDERS_CAP} (au-delà, le plafond du critère est atteint)`,
      points: Math.round(reminderScore),
      maxPoints: 20,
    },
    {
      label: "Silence prolongé",
      value:
        silenceBonus > 0
          ? "2 relances ou plus envoyées, aucune réponse du client"
          : "Pas encore assez de relances sans réponse pour ce bonus",
      points: silenceBonus,
      maxPoints: 10,
    },
  ];

  return { score, priority, reasoning, breakdown };
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

  if (daysOverdue < 0) {
    return `Facture pas encore échue (échéance dans ${Math.abs(daysOverdue)} jour(s)) sur ${amountLabel} — rappel préventif.`;
  }

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

export type Tone = "AMICALE" | "FERME" | "MISE_EN_DEMEURE";

export function suggestedTone(reminderCount: number): Tone {
  if (reminderCount <= 1) return "AMICALE";
  if (reminderCount <= 3) return "FERME";
  return "MISE_EN_DEMEURE";
}

// Scores complémentaires (§14 des specs) — formules déterministes basées sur l'ancienneté
// et l'historique, sans modèle de machine learning, comme demandé pour le MVP.
export type ExtendedScores = {
  riskScore: number; // risque global de non-recouvrement
  paymentProbabilityScore: number; // probabilité d'encaissement
  promiseReliabilityScore: number; // fiabilité des promesses de paiement de ce client
  customerHealthScore: number; // santé relationnelle du client
  cashImpactScore: number; // impact potentiel sur la trésorerie
};

export type ExtendedScoringInput = {
  daysOverdue: number;
  amountMad: number;
  chronicLatePayer: boolean;
  strategic: boolean;
  hasUnresolvedReply: boolean;
  disputeCount: number; // contestations passées de ce client, tous dossiers confondus
  promisesTenues: number;
  promisesRompues: number;
};

const CASH_IMPACT_CAP_MAD = 250_000;

export function computeExtendedScores(input: ExtendedScoringInput): ExtendedScores {
  const days = Math.max(0, input.daysOverdue);

  const riskScore = Math.min(
    100,
    Math.round(
      Math.min(days / LEGAL_CEILING_DAYS, 1) * 50 +
        (input.chronicLatePayer ? 20 : 0) +
        (input.hasUnresolvedReply ? 15 : 0) +
        Math.min(input.amountMad / AMOUNT_CAP_MAD, 1) * 15
    )
  );

  const totalPromises = input.promisesTenues + input.promisesRompues;
  const promiseReliabilityScore =
    totalPromises > 0 ? Math.round((input.promisesTenues / totalPromises) * 100) : 70; // neutre, pas d'historique

  const paymentProbabilityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - riskScore * 0.8 + (input.strategic ? 8 : 0) + (promiseReliabilityScore - 70) * 0.2)
    )
  );

  const customerHealthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          (input.chronicLatePayer ? 25 : 0) -
          input.disputeCount * 12 +
          (input.strategic ? 10 : 0) +
          (promiseReliabilityScore - 70) * 0.3
      )
    )
  );

  const cashImpactScore = Math.round(Math.min(input.amountMad / CASH_IMPACT_CAP_MAD, 1) * 100);

  return { riskScore, paymentProbabilityScore, promiseReliabilityScore, customerHealthScore, cashImpactScore };
}
