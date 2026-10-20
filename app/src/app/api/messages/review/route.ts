import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { checkGeneratedContent } from "@/lib/contentGuardrails";

// Validation humaine d'un brouillon préparé par Yas : approuver (éventuellement après
// modification — le garde-fou rejoue sur le texte final) ou rejeter avec un motif.
export async function POST(req: Request) {
  const { reminderId, decision, content, reason } = await req.json();
  if (!reminderId || (decision !== "approve" && decision !== "reject")) {
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
  }

  const [reminder, settings] = await Promise.all([
    prisma.reminder.findUnique({ where: { id: reminderId }, include: { invoice: true } }),
    getSettings(),
  ]);
  if (!reminder || reminder.status !== "BROUILLON") {
    return NextResponse.json({ error: "Brouillon introuvable ou déjà traité" }, { status: 404 });
  }

  if (decision === "reject") {
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { status: "REJETEE", note: (reason ?? "").trim() || "Rejeté par l'équipe" },
    });
    return NextResponse.json({ ok: true });
  }

  const finalText = typeof content === "string" && content.trim() ? content.trim() : reminder.content;
  const check = checkGeneratedContent(finalText, {
    invoiceReference: reminder.invoice.reference,
    amountMad: reminder.invoice.amountMad,
    maxLength: reminder.channel === "WHATSAPP" ? 700 : 2500,
    extraForbiddenTerms: settings.extraForbiddenTerms,
  });
  if (!check.ok) {
    return NextResponse.json({ error: "Le garde-fou bloque ce message", violations: check.violations }, { status: 422 });
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "ENVOYEE_SIMULEE", content: finalText, createdBy: "HUMAIN", note: null, sentAt: settings.simulatedDate },
  });
  return NextResponse.json({ ok: true });
}
