// Garde-fous de contenu sur les messages générés par les agents — inspirés de la liste de
// termes interdits et des post-contrôles du kit de cadrage VELOS IA (config/parametres
// par défaut, règle d'architecture n°4 : "chaque montant et numéro de facture cité doit
// exister dans le dossier"). Contrôle heuristique, pas une garantie absolue — mais un vrai
// filet de sécurité qui n'existait pas avant : sans lui, un message halluciné par le modèle
// partirait tel quel.
export type GuardrailResult = {
  ok: boolean;
  violations: string[];
};

// Vocabulaire hors cadre pour du recouvrement AMIABLE (menaces, mentions pénales, pressions
// illégales) — si l'un de ces termes apparaît, le message ne doit jamais partir sans revue
// humaine, quel que soit le montant ou le playbook.
const FORBIDDEN_TERMS = [
  "poursuites pénales",
  "prison",
  "liste noire",
  "vous serez signalé",
  "nous allons vous signaler",
  "saisie immédiate",
  "porter plainte",
  "casier judiciaire",
  "amende que vous nous devez",
  "amende à nous verser",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // insensible aux accents
}

// Extrait les montants en MAD mentionnés dans le texte généré (ex: "18 000 MAD", "18000 MAD").
function extractMadAmounts(text: string): number[] {
  const matches = text.matchAll(/([\d][\d\s]*)\s*(?:mad|dh|dirhams?)\b/gi);
  const amounts: number[] = [];
  for (const m of matches) {
    const n = Number(m[1].replace(/\s/g, ""));
    if (Number.isFinite(n) && n > 0) amounts.push(n);
  }
  return amounts;
}

export function checkGeneratedContent(
  text: string,
  context: { invoiceReference: string; amountMad: number; maxLength?: number }
): GuardrailResult {
  const violations: string[] = [];
  const normalizedText = normalize(text);

  for (const term of FORBIDDEN_TERMS) {
    if (normalizedText.includes(normalize(term))) {
      violations.push(`Terme hors cadre détecté : "${term}"`);
    }
  }

  // Chaque montant MAD cité doit correspondre au montant réel de la facture (tolérance pour
  // les échéanciers en plusieurs fois, qui divisent légitimement le montant).
  const knownAmounts = new Set([context.amountMad]);
  for (const amount of extractMadAmounts(text)) {
    const isKnown = [...knownAmounts].some((known) => Math.abs(known - amount) <= 1);
    const isPlausibleFraction = amount < context.amountMad && context.amountMad % amount < context.amountMad * 0.05;
    if (!isKnown && !isPlausibleFraction) {
      violations.push(`Montant "${amount.toLocaleString("fr-FR")} MAD" absent du dossier (facture réelle : ${context.amountMad.toLocaleString("fr-FR")} MAD)`);
    }
  }

  // La référence de facture citée doit être la vraie référence du dossier (pas une inventée).
  const referenceMatches = text.match(/FAC-[\w-]+/gi) ?? [];
  for (const ref of referenceMatches) {
    if (ref.toUpperCase() !== context.invoiceReference.toUpperCase()) {
      violations.push(`Référence "${ref}" ne correspond pas à la facture du dossier (${context.invoiceReference})`);
    }
  }

  if (context.maxLength && text.length > context.maxLength) {
    violations.push(`Message trop long pour le canal (${text.length} caractères, limite ${context.maxLength})`);
  }

  return { ok: violations.length === 0, violations };
}
