import type { Tone } from "@/lib/scoring";

// Modèles de secours : si l'IA est indisponible (clé révoquée, panne, limite d'usage), la démo
// ne s'arrête pas. Ces textes sont déterministes, respectent les règles du garde-fou (montants
// et références exacts, aucun terme interdit) et sont toujours déposés en brouillon à relire :
// jamais envoyés automatiquement.
export const FALLBACK_NOTE = "Modèle de secours : l'IA était indisponible, relisez ce message avant de l'envoyer.";

export function isFallbackNote(note: string | null | undefined): boolean {
  return Boolean(note && note.startsWith("Modèle de secours"));
}

type DraftCtx = {
  contactName: string;
  reference: string;
  amountMad: number;
  daysOverdue: number;
  companyName: string;
};

const mad = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

export function fallbackDraft(channel: "EMAIL" | "WHATSAPP", tone: Tone, c: DraftCtx): string {
  const first = c.contactName.trim().split(" ")[0] || "Madame, Monsieur";
  const d = Math.max(c.daysOverdue, 0);
  const due = c.daysOverdue < 0 ? `arrive à échéance dans ${Math.abs(c.daysOverdue)} jour(s)` : `est échue depuis ${d} jours`;
  const legal = d >= 105 ? ` Ce retard ${d >= 120 ? "dépasse" : "approche"} le plafond légal de 120 jours entre partenaires commerciaux (loi 69-21).` : "";

  if (channel === "WHATSAPP") {
    if (tone === "AMICALE") {
      return `Bonjour ${first}, petit rappel : la facture ${c.reference} (${mad(c.amountMad)}) ${due}. Pouvez-vous nous confirmer la date de règlement ? Merci.\n${c.companyName}`;
    }
    if (tone === "FERME") {
      return `Bonjour ${first}, malgré nos précédents messages, la facture ${c.reference} (${mad(c.amountMad)}) reste impayée, ${d} jours après son échéance. Merci de nous indiquer une date de paiement ferme sous 5 jours.\n${c.companyName}`;
    }
    return `Bonjour ${first}, la facture ${c.reference} (${mad(c.amountMad)}) reste impayée (${d} jours de retard).${legal} Sans règlement ou retour de votre part sous 5 jours, nous engagerons une mise en demeure formelle.\n${c.companyName}`;
  }

  const subject =
    tone === "AMICALE" ? `Rappel : facture ${c.reference}` : tone === "FERME" ? `Facture ${c.reference} échue : règlement attendu` : `Dernier avertissement : facture ${c.reference}`;
  const body =
    tone === "AMICALE"
      ? `Bonjour ${first},\n\nSauf erreur de notre part, la facture ${c.reference} d'un montant de ${mad(c.amountMad)} ${due}. Il s'agit peut-être d'un simple oubli.\n\nPourriez-vous nous indiquer la date de règlement prévue ? Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce message.\n\nCordialement,`
      : tone === "FERME"
      ? `Bonjour ${first},\n\nMalgré nos précédents rappels, la facture ${c.reference} d'un montant de ${mad(c.amountMad)} reste impayée, ${d} jours après son échéance.\n\nNous vous remercions de procéder au règlement dans les 5 jours suivant la réception de ce message, ou de nous communiquer une date ferme de paiement.\n\nCordialement,`
      : `Bonjour ${first},\n\nLa facture ${c.reference} d'un montant de ${mad(c.amountMad)} reste impayée, ${d} jours après son échéance, malgré plusieurs relances.${legal}\n\nSans règlement ou retour de votre part dans les 5 jours suivant la réception de ce message, nous procéderons à une mise en demeure formelle.\n\nCordialement,`;
  return `Objet : ${subject}\n\n${body}\nLe service recouvrement — ${c.companyName}`;
}

export function fallbackCallSheet(c: { reference: string; amountMad: number; daysOverdue: number; reminderCount: number }): string {
  const hist = c.reminderCount ? `${c.reminderCount} relance(s) déjà envoyée(s), sans paiement à ce jour.` : "Aucune relance écrite envoyée pour l'instant.";
  return [
    `- Ouvrir sur la relation, puis rappeler la facture ${c.reference} (${mad(c.amountMad)}) et les ${Math.max(c.daysOverdue, 0)} jours de retard.`,
    `- Contexte : ${hist}`,
    "- Demander s'il y a un blocage particulier (trésorerie, litige, interlocuteur absent).",
    "- Obtenir avant de raccrocher : un engagement de paiement avec une date précise, ou la raison claire du blocage.",
  ].join("\n");
}

const strip = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Classification par mots-clés quand l'IA est indisponible. Volontairement prudente : en cas
// de doute, "AUTRE" (lecture humaine, aucune action automatique).
export function fallbackClassify(content: string): { classifiedIntent: string; agentSummary: string; proposedAction: string } {
  const t = strip(content);
  let intent = "AUTRE";
  if (/conteste|contestation|avoir|non conforme|erreur|litige|pas recu|pas livre|desaccord/.test(t)) intent = "CONTESTATION";
  else if (/delai|echeancier|etaler|en \d+ fois|en deux fois|tresorerie|reporter|plus tard/.test(t)) intent = "DEMANDE_DELAI";
  else if (/virement effectue|deja regle|deja paye|cheque envoye|reglement effectue/.test(t)) intent = "CONFIRMATION";

  const summary: Record<string, string> = {
    DEMANDE_DELAI: "Le client demande un délai ou un échéancier de paiement.",
    CONTESTATION: "Le client conteste tout ou partie de la facture.",
    CONFIRMATION: "Le client indique avoir réglé ou régler la facture.",
    AUTRE: "Réponse reçue, sans intention claire identifiée.",
  };
  const action: Record<string, string> = {
    DEMANDE_DELAI: "Proposer un échéancier raisonnable — à valider par un humain avant envoi.",
    CONTESTATION: "Hors cadre automatique — à escalader à un humain, aucune relance tant que le litige n'est pas levé.",
    CONFIRMATION: "Classer le dossier en attente de paiement, sans nouvelle relance immédiate.",
    AUTRE: "Un humain lit la réponse directement, aucune action automatique suggérée.",
  };
  return {
    classifiedIntent: intent,
    agentSummary: `${summary[intent]} (analyse simplifiée : l'IA était indisponible)`,
    proposedAction: action[intent],
  };
}
