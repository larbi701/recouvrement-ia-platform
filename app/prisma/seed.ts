import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await prisma.clientReply.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();

  // 1. Client fiable, léger retard
  const atlas = await prisma.client.create({
    data: {
      name: "Atlas Négoce",
      sector: "Distribution alimentaire",
      contactName: "Yassine Belghiti",
      contactEmail: "y.belghiti@atlas-negoce.ma",
      behaviorNote: "Client fiable, paie habituellement à temps, premier retard depuis 2 ans.",
      strategic: false,
    },
  });
  const atlasInvoice = await prisma.invoice.create({
    data: {
      clientId: atlas.id,
      reference: "FAC-2026-0142",
      amountMad: 18_000,
      issueDate: daysAgo(38),
      dueDate: daysAgo(8),
      status: "EN_RETARD",
    },
  });
  await prisma.reminder.create({
    data: {
      invoiceId: atlasInvoice.id,
      tone: "AMICALE",
      content:
        "Bonjour Yassine, un petit rappel amical : la facture FAC-2026-0142 de 18 000 MAD est arrivée à échéance il y a quelques jours. Peut-être un simple oubli — dites-nous si un justificatif de paiement est déjà en route.",
      status: "ENVOYEE_SIMULEE",
      createdBy: "AGENT",
      sentAt: daysAgo(2),
    },
  });

  // 2. Client en retard chronique, silence total
  const tanger = await prisma.client.create({
    data: {
      name: "Tanger Fournitures SARL",
      sector: "Fournitures industrielles",
      contactName: "Rachid Amrani",
      contactEmail: "comptabilite@tanger-fournitures.ma",
      behaviorNote: "Retards fréquents sur les 12 derniers mois, ne répond pas aux relances email.",
      strategic: false,
    },
  });
  const tangerInvoice = await prisma.invoice.create({
    data: {
      clientId: tanger.id,
      reference: "FAC-2026-0098",
      amountMad: 42_000,
      issueDate: daysAgo(82),
      dueDate: daysAgo(52),
      status: "EN_RETARD",
    },
  });
  for (const [i, days] of [40, 25, 10].entries()) {
    await prisma.reminder.create({
      data: {
        invoiceId: tangerInvoice.id,
        tone: i === 0 ? "AMICALE" : "FERME",
        content: `Relance ${i + 1} envoyée concernant la facture FAC-2026-0098 (42 000 MAD), toujours sans réponse.`,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
        sentAt: daysAgo(days),
      },
    });
  }

  // 3. Client qui demande un échéancier
  const cosmetiques = await prisma.client.create({
    data: {
      name: "Cosmétiques du Sud",
      sector: "Cosmétique / distribution",
      contactName: "Salma Idrissi",
      contactEmail: "s.idrissi@cosmetiques-sud.ma",
      behaviorNote: "Bon payeur historiquement, traverse une tension de trésorerie ce trimestre.",
      strategic: false,
    },
  });
  const cosmetiquesInvoice = await prisma.invoice.create({
    data: {
      clientId: cosmetiques.id,
      reference: "FAC-2026-0117",
      amountMad: 65_000,
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      status: "ECHEANCIER",
    },
  });
  for (const days of [22, 10]) {
    await prisma.reminder.create({
      data: {
        invoiceId: cosmetiquesInvoice.id,
        tone: "FERME",
        content: "Relance concernant la facture FAC-2026-0117 (65 000 MAD), échéance dépassée.",
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
        sentAt: daysAgo(days),
      },
    });
  }
  await prisma.clientReply.create({
    data: {
      invoiceId: cosmetiquesInvoice.id,
      content:
        "Bonjour, nous confirmons la facture mais traversons une tension de trésorerie ce mois-ci. Pourrions-nous régler en 3 fois sur 6 semaines ?",
      classifiedIntent: "DEMANDE_DELAI",
      agentSummary: "Le client confirme la dette et demande un paiement en 3 fois sur 6 semaines.",
      proposedAction:
        "Proposer un échéancier en 3 mensualités de ~21 667 MAD, dans les limites autorisées — à valider par un humain avant envoi.",
      receivedAt: daysAgo(9),
    },
  });

  // 4. Client qui conteste la facture
  const btp = await prisma.client.create({
    data: {
      name: "BTP Rif Construction",
      sector: "BTP",
      contactName: "Hicham Ouazzani",
      contactEmail: "h.ouazzani@btprif.ma",
      behaviorNote: "Conteste une partie de la commande — litige en cours de clarification.",
      strategic: false,
    },
  });
  const btpInvoice = await prisma.invoice.create({
    data: {
      clientId: btp.id,
      reference: "FAC-2026-0155",
      amountMad: 120_000,
      issueDate: daysAgo(51),
      dueDate: daysAgo(21),
      status: "LITIGE",
    },
  });
  await prisma.reminder.create({
    data: {
      invoiceId: btpInvoice.id,
      tone: "AMICALE",
      content: "Relance concernant la facture FAC-2026-0155 (120 000 MAD), échéance dépassée de 21 jours.",
      status: "ENVOYEE_SIMULEE",
      createdBy: "AGENT",
      sentAt: daysAgo(15),
    },
  });
  await prisma.clientReply.create({
    data: {
      invoiceId: btpInvoice.id,
      content:
        "Nous contestons 30 000 MAD sur cette facture : une partie de la livraison n'a pas été conforme au bon de commande. Merci de nous envoyer un avoir avant tout règlement.",
      classifiedIntent: "CONTESTATION",
      agentSummary: "Le client conteste 30 000 MAD sur 120 000 MAD pour non-conformité de livraison.",
      proposedAction: "Hors cadre automatique — à escalader à un humain (vérifier le bon de commande et la livraison).",
      receivedAt: daysAgo(6),
    },
  });

  // 5. Client silencieux, proche de la mise en demeure
  const meknes = await prisma.client.create({
    data: {
      name: "Meknès Industrie",
      sector: "Industrie / équipement",
      contactName: "Nabil Cherkaoui",
      contactEmail: "n.cherkaoui@meknes-industrie.ma",
      behaviorNote: "Aucune réponse depuis 75 jours malgré 4 relances. Ancien litige déjà résolu sans incident.",
      strategic: false,
    },
  });
  const meknesInvoice = await prisma.invoice.create({
    data: {
      clientId: meknes.id,
      reference: "FAC-2026-0071",
      amountMad: 28_000,
      issueDate: daysAgo(105),
      dueDate: daysAgo(75),
      status: "EN_RETARD",
    },
  });
  for (const [i, days] of [60, 45, 30, 12].entries()) {
    await prisma.reminder.create({
      data: {
        invoiceId: meknesInvoice.id,
        tone: i < 2 ? "FERME" : "MISE_EN_DEMEURE",
        content: `Relance ${i + 1} sur la facture FAC-2026-0071 (28 000 MAD) — toujours sans réponse.`,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
        sentAt: daysAgo(days),
      },
    });
  }

  // 6. Gros client stratégique, retard tout juste détecté
  const alAmal = await prisma.client.create({
    data: {
      name: "Groupe Al Amal Distribution",
      sector: "Grande distribution",
      contactName: "Fatima-Zahra Bennis",
      contactEmail: "fz.bennis@alamal-distribution.ma",
      behaviorNote: "Client stratégique, gros volume d'affaires récurrent, premier retard détecté aujourd'hui.",
      strategic: true,
    },
  });
  await prisma.invoice.create({
    data: {
      clientId: alAmal.id,
      reference: "FAC-2026-0163",
      amountMad: 250_000,
      issueDate: daysAgo(45),
      dueDate: daysAgo(15),
      status: "EN_RETARD",
    },
  });

  console.log("Jeu de données synthétique créé : 6 clients, 6 factures.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
