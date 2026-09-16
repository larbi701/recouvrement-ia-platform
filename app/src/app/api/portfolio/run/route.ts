import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderDraft } from "@/lib/agentDraft";
import { buildWorklistItem } from "@/lib/buildWorklistItem";

// Pilotage automatique : Yas traite d'affilée tous les dossiers dont la prochaine action
// (email/WhatsApp) ne nécessite PAS de validation humaine (Niveau 2 — Semi-Autonome, §8).
// Les dossiers sensibles (montant élevé, client stratégique, playbooks avancés) restent
// dans les Work Queues pour validation individuelle — l'automatique ne les court-circuite pas.
export async function POST() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    orderBy: { dueDate: "asc" },
  });

  const toProcess = invoices.filter((invoice) => {
    const item = buildWorklistItem(invoice);
    return (
      (item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP") &&
      !item.nextAction.requiresValidation
    );
  });

  const results: { clientName: string; channel: string; tone: string; snippet: string }[] = [];

  for (const invoice of toProcess) {
    const item = buildWorklistItem(invoice);
    if (item.nextAction.kind !== "EMAIL" && item.nextAction.kind !== "WHATSAPP") continue;

    const { draft, tone } = await generateReminderDraft(invoice, item.nextAction.kind);

    await prisma.reminder.create({
      data: {
        invoiceId: invoice.id,
        channel: item.nextAction.kind,
        tone,
        content: draft,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
      },
    });

    results.push({
      clientName: invoice.client.name,
      channel: item.nextAction.kind,
      tone,
      snippet: draft.slice(0, 140),
    });
  }

  return NextResponse.json({ results });
}
