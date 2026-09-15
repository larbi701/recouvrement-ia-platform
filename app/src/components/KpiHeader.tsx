type Props = {
  totalOverdueMad: number;
  dossierCount: number;
};

function SimulationTag() {
  return (
    <span
      title="Scénario illustratif pour la démo — pas un résultat mesuré chez un client réel."
      className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"
    >
      Simulation
    </span>
  );
}

export function KpiHeader({ totalOverdueMad, dossierCount }: Props) {
  const tiles = [
    {
      label: "Total en retard",
      value: `${totalOverdueMad.toLocaleString("fr-FR")} MAD`,
      sub: `${dossierCount} dossiers en cours`,
      simulated: false,
    },
    {
      label: "Délai moyen de recouvrement (DSO)",
      value: "52 → 34 jours",
      sub: "-35% grâce à l'automatisation",
      simulated: true,
    },
    {
      label: "Effort manuel réduit",
      value: "55%",
      sub: "temps de relance économisé",
      simulated: true,
    },
    {
      label: "Récupéré ce mois grâce à l'agent",
      value: "96 500 MAD",
      sub: "sur les dossiers relancés",
      simulated: true,
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tile.label}
              </span>
              {tile.simulated && <SimulationTag />}
            </div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900">
              {tile.value}
            </div>
            <div className="text-xs text-slate-500">{tile.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
