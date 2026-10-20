import { NextResponse } from "next/server";
import { llmErrorResponse } from "@/lib/llmError";
import { prisma } from "@/lib/prisma";
import { generateReminderDraft } from "@/lib/agentDraft";
import { buildWorklistItem } from "@/lib/buildWorklistItem";
import { getSettings } from "@/lib/settings";
import { getAgentConfigs, SUSPENDED_MESSAGE } from "@/lib/agentConfig";
import { FALLBACK_NOTE } from "@/lib/fallbacks";

const MAX_BULK = 8; // un appel Claude par dossier : on borne le coût d'une action groupée

// Action groupée depuis le Portefeuille : prépare une relance par dossier sélectionné.
// Tout arrive en brouillon dans Messages > À valider — jamais d'envoi sans validation humaine,
// quel que soit le niveau de validation du dossier.
async function handle(req: Request) {
  const { invoiceIds } = await req.json();
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return NextResponse.json({ error: "Aucun dossier sélectionné" }, { status: 400 });
  }

  const [invoices, settings, agents] = await Promise.all([
    prisma.invoice.findMany({
      where: { id: { in: invoiceIds.slice(0, 50) } },
      include: { client: true, reminders: true, replies: true, callTasks: true, promises: true },
    }),
    getSettings(),
    getAgentConfigs(),
  ]);
  if (!agents.COMMUNICATION_SPECIALIST.enabled) return NextResponse.json({ error: SUSPENDED_MESSAGE }, { status: 409 });

  const prepared: string[] = [];
  const skipped: { clientName: string; reason: string }[] = [];

  for (const invoice of invoices) {
    const item = buildWorklistItem(invoice, settings);
    if (item.nextAction.kind !== "EMAIL" && item.nextAction.kind !== "WHATSAPP") {
      skipped.push({ clientName: item.clientName, reason: "Pas de relance écrite recommandée pour ce dossier" });
      continue;
    }
    if (item.drafts.length > 0) {
      skipped.push({ clientName: item.clientName, reason: "Un brouillon attend déjà sa validation" });
      continue;
    }
    if (prepared.length >= MAX_BULK) {
      skipped.push({ clientName: item.clientName, reason: `Limite de ${MAX_BULK} dossiers par action groupée` });
      continue;
    }
    const { draft, tone, guardrail, fallback } = await generateReminderDraft(invoice, item.nextAction.kind, settings);
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
    prepared.push(item.clientName);
  }

  return NextResponse.json({ prepared, skipped });
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    return llmErrorResponse(e);
  }
}
