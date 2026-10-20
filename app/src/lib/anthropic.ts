import Anthropic from "@anthropic-ai/sdk";

// maxRetries : le SDK réessaie tout seul sur les erreurs transitoires (429, 5xx, réseau).
// timeout : sans lui, un appel bloqué figerait l'écran ; au-delà, on bascule sur le modèle de secours.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});

// Haiku : le modèle le moins cher, largement suffisant pour rédiger des relances courtes.
export const AGENT_MODEL = "claude-haiku-4-5-20251001";
