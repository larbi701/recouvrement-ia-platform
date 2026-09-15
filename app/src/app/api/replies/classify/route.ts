import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";

// Agent "Négociateur" — en direct : lit une réponse du client, la classe, la résume,
// et propose une action. C'est la brique qui manquait (les réponses du scénario de
// démo initial sont pré-écrites, mais toute nouvelle réponse passe maintenant ici).
export async function POST(req: Request) {
  const { invoiceId, content } = await req.json();

  if (!invoiceId || !content) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, reminders: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const prompt = `Tu es l'agent qui traite les réponses des clients en retard de paiement pour "Meridian Distribution" (PME marocaine, B2B). Un client vient de répondre à une relance. Analyse sa réponse.

Contexte :
- Client : ${invoice.client.name}
- Facture : ${invoice.reference}, montant ${invoice.amountMad.toLocaleString("fr-FR")} MAD
- Réponse du client : "${content}"

Réponds STRICTEMENT en JSON, sans balise ni commentaire, avec cette forme exacte :
{
  "classifiedIntent": "DEMANDE_DELAI" | "CONTESTATION" | "CONFIRMATION" | "AUTRE",
  "agentSummary": "une phrase factuelle résumant ce que dit le client",
  "proposedAction": "une phrase proposant l'action à prendre"
}

Règles pour proposedAction :
- DEMANDE_DELAI : proposer un échéancier raisonnable dans la limite du montant dû, en précisant qu'il doit être validé par un humain avant envoi.
- CONTESTATION : ne jamais proposer de relancer automatiquement — dire explicitement que c'est hors cadre automatique et doit être vérifié par un humain.
- CONFIRMATION : proposer de classer le dossier en attente de paiement, sans nouvelle relance immédiate.
- AUTRE : proposer qu'un humain lise la réponse directement, sans action automatique suggérée.`;

  const message = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  let parsed: { classifiedIntent: string; agentSummary: string; proposedAction: string };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return NextResponse.json({ error: "Réponse de l'agent illisible, réessaie." }, { status: 502 });
  }

  const reply = await prisma.clientReply.create({
    data: {
      invoiceId,
      content,
      classifiedIntent: parsed.classifiedIntent,
      agentSummary: parsed.agentSummary,
      proposedAction: parsed.proposedAction,
    },
  });

  return NextResponse.json({ reply });
}
