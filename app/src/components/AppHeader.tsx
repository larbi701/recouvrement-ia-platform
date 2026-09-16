import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";

// Ordre du plus général (vue globale du portefeuille) au plus particulier (le système
// lui-même) — suit la séquence réelle du workflow (§9 des specs) : on alimente d'abord
// la plateforme, on regarde l'ensemble, puis on affine progressivement le niveau de zoom.
const NAV_LINKS = [
  { href: "/import", label: "Importer", numbering: null },
  { href: "/dashboard", label: "Tableau de bord", numbering: "01" },
  { href: "/cockpit", label: "Centre d'action", numbering: "02" },
  { href: "/dossiers", label: "Dossiers par priorité", numbering: "03" },
  { href: "/portfolio", label: "Portefeuille", numbering: "04" },
  { href: "/customers", label: "Vue client 360", numbering: "05" },
  { href: "/forecast", label: "Prévisions de trésorerie", numbering: "08" },
  { href: "/agents", label: "Agents IA", numbering: "07" },
  { href: "/team", label: "Interventions humaines", numbering: "09" },
  { href: "/settings", label: "Paramètres", numbering: "10" },
];

export function AppHeader({ breadcrumb }: { breadcrumb?: { label: string; href?: string }[] }) {
  const showNav = Boolean(breadcrumb);

  return (
    <header className="border-b border-lavande-struct bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <Link href="/cockpit">
          <LogoWordmark />
        </Link>
        <span className="ml-3 rounded-full bg-lavande-struct px-2 py-0.5 text-xs font-medium text-indigo-deep">
          Démo — données simulées
        </span>
      </div>

      {showNav && (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-6 pb-3 text-xs font-medium">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-x-4">
              {i === 1 && <span className="h-3 w-px bg-lavande-struct" aria-hidden />}
              <Link href={link.href} className="flex items-center gap-1 text-graphite/60 hover:text-indigo-deep">
                {link.numbering && <span className="text-graphite/30">{link.numbering}</span>}
                {link.label}
              </Link>
            </span>
          ))}
        </div>
      )}

      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-4 text-sm text-graphite/60">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.label}>
              {i > 0 && <span className="mx-1.5 text-graphite/30">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-indigo-deep hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-indigo-deep">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
