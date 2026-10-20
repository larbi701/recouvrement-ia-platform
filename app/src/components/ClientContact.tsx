"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl } from "@/lib/deeplinks";

// Actions directes sur un client : appeler, WhatsApp, email — ouvrent le vrai canal avec un
// message d'ouverture neutre — et ajout d'une note interne (visible dans l'historique).
export function ClientContact({
  clientId,
  contactName,
  phone,
  email,
  companyName,
}: {
  clientId: string;
  contactName: string;
  phone: string;
  email: string;
  companyName: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const greeting = `Bonjour ${contactName.split(" ")[0]}, je vous contacte de la part de ${companyName} au sujet de votre compte.`;
  const btn = "rounded-lg px-4 py-2 text-sm font-medium transition";

  async function addNote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clients/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, content: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <a href={buildTelUrl(phone)} className={`${btn} bg-indigo-deep text-white hover:opacity-90`}>
          Appeler {phone}
        </a>
        <button
          onClick={() => window.open(buildWhatsappUrl(phone, greeting), "_blank", "noopener")}
          className={`${btn} border border-indigo-deep text-indigo-deep hover:bg-lavande-struct/40`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => {
            window.location.href = buildMailtoUrl(email, `Objet : Votre compte ${companyName}\n\n${greeting}`);
          }}
          disabled={!email}
          className={`${btn} border border-indigo-deep text-indigo-deep hover:bg-lavande-struct/40 disabled:opacity-40`}
        >
          Email
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter une note interne (ex : interlocuteur absent jusqu'au 15)"
          className="min-w-0 flex-1 rounded-lg border border-lavande-struct p-2 text-sm focus:border-violet-velos focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && note.trim() && !busy) addNote();
          }}
        />
        <button onClick={addNote} disabled={busy || !note.trim()} className="rounded-lg border border-lavande-struct px-3 py-2 text-sm font-medium text-graphite hover:bg-perle disabled:opacity-40">
          Ajouter
        </button>
      </div>
      {error && <p className="text-xs text-corail">{error}</p>}
    </div>
  );
}
