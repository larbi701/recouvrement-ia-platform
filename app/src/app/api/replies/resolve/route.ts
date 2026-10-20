import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Traitement humain d'une réponse client : la marquer traitée (le dossier est débloqué) ou
// accorder un délai, ce qui crée une promesse de paiement suivie par le Promise To Pay Manager.
export async function POST(req: Request) {
  const { replyId, action, days } = await req.json();
  if (!replyId || (action !== "HANDLED" && action !== "GRANT_DELAY")) {
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
  }

  const [reply, settings] = await Promise.all([
    prisma.clientReply.findUnique({ where: { id: replyId }, include: { invoice: true } }),
    getSettings(),
  ]);
  if (!reply) return NextResponse.json({ error: "Réponse introuvable" }, { status: 404 });

  if (action === "GRANT_DELAY") {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1 || n > 180) {
      return NextResponse.json({ error: "Délai invalide (1 à 180 jours)" }, { status: 400 });
    }
    await prisma.promiseToPay.create({
      data: {
        invoiceId: reply.invoiceId,
        amountMad: reply.invoice.amountMad,
        promisedDate: new Date(settings.simulatedDate.getTime() + Math.round(n) * 86_400_000),
        status: "EN_COURS",
        source: "REPONSE",
        createdAt: settings.simulatedDate,
      },
    });
  }

  await prisma.clientReply.update({ where: { id: replyId }, data: { handled: true } });
  return NextResponse.json({ ok: true });
}
