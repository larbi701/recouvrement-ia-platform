"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildMailtoUrl, buildWhatsappUrl } from "@/lib/deeplinks";
import { ReplyResolver } from "@/components/ReplyResolver";

export type MessageDTO = {
  id: string;
  invoiceId: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  reference: string;
  amountMad: number;
  channel: string;
  tone: string;
  content: string;
  createdBy: string;
  note: string | null;
  daysAgo: number;
};

export type InboxDTO = {
  id: string;
  invoiceId: string;
  clientName: string;
  reference: string;
  content: string;
  intent: string | null;
  summary: string | null;
  proposedAction: string | null;
  handled: boolean;
  daysAgo: number;
};

const TONE_LABELS: Record<string, string> = { AMICALE: "Amicale", FERME: "Ferme", MISE_EN_DEMEURE: "Dernier avertissement" };
const CHANNEL_LABELS: Record<string, string> = { EMAIL: "Email", WHATSAPP: "WhatsApp" };
const INTENT_LABELS: Record<string, string> = {
  DEMANDE_DELAI: "Demande de délai",
  CONTESTATION: "Contestation",
  CONFIRMATION: "Confirmation de paiement",
  AUTRE: "Autre",
};

function when(daysAgo: number) {
  if (daysAgo <= 0) return "aujourd'hui";
  if (daysAgo === 1) return "hier";
  return `il y a ${daysAgo} j`;
}

function openChannel(m: Pick<MessageDTO, "channel" | "contactPhone" | "contactEmail">, text: string) {
  if (m.channel === "WHATSAPP") window.open(buildWhatsappUrl(m.contactPhone, text), "_blank", "noopener");
  else window.location.href = buildMailtoUrl(m.contactEmail, text);
}

function DraftCard({ m }: { m: MessageDTO }) {
  const router = useRouter();
  const [text, setText] = useState(m.content);
  const [busy, setBusy] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [approved, setApproved] = useState(false);

  async function review(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    setViolations([]);
    try {
      const res = await fetch("/api/messages/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId: m.id, decision, content: text, reason }),
      });
      const data = await res.json();
      if (res.status === 422) {
        setViolations(data.violations ?? []);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Échec");
      if (decision === "approve") {
        setApproved(true);
        openChannel(m, text);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (approved) {
    return (
      <div className="rounded-xl border border-violet-velos/30 bg-lavande/20 p-4">
        <p className="text-sm font-medium text-indigo-deep">
          Message validé pour {m.clientName}. {m.channel === "WHATSAPP" ? "WhatsApp" : "Votre messagerie"} s&apos;ouvre avec le message prêt : appuyez sur Envoyer.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => openChannel(m, text)}
            className="rounded-lg bg-indigo-deep px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            {m.channel === "WHATSAPP" ? "Rouvrir WhatsApp" : "Rouvrir la messagerie"}
          </button>
          <button onClick={() => router.refresh()} className="rounded-lg border border-lavande-struct px-3 py-1.5 text-sm text-graphite hover:bg-perle">
            Terminé
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-lavande-struct bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/dossiers/${m.invoiceId}`} className="font-semibold text-indigo-deep hover:underline">
            {m.clientName}
          </Link>
          <p className="text-xs text-graphite/50">
            {CHANNEL_LABELS[m.channel]} · ton {TONE_LABELS[m.tone]?.toLowerCase()} · {m.reference} · {m.amountMad.toLocaleString("fr-FR")} MAD ·
            préparé {when(m.daysAgo)} par Yas
          </p>
        </div>
        <span className="text-xs text-graphite/50">À : {m.channel === "WHATSAPP" ? m.contactPhone : m.contactEmail}</span>
      </div>

      {m.note && (
        <div className="mt-3 rounded-lg border border-corail/40 bg-corail/10 p-2.5 text-xs text-indigo-deep">
          <p className="font-medium">Retenu par le garde-fou — corrigez le texte avant de valider</p>
          <p className="mt-0.5">{m.note}</p>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={m.channel === "WHATSAPP" ? 5 : 9}
        className="mt-3 w-full rounded-lg border border-lavande-struct p-3 text-sm text-graphite focus:border-violet-velos focus:outline-none"
        aria-label={`Message pour ${m.clientName}`}
      />

      {violations.length > 0 && (
        <div className="mt-2 rounded-lg border border-corail/40 bg-corail/10 p-2.5 text-xs text-indigo-deep">
          <p className="font-medium">Le garde-fou bloque ce texte</p>
          <ul className="mt-1 list-disc pl-4">
            {violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-corail">{error}</p>}

      {rejecting ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du rejet (ex : ton trop direct)"
            className="min-w-0 flex-1 rounded-lg border border-lavande-struct p-2 text-sm"
          />
          <button onClick={() => review("reject")} disabled={busy} className="rounded-lg bg-corail px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            Confirmer le rejet
          </button>
          <button onClick={() => setRejecting(false)} className="text-sm text-graphite/60 underline">
            Annuler
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => review("approve")}
            disabled={busy}
            className="rounded-lg bg-indigo-deep px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {m.channel === "WHATSAPP" ? "Approuver et ouvrir WhatsApp" : "Approuver et ouvrir ma messagerie"}
          </button>
          <button onClick={() => setRejecting(true)} className="rounded-lg border border-lavande-struct px-4 py-2 text-sm font-medium text-graphite hover:bg-perle">
            Rejeter
          </button>
        </div>
      )}
    </div>
  );
}

function SimulateReply({ options }: { options: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState(options[0]?.id ?? "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/replies/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setText("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur — vérifiez la clé API dans .env.local");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-medium text-azur underline decoration-azur/40 underline-offset-2 hover:text-indigo-deep">
        Simuler la réponse d&apos;un client (test du Dispute Specialist)
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-azur/30 bg-azur/5 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-azur">Réponse simulée, classée en direct par Yas</span>
      <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="rounded-lg border border-lavande-struct bg-white p-2 text-sm" aria-label="Dossier concerné">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Ex : Bonjour, nous avons un souci de trésorerie ce mois-ci, pouvons-nous payer en deux fois ?"
        className="rounded-lg border border-lavande-struct bg-white p-2 text-sm"
      />
      {error && <p className="text-xs text-corail">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !text.trim()} className="rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? "Yas analyse…" : "Recevoir cette réponse"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-lavande-struct px-4 py-2 text-sm text-graphite hover:bg-perle">
          Annuler
        </button>
      </div>
    </div>
  );
}

export function MessagesView({
  drafts,
  inbox,
  sent,
  invoiceOptions,
  initialTab,
}: {
  drafts: MessageDTO[];
  inbox: InboxDTO[];
  sent: MessageDTO[];
  invoiceOptions: { id: string; label: string }[];
  initialTab: "drafts" | "replies" | "sent";
}) {
  const [tab, setTab] = useState(initialTab);
  const pendingReplies = inbox.filter((r) => !r.handled);

  const tabBtn = (key: typeof tab, label: string, count: number, alert?: boolean) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        tab === key ? "bg-indigo-deep text-white" : "bg-lavande-struct/60 text-graphite hover:bg-lavande-struct"
      }`}
    >
      {label}{" "}
      <span className={tab === key ? "opacity-70" : alert && count > 0 ? "font-semibold text-corail" : "opacity-70"}>({count})</span>
    </button>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-lavande-struct pb-3">
        {tabBtn("drafts", "À valider", drafts.length, true)}
        {tabBtn("replies", "Réponses clients", pendingReplies.length, true)}
        {tabBtn("sent", "Envoyés", sent.length)}
      </div>

      {tab === "drafts" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-graphite/60">
            Les messages préparés par Yas qui attendent votre feu vert : relances en lot, mode « propose seulement », ou messages
            retenus par le garde-fou. Rien ne part sans votre validation.
          </p>
          {drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">
              Aucun message à valider. Cochez des dossiers dans le Portefeuille, ou passez Yas en « propose seulement » dans Agents IA.
            </div>
          ) : (
            drafts.map((m) => <DraftCard key={m.id} m={m} />)
          )}
        </div>
      )}

      {tab === "replies" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-graphite/60">
            Ce que les clients ont répondu, classé par le Dispute Specialist. Tant qu&apos;une réponse n&apos;est pas traitée, Yas ne
            relance pas le dossier.
          </p>
          <SimulateReply options={invoiceOptions} />
          {inbox.length === 0 && <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">Aucune réponse client pour l&apos;instant.</div>}
          {inbox.map((r) => (
            <div key={r.id} className={`rounded-xl border bg-white p-4 ${r.handled ? "border-lavande-struct opacity-70" : "border-azur/30"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dossiers/${r.invoiceId}`} className="font-semibold text-indigo-deep hover:underline">
                    {r.clientName}
                  </Link>
                  {r.intent && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.intent === "CONTESTATION" ? "bg-corail/10 text-indigo-deep ring-1 ring-corail/30" : "bg-azur/10 text-azur"}`}>
                      {INTENT_LABELS[r.intent] ?? r.intent}
                    </span>
                  )}
                  {r.handled && <span className="rounded-full bg-lavande-struct px-2 py-0.5 text-[11px] text-graphite/60">Traité</span>}
                </div>
                <span className="text-xs text-graphite/50">
                  {r.reference} · reçu {when(r.daysAgo)}
                </span>
              </div>
              <blockquote className="mt-2 border-l-2 border-lavande-struct pl-3 text-sm italic text-graphite/80">{r.content}</blockquote>
              {r.summary && <p className="mt-2 text-sm text-graphite">{r.summary}</p>}
              {r.proposedAction && <p className="mt-1 text-xs text-graphite/60">Action proposée : {r.proposedAction}</p>}
              {!r.handled && (
                <div className="mt-3 border-t border-lavande-struct pt-3">
                  <ReplyResolver replyId={r.id} intent={r.intent} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "sent" && (
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-sm text-graphite/60">
            Tout ce qui est parti, avec l&apos;auteur (agent ou humain). Vous pouvez rouvrir le canal réel pour renvoyer un message.
          </p>
          {sent.length === 0 && <div className="rounded-xl border border-dashed border-lavande-struct p-8 text-center text-sm text-graphite/40">Aucun message envoyé.</div>}
          {sent.map((m) => (
            <details key={m.id} className="rounded-xl border border-lavande-struct bg-white p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <b className="text-indigo-deep">{m.clientName}</b>{" "}
                  <span className="text-graphite/60">
                    — {CHANNEL_LABELS[m.channel]} · ton {TONE_LABELS[m.tone]?.toLowerCase()}
                  </span>
                </span>
                <span className="text-xs text-graphite/50">
                  {m.createdBy === "HUMAIN" ? "Humain" : "Communication Specialist"} · {when(m.daysAgo)}
                </span>
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm text-graphite/80">{m.content}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openChannel(m, m.content)}
                  className="rounded-lg border border-lavande-struct px-3 py-1.5 text-xs font-medium text-graphite hover:bg-perle"
                >
                  {m.channel === "WHATSAPP" ? "Rouvrir dans WhatsApp" : "Rouvrir dans ma messagerie"}
                </button>
                <Link href={`/dossiers/${m.invoiceId}`} className="rounded-lg px-3 py-1.5 text-xs text-azur hover:underline">
                  Ouvrir le dossier →
                </Link>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
