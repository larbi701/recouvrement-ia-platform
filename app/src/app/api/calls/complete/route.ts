import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const { callTaskId, outcome, outcomeNote, promisedDate } = await req.json();

  if (!callTaskId || !outcome) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const settings = await getSettings();

  const callTask = await prisma.callTask.update({
    where: { id: callTaskId },
    data: {
      status: "FAIT",
      outcome,
      outcomeNote: outcomeNote || null,
      promisedDate: promisedDate ? new Date(promisedDate) : null,
      completedAt: settings.simulatedDate,
    },
  });

  // Promise To Pay Manager : une promesse obtenue par téléphone devient un engagement suivi.
  if (outcome === "PROMESSE_PAIEMENT" && promisedDate) {
    const invoice = await prisma.invoice.findUnique({ where: { id: callTask.invoiceId } });
    if (invoice) {
      await prisma.promiseToPay.create({
        data: {
          invoiceId: callTask.invoiceId,
          amountMad: invoice.amountMad,
          promisedDate: new Date(promisedDate),
          status: "EN_COURS",
          source: "APPEL",
        },
      });
    }
  }

  return NextResponse.json({ callTask });
}
