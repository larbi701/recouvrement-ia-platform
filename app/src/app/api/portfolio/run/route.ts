import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderDraft } from "@/lib/agentDraft";
import { computeNextAction } from "@/lib/workflow";

// Pilotage automatique : Yas traite d'affilée tous les dossiers qui ont une relance
// email/WhatsApp due aujourd'hui, sans qu'un humain ait à ouvrir chaque dossier un par un.
// Séquentiel et pas parallèle : chaque étape doit apparaître dans le fil d'activité dans
// l'ordre où elle a été traitée, comme un vrai agent qui avance dossier après dossier.
export async function POST() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true },
    orderBy: { dueDate: "asc" },
  });

  const toProcess = invoices.filter((invoice) => {
    const daysOverdue = Math.max(0, Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000));
    const emailCount = invoice.reminders.filter((r) => r.channel === "EMAIL").length;
    const whatsappCount = invoice.reminders.filter((r) => r.channel === "WHATSAPP").length;
    const nextAction = computeNextAction({
      daysOverdue,
      hasUnresolvedReply: invoice.replies.length > 0,
      emailCount,
      whatsappCount,
      hasPendingCallTask: invoice.callTasks.some((c) => c.status === "A_FAIRE"),
      hasAnyCallTask: invoice.callTasks.length > 0,
      strategic: invoice.client.strategic,
      chronicLatePayer: invoice.client.chronicLatePayer,
    });
    return nextAction.kind === "EMAIL" || nextAction.kind === "WHATSAPP";
  });

  const results: { clientName: string; channel: string; tone: string; snippet: string }[] = [];

  for (const invoice of toProcess) {
    const daysOverdue = Math.max(0, Math.floor((Date.now() - invoice.dueDate.getTime()) / 86_400_000));
    const emailCount = invoice.reminders.filter((r) => r.channel === "EMAIL").length;
    const whatsappCount = invoice.reminders.filter((r) => r.channel === "WHATSAPP").length;
    const nextAction = computeNextAction({
      daysOverdue,
      hasUnresolvedReply: invoice.replies.length > 0,
      emailCount,
      whatsappCount,
      hasPendingCallTask: invoice.callTasks.some((c) => c.status === "A_FAIRE"),
      hasAnyCallTask: invoice.callTasks.length > 0,
      strategic: invoice.client.strategic,
      chronicLatePayer: invoice.client.chronicLatePayer,
    });
    if (nextAction.kind !== "EMAIL" && nextAction.kind !== "WHATSAPP") continue;

    const { draft, tone } = await generateReminderDraft(invoice, nextAction.kind);

    await prisma.reminder.create({
      data: {
        invoiceId: invoice.id,
        channel: nextAction.kind,
        tone,
        content: draft,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
      },
    });

    results.push({
      clientName: invoice.client.name,
      channel: nextAction.kind,
      tone,
      snippet: draft.slice(0, 140),
    });
  }

  return NextResponse.json({ results });
}
