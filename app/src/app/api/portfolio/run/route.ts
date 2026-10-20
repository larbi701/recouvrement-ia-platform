import { NextResponse } from "next/server";
import { llmErrorResponse } from "@/lib/llmError";
import { prisma } from "@/lib/prisma";
import { generateReminderDraft } from "@/lib/agentDraft";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { getAgentConfigs, SUSPENDED_MESSAGE } from "@/lib/agentConfig";
import { FALLBACK_NOTE } from "@/lib/fallbacks";

// Pilotage automatique : Yas traite d'affilée tous les dossiers dont la prochaine action
// (email/WhatsApp) ne nécessite PAS de validation humaine (Niveau 2 — Semi-Autonome).
// - Agent suspendu : rien ne part, la route refuse.
// - Autonomie "propose seulement" : tout est préparé en brouillon, l'humain valide dans Messages.
// - Message bloqué par le garde-fou : jamais envoyé, déposé en brouillon avec le motif.
async function handle() {
  const [invoices, settings, agents] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
      orderBy: { dueDate: "asc" },
    }),
    getSettings(),
    getAgentConfigs(),
  ]);

  const comm = agents.COMMUNICATION_SPECIALIST;
  if (!comm.enabled) return NextResponse.json({ error: SUSPENDED_MESSAGE }, { status: 409 });

  const toProcess = invoices.filter((invoice) => {
    const item = buildWorklistItem(invoice, settings);
    return (
      (item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP") &&
      !item.nextAction.requiresValidation &&
      item.drafts.length === 0
    );
  });

  const results: { clientName: string; channel: string; tone: string; snippet: string }[] = [];
  const drafted: { clientName: string; reason: string }[] = [];

  for (const invoice of toProcess) {
    const item = buildWorklistItem(invoice, settings);
    if (item.nextAction.kind !== "EMAIL" && item.nextAction.kind !== "WHATSAPP") continue;

    const { draft, tone, guardrail, fallback } = await generateReminderDraft(invoice, item.nextAction.kind, settings);

    // Un message de secours (IA indisponible) n'est jamais envoyé seul : brouillon à relire.
    const proposeOnly = comm.autonomy === "PROPOSE";
    if (!guardrail.ok || proposeOnly || fallback) {
      await prisma.reminder.create({
        data: {
          invoiceId: invoice.id,
          channel: item.nextAction.kind,
          tone,
          content: draft,
          status: "BROUILLON",
          createdBy: "AGENT",
          note: !guardrail.ok ? guardrail.violations.join(" · ") : fallback ? FALLBACK_NOTE : null,
          sentAt: settings.simulatedDate,
        },
      });
      drafted.push({
        clientName: invoice.client.name,
        reason: !guardrail.ok
          ? guardrail.violations.join(" · ")
          : fallback
          ? "IA indisponible : message de secours à relire"
          : "Autonomie réglée sur « propose seulement »",
      });
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
        sentAt: settings.simulatedDate,
      },
    });

    results.push({
      clientName: invoice.client.name,
      channel: item.nextAction.kind,
      tone,
      snippet: draft.slice(0, 140),
    });
  }

  return NextResponse.json({ results, drafted });
}

export async function POST() {
  try {
    return await handle();
  } catch (e) {
    return llmErrorResponse(e);
  }
}
