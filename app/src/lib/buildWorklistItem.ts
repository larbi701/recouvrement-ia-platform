import { computeRiskScore, computeExtendedScores } from "@/lib/scoring";
import { computeNextAction, computePlaybook } from "@/lib/workflow";
import type { WorklistItem } from "@/lib/types";
import type { Prisma } from "@prisma/client";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { client: true; reminders: true; replies: true; callTasks: true; promises: true };
}>;

export function buildWorklistItem(invoice: InvoiceWithRelations): WorklistItem {
  // Signé : négatif = jours restants avant échéance (PRE_DUE), positif = jours de retard.
  const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000);
  const emailCount = invoice.reminders.filter((r) => r.channel === "EMAIL").length;
  const whatsappCount = invoice.reminders.filter((r) => r.channel === "WHATSAPP").length;
  const hasUnresolvedReply = invoice.replies.length > 0;

  const { score, priority, reasoning, breakdown } = computeRiskScore({
    daysOverdue,
    amountMad: invoice.amountMad,
    reminderCount: emailCount + whatsappCount,
    hasUnresolvedReply,
  });

  // Approximation POC : historique calculé sur ce dossier uniquement (chaque client n'a qu'une
  // facture dans le scénario démo). À agréger sur tout l'historique client si un client a
  // plusieurs factures un jour.
  const disputeCount = invoice.replies.filter((r) => r.classifiedIntent === "CONTESTATION").length;
  const promisesTenues = invoice.promises.filter((p) => p.status === "TENUE").length;
  const promisesRompues = invoice.promises.filter((p) => p.status === "ROMPUE").length;

  const extendedScores = computeExtendedScores({
    daysOverdue,
    amountMad: invoice.amountMad,
    chronicLatePayer: invoice.client.chronicLatePayer,
    strategic: invoice.client.strategic,
    hasUnresolvedReply,
    disputeCount,
    promisesTenues,
    promisesRompues,
  });

  const activePromiseRecord = invoice.promises
    .filter((p) => p.status === "EN_COURS")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const activePromise = activePromiseRecord
    ? {
        promisedDate: activePromiseRecord.promisedDate.toISOString(),
        overdue: activePromiseRecord.promisedDate.getTime() < Date.now(),
      }
    : null;

  const lastCallOutcome =
    invoice.callTasks
      .filter((c) => c.status === "FAIT")
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0]?.outcome ?? null;

  const nextAction = computeNextAction({
    daysOverdue,
    amountMad: invoice.amountMad,
    hasUnresolvedReply,
    emailCount,
    whatsappCount,
    hasPendingCallTask: invoice.callTasks.some((c) => c.status === "A_FAIRE"),
    hasAnyCallTask: invoice.callTasks.length > 0,
    lastCallOutcome,
    strategic: invoice.client.strategic,
    chronicLatePayer: invoice.client.chronicLatePayer,
    activePromise,
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
    promises: invoice.promises
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => ({
        id: p.id,
        amountMad: p.amountMad,
        promisedDate: p.promisedDate.toISOString(),
        status: p.status,
        source: p.source,
        createdAt: p.createdAt.toISOString(),
        resolvedAt: p.resolvedAt ? p.resolvedAt.toISOString() : null,
      })),
    score,
    priority,
    reasoning,
    breakdown,
    playbook: computePlaybook(daysOverdue),
    scores: extendedScores,
    nextAction,
  };
}
