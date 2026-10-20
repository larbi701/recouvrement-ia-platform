import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Journalise l'envoi (traçabilité). Le vrai canal (WhatsApp, messagerie) est ouvert côté
// navigateur avec le message prérempli : c'est l'utilisateur qui appuie sur "Envoyer".
export async function POST(req: Request) {
  const { invoiceId, channel, tone, content, createdBy } = await req.json();

  if (!invoiceId || !tone || !content) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const settings = await getSettings();
  const reminder = await prisma.reminder.create({
    data: {
      invoiceId,
      channel: channel === "WHATSAPP" ? "WHATSAPP" : "EMAIL",
      tone,
      content,
      status: "ENVOYEE_SIMULEE",
      createdBy: createdBy === "HUMAIN" ? "HUMAIN" : "AGENT",
      sentAt: settings.simulatedDate,
    },
  });

  return NextResponse.json({ reminder });
}
