type Props = {
  totalOverdueMad: number;
  dossierCount: number;
};

function SimulationTag({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="rounded-full bg-lavande px-2 py-0.5 text-[11px] font-medium text-indigo-deep"
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
      tooltip: "",
    },
    {
      label: "Délai moyen de recouvrement (DSO)",
      value: "125 → 82 jours",
      sub: "-34% grâce à l'automatisation",
      simulated: true,
      tooltip:
        "125 jours = délai de paiement moyen constaté sur le segment cible VELOS IA (PME 10-175M MAD de CA). 82 jours = projection avec l'agent (-34%, ordre de grandeur documenté chez Growfin). Pour référence, l'étude Inforisk 2024 situe le délai clients moyen des PME marocaines à 88 jours (en baisse depuis 94 jours en 2023).",
    },
    {
      label: "Effort manuel réduit",
      value: "55%",
      sub: "temps de relance économisé",
      simulated: true,
      tooltip: "Scénario illustratif pour la démo — pas un résultat mesuré chez un client réel.",
    },
    {
      label: "Récupéré ce mois grâce à l'agent",
      value: "96 500 MAD",
      sub: "sur les dossiers relancés",
      simulated: true,
      tooltip: "Scénario illustratif pour la démo — pas un résultat mesuré chez un client réel.",
    },
  ];

  return (
    <div className="border-b border-lavande-struct bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-lavande-struct p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-graphite/70">
                {tile.label}
              </span>
              {tile.simulated && <SimulationTag title={tile.tooltip} />}
            </div>
            <div className="text-2xl font-bold tracking-[-0.02em] text-violet-velos">
              {tile.value}
            </div>
            <div className="text-xs text-graphite/60">{tile.sub}</div>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-4 text-[11px] text-graphite/50">
        Délais de paiement calibrés sur le segment cible VELOS IA (PME 10-175M MAD de CA) et le contexte légal
        marocain — plafond entre entreprises : 120 jours (loi 69-21).
      </p>
    </div>
  );
}
