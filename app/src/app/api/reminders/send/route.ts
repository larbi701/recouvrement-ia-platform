import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// "Envoi" simulé pour la démo : on journalise la relance (traçabilité),
// on ne l'expédie pas réellement — cf. §9 du fichier mémoire du projet.
export async function POST(req: Request) {
  const { invoiceId, tone, content, createdBy } = await req.json();

  if (!invoiceId || !tone || !content) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      invoiceId,
      tone,
      content,
      status: "ENVOYEE_SIMULEE",
      createdBy: createdBy === "HUMAIN" ? "HUMAIN" : "AGENT",
    },
  });

  return NextResponse.json({ reminder });
}
