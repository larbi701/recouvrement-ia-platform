import { computeRiskScore } from "@/lib/scoring";
import { computeNextAction } from "@/lib/workflow";
import type { WorklistItem } from "@/lib/types";
import type { Prisma } from "@prisma/client";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { client: true; reminders: true; replies: true; callTasks: true };
}>;

export function buildWorklistItem(invoice: InvoiceWithRelations): WorklistItem {
  const daysOverdue = Math.max(0, Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000));
  const emailCount = invoice.reminders.filter((r) => r.channel === "EMAIL").length;
  const whatsappCount = invoice.reminders.filter((r) => r.channel === "WHATSAPP").length;
  const hasUnresolvedReply = invoice.replies.length > 0;

  const { score, priority, reasoning, breakdown } = computeRiskScore({
    daysOverdue,
    amountMad: invoice.amountMad,
    reminderCount: emailCount + whatsappCount,
    hasUnresolvedReply,
  });

  const nextAction = computeNextAction({
    daysOverdue,
    hasUnresolvedReply,
    emailCount,
    whatsappCount,
    hasPendingCallTask: invoice.callTasks.some((c) => c.status === "A_FAIRE"),
    hasAnyCallTask: invoice.callTasks.length > 0,
    strategic: invoice.client.strategic,
    chronicLatePayer: invoice.client.chronicLatePayer,
  });

  return {
    invoiceId: invoice.id,
    reference: invoice.reference,
    amountMad: invoice.amountMad,
    daysOverdue,
    status: invoice.status,
    clientId: invoice.client.id,
    clientName: invoice.client.name,
    sector: invoice.client.sector,
    contactName: invoice.client.contactName,
    contactEmail: invoice.client.contactEmail,
    contactPhone: invoice.client.contactPhone,
    behaviorNote: invoice.client.behaviorNote,
    strategic: invoice.client.strategic,
    chronicLatePayer: invoice.client.chronicLatePayer,
    reminders: invoice.reminders
      .slice()
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .map((r) => ({
        id: r.id,
        channel: r.channel,
        tone: r.tone,
        content: r.content,
        status: r.status,
        createdBy: r.createdBy,
        sentAt: r.sentAt.toISOString(),
      })),
    replies: invoice.replies.map((r) => ({
      id: r.id,
      content: r.content,
      classifiedIntent: r.classifiedIntent,
      agentSummary: r.agentSummary,
      proposedAction: r.proposedAction,
      receivedAt: r.receivedAt.toISOString(),
    })),
    callTasks: invoice.callTasks
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((c) => ({
        id: c.id,
        reason: c.reason,
        talkingPoints: c.talkingPoints,
        status: c.status,
        outcome: c.outcome,
        outcomeNote: c.outcomeNote,
        promisedDate: c.promisedDate ? c.promisedDate.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        completedAt: c.completedAt ? c.completedAt.toISOString() : null,
      })),
    score,
    priority,
    reasoning,
    breakdown,
    nextAction,
  };
}
