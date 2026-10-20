import { prisma } from "@/lib/prisma";

// Seuls les agents qui font réellement appel à Claude peuvent être suspendus ou passés en
// "propose seulement". Les autres (analyse, prévision, supervision) sont des calculs
// déterministes du moteur : ils tournent toujours, y compris le garde-fou.
export const CONTROLLABLE_AGENTS = ["COMMUNICATION_SPECIALIST", "COLLECTION_STRATEGIST", "DISPUTE_SPECIALIST"] as const;
export type ControllableAgent = (typeof CONTROLLABLE_AGENTS)[number];

export type AgentCfg = { key: string; enabled: boolean; autonomy: "AUTO" | "PROPOSE" };

export function isControllable(key: string): key is ControllableAgent {
  return (CONTROLLABLE_AGENTS as readonly string[]).includes(key);
}

export async function getAgentConfigs(): Promise<Record<string, AgentCfg>> {
  const out: Record<string, AgentCfg> = {};
  for (const key of CONTROLLABLE_AGENTS) {
    const row = await prisma.agentConfig.upsert({ where: { key }, update: {}, create: { key } });
    out[key] = { key, enabled: row.enabled, autonomy: row.autonomy === "PROPOSE" ? "PROPOSE" : "AUTO" };
  }
  return out;
}

export const SUSPENDED_MESSAGE = "Cet agent est suspendu (page Agents IA) — reprenez-le pour continuer.";
