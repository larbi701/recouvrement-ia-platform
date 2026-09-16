import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { promiseId, outcome } = await req.json();

  if (!promiseId || (outcome !== "TENUE" && outcome !== "ROMPUE")) {
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
  }

  const promise = await prisma.promiseToPay.update({
    where: { id: promiseId },
    data: { status: outcome, resolvedAt: new Date() },
  });

  return NextResponse.json({ promise });
}
