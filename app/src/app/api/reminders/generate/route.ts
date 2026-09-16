import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRiskScore } from "@/lib/scoring";
import { generateReminderDraft } from "@/lib/agentDraft";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const { invoiceId, channel: requestedChannel } = await req.json();
  const channel = requestedChannel === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

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

  const { draft, tone, daysOverdue, guardrail } = await generateReminderDraft(invoice, channel, settings);

  const scoring = computeRiskScore({
    daysOverdue,
    amountMad: invoice.amountMad,
    reminderCount: invoice.reminders.length,
    hasUnresolvedReply: invoice.replies.length > 0,
  });

  return NextResponse.json({ draft, tone, channel, scoring, daysOverdue, guardrail });
}
