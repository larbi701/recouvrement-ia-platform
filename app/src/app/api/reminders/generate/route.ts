import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRiskScore } from "@/lib/scoring";
import { generateReminderDraft } from "@/lib/agentDraft";

export async function POST(req: Request) {
  const { invoiceId, channel: requestedChannel } = await req.json();
  const channel = requestedChannel === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, reminders: true, replies: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const { draft, tone, daysOverdue } = await generateReminderDraft(invoice, channel);

  const scoring = computeRiskScore({
    daysOverdue,
    amountMad: invoice.amountMad,
    reminderCount: invoice.reminders.length,
    hasUnresolvedReply: invoice.replies.length > 0,
  });

  return NextResponse.json({ draft, tone, channel, scoring, daysOverdue });
}
