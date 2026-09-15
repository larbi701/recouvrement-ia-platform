// Ouvre le vrai canal (messagerie / WhatsApp) avec le message de l'agent prérempli —
// l'action se produit réellement dans un outil réel, ce n'est pas qu'une ligne en base.

export function parseEmailDraft(draft: string): { subject: string; body: string } {
  const match = draft.match(/^Objet\s*:\s*(.+)\n+([\s\S]*)$/i);
  if (match) {
    return { subject: match[1].trim(), body: match[2].trim() };
  }
  return { subject: "Relance de facture", body: draft.trim() };
}

export function buildMailtoUrl(email: string, draft: string): string {
  const { subject, body } = parseEmailDraft(draft);
  const params = new URLSearchParams({ subject, body });
  return `mailto:${email}?${params.toString()}`;
}

export function buildWhatsappUrl(phone: string, draft: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  const params = new URLSearchParams({ text: draft.trim() });
  return `https://wa.me/${digitsOnly}?${params.toString()}`;
}

export function buildTelUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}
