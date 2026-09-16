import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderDraft } from "@/lib/agentDraft";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";

// Pilotage automatique : Yas traite d'affilée tous les dossiers dont la prochaine action
// (email/WhatsApp) ne nécessite PAS de validation humaine (Niveau 2 — Semi-Autonome, §8).
// Les dossiers sensibles (montant élevé, client stratégique, playbooks avancés) restent
// dans les Work Queues pour validation individuelle — l'automatique ne les court-circuite pas.
export async function POST() {
  const [invoices, settings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
      orderBy: { dueDate: "asc" },
    }),
    getSettings(),
  ]);

  const toProcess = invoices.filter((invoice) => {
    const item = buildWorklistItem(invoice, settings);
    return (
      (item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP") &&
      !item.nextAction.requiresValidation
    );
  });

  const results: { clientName: string; channel: string; tone: string; snippet: string }[] = [];
  const blocked: { clientName: string; violations: string[] }[] = [];

  for (const invoice of toProcess) {
    const item = buildWorklistItem(invoice, settings);
    if (item.nextAction.kind !== "EMAIL" && item.nextAction.kind !== "WHATSAPP") continue;

    const { draft, tone, guardrail } = await generateReminderDraft(invoice, item.nextAction.kind, settings);

    // Garde-fou de contenu : un message qui échoue au contrôle (terme interdit, montant ou
    // référence qui ne correspond pas au dossier) n'est jamais auto-envoyé, même si le
    // niveau de validation du playbook ne l'exigeait pas — Collection Supervisor le
    // renvoie systématiquement à un humain plutôt que de le laisser partir tel quel.
    if (!guardrail.ok) {
      blocked.push({ clientName: invoice.client.name, violations: guardrail.violations });
      continue;
    }

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

  return NextResponse.json({ results, blocked });
}
