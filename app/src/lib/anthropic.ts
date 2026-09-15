import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Haiku : le modèle le moins cher, largement suffisant pour rédiger des relances courtes.
export const AGENT_MODEL = "claude-haiku-4-5-20251001";
