import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";

// L'IA ne passe pas l'appel elle-même (pas d'agent vocal dans ce POC) : elle prépare
// une fiche d'appel pour un humain, et crée la tâche à traiter. Voir MEMOIRE-PROJET.md
// pour la décision de reporter l'agent vocal (Twilio/ElevenLabs) à une phase séparée.
export async function POST(req: Request) {
  const { invoiceId, reason } = await req.json();

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

  const historySummary = invoice.reminders.length
    ? `${invoice.reminders.length} relance(s) déjà envoyée(s) (${invoice.reminders
        .map((r) => r.channel)
        .join(", ")}), sans paiement à ce jour.`
    : "Aucune relance écrite envoyée pour l'instant.";

  const prompt = `Tu prépares une fiche d'appel courte pour un chargé de recouvrement humain qui va appeler un client B2B en retard de paiement, pour "Meridian Distribution" (PME marocaine).

Contexte :
- Client : ${invoice.client.name} (contact : ${invoice.client.contactName})
- Note de contexte : ${invoice.client.behaviorNote}
- Facture : ${invoice.reference}, montant ${invoice.amountMad.toLocaleString("fr-FR")} MAD
- Retard actuel : ${daysOverdue} jours
- Historique : ${historySummary}
- Pourquoi cet appel maintenant : ${reason ?? "à évaluer selon le contexte"}

Rédige une fiche d'appel en 4 à 6 points courts (une ligne chacun), qui couvre : comment ouvrir l'appel, les informations clés à rappeler, la question à poser pour comprendre le blocage, et ce qu'il faut obtenir avant de raccrocher (engagement de paiement avec date, ou raison claire du blocage). Ton factuel et direct, pas de formule à effet.

Réponds uniquement avec la liste à puces, sans titre ni commentaire.`;

  const message = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 350,
    messages: [{ role: "user", content: prompt }],
  });

  const talkingPoints = message.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const callTask = await prisma.callTask.create({
    data: {
      invoiceId,
      reason: reason ?? "Appel recommandé par l'agent.",
      talkingPoints,
      status: "A_FAIRE",
    },
  });

  return NextResponse.json({ callTask });
}
