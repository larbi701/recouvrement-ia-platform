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
      contactPhone: "+212 6 61 22 33 44",
      behaviorNote: "Client fiable, paie habituellement à temps, premier retard depuis 2 ans.",
      strategic: false,
      chronicLatePayer: false,
    },
  });
  const atlasInvoice = await prisma.invoice.create({
    data: {
      clientId: atlas.id,
      reference: "FAC-2026-0142",
      amountMad: 18_000,
      issueDate: daysAgo(72), // délai standard 60 jours (loi 69-21) + 12 jours de retard
      dueDate: daysAgo(12),
      status: "EN_RETARD",
    },
  });
  await prisma.reminder.create({
    data: {
      invoiceId: atlasInvoice.id,
      channel: "EMAIL",
      tone: "AMICALE",
      content:
        "Bonjour Yassine, un petit rappel amical : la facture FAC-2026-0142 de 18 000 MAD est arrivée à échéance il y a quelques jours. Peut-être un simple oubli — dites-nous si un justificatif de paiement est déjà en route.",
      status: "ENVOYEE_SIMULEE",
      createdBy: "AGENT",
      sentAt: daysAgo(3),
    },
  });

  // 2. Client en retard chronique, silence total
  const tanger = await prisma.client.create({
    data: {
      name: "Tanger Fournitures SARL",
      sector: "Fournitures industrielles",
      contactName: "Rachid Amrani",
      contactEmail: "comptabilite@tanger-fournitures.ma",
      contactPhone: "+212 6 62 33 44 55",
      behaviorNote: "Retards fréquents sur les 12 derniers mois, ne répond pas aux relances email.",
      strategic: false,
      chronicLatePayer: true, // -> l'agent saute l'email et démarre directement sur WhatsApp
    },
  });
  const tangerInvoice = await prisma.invoice.create({
    data: {
      clientId: tanger.id,
      reference: "FAC-2026-0098",
      amountMad: 42_000,
      issueDate: daysAgo(125), // proche du délai clients moyen observé chez les PME marocaines (88-94 jours, Inforisk 2024) + retard
      dueDate: daysAgo(65),
      status: "EN_RETARD",
    },
  });
  for (const [i, { days, channel }] of [
    { days: 55, channel: "WHATSAPP" },
    { days: 35, channel: "WHATSAPP" },
    { days: 15, channel: "EMAIL" },
  ].entries()) {
    await prisma.reminder.create({
      data: {
        invoiceId: tangerInvoice.id,
        channel,
        tone: i === 0 ? "AMICALE" : "FERME",
        content: `Relance ${i + 1} envoyée concernant la facture FAC-2026-0098 (42 000 MAD), toujours sans réponse.`,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
        sentAt: daysAgo(days),
      },
    });
  }
  await prisma.callTask.create({
    data: {
      invoiceId: tangerInvoice.id,
      reason: "Client chronique — aucune réponse sur WhatsApp après 3 semaines, tentative d'appel avant durcissement du ton.",
      talkingPoints:
        "1. Rappeler la facture FAC-2026-0098 (42 000 MAD) et l'ancienneté du retard.\n2. Demander s'il y a un blocage particulier (trésorerie, litige, interlocuteur absent).\n3. Proposer un point sur un éventuel échéancier si besoin.\n4. Fixer une date ferme de rappel si pas de réponse immédiate.",
      status: "FAIT",
      outcome: "NE_REPOND_PAS",
      outcomeNote: "Deux tentatives, messagerie à chaque fois. Un message vocal a été laissé.",
      createdAt: daysAgo(30),
      completedAt: daysAgo(30),
    },
  });

  // 3. Client qui demande un échéancier
  const cosmetiques = await prisma.client.create({
    data: {
      name: "Cosmétiques du Sud",
      sector: "Cosmétique / distribution",
      contactName: "Salma Idrissi",
      contactEmail: "s.idrissi@cosmetiques-sud.ma",
      contactPhone: "+212 6 63 44 55 66",
      behaviorNote: "Bon payeur historiquement, traverse une tension de trésorerie ce trimestre.",
      strategic: false,
      chronicLatePayer: false,
    },
  });
  const cosmetiquesInvoice = await prisma.invoice.create({
    data: {
      clientId: cosmetiques.id,
      reference: "FAC-2026-0117",
      amountMad: 65_000,
      issueDate: daysAgo(98),
      dueDate: daysAgo(38),
      status: "ECHEANCIER",
    },
  });
  for (const days of [28, 12]) {
    await prisma.reminder.create({
      data: {
        invoiceId: cosmetiquesInvoice.id,
        channel: "EMAIL",
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
      receivedAt: daysAgo(10),
    },
  });

  // 4. Client qui conteste la facture
  const btp = await prisma.client.create({
    data: {
      name: "BTP Rif Construction",
      sector: "BTP",
      contactName: "Hicham Ouazzani",
      contactEmail: "h.ouazzani@btprif.ma",
      contactPhone: "+212 6 64 55 66 77",
      behaviorNote: "Conteste une partie de la commande — litige en cours de clarification.",
      strategic: false,
      chronicLatePayer: false,
    },
  });
  const btpInvoice = await prisma.invoice.create({
    data: {
      clientId: btp.id,
      reference: "FAC-2026-0155",
      amountMad: 120_000,
      issueDate: daysAgo(88),
      dueDate: daysAgo(28),
      status: "LITIGE",
    },
  });
  await prisma.reminder.create({
    data: {
      invoiceId: btpInvoice.id,
      channel: "EMAIL",
      tone: "AMICALE",
      content: "Relance concernant la facture FAC-2026-0155 (120 000 MAD), échéance dépassée de 28 jours.",
      status: "ENVOYEE_SIMULEE",
      createdBy: "AGENT",
      sentAt: daysAgo(18),
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
      receivedAt: daysAgo(7),
    },
  });

  // 5. Client silencieux, proche de la mise en demeure
  const meknes = await prisma.client.create({
    data: {
      name: "Meknès Industrie",
      sector: "Industrie / équipement",
      contactName: "Nabil Cherkaoui",
      contactEmail: "n.cherkaoui@meknes-industrie.ma",
      contactPhone: "+212 6 65 66 77 88",
      behaviorNote:
        "Aucune réponse depuis plus de 110 jours malgré 4 relances et un appel resté sans réponse — approche le plafond légal de 120 jours (loi 69-21). Ancien litige déjà résolu sans incident.",
      strategic: false,
      chronicLatePayer: true,
    },
  });
  const meknesInvoice = await prisma.invoice.create({
    data: {
      clientId: meknes.id,
      reference: "FAC-2026-0071",
      amountMad: 28_000,
      issueDate: daysAgo(172), // délai moyen de paiement au Maroc en 2023, avant amélioration (Inforisk) — cas volontairement extrême
      dueDate: daysAgo(112),
      status: "EN_RETARD",
    },
  });
  for (const [i, { days, channel }] of [
    { days: 90, channel: "WHATSAPP" },
    { days: 65, channel: "WHATSAPP" },
    { days: 40, channel: "EMAIL" },
    { days: 15, channel: "EMAIL" },
  ].entries()) {
    await prisma.reminder.create({
      data: {
        invoiceId: meknesInvoice.id,
        channel,
        tone: i < 2 ? "FERME" : "MISE_EN_DEMEURE",
        content: `Relance ${i + 1} sur la facture FAC-2026-0071 (28 000 MAD) — toujours sans réponse.`,
        status: "ENVOYEE_SIMULEE",
        createdBy: "AGENT",
        sentAt: daysAgo(days),
      },
    });
  }
  await prisma.callTask.create({
    data: {
      invoiceId: meknesInvoice.id,
      reason: "Silence total après 2 relances WhatsApp — tentative d'appel avant passage au ton dernier avertissement.",
      talkingPoints:
        "1. Rappeler la facture FAC-2026-0071 (28 000 MAD) et les 65 jours de retard à ce moment-là.\n2. Vérifier qu'il n'y a pas de litige non signalé.\n3. Demander un engagement de paiement avec une date précise.\n4. Prévenir que sans retour, la prochaine communication sera un dernier avertissement écrit.",
      status: "FAIT",
      outcome: "NE_REPOND_PAS",
      outcomeNote: "Aucune réponse, ligne directe injoignable à deux reprises.",
      createdAt: daysAgo(55),
      completedAt: daysAgo(55),
    },
  });

  // 6. Gros client stratégique, retard tout juste détecté
  const alAmal = await prisma.client.create({
    data: {
      name: "Groupe Al Amal Distribution",
      sector: "Grande distribution",
      contactName: "Fatima-Zahra Bennis",
      contactEmail: "fz.bennis@alamal-distribution.ma",
      contactPhone: "+212 6 66 77 88 99",
      behaviorNote: "Client stratégique, gros volume d'affaires récurrent, premier retard détecté aujourd'hui.",
      strategic: true,
      chronicLatePayer: false,
    },
  });
  const alAmalInvoice = await prisma.invoice.create({
    data: {
      clientId: alAmal.id,
      reference: "FAC-2026-0163",
      amountMad: 250_000,
      issueDate: daysAgo(78),
      dueDate: daysAgo(18),
      status: "EN_RETARD",
    },
  });
  await prisma.callTask.create({
    data: {
      invoiceId: alAmalInvoice.id,
      reason: "Client stratégique — premier retard détecté : contact téléphonique direct privilégié plutôt qu'une relance automatique, pour préserver la relation.",
      talkingPoints:
        "1. Ouvrir sur la relation commerciale, pas sur l'impayé en premier.\n2. Mentionner la facture FAC-2026-0163 (250 000 MAD) et les 18 jours de retard.\n3. Demander s'il s'agit d'un simple délai de traitement interne.\n4. Proposer de reprogrammer un point si un interlocuteur plus adapté est nécessaire.",
      status: "A_FAIRE",
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
