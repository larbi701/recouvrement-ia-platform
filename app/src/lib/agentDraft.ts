import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { suggestedTone, type Tone } from "@/lib/scoring";
import { checkGeneratedContent, type GuardrailResult } from "@/lib/contentGuardrails";
import { fallbackDraft } from "@/lib/fallbacks";
import type { PlatformSettings } from "@/lib/settings";
import type { Prisma } from "@prisma/client";

type InvoiceForDraft = Prisma.InvoiceGetPayload<{ include: { client: true; reminders: true } }>;

const CHANNEL_MAX_LENGTH: Record<"EMAIL" | "WHATSAPP", number> = { EMAIL: 2500, WHATSAPP: 700 };

// Logique de rédaction de Yas, partagée entre l'action manuelle (un dossier)
// et le pilotage automatique (plusieurs dossiers d'affilée). Le nom de l'entreprise
// créancière vient des Paramètres (settings.companyName) — jamais en dur dans le prompt,
// pour rester cohérent avec la marque affichée dans le reste de l'application.
export async function generateReminderDraft(
  invoice: InvoiceForDraft,
  channel: "EMAIL" | "WHATSAPP",
  settings: PlatformSettings
): Promise<{ draft: string; tone: Tone; daysOverdue: number; guardrail: GuardrailResult; fallback: boolean }> {
  const daysOverdue = Math.max(0, Math.floor((settings.simulatedDate.getTime() - invoice.dueDate.getTime()) / 86_400_000));
  const tone = suggestedTone(invoice.reminders.length);
  const toneInstruction =
    tone === "AMICALE"
      ? "amical, premier rappel, on suppose un simple oubli"
      : tone === "FERME"
      ? "ferme mais respectueux, deuxième niveau, on rappelle les relances précédentes"
      : "dernier avertissement avant mise en demeure, sérieux, explicite sur les conséquences, mais toujours professionnel et factuellement exact sur le plan juridique";

  const legalContext =
    daysOverdue >= 105
      ? `\n- Contexte légal marocain : ce retard approche ou dépasse le plafond légal de 120 jours entre partenaires commerciaux fixé par la loi 69-21. Tu peux le mentionner brièvement, de façon factuelle (pas comme une menace), pour appuyer le sérieux de la situation.`
      : "";

  const formatRules =
    channel === "WHATSAPP"
      ? `- Format WhatsApp : message court (40 à 70 mots), sans "Objet :", sans formule d'ouverture/fermeture façon lettre — direct, comme un message professionnel qu'on tape sur son téléphone. Une ou deux phrases courtes maximum par paragraphe. Pas d'emoji.
- Termine par une signature courte sur sa propre ligne : "${settings.companyName}".`
      : `- Format email : commence par "Objet : ...", corps structuré en paragraphes courts, 130 à 180 mots.
- Termine par une signature générique : "Le service recouvrement — ${settings.companyName}" (pas de prénom inventé).`;

  const prompt = `Tu es l'agent de recouvrement amiable de "${settings.companyName}", une PME marocaine (B2B, secteur : ${settings.companySector}). Rédige UNE relance en français, professionnelle et humaine, jamais agressive, au format ${channel === "WHATSAPP" ? "WhatsApp" : "email"}.

Contexte :
- Client : ${invoice.client.name} (contact : ${invoice.client.contactName})
- Note de contexte sur ce client : ${invoice.client.behaviorNote}
- Facture : ${invoice.reference}, montant ${invoice.amountMad.toLocaleString("fr-FR")} MAD
- Retard actuel : ${daysOverdue} jours
- Nombre de relances déjà envoyées : ${invoice.reminders.length}
- Ton attendu : ${toneInstruction}${legalContext}

Règles strictes :
- On est encore dans le recouvrement AMIABLE, pas dans le contentieux : ne jamais mentionner "porter plainte" (terme de droit pénal, inapproprié pour un impayé commercial) ni promettre une action judiciaire précise. Si une escalade doit être évoquée (ton "dernier avertissement" uniquement), parle d'une "mise en demeure formelle" et d'une possible "procédure de recouvrement", sans détailler davantage.
- N'utilise aucun texte entre crochets à compléter (pas de "[Nom]", "[date]", etc.) — écris un message fini, prêt à envoyer tel quel. Pour un délai, utilise une formulation relative ("dans les 5 jours suivant la réception de ce message"), jamais une date absolue que tu ne peux pas connaître.
${formatRules}
- Ton de voix (charte VELOS IA) : factuel (un chiffre plutôt qu'un adjectif), direct (phrases courtes, voix active), sobre (aucune formule à effet). Évite tout vocabulaire du type "solution innovante", "révolutionner", "disruptif".${
    settings.styleGuidelines.trim() ? `\n- Consignes de style de l'entreprise : ${settings.styleGuidelines.trim()}` : ""
  }

Réponds uniquement avec le message, en texte brut. Pas de commentaire, pas de balise, pas de markdown (pas de **gras**, pas de listes à puces), pas d'explication.`;

  const guardOpts = {
    invoiceReference: invoice.reference,
    amountMad: invoice.amountMad,
    maxLength: CHANNEL_MAX_LENGTH[channel],
    extraForbiddenTerms: settings.extraForbiddenTerms,
  };

  async function ask(extra = ""): Promise<string> {
    const message = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt + extra }],
    });
    return message.content
      .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }

  // 1) appel normal ; 2) si le garde-fou refuse le texte, une nouvelle tentative qui lui
  // dit pourquoi ; 3) si l'IA échoue ou refuse encore, modèle de secours déterministe.
  // La démo ne s'arrête jamais : au pire, un message sobre et exact, à relire.
  try {
    let draft = await ask();
    let guardrail = checkGeneratedContent(draft, guardOpts);
    if (!guardrail.ok) {
      draft = await ask(`\n\nATTENTION : ta version précédente a été refusée (${guardrail.violations.join(" ; ")}). Corrige exactement ces points.`);
      guardrail = checkGeneratedContent(draft, guardOpts);
    }
    if (guardrail.ok) return { draft, tone, daysOverdue, guardrail, fallback: false };
  } catch (e) {
    console.error("[LLM] rédaction impossible, modèle de secours utilisé :", e instanceof Error ? e.message : e);
  }

  const draft = fallbackDraft(channel, tone, {
    contactName: invoice.client.contactName,
    reference: invoice.reference,
    amountMad: invoice.amountMad,
    daysOverdue: invoice.dueDate.getTime() > settings.simulatedDate.getTime() ? -Math.ceil((invoice.dueDate.getTime() - settings.simulatedDate.getTime()) / 86_400_000) : daysOverdue,
    companyName: settings.companyName,
  });
  return { draft, tone, daysOverdue, guardrail: checkGeneratedContent(draft, guardOpts), fallback: true };
}