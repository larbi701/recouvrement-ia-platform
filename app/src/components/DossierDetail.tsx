"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorklistItem } from "@/lib/types";
import { ActivityFeed } from "@/components/ActivityFeed";
import { buildActivityFeed } from "@/lib/activity";
import { buildMailtoUrl, buildWhatsappUrl, buildTelUrl } from "@/lib/deeplinks";
import { ClassificationCard } from "@/components/ClassificationCard";

const TONE_LABELS: Record<string, string> = {
  AMICALE: "Amicale",
  FERME: "Ferme",
  MISE_EN_DEMEURE: "Dernier avertissement",
};

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

const OUTCOME_LABELS: Record<string, string> = {
  PROMESSE_PAIEMENT: "Promesse de paiement",
  NE_REPOND_PAS: "Ne répond pas",
  CONTESTE: "Conteste",
  PAYE: "A payé pendant l'appel",
  AUTRE: "Autre",
};

type GenerateResponse = { draft: string; tone: string; channel: string };

export function DossierDetail({ item }: { item: WorklistItem }) {
  const router = useRouter();
  const [validated, setValidated] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftTone, setDraftTone] = useState<string | null>(null);
  const [draftChannel, setDraftChannel] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const [callLoading, setCallLoading] = useState(false);
  const [callOutcome, setCallOutcome] = useState("PROMESSE_PAIEMENT");
  const [callNote, setCallNote] = useState("");
  const [callPromisedDate, setCallPromisedDate] = useState("");
  const [callSubmitting, setCallSubmitting] = useState(false);

  const [showReplySimulator, setShowReplySimulator] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const pendingCall = item.callTasks.find((c) => c.status === "A_FAIRE") ?? null;
  const caseActivity = buildActivityFeed([item], 20);
  const requiresValidation = "requiresValidation" in item.nextAction && item.nextAction.requiresValidation;
  const actionUnlocked = validated || !requiresValidation;

  async function handleGenerate(channel: "EMAIL" | "WHATSAPP") {
    setLoadingGenerate(true);
    setConfirmation(null);
    try {
      const res = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: item.invoiceId, channel }),
      });
      if (!res.ok) throw new Error("Échec de la génération");
      const data: GenerateResponse = await res.json();
      setDraft(data.draft);
      setDraftTone(data.tone);
      setDraftChannel(data.channel);
    } catch {
      setConfirmation("Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleSend() {
    if (!draft || !draftTone || !draftChannel) return;
    // Ouvre le vrai canal (messagerie / WhatsApp) immédiatement, dans le même geste que le clic —
    // sinon le navigateur bloque l'ouverture comme un pop-up une fois qu'on a attendu une réponse réseau.
    if (draftChannel === "WHATSAPP") {
      window.open(buildWhatsappUrl(item.contactPhone, draft), "_blank", "noopener");
    } else {
      window.open(buildMailtoUrl(item.contactEmail, draft), "_blank");
    }

    setLoadingSend(true);
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: item.invoiceId,
          channel: draftChannel,
          tone: draftTone,
          content: draft,
          createdBy: "HUMAIN",
        }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi");
      setConfirmation(
        draftChannel === "WHATSAPP"
          ? "WhatsApp ouvert avec le message prêt — envoie-le depuis l'onglet qui vient de s'ouvrir. Traçabilité enregistrée."
          : "Ta messagerie s'est ouverte avec l'email prêt — il ne reste qu'à cliquer envoyer. Traçabilité enregistrée."
      );
      setDraft(null);
      setDraftTone(null);
      setDraftChannel(null);
      router.refresh();
    } catch {
      setConfirmation("Erreur lors de l'envoi.");
    } finally {
      setLoadingSend(false);
    }
  }

  async function handleCreateCallTask() {
    if (item.nextAction.kind !== "CALL_TASK") return;
    setCallLoading(true);
    try {
      const res = await fetch("/api/calls/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: item.invoiceId, reason: item.nextAction.reason }),
      });
      if (!res.ok) throw new Error("Échec de la génération");
      router.refresh();
    } catch {
      setConfirmation("Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setCallLoading(false);
    }
  }

  async function handleCompleteCall() {
    if (!pendingCall) return;
    setCallSubmitting(true);
    try {
      const res = await fetch("/api/calls/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callTaskId: pendingCall.id,
          outcome: callOutcome,
          outcomeNote: callNote,
          promisedDate: callOutcome === "PROMESSE_PAIEMENT" && callPromisedDate ? callPromisedDate : null,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement");
      setCallNote("");
      setCallPromisedDate("");
      router.refresh();
    } catch {
      setConfirmation("Erreur lors de l'enregistrement du résultat d'appel.");
    } finally {
      setCallSubmitting(false);
    }
  }

  async function handleSimulateReply() {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    setConfirmation(null);
    try {
      const res = await fetch("/api/replies/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: item.invoiceId, content: replyText }),
      });
      if (!res.ok) throw new Error("Échec de la classification");
      setReplyText("");
      setShowReplySimulator(false);
      router.refresh();
    } catch {
      setConfirmation("Erreur — vérifie que ta clé API Claude est bien renseignée dans .env.local");
    } finally {
      setReplySubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-lavande-struct bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold text-indigo-deep">{item.clientName}</h2>
            {item.strategic && <span className="text-violet-velos">★</span>}
          </div>
          <p className="text-sm text-graphite/60">
            {item.sector} · {item.contactName} · {item.contactEmail} · {item.contactPhone}
          </p>
          <a href={`/customers/${item.clientId}`} className="text-xs text-azur hover:underline">
            Voir la vue client 360 complète →
          </a>
          <div className="mt-4 rounded-lg bg-perle p-3 text-sm text-graphite">{item.behaviorNote}</div>

          {item.replies.length === 0 && (
            <div className="mt-4">
              {!showReplySimulator ? (
                <button
                  onClick={() => setShowReplySimulator(true)}
                  className="text-sm font-medium text-azur underline decoration-azur/40 underline-offset-2 hover:text-indigo-deep"
                >
                  Simuler une réponse client (test de l&apos;agent Négociateur)
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-azur/30 bg-azur/5 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-azur">
                    Réponse simulée du client — classée en direct par Yas
                  </span>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Ex : Bonjour, on a un souci de trésorerie ce mois-ci, on peut payer en deux fois ?"
                    className="rounded-lg border border-lavande-struct bg-white p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulateReply}
                      disabled={replySubmitting || !replyText.trim()}
                      className="flex-1 rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {replySubmitting ? "Yas analyse…" : "Envoyer cette réponse (simulation)"}
                    </button>
                    <button
                      onClick={() => {
                        setShowReplySimulator(false);
                        setReplyText("");
                      }}
                      className="rounded-lg border border-lavande-struct px-4 py-2 text-sm font-medium text-graphite transition hover:bg-perle"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ClassificationCard item={item} validated={validated} onValidate={() => setValidated(true)} />

        {(actionUnlocked || !["EMAIL", "WHATSAPP", "CALL_TASK"].includes(item.nextAction.kind)) && (
          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">Action</h3>

            {item.nextAction.kind === "WAIT_HUMAN" && (
              <p className="text-sm text-graphite/60">
                En attente d&apos;une décision humaine sur la réponse du client (voir ci-dessus) — pas de relance
                automatique tant que ce n&apos;est pas traité.
              </p>
            )}

            {item.nextAction.kind === "WAIT_PROMISE" && (
              <div className="rounded-lg border border-lavande-struct bg-perle p-3 text-sm text-graphite">
                <span className="font-medium text-indigo-deep">Promise To Pay Manager — </span>
                Promesse de paiement en cours, échéance le{" "}
                {new Date(item.nextAction.promisedDate).toLocaleDateString("fr-FR")}. Aucune relance tant que ce
                délai n&apos;est pas dépassé.
              </div>
            )}

            {item.nextAction.kind === "LEGAL_TRANSFER" && (
              <div className="rounded-lg border border-corail/40 bg-corail/10 p-3 text-sm text-indigo-deep">
                Plafond légal marocain de 120 jours dépassé (loi 69-21) — ce dossier sort du recouvrement amiable.
                Transmission avocat recommandée, validation obligatoire (hors périmètre d&apos;exécution de cette
                démo).
              </div>
            )}

            {item.nextAction.kind === "CALL_TASK" && !pendingCall && (
              <button
                onClick={handleCreateCallTask}
                disabled={callLoading}
                className="w-full rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {callLoading ? "Yas prépare la fiche…" : "Créer une fiche d'appel"}
              </button>
            )}

            {pendingCall && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-lavande-struct bg-perle p-3 text-sm">
                  <p className="mb-1 font-medium text-indigo-deep">Fiche d&apos;appel — à traiter par téléphone</p>
                  <p className="mb-2 text-xs text-graphite/60">{pendingCall.reason}</p>
                  <p className="whitespace-pre-line text-graphite/80">{pendingCall.talkingPoints}</p>
                  <a
                    href={buildTelUrl(item.contactPhone)}
                    className="mt-3 inline-block rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Appeler {item.contactPhone} maintenant
                  </a>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border border-lavande-struct p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">
                    Résultat de l&apos;appel
                  </span>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="rounded-lg border border-lavande-struct p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                  >
                    {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {callOutcome === "PROMESSE_PAIEMENT" && (
                    <input
                      type="date"
                      value={callPromisedDate}
                      onChange={(e) => setCallPromisedDate(e.target.value)}
                      className="rounded-lg border border-lavande-struct p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                    />
                  )}
                  <textarea
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    placeholder="Note rapide sur l'appel (optionnel)"
                    rows={2}
                    className="rounded-lg border border-lavande-struct p-2 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                  />
                  <button
                    onClick={handleCompleteCall}
                    disabled={callSubmitting}
                    className="rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {callSubmitting ? "Enregistrement…" : "Enregistrer le résultat"}
                  </button>
                </div>
              </div>
            )}

            {(item.nextAction.kind === "EMAIL" || item.nextAction.kind === "WHATSAPP") && !draft && (
              <button
                onClick={() => handleGenerate(item.nextAction.kind as "EMAIL" | "WHATSAPP")}
                disabled={loadingGenerate}
                className="w-full rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loadingGenerate
                  ? "Yas rédige…"
                  : `Générer ${item.nextAction.kind === "WHATSAPP" ? "un message WhatsApp" : "un email"}`}
              </button>
            )}

            {draft && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">
                  {CHANNEL_LABELS[draftChannel ?? ""] ?? draftChannel} · Ton :{" "}
                  {TONE_LABELS[draftTone ?? ""] ?? draftTone} — modifiable avant envoi
                </span>
                <p className="text-xs text-graphite/50">
                  {draftChannel === "WHATSAPP"
                    ? "Envoyer ouvre WhatsApp avec ce message déjà écrit dedans."
                    : "Envoyer ouvre ta messagerie avec cet email déjà écrit dedans."}
                </p>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={draftChannel === "WHATSAPP" ? 5 : 8}
                  className="w-full rounded-lg border border-lavande-struct p-3 text-sm text-graphite focus:border-violet-velos focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={loadingSend}
                    className="flex-1 rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {loadingSend
                      ? "Ouverture…"
                      : draftChannel === "WHATSAPP"
                      ? "Ouvrir WhatsApp et envoyer"
                      : "Ouvrir l'email et envoyer"}
                  </button>
                  <button
                    onClick={() => {
                      setDraft(null);
                      setDraftTone(null);
                      setDraftChannel(null);
                    }}
                    className="rounded-lg border border-lavande-struct px-4 py-2 text-sm font-medium text-graphite transition hover:bg-perle"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {confirmation && <p className="mt-2 text-sm font-medium text-indigo-deep">{confirmation}</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-lavande-struct bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-graphite/60">
          Ce que Yas a fait sur ce dossier
        </h3>
        <p className="mb-2 text-xs text-graphite/50">Journal chronologique, du plus récent au plus ancien.</p>
        <ActivityFeed events={caseActivity} linkToDossiers={false} />
      </div>
    </div>
  );
}
