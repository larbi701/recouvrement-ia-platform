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

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { hitlAmountThreshold, earlyMaxDays, standardMaxDays, intensiveMaxDays, preLegalMaxDays },
    create: { id: "singleton", hitlAmountThreshold, earlyMaxDays, standardMaxDays, intensiveMaxDays, preLegalMaxDays },
  });

  return NextResponse.json({ settings });
}
