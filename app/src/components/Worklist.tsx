"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorklistItem } from "@/lib/types";

const PRIORITY_STYLES: Record<WorklistItem["priority"], string> = {
  URGENT: "bg-corail/10 text-indigo-deep ring-corail/40",
  A_TRAITER: "bg-sky/15 text-azur ring-sky/40",
  SURVEILLANCE: "bg-lavande-struct text-graphite/70 ring-lavande-struct",
};

const PRIORITY_LABELS: Record<WorklistItem["priority"], string> = {
  URGENT: "Urgent",
  A_TRAITER: "À traiter",
  SURVEILLANCE: "Surveillance",
};

const TONE_LABELS: Record<string, string> = {
  AMICALE: "Amicale",
  FERME: "Ferme",
  MISE_EN_DEMEURE: "Dernier avertissement",
};

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

const INTENT_LABELS: Record<string, string> = {
  DEMANDE_DELAI: "Demande de délai",
  CONTESTATION: "Contestation",
  CONFIRMATION: "Confirmation de paiement",
  AUTRE: "Autre",
};

const OUTCOME_LABELS: Record<string, string> = {
  PROMESSE_PAIEMENT: "Promesse de paiement",
  NE_REPOND_PAS: "Ne répond pas",
  CONTESTE: "Conteste",
  PAYE: "A payé pendant l'appel",
  AUTRE: "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

type GenerateResponse = {
  draft: string;
  tone: string;
  channel: string;
};

export function Worklist({ items }: { items: WorklistItem[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.invoiceId ?? null);
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

  const selected = useMemo(
    () => items.find((i) => i.invoiceId === selectedId) ?? null,
    [items, selectedId]
  );

  const pendingCall = selected?.callTasks.find((c) => c.status === "A_FAIRE") ?? null;

  function selectItem(id: string) {
    setSelectedId(id);
    setDraft(null);
    setDraftTone(null);
    setDraftChannel(null);
    setConfirmation(null);
    setCallNote("");
    setCallPromisedDate("");
    setCallOutcome("PROMESSE_PAIEMENT");
    setShowReplySimulator(false);
    setReplyText("");
  }

  async function handleSimulateReply() {
    if (!selected || !replyText.trim()) return;
    setReplySubmitting(true);
    setConfirmation(null);
    try {
      const res = await fetch("/api/replies/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selected.invoiceId, content: replyText }),
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

  async function handleGenerate(channel: "EMAIL" | "WHATSAPP") {
    if (!selected) return;
    setLoadingGenerate(true);
    setConfirmation(null);
    try {
      const res = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selected.invoiceId, channel }),
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
    if (!selected || !draft || !draftTone || !draftChannel) return;
    setLoadingSend(true);
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selected.invoiceId,
          channel: draftChannel,
          tone: draftTone,
          content: draft,
          createdBy: "HUMAIN",
        }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi");
      setConfirmation(
        `${draftChannel === "WHATSAPP" ? "Message WhatsApp" : "Email"} envoyé ✓ (simulation — traçabilité enregistrée)`
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
    if (!selected || selected.nextAction.kind !== "CALL_TASK") return;
    setCallLoading(true);
    try {
      const res = await fetch("/api/calls/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selected.invoiceId, reason: selected.nextAction.reason }),
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

  return (
    <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[1fr_420px]">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.invoiceId}>
            <button
              onClick={() => selectItem(item.invoiceId)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedId === item.invoiceId
                  ? "border-violet-velos/50 bg-lavande-struct/50 ring-1 ring-violet-velos/30"
                  : "border-lavande-struct bg-white hover:border-violet-velos/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-indigo-deep">{item.clientName}</span>
                    {item.strategic && (
                      <span
                        title="Client stratégique — à traiter avec tact, indépendamment du score"
                        className="text-violet-velos"
                      >
                        ★
                      </span>
                    )}
                    {item.callTasks.some((c) => c.status === "A_FAIRE") && (
                      <span className="rounded-full bg-corail/10 px-2 py-0.5 text-[11px] font-medium text-indigo-deep ring-1 ring-corail/30">
                        Appel à faire
                      </span>
                    )}
                    {item.replies.length > 0 && (
                      <span className="rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur ring-1 ring-azur/30">
                        Réponse à traiter
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-graphite/70">{item.reasoning}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-indigo-deep">
                    {item.amountMad.toLocaleString("fr-FR")} MAD
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${PRIORITY_STYLES[item.priority]}`}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {selected ? (
          <div className="rounded-xl border border-lavande-struct bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-bold text-indigo-deep">{selected.clientName}</h2>
              {selected.strategic && <span className="text-violet-velos">★</span>}
            </div>
            <p className="text-sm text-graphite/60">
              {selected.sector} · {selected.contactName} · {selected.contactEmail} · {selected.contactPhone}
            </p>

            <div className="mt-4 rounded-lg bg-perle p-3 text-sm text-graphite">
              {selected.behaviorNote}
            </div>

            <div className="mt-4 rounded-lg border border-violet-velos/30 bg-lavande/30 p-3 text-sm text-indigo-deep">
              <span className="font-semibold text-violet-velos">Raisonnement de l&apos;agent — </span>
              {selected.reasoning}
            </div>

            {selected.replies.length > 0 && (
              <div className="mt-4 rounded-lg border border-azur/30 bg-azur/5 p-3 text-sm">
                <p className="font-medium text-azur">
                  Réponse du client
                  {selected.replies[0].classifiedIntent && (
                    <span className="ml-2 rounded-full bg-azur/10 px-2 py-0.5 text-[11px] font-medium text-azur">
                      {INTENT_LABELS[selected.replies[0].classifiedIntent] ?? selected.replies[0].classifiedIntent}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-graphite/80">&ldquo;{selected.replies[0].content}&rdquo;</p>
                {selected.replies[0].agentSummary && (
                  <p className="mt-2 text-graphite/80">
                    <span className="font-medium text-graphite">Résumé agent : </span>
                    {selected.replies[0].agentSummary}
                  </p>
                )}
                {selected.replies[0].proposedAction && (
                  <p className="mt-2 text-graphite/80">
                    <span className="font-medium text-graphite">Action proposée : </span>
                    {selected.replies[0].proposedAction}
                  </p>
                )}
              </div>
            )}

            {selected.replies.length === 0 && (
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
                      Réponse simulée du client — classée en direct par l&apos;agent
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
                        {replySubmitting ? "L'agent analyse…" : "Envoyer cette réponse (simulation)"}
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

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-graphite/60">
                Historique des relances ({selected.reminders.length})
              </p>
              <ul className="flex flex-col gap-2">
                {selected.reminders.map((r) => (
                  <li key={r.id} className="rounded-lg border border-lavande-struct p-2 text-xs text-graphite/70">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-indigo-deep">
                        {CHANNEL_LABELS[r.channel] ?? r.channel} · {TONE_LABELS[r.tone] ?? r.tone}
                      </span>
                      <span>{formatDate(r.sentAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-graphite/60">{r.content}</p>
                  </li>
                ))}
                {selected.callTasks
                  .filter((c) => c.status === "FAIT")
                  .map((c) => (
                    <li key={c.id} className="rounded-lg border border-lavande-struct p-2 text-xs text-graphite/70">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-indigo-deep">
                          Appel · {c.outcome ? OUTCOME_LABELS[c.outcome] ?? c.outcome : "Résultat non précisé"}
                        </span>
                        <span>{c.completedAt ? formatDate(c.completedAt) : ""}</span>
                      </div>
                      {c.outcomeNote && <p className="line-clamp-2 text-graphite/60">{c.outcomeNote}</p>}
                    </li>
                  ))}
                {selected.reminders.length === 0 && selected.callTasks.length === 0 && (
                  <li className="text-xs text-graphite/40">Aucun contact envoyé pour l&apos;instant.</li>
                )}
              </ul>
            </div>

            <div className="mt-5 border-t border-lavande-struct pt-4">
              {selected.nextAction.kind === "WAIT_HUMAN" && (
                <p className="text-sm text-graphite/60">
                  En attente d&apos;une décision humaine sur la réponse du client (voir ci-dessus) — pas de relance
                  automatique tant que ce n&apos;est pas traité.
                </p>
              )}

              {selected.nextAction.kind === "LEGAL_ESCALATION" && (
                <div className="rounded-lg border border-corail/40 bg-corail/10 p-3 text-sm text-indigo-deep">
                  Plafond légal marocain de 120 jours dépassé (loi 69-21) — ce dossier sort du recouvrement amiable.
                  À transmettre au contentieux (hors périmètre de cette démo).
                </div>
              )}

              {selected.nextAction.kind === "CALL_TASK" && !pendingCall && (
                <button
                  onClick={handleCreateCallTask}
                  disabled={callLoading}
                  className="w-full rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {callLoading ? "L'agent prépare la fiche…" : "Créer une fiche d'appel"}
                </button>
              )}

              {pendingCall && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-lavande-struct bg-perle p-3 text-sm">
                    <p className="mb-1 font-medium text-indigo-deep">Fiche d&apos;appel — à traiter par téléphone</p>
                    <p className="mb-2 text-xs text-graphite/60">{pendingCall.reason}</p>
                    <p className="whitespace-pre-line text-graphite/80">{pendingCall.talkingPoints}</p>
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

              {(selected.nextAction.kind === "EMAIL" || selected.nextAction.kind === "WHATSAPP") &&
                !draft && (
                  <button
                    onClick={() => handleGenerate(selected.nextAction.kind as "EMAIL" | "WHATSAPP")}
                    disabled={loadingGenerate}
                    className="w-full rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {loadingGenerate
                      ? "L'agent rédige…"
                      : `Générer ${selected.nextAction.kind === "WHATSAPP" ? "un message WhatsApp" : "un email"}`}
                  </button>
                )}

              {draft && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-graphite/60">
                    {CHANNEL_LABELS[draftChannel ?? ""] ?? draftChannel} · Ton :{" "}
                    {TONE_LABELS[draftTone ?? ""] ?? draftTone} — modifiable avant envoi
                  </span>
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
                      {loadingSend ? "Envoi…" : "Envoyer"}
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
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">
            Sélectionne un dossier à gauche.
          </div>
        )}
      </aside>
    </div>
  );
}
