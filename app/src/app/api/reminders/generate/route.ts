import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { computeRiskScore, suggestedTone } from "@/lib/scoring";

export async function POST(req: Request) {
  const { invoiceId } = await req.json();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, reminders: true, replies: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const daysOverdue = Math.max(
    0,
    Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000)
  );
  const tone = suggestedTone(invoice.reminders.length);
  const toneInstruction =
    tone === "AMICALE"
      ? "amical, premier rappel, on suppose un simple oubli"
      : tone === "FERME"
      ? "ferme mais respectueux, deuxième niveau, on rappelle les relances précédentes"
      : "dernier avertissement avant mise en demeure, sérieux, explicite sur les conséquences, mais toujours professionnel et factuellement exact sur le plan juridique";

  const scoring = computeRiskScore({
    daysOverdue,
    amountMad: invoice.amountMad,
    reminderCount: invoice.reminders.length,
    hasUnresolvedReply: invoice.replies.length > 0,
  });

  const legalContext =
    daysOverdue >= 105
      ? `\n- Contexte légal marocain : ce retard approche ou dépasse le plafond légal de 120 jours entre partenaires commerciaux fixé par la loi 69-21. Tu peux le mentionner brièvement, de façon factuelle (pas comme une menace), pour appuyer le sérieux de la situation.`
      : "";

  const prompt = `Tu es l'agent de recouvrement amiable de "Meridian Distribution", une PME marocaine (B2B). Rédige UNE relance par email en français, professionnelle et humaine, jamais agressive.

Contexte :
- Client : ${invoice.client.name} (contact : ${invoice.client.contactName})
- Note de contexte sur ce client : ${invoice.client.behaviorNote}
- Facture : ${invoice.reference}, montant ${invoice.amountMad.toLocaleString("fr-FR")} MAD
- Retard actuel : ${daysOverdue} jours
- Nombre de relances déjà envoyées : ${invoice.reminders.length}
- Ton attendu : ${toneInstruction}${legalContext}

Règles strictes :
- On est encore dans le recouvrement AMIABLE, pas dans le contentieux : ne jamais mentionner "porter plainte" (terme de droit pénal, inapproprié pour un impayé commercial) ni promettre une action judiciaire précise. Si une escalade doit être évoquée (ton "dernier avertissement" uniquement), parle d'une "mise en demeure formelle" et d'une possible "procédure de recouvrement", sans détailler davantage.
- N'utilise aucun texte entre crochets à compléter (pas de "[Nom]", "[date]", etc.) — écris un email fini, prêt à envoyer tel quel. Pour un délai, utilise une formulation relative ("dans les 5 jours suivant la réception de ce message"), jamais une date absolue que tu ne peux pas connaître.
- Termine par une signature générique : "Le service recouvrement — Meridian Distribution" (pas de prénom inventé).
- Reste concis : 130 à 180 mots pour le corps du message.

Réponds uniquement avec "Objet : ..." suivi du corps de l'email. Pas de commentaire, pas de balise, pas d'explication.`;

  const message = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const draft = message.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return NextResponse.json({ draft, tone, scoring, daysOverdue });
}
