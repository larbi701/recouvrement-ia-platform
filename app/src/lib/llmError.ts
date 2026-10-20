import { NextResponse } from "next/server";

// Transforme une erreur d'appel à Claude en réponse JSON lisible. Sans ça, une clé révoquée
// ou une panne renvoyait une page d'erreur HTML : l'écran affichait un message technique
// incompréhensible ("Unexpected token <") au lieu de dire quoi faire.
export function llmErrorResponse(e: unknown) {
  const status = (e as { status?: number })?.status;
  console.error("[LLM]", e instanceof Error ? e.message : e);

  if (status === 401 || status === 403) {
    return NextResponse.json(
      { error: "La clé API Anthropic est invalide ou révoquée. Mettez à jour ANTHROPIC_API_KEY dans app/.env.local, puis relancez le serveur." },
      { status: 502 }
    );
  }
  if (status === 429) {
    return NextResponse.json({ error: "Limite d'usage de l'IA atteinte pour le moment. Réessayez dans quelques minutes." }, { status: 502 });
  }
  return NextResponse.json({ error: "L'IA n'a pas répondu. Réessayez dans un instant." }, { status: 502 });
}
