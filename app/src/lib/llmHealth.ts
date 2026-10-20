// État de la connexion à l'IA, affiché dans l'en-tête. Un appel gratuit (liste des modèles)
// vérifie que la clé est valide ; le résultat est gardé 60 s pour ne pas ralentir les pages.
export type LlmHealth = { ok: boolean; reason: string | null };

let cache: { at: number; value: LlmHealth } | null = null;

export async function getLlmHealth(): Promise<LlmHealth> {
  if (cache && Date.now() - cache.at < 60_000) return cache.value;

  const key = process.env.ANTHROPIC_API_KEY;
  let value: LlmHealth;
  if (!key) {
    value = { ok: false, reason: "Aucune clé API renseignée (ANTHROPIC_API_KEY)." };
  } else {
    try {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      value = res.ok
        ? { ok: true, reason: null }
        : { ok: false, reason: res.status === 401 || res.status === 403 ? "Clé API invalide ou révoquée." : `L'IA répond avec une erreur (${res.status}).` };
    } catch {
      value = { ok: false, reason: "L'IA est injoignable (réseau ou panne)." };
    }
  }
  cache = { at: Date.now(), value };
  return value;
}
