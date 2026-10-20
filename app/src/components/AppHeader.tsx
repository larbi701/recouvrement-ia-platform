import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LogoWordmark } from "@/components/Logo";
import { ClockControl } from "@/components/ClockControl";

// Huit écrans, dans l'ordre du travail réel : on alimente, on pilote, on traite, on retrouve
// un dossier, on regarde un client, on valide les messages, on contrôle les agents, on règle.
const NAV_LINKS = [
  { href: "/import", label: "Importer" },
  { href: "/dashboard", label: "Pilotage" },
  { href: "/cockpit", label: "Centre d'action" },
  { href: "/portfolio", label: "Portefeuille" },
  { href: "/customers", label: "Clients" },
  { href: "/messages", label: "Messages", badge: true },
  { href: "/agents", label: "Agents IA" },
  { href: "/settings", label: "Paramètres" },
];

export async function AppHeader({
  breadcrumb,
  simulatedDate,
}: {
  breadcrumb?: { label: string; href?: string }[];
  simulatedDate?: Date;
}) {
  const showNav = Boolean(breadcrumb);
  const [drafts, unhandled] = showNav
    ? await Promise.all([
        prisma.reminder.count({ where: { status: "BROUILLON" } }),
        prisma.clientReply.count({ where: { handled: false } }),
      ])
    : [0, 0];
  const pending = drafts + unhandled;

  return (
    <header className="border-b border-lavande-struct bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-5">
        <Link href="/cockpit">
          <LogoWordmark />
        </Link>
        <span className="rounded-full bg-lavande-struct px-2 py-0.5 text-xs font-medium text-indigo-deep">
          Démo — données simulées
        </span>
        {simulatedDate && <ClockControl simulatedDate={simulatedDate.toISOString()} />}
      </div>

      {showNav && (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-6 pb-3 text-xs font-medium">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-x-4">
              {i === 1 && <span className="h-3 w-px bg-lavande-struct" aria-hidden />}
              <Link href={link.href} className="flex items-center gap-1.5 text-graphite/60 hover:text-indigo-deep">
                {link.label}
                {link.badge && pending > 0 && (
                  <span className="rounded-full bg-corail px-1.5 text-[10px] font-semibold leading-4 text-white">{pending}</span>
                )}
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
