import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    hitlAmountThreshold,
    earlyMaxDays,
    standardMaxDays,
    intensiveMaxDays,
    preLegalMaxDays,
    companyName,
    companySector,
    channelEmail,
    channelWhatsapp,
    extraForbiddenTerms,
    styleGuidelines,
  } = body;

  const values = [hitlAmountThreshold, earlyMaxDays, standardMaxDays, intensiveMaxDays, preLegalMaxDays];
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v) || v <= 0)) {
    return NextResponse.json({ error: "Valeurs invalides" }, { status: 400 });
  }
  if (!(earlyMaxDays < standardMaxDays && standardMaxDays < intensiveMaxDays && intensiveMaxDays < preLegalMaxDays)) {
    return NextResponse.json(
      { error: "Les seuils de jours doivent être strictement croissants (précoce < standard < intensif < pré-contentieux)" },
      { status: 400 }
    );
  }
  if (typeof companyName !== "string" || !companyName.trim() || typeof companySector !== "string" || !companySector.trim()) {
    return NextResponse.json({ error: "La raison sociale et le secteur ne peuvent pas être vides" }, { status: 400 });
  }

  if (typeof channelEmail !== "boolean" || typeof channelWhatsapp !== "boolean") {
    return NextResponse.json({ error: "Canaux invalides" }, { status: 400 });
  }
  if (!channelEmail && !channelWhatsapp) {
    return NextResponse.json({ error: "Au moins un canal (email ou WhatsApp) doit rester activé" }, { status: 400 });
  }

  const data = {
    channelEmail,
    channelWhatsapp,
    extraForbiddenTerms: typeof extraForbiddenTerms === "string" ? extraForbiddenTerms.trim().slice(0, 500) : "",
    styleGuidelines: typeof styleGuidelines === "string" ? styleGuidelines.trim().slice(0, 500) : "",
    hitlAmountThreshold,
    earlyMaxDays,
    standardMaxDays,
    intensiveMaxDays,
    preLegalMaxDays,
    companyName: companyName.trim(),
    companySector: companySector.trim(),
  };

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ settings });
}
