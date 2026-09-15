export function AgentProfileCard() {
  return (
    <div className="rounded-xl border border-lavande-struct bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-deep to-violet-velos text-xl font-bold text-white">
          Y
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-lavande px-2 py-0.5 text-[11px] font-medium text-indigo-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-velos" />
              En ligne
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-corail">
              Agent recouvrement — CASH
            </span>
          </div>
          <h2 className="text-xl font-bold text-indigo-deep">Yasmine</h2>
          <p className="text-sm text-graphite/70">
            Relances email et WhatsApp, fiches d&apos;appel, réponses client classées — 24/7, sur tout le portefeuille.
          </p>
        </div>
      </div>
    </div>
  );
}
