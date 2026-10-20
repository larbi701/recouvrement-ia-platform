import { NextResponse } from "next/server";
import { llmErrorResponse } from "@/lib/llmError";
import { prisma } from "@/lib/prisma";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { getSettings } from "@/lib/settings";
import { getAgentConfigs, SUSPENDED_MESSAGE } from "@/lib/agentConfig";
import { fallbackCallSheet } from "@/lib/fallbacks";

// L'IA ne passe pas l'appel elle-même (pas d'agent vocal dans ce POC) : elle prépare
// une fiche d'appel pour un humain, et crée la tâche à traiter. Voir MEMOIRE-PROJET.md
// pour la décision de reporter l'agent vocal (Twilio/ElevenLabs) à une phase séparée.
async function handle(req: Request) {
  const { invoiceId, reason } = await req.json();

  if (!(await getAgentConfigs()).COLLECTION_STRATEGIST.enabled) {
    return NextResponse.json({ error: SUSPENDED_MESSAGE }, { status: 409 });
  }

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, reminders: true, replies: true },
    }),
    getSettings(),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const daysOverdue = Math.max(
    0,
    Math.floor((settings.simulatedDate.getTime() - invoice.dueDate.getTime()) / 86_400_000)
  );

  const historySummary = invoice.reminders.length
    ? `${invoice.reminders.length} relance(s) déjà envoyée(s) (${invoice.reminders
        .map((r) => r.channel)
        .join(", ")}), sans paiement à ce jour.`
    : "Aucune relance écrite envoyée pour l'instant.";

  const prompt = `Tu prépares une fiche d'appel courte pour un chargé de recouvrement humain qui va appeler un client B2B en retard de paiement, pour "${settings.companyName}" (PME marocaine).

Contexte :
- Client : ${invoice.client.name} (contact : ${invoice.client.contactName})
- Note de contexte : ${invoice.client.behaviorNote}
- Facture : ${invoice.reference}, montant ${invoice.amountMad.toLocaleString("fr-FR")} MAD
- Retard actuel : ${daysOverdue} jours
- Historique : ${historySummary}
- Pourquoi cet appel maintenant : ${reason ?? "à évaluer selon le contexte"}

Rédige une fiche d'appel en 4 à 6 points courts (une ligne chacun), qui couvre : comment ouvrir l'appel, les informations clés à rappeler, la question à poser pour comprendre le blocage, et ce qu'il faut obtenir avant de raccrocher (engagement de paiement avec date, ou raison claire du blocage). Ton factuel et direct, pas de formule à effet.

Réponds uniquement avec la liste à puces, sans titre ni commentaire.`;

  // Si l'IA est indisponible, la fiche d'appel de secours (déterministe) prend le relais :
  // l'équipe peut quand même passer l'appel.
  let talkingPoints: string;
  let fallback = false;
  try {
    const message = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    });
    talkingPoints = message.content
      .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!talkingPoints) throw new Error("fiche vide");
  } catch (e) {
    console.error("[LLM] fiche d'appel : modèle de secours utilisé :", e instanceof Error ? e.message : e);
    fallback = true;
    talkingPoints = fallbackCallSheet({
      reference: invoice.reference,
      amountMad: invoice.amountMad,
      daysOverdue,
      reminderCount: invoice.reminders.length,
    });
  }

  const callTask = await prisma.callTask.create({
    data: {
      invoiceId,
      reason: reason ?? "Appel recommandé par l'agent.",
      talkingPoints,
      status: "A_FAIRE",
      createdAt: settings.simulatedDate,
    },
  });

  return NextResponse.json({ callTask, fallback });
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    return llmErrorResponse(e);
  }
}
