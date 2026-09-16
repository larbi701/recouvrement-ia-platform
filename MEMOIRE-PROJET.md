# Plateforme IA de Recouvrement — Mémoire projet

> Dernière mise à jour : 2026-09-16
> Ce fichier est la mémoire de référence du projet. On le met à jour à chaque décision importante.

## 1. Vision

Une plateforme augmentée par l'IA qui automatise **de bout en bout le workflow de recouvrement de créances B2B**, avec une **traçabilité complète** de chaque action (qui/quoi/quand — humain ou agent IA). Référence produit : **Growfin**, augmenté par des agents IA.

Stratégie de déploiement du périmètre fonctionnel : **on commence par l'amont** (recouvrement amiable) et on **étend progressivement vers l'aval** (contentieux) une fois l'amont solide et vendu.

## 1bis. Contexte géographique

**Maroc.** Les montants du scénario démo sont en **MAD** (dirham marocain), pas en euros. ⚠️ Le cadre juridique décrit au §7 a été rédigé en pensant RGPD/CNIL (France) — **à corriger** : le Maroc a son propre cadre de protection des données (loi 09-08, régulateur CNDP), structurellement proche du RGPD mais pas identique. À revalider avant le pilote avec des données réelles — ne pas se fier au §7 tel quel pour la partie juridique tant que ce n'est pas fait.

## 2. Cible

- **Qui** : PME / ETI (ouverture possible aux grandes entreprises plus tard), en tant que créancier qui veut se faire payer par ses propres clients professionnels.
- **Type de créances** : factures B2B interentreprises (pas de crédit à la consommation, pas de recouvrement pour compte de tiers — voir §7 Cadre juridique).
- **Mode de commercialisation** : SaaS vendu directement aux PME, **dès la V1** (pas un outil interne).

## 3. Périmètre V1 — l'amont uniquement

Le workflow "amont" (recouvrement amiable) couvre, dans l'ordre :

1. **Suivi des factures impayées** — import/synchronisation des factures et de leur statut de paiement.
2. **Scoring / priorisation** — quel client relancer en premier (montant, ancienneté, historique de paiement, risque).
3. **Relances automatisées et personnalisées** — l'agent IA rédige (et idéalement adapte) chaque relance au contexte du client plutôt que d'envoyer un template figé.
4. **Séquencement multi-étapes** — relance amicale → relance ferme → mise en demeure (dernière étape avant l'aval).
5. **Gestion des réponses / négociation légère** — le client répond, demande un délai : l'agent qualifie et propose un échéancier ou escalade à un humain.
6. **Traçabilité totale** — chaque email envoyé, chaque décision de l'agent, chaque changement de statut est journalisé et consultable (c'est le différenciateur produit face aux outils de relance "boîte noire").

**Hors périmètre V1** (explicitement mis de côté pour plus tard) : mise en demeure formelle avec valeur juridique renforcée, injonction de payer, gestion du contentieux, lien avec huissiers/avocats. Voir §8.

## 4. Pourquoi "agent IA" et pas juste de l'automatisation

Une séquence d'emails programmée (J+7/J+15/J+30) ne nécessite pas d'IA — un simple outil de drip campaign suffit (et existe déjà : Upflow, Chaser, modules d'ERP). La valeur ajoutée IA doit se voir sur au moins un de ces leviers :

- **Rédaction contextuelle** : le ton et le contenu de la relance s'adaptent à l'historique du client et à la situation (premier retard vs client chronique, litige en cours, etc.).
- **Priorisation intelligente** : score de risque de non-paiement, pas juste un tri par ancienneté.
- **Négociation de premier niveau** : lecture des réponses du débiteur, proposition d'échéancier dans des limites définies, escalade humaine si ça sort du cadre.
- **Décision du bon canal/moment** : email d'abord, puis SMS, puis suggestion d'appel — au bon rythme.

**Décidé** : on ne choisit pas un seul levier — on construit **un cas d'usage complet de A à Z** (une entreprise fictive, quelques clients débiteurs fictifs) qui met en scène *tous* les leviers dans une histoire cohérente, sur le modèle Growfin :
- **Score de risque** par client débiteur (façon "health score" Growfin, basé sur des signaux simulés : ancienneté, montant, historique de paiement, promesses de paiement non tenues).
- **Worklist priorisée** : qui relancer en premier.
- **Relance contextuelle générée par l'IA** à chaque étape (amicale → ferme → mise en demeure).
- **Boîte de réception intelligente** : le débiteur "répond" (scénario scripté), l'agent classe la réponse, résume, propose une action (échéancier, escalade humaine) et rédige la réponse.
- **Traçabilité totale** de bout en bout, visible dans l'interface (journal d'audit).

Référence produit validée : **Growfin** (cf. recherche du 2026-09-15 : health score 15+ signaux, worklist priorisée, relances personnalisées, inbox IA avec résumé/classification/réponses suggérées, prévision de trésorerie). "IA Recovery Group" évoqué en référence n'a pas été identifié comme un logiciel IA — probablement une fausse piste (le résultat le plus proche, "IA Group Recovery", est une société de recouvrement physique sans lien avec l'IA).

## 5. Stratégie de lancement

```
Démo commerciale (données synthétiques)  →  Pilote réel (1 PME déjà identifiée)  →  Production / autres clients
        [2 à 4 semaines]                        [données réelles]
```

- **Démo** : jeu de données **synthétique**, généré pour être réaliste (factures, clients, retards, échanges). Objectif : convaincre des prospects, aucune dépendance externe, zéro contrainte RGPD (aucune donnée réelle).
- **Pilote** : une PME partenaire est **déjà identifiée** par l'utilisateur ("facile à convaincre"). À ce stade, on bascule sur des données réelles → ça déclenche les obligations de sécurité/RGPD (voir §7).
- **Production** : ouverture à d'autres clients PME, multi-tenant.

## 6. Qui construit

- L'utilisateur n'a pas de compétence technique. Construction **avec Claude Code comme copilote**, pas à pas.
- Un **cofondateur technique potentiel** (profil Microsoft) pourrait rejoindre si besoin — pas encore acté, à garder en tête pour la suite (notamment pour la phase production/scale).

## 7. Cadre juridique et sécurité — ce qu'il ne faut pas oublier

### Ce qui est plutôt favorable
- Recouvrement **B2B** = pas de Code de la consommation (contrairement au crédit conso).
- L'outil sert le créancier à recouvrer **ses propres créances** — ce n'est **pas** un mandat de recouvrement pour compte de tiers. Tant qu'on ne devient pas nous-mêmes une société qui recouvre les créances *d'autres entreprises*, on évite le statut réglementé de "société de recouvrement" (déclaration en préfecture, compte séquestre, etc.). **Point de vigilance** : si un jour le produit évolue vers "on recouvre pour le compte de nos clients" plutôt que "l'outil aide nos clients à recouvrer eux-mêmes", ce statut redevient pertinent — à surveiller si le modèle évolue.

### Ce qui reste obligatoire, même en B2B
- **RGPD** : même en B2B, les factures et relances contiennent des données personnelles (nom/email/téléphone du contact comptable côté débiteur). Dès le pilote (données réelles) :
  - Registre des traitements à jour.
  - Base légale identifiée (intérêt légitime du créancier, en principe).
  - **DPA (Data Processing Agreement / accord de sous-traitance)** signé avec chaque PME cliente — on traite leurs données de facturation pour leur compte.
  - Politique de confidentialité publique.
  - Hébergement des données **dans l'UE** (région Frankfurt/Paris selon les fournisseurs) — à vérifier pour chaque brique technique retenue.
  - Politique de conservation/suppression des données.
  - Procédure de réponse aux demandes d'accès/effacement.
- **Sécurité technique** dès le pilote (pas besoin en démo avec données fictives, mais à concevoir dès maintenant pour ne pas tout refaire) :
  - Chiffrement en transit (HTTPS partout) et au repos (base de données chiffrée).
  - Authentification robuste (ne pas coder son propre système — utiliser un fournisseur éprouvé type Supabase Auth, Clerk, Auth0).
  - Contrôle d'accès par rôle : qui dans l'équipe du client voit quelles données débiteur.
  - **Gestion des secrets** : clé API Anthropic, identifiants base de données, etc. jamais en dur dans le code — variables d'environnement / gestionnaire de secrets.
  - Sauvegarde régulière de la base de données.
- **Emailing des relances** :
  - Passer par un prestataire d'envoi transactionnel (ex. Brevo — français/UE, ou Resend) avec domaine authentifié (SPF/DKIM/DMARC) : évite le spam et **constitue une preuve d'envoi** (important si ça finit un jour en contentieux).
- **Transparence IA** : informer les débiteurs/utilisateurs que les relances peuvent être rédigées par un agent IA (bonne pratique, et alignement avec les obligations de transparence qui montent en puissance au niveau UE — à revalider avec un juriste avant la mise en production réelle).
- **CGU / CGV** du SaaS : contrat clair avec chaque PME cliente sur ce que fait l'outil, ce qu'il ne fait pas (pas de conseil juridique), et la répartition des responsabilités.

### Recommandation
Pas besoin de tout mettre en place pour la démo (données fictives = pas de risque). Mais concevoir le schéma de données et les accès **comme si** c'était réel dès le POC, pour ne pas devoir tout reconstruire au moment du pilote. Avant le pilote réel : au minimum DPA + politique de confidentialité + hébergement UE + chiffrement + gestion des secrets. Un point de vigilance IA Act / RGPD Article 22 (décision automatisée) est à valider avec un juriste si l'agent va jusqu'à décider seul de déclencher une mise en demeure formelle (plutôt une question pour la phase aval, §8).

## 8. Roadmap aval (plus tard, pas maintenant)

Une fois l'amont solide et vendu, extension progressive vers :

1. Mise en demeure formelle (valeur juridique renforcée, accusé de réception).
2. Constitution de dossier de recouvrement judiciaire (injonction de payer).
3. Intégration avec des partenaires huissiers/avocats (transmission de dossier).
4. Suivi des statuts légaux et des délais de procédure.

Chacune de ces étapes a ses propres prérequis juridiques (au minimum, avis juridique avant de coder quoi que ce soit ici). Ne pas commencer avant que l'amont soit éprouvé.

## 9. Stack technique — DÉCIDÉE : 100% gratuite pour la démo

Décision du 2026-09-15 : aucune dépense d'outil pour la démo. Sécurité/hébergement en profondeur repoussés au pilote (accord explicite, données démo 100% synthétiques donc aucun risque réel entre-temps).

| Brique | Choix retenu | Coût | Pourquoi |
|---|---|---|---|
| Frontend + backend | Next.js (React) | Gratuit | Un seul framework pour l'interface et la logique, tu lances ça en local avec `npm run dev` — le même geste que pour l'agent Lea |
| Base de données | SQLite (fichier local, via Prisma) | Gratuit | Zéro compte à créer, zéro configuration, tourne entièrement sur ta machine. Suffisant pour une démo avec données synthétiques |
| Authentification | Aucune pour la démo | Gratuit | Démo mono-utilisateur en local, pas besoin de login |
| Agent IA | API Claude (Anthropic) | **Seul coût réel, à l'usage** | Rédaction des relances, scoring, résumé/classification des réponses. Volume démo = quelques centimes à quelques euros. On mettra une limite de dépense dans la console Anthropic par sécurité |
| Envoi d'emails | Aucun envoi réel — les relances sont **affichées et "simulées"** dans l'interface | Gratuit | Pas besoin de Brevo/Resend tant qu'on n'envoie rien pour de vrai. Un vrai prestataire d'envoi ne sera nécessaire qu'au pilote |
| Hébergement | Aucun pour l'instant — démo lancée en local sur ton ordinateur pendant les rendez-vous | Gratuit | Pas de déploiement à gérer. Si un jour tu veux un lien partageable, on ajoutera Vercel (gratuit) + une base Postgres gratuite (Supabase/Neon) à ce moment-là seulement |
| Code source | GitHub (repo privé, gratuit) | Gratuit | Versionning, sauvegarde du travail |

**Seule dépense inévitable** : l'usage de l'API Claude (facturé à la consommation, pas d'abonnement fixe). Tout le reste est à 0€.

## 10. Prérequis concrets avant de démarrer le POC

Actions côté utilisateur, à faire avant qu'on commence à construire :

- [ ] Créer un compte sur [console.anthropic.com](https://console.anthropic.com) pour obtenir une clé API Claude (nécessaire pour l'agent IA) — c'est le seul prérequis qui implique un moyen de paiement (facturation à l'usage). Penser à fixer une limite de dépense dans les paramètres du compte.
- [ ] Créer un compte GitHub gratuit (si pas déjà existant) — pour sauvegarder le code.
- [ ] Choisir un nom de projet/produit provisoire parmi les pistes du §13 (ou une autre idée).

Rien d'autre : pas de Vercel/Supabase nécessaires pour la démo (voir §9). Rien à faire côté PME pilote pour l'instant (démo = données fictives). Pour le pilote (plus tard), on sait déjà que la PME travaille sous **Excel** — donc l'import de données réelles se fera probablement par fichier Excel/CSV plutôt que par intégration API à un logiciel de compta (plus simple, pas d'API à développer dans un premier temps).

## 11. Journal des décisions

- **2026-09-15** — Choix du créneau : recouvrement B2B interentreprises (PME/ETI créancières), pas crédit conso, pas société de recouvrement pour compte de tiers.
- **2026-09-15** — Produit de référence : Growfin, augmenté par des agents IA, avec traçabilité complète comme différenciateur.
- **2026-09-15** — Périmètre V1 : amont (amiable) uniquement ; aval (contentieux) repoussé à une phase ultérieure.
- **2026-09-15** — Go-to-market : démo à données synthétiques d'abord, puis pilote avec une PME déjà identifiée par l'utilisateur, avant la production.
- **2026-09-15** — Construction : utilisateur + Claude Code en copilote ; cofondateur technique potentiel (profil Microsoft) sollicité "quand l'utilisateur le décide", pas de date fixée.
- **2026-09-15** — Horizon POC démontrable : 2 à 4 semaines.
- **2026-09-15** — Ce projet est distinct du projet "Lea / naiom-platform" (assistant créateur de contenu) présent dans le dossier `Lea-createur-contenu` — nouveau dossier de travail créé séparément : `Documents/recouvrement-ia-platform/`.
- **2026-09-15** — Démo conçue comme **un cas d'usage complet de A à Z** (pas un seul levier isolé), modelé sur les fonctionnalités réelles de Growfin (recherche web effectuée). "IA Recovery Group" écarté comme référence (pas de logiciel IA identifié sous ce nom).
- **2026-09-15** — Stack démo 100% gratuite : Next.js + SQLite en local, sans auth, sans envoi d'email réel (relances simulées à l'écran), sans hébergement cloud. Seul coût réel : usage de l'API Claude. Sécurité/hébergement approfondis repoussés au pilote — accord explicite de l'utilisateur, risque nul entre-temps (données 100% synthétiques).
- **2026-09-15** — PME pilote travaille sous Excel (pas d'outil de compta/facturation dédié) → import de données réelles prévu par fichier Excel/CSV pour le pilote, pas d'intégration API.
- **2026-09-15** — "IA Group Recovery" (https://iagroup.com/fr/iarecovery/) vérifié : ce n'est pas un logiciel IA mais un cabinet de recouvrement international avec négociation humaine (créances commerciales internationales, assureurs-crédit/export, ~50 ans d'existence). Écarté comme référence produit pour la démo ; gardé comme repère possible pour la roadmap aval (dossiers lourds/internationaux), pas pour maintenant. Growfin reste la seule référence produit pour la démo.
- **2026-09-15** — Compte Anthropic existant de l'utilisateur (crédit 5$) réutilisé tel quel — pas de nouveau compte à créer. Décision : limiter la dépense au maximum → fixer une limite de dépense mensuelle dans la console (Settings → Billing), utiliser le modèle **Claude Haiku** par défaut pour le développement/les tests (le moins cher), réserver un modèle plus performant uniquement pour peaufiner ponctuellement la démo finale si besoin.
- **2026-09-15** — GitHub : compte créé dès maintenant (choix de l'utilisateur) pour sauvegarder le code en continu pendant la construction.
- **2026-09-15** — Contexte géographique précisé : **Maroc**, montants du scénario en **MAD**. Cadre juridique §7 rédigé pour la France (RGPD/CNIL) → à corriger pour le Maroc (loi 09-08, CNDP) avant le pilote réel.
- **2026-09-15** — Workflow produit validé par recherche factuelle sur Growfin (voir §14) : promesse n°1 = réduction du DSO / élimination du travail répétitif, pas la négociation. Agent "Négociateur" repositionné comme gestion d'exceptions uniquement. Tableau de bord doit mettre le DSO avant/après en avant en premier.

## 12. Nom de produit — pistes

Le nom reste provisoire, facile à changer plus tard. Piste de l'utilisateur : **"Vélos IA"** (évoque la vélocité — "on vous fait payer plus vite"), cohérent comme angle de positionnement. Quelques autres pistes qui "sonnent recouvrement" si besoin d'alternatives :
- **Encaissia** / **Encaisso** (encaissement + IA)
- **Relancia** (relance + IA)
- **Solvia** (évoque la solvabilité)
- **Créance IA**

Pas de décision requise maintenant — à trancher quand un nom sera nécessaire (dépôt de nom de domaine, pitch).

## 13. Questions ouvertes restantes

1. Détails chiffrés finaux du scénario du cas A à Z (les 6 profils de clients débiteurs sont validés en nature, §14 — reste à fixer les montants exacts en MAD au moment de générer le jeu de données synthétiques).
2. Nom de produit définitif (voir §12).
3. Cofondateur technique : pas de timing fixé, à l'initiative de l'utilisateur.

## 14. Workflow produit détaillé — VALIDÉ (2026-09-15)

Vérifié par recherche directe sur Growfin (growfin.ai/products/collections-automation + études de cas Hubilo/Locus) : la promesse n°1 affichée est **"Reduce DSO and Get Paid Faster"**, avec des résultats clients cités de **34% de réduction du DSO**, **60% de réduction de l'effort manuel**, **27% d'accélération du cash-flow** (ex. Locus : -20% DSO ; un client passe de 45 à 30 jours). Positionnement explicite de Growfin : *"Accelerate Collections Without Losing Control"* / *"without losing the human touch"* — l'automatisation porte le travail répétitif, l'humain garde la main, la négociation est un filet de sécurité et non le cœur du produit.

**Conséquence pour notre produit** : la promesse centrale est **la réduction du délai de recouvrement par l'élimination du travail chronophage et répétitif**, pas la capacité de négociation de l'IA. Le workflow est repositionné en conséquence :

### Pipeline (3 agents)

1. **Détection automatique** — une facture qui dépasse son échéance entre seule dans le pipeline de recouvrement.
2. **Agent "Analyste"** — calcule un score de risque par facture (ancienneté du retard, montant, historique de paiement, relances déjà envoyées sans réponse) → produit une **worklist priorisée automatiquement**, remise à jour en continu, sans effort humain.
3. **Agent "Rédacteur"** — génère, pour chaque dossier prioritaire, une relance personnalisée (bon ton, bon contexte, bon montant) — élimine la tâche répétitive de rédaction manuelle.
4. **Validation humaine en un clic** — l'utilisateur approuve/modifie/refuse. Rassure sur le contrôle, un argument de vente à part entière.
5. **Traçabilité automatique** — chaque relance journalisée (date, contenu, statut).
6. **Agent "Négociateur" (cas EXCEPTIONNELS uniquement)** — ne s'active que si le client répond hors du cadre standard (demande de délai, contestation) : classe l'intention, résume, propose une action limitée ou escalade à un humain. **Ce n'est pas le cœur du produit** — dans la majorité des dossiers, le parcours reste 100% automatique de bout en bout, sans intervention.
7. **Escalade progressive** — sans réponse après plusieurs relances, proposition de passer à l'étape suivante (ton plus ferme, puis mise en demeure — document généré, périmètre amont).
8. **Tableau de bord — le DSO en tête** : à l'image de Growfin, l'écran d'accueil met en avant en premier le **DSO avant/après** (ex. "45 → 30 jours"), le **% d'effort manuel réduit**, et le **montant récupéré ce mois grâce à l'agent** — ce sont les chiffres qui vendent en 10 secondes, avant tout détail de négociation.

### Principes UX (épuré, "hyper sexy")

- Un seul écran principal : la worklist en cartes triées par priorité, badge couleur de risque (rouge/orange/vert), montant, jours de retard.
- Clic sur un dossier → panneau latéral (pas de nouvelle page) : historique client + relance proposée + bouton "Envoyer" + bouton "Modifier."
- Raisonnement de l'agent visible et vulgarisé (ex. *"45 jours de retard sur [montant] MAD, 2 relances sans réponse → priorité haute"*) — rend l'IA concrète, vend en démo.
- Micro-interactions de confirmation ("Envoyée ✓") pour une sensation de produit fini.
- Palette sobre, une seule couleur d'accent, typographie claire, zéro jargon technique visible.

Sources : [Growfin — Collections Automation](https://www.growfin.ai/products/collections-automation) ; [Growfin — Reduce DSO and Get Paid Faster](https://www.growfin.ai/by-objective/reduce-dso-and-get-paid-faster) ; [Case study Locus — DSO -20%](https://www.growfin.ai/case-studies/locus) ; [Case study Hubilo](https://www.growfin.ai/case-studies/hubilo)

## 15. Méthode de vérification systématique — QA commerciale (validée 2026-09-15)

Objectif : ne jamais perdre de vue que le but est de **vendre en résolvant une vraie douleur métier**, pas de construire de la technique pour la technique. Vérifié sur growfin.ai (homepage) : structure de vente **douleur d'abord** ("Over 50% of enterprise invoices go overdue despite ERP-based automations") → promesse ("Turn Receivables into Predictable Cash Flow") → fonctionnalités (Collections CRM en premier) → chiffres (65% tâches automatisées, 33% DSO réduit, 45% temps de collecte réduit, 27% cash-flow accru). Chaîne YouTube officielle repérée ([@growfin195](https://www.youtube.com/@growfin195), témoignage Hubilo) mais non visionnée (pas d'outil vidéo côté assistant) — à regarder par l'utilisateur si inspiration visuelle souhaitée.

**a) Script de démo fixe (boussole de construction)**, calqué sur cette structure :
1. La douleur (15s) — travail manuel chronophage, argent qui traîne malgré tout.
2. La promesse (15s) — réduction du délai de recouvrement par l'automatisation du répétitif.
3. La preuve en action (2 min) — worklist priorisée automatiquement, relance envoyée en un clic, raisonnement de l'agent visible.
4. Le chiffre qui reste en tête — DSO avant/après affiché sur le tableau de bord.
5. Le cas exceptionnel (négociation) en toute fin, pour montrer la maîtrise sans en faire le sujet principal.
Chaque brique construite doit servir un de ces 5 temps ; sinon elle attend.

**b) Grille de vérification en 3 questions**, à appliquer avant de considérer un morceau "terminé" :
1. Élimine une vraie tâche chronophage/répétitive ?
2. Montrable à un prospect PME en moins de 2 minutes, capable de provoquer un "ah oui, ça je le vis" ?
3. Fait bouger un chiffre visible du tableau de bord (DSO, % automatisé, argent récupéré) ?
Si non aux 3 → on retravaille avant d'avancer.

**c) Rituel de checkpoint — "le test du prospect"** : à la fin de chaque étape de construction, rejouer le script de démo en entier en se mettant à la place d'un prospect PME, et noter les frictions/confusions/moments forts avant de passer à la suite.

**d) Discipline sur les chiffres** : les chiffres réels de Growfin servent de repère de langage marketing, jamais attribués à notre outil sans preuve. Le tableau de bord de la démo affiche un scénario explicitement présenté comme une simulation.

## 16. État technique — Checkpoint 1 (2026-09-15)

**Projet créé** : `Documents/recouvrement-ia-platform/app/` — Next.js (TypeScript, Tailwind, App Router) + Prisma/SQLite.

**Fonctionne et vérifié en local** (via navigateur, pas juste "ça compile") :
- Worklist priorisée automatiquement (les 6 profils du scénario, triés par score de risque).
- Score de risque + raisonnement affiché en langage clair pour chaque dossier (`src/lib/scoring.ts`).
- Panneau de détail par dossier : historique des relances, badge "client stratégique", badge "réponse à traiter" avec intention classifiée / résumé / action proposée (cas Cosmétiques du Sud et BTP Rif Construction testés en direct).
- Tableau de bord avec DSO avant/après, effort réduit, montant récupéré — clairement étiquetés "Simulation" (discipline §15d respectée).
- Génération de relance par l'agent (bouton "Générer la prochaine relance") → appelle l'API Claude (Haiku) → gestion d'erreur propre testée (message clair si la clé API manque, pas de plantage).
- "Envoi" simulé avec traçabilité (route `/api/reminders/send`, écrit en base, historique mis à jour).

**Bloquant restant avant de voir une vraie relance générée** : la clé API Anthropic doit être collée dans `Documents/recouvrement-ia-platform/app/.env.local` (jamais transmise dans la conversation, pour des raisons de sécurité) — puis le serveur doit être redémarré pour la prendre en compte.

**Non fait / à surveiller** :
- Git n'est pas installé sur la machine (`git --version` échoue) → impossible de committer/pousser sur GitHub tant que ce n'est pas installé. Le compte GitHub existe déjà (créé plus tôt), il manque l'outil en ligne de commande.
- Prisma a été fixé en version 6.19.3 (stable) après un premier essai en v7/v8 (versions encore instables au moment du build, changement de config non nécessaire pour ce POC) — ne pas mettre à jour Prisma sans re-tester.
- Port 3000 déjà occupé par le projet "Lea/naiom-platform" sur cette machine → la démo tourne sur un port différent attribué automatiquement (`autoPort` activé dans `.claude/launch.json`), sans impact sur l'autre projet.

**Checkpoint "test du prospect"** : les temps 1 (douleur), 3 (preuve en action) et 4 (chiffre DSO) du script de démo (§15a) sont déjà démontrables à l'écran. Le temps 5 (négociation exceptionnelle) est démontrable sur les dossiers Cosmétiques du Sud et BTP Rif Construction.

**Mise à jour 2026-09-15 (soir) — clé API branchée, premier test réel :**
- Première génération : email tronqué (max_tokens trop bas) ET contenait "porter plainte auprès des autorités compétentes" — formulation de droit pénal inappropriée pour un impayé commercial en phase amiable, plus des placeholders bruts type "[Nom de votre" non remplis. Corrigé immédiatement (`src/app/api/reminders/generate/route.ts`) : max_tokens relevé à 600, règles strictes ajoutées au prompt (pas de menace pénale, pas de crochets à compléter, délai en formulation relative, signature générique "Le service recouvrement — Meridian Distribution"). Nom de la PME créancière fictive fixé : **Meridian Distribution**.
- Deuxième génération (même dossier, Meknès Industrie) : email complet, professionnel, correct juridiquement, prêt à l'emploi. Testé jusqu'au bout : "Envoyer" (simulé) → historique mis à jour en direct (4 → 5 relances), traçabilité fonctionnelle.
- Exactement le genre de problème que la grille de vérification (§15b) et le rituel de checkpoint (§15c) sont censés attraper — attrapé et corrigé avant de montrer quoi que ce soit à un prospect.

**Git** : dépôt initialisé à la racine du projet (`recouvrement-ia-platform/`), premier commit fait en local. Dépôt distant fourni par l'utilisateur : https://github.com/larbi701/recouvrement-ia-platform.git

## 17. Calibrage marché marocain (2026-09-15, vérifié par recherche)

Chiffres réels trouvés (étude Inforisk 2026, échantillon 25 392 entreprises, 85% TPE / 13% PME / 2% GE) :
- Délai de paiement moyen toutes entreprises : 172 jours (2023) → 150 jours (2024), -22 jours.
- TPE : 199 → 167 jours (-32 jours).
- **PME : 94 → 88 jours** (amélioration limitée) — c'est la référence retenue pour notre cible.
- Cadre légal (loi 69-21) : délai standard ≤ 60 jours depuis la date de facture ; **plafond à 120 jours entre partenaires commerciaux**.

Sources : [Médias24](https://medias24.com/2025/07/25/delais-de-paiement-recul-du-credit-interentreprises-mais-des-retards-toujours-important-dans-le-prive), [EcoActu — baromètre Inforisk](https://ecoactu.ma/barometre-inforisk-la-loi-69-21-est-elle-en-train-de-terrasser-le-fleau-des-retards/), [Jeune Afrique](https://www.jeuneafrique.com/788207/economie-entreprises/maroc-malgre-une-baisse-les-delais-de-paiement-entre-entreprises-restent-lents/).

**Changements appliqués** :
- `src/lib/scoring.ts` : plafond de score (`DAYS_CAP`) relevé de 90 à **120 jours** (aligné sur la loi 69-21) ; ajout d'une mention automatique dans le raisonnement de l'agent quand un dossier approche (≥105j) ou dépasse (≥120j) le plafond légal.
- Scénario démo recalibré : délais standard facture→échéance fixés à 60 jours (le défaut légal) ; le cas Meknès Industrie (silence total) porté à **112 jours de retard** (issueDate à 172 jours — clin d'œil volontaire au chiffre national 2023) pour incarner un dossier proche du plafond légal, un argument de vente fort et spécifique au Maroc.
- Tableau de bord : DSO "avant" fixé à **88 jours** (chiffre réel PME 2024, sourcé), DSO "après" simulé à **58 jours** (-34%, ordre de grandeur documenté chez Growfin) — infobulle affichant la source au survol.
- Prompt de l'agent (génération de relance) : ajoute automatiquement un rappel factuel du plafond légal de 120 jours (loi 69-21) quand le dossier en est proche, sans le présenter comme une menace.

## 18. Vérification de cohérence avec Growfin (2026-09-15)

Comparé notre construit aux deux piliers connus de Growfin (Collections CRM + Cash Application, cf. §14/§15) :
- **Collections CRM (notre périmètre V1)** : ✅ couvert — worklist priorisée automatiquement, relances personnalisées, boîte de réception/gestion des réponses, traçabilité. C'est le pilier sur lequel on s'aligne.
- **Cash Application** (rapprochement automatique des paiements par OCR/IA) : ❌ hors périmètre, **par choix assumé** — ce n'est pas "l'amont" tel que défini au §3, et n'apporte pas la même valeur de démonstration commerciale immédiate. À reconsidérer seulement si un pilote réel le demande explicitement.
- Recherche complémentaire sur les avis G2 : dashboard Growfin décrit comme "attractif" et "très user-friendly" comparé aux ERP classiques — conforme à l'objectif "hyper sexy, épuré" du §14. Aucun détail de palette de couleurs trouvé publiquement (pas de contrainte à respecter de ce côté).

## 19. Charte graphique "Vélos IA" (2026-09-15)

- **Couleur de marque** : Indigo-600 (`#4F46E5` environ) — logo, éléments interactifs (boutons, sélection), remplace le vert générique utilisé au premier jet. Choisi pour se différencier du vert "fintech générique" que beaucoup d'outils de ce secteur utilisent (dont Growfin), tout en évoquant la vélocité/modernité.
- **Emerald conservé uniquement en usage sémantique** : confirmation "Relance envoyée ✓", montant "récupéré" — code couleur universel "argent/succès", pas la couleur de marque.
- **Couleurs de risque inchangées** (rouge/ambre/slate pour Urgent/À traiter/Surveillance) — ce sont des codes universels, ne pas les rebrander.
- **Logo** : marque simple en SVG (double chevron blanc sur fond dégradé indigo, `src/components/Logo.tsx`) — évoque la vitesse/vélocité sans dépendre d'une image externe.
- Nom **"Vélos IA" considéré comme acté** pour la durée du POC (plus de piste alternative explorée activement, cf. §12 pour les autres options si le nom doit changer avant le dépôt de marque).

## 20. Charte graphique officielle reçue — VELOS IA V5 (2026-09-15)

L'utilisateur a fourni un vrai document de marque (`VELOS_IA_Charte_Graphique_V5.pdf`, confidentiel). Il révèle que **VELOS IA est un projet plus large que le seul recouvrement** :

> "Le système d'exploitation des PME marocaines, piloté par des agents IA autonomes." — Business Operating System, CEO & co-fondateur **Larbi Chraïbi**, velosia.io, Casablanca.

**Trois domaines d'agents** : CASH (trésorerie · prévision · **relances** · rapprochement bancaire), GROWTH (CRM · pipeline · devis · suivi commercial), STRATEGY (scénarios · rentabilité · arbitrages). **Notre POC actuel = la brique "relances" du domaine CASH uniquement.** Trésorerie, prévision et rapprochement bancaire restent hors périmètre (cohérent avec la stratégie "amont d'abord" déjà actée) — mais il faut garder en tête que le produit final vise bien plus large.

**Cible précisée** : dirigeants de PME **10M-175M MAD de CA**, B2B structuré, Maroc + cabinets comptables (pas seulement "PME/ETI" au sens large — un seuil de CA précis).

**Problème officiel positionné** : "125 jours d'attente de paiement" et "40% des faillites PME liées à la trésorerie" — chiffre de positionnement à utiliser en priorité (utilisé maintenant comme DSO "avant" dans le tableau de bord), les chiffres Inforisk (88j PME/94j/172j) gardés en note de support.

**Réglementation élargie** : en plus de la loi 69-21 (déjà connue), la charte mentionne **facturation électronique CGI 2026** et **open banking** comme éléments de contexte réglementaire — à approfondir si le produit va vers la brique trésorerie/rapprochement bancaire plus tard.

**Ton de voix à respecter dans tous les textes générés** (emails, UI, présentation) : factuel (un chiffre plutôt qu'un adjectif), direct (phrases courtes, voix active, vocabulaire de dirigeant), sobre (démontrer plutôt que promettre). Vocabulaire à privilégier : agents, pilotage, temps réel, trésorerie, encaissement, DSO, décision, arbitrage, scénario, dirigeant, PME, cabinet comptable. **Vocabulaire à écarter** : solution innovante, révolutionner, disruptif, game changer, ERP, progiciel, module logiciel, "intelligence artificielle" en général. → Intégré au prompt de génération de relances (`src/app/api/reminders/generate/route.ts`).

### Écarts corrigés dans le code (avant cette charte, tout était improvisé)

| Élément | Avant (improvisé) | Après (charte V5) |
|---|---|---|
| Logo | Carré coloré + double chevron (invention) | **Mark officiel** : trois nœuds reliés façon triangle/V (`src/components/Logo.tsx`), badge indigo, wordmark "VELOS IA" (sans accent, IA en violet) + sous-titre "BUSINESS OPERATING SYSTEM" |
| Police | Geist (police par défaut Next.js) | **Poppins** (seule famille autorisée, poids 300/400/500/700), chargée via `next/font/google` |
| Couleur de marque | Indigo Tailwind générique (#4F46E5 approx.) | **Indigo Profond `#181A89`** (autorité) + **Violet Velos `#9B5FE0`** (KPIs/signature IA), tokens exacts dans `globals.css` |
| Couleurs sémantiques | Rouge/ambre/slate Tailwind par défaut | **Corail `#FF6868`** (urgent, texte Indigo dessus — pas blanc, cf. règle de contraste corrigée V5), **Bleu Azur** (à traiter), **Lavande Structurelle** (surveillance/neutre) |
| Mode sombre | Bascule auto `prefers-color-scheme` héritée du template | **Supprimée** — la charte ne définit qu'un usage fond clair/fond indigo, pas de dark mode applicatif |
| KPI (couleur) | Texte gris foncé générique | **Violet Velos**, conforme à la sémantique "Violet = KPIs" de la charte |
| Ton des textes IA | Correct mais non formalisé | Règles de ton (factuel/direct/sobre) et vocabulaire à écarter ajoutés explicitement au prompt |

**Non repris tel quel (hors périmètre app web)** : le gabarit de signature email (section 06 de la charte) — concerne la messagerie personnelle de l'utilisateur, pas l'application. À traiter séparément si demandé.

**Vérification effectuée** : rendu contrôlé dans le navigateur après application (captures internes) — logo, couleurs de badges de priorité, encadré "raisonnement de l'agent", boutons, tous conformes aux couples couleur/contraste autorisés par la charte (section 05).

## 21. Workflow multi-canal — mimer le chargé de recouvrement humain (2026-09-15)

Constat de l'utilisateur : un chargé de recouvrement humain ne relance pas tout le monde par email — il **escalade le canal** (email → WhatsApp → appel téléphonique → email formel final) et **saute des étapes selon ce qu'il connaît du client**. Le POC ne faisait que de l'email ; corrigé.

### Échelle standard retenue
1. J+1 à J+7 : Email, ton amical.
2. J+8 à J+15 (ou immédiatement si client chronique) : WhatsApp.
3. J+16 à J+45, si aucun appel n'a encore été tenté : **fiche d'appel générée par l'IA** + tâche assignée à un humain (l'IA ne passe pas l'appel elle-même — voir §22).
4. Ton "dernier avertissement" (MISE_EN_DEMEURE, ≥4 relances) : **toujours email**, même pour un client chronique — c'est la trace écrite qui compte juridiquement avant l'approche du plafond légal.
5. ≥120 jours : sort de l'amiable, flag `LEGAL_ESCALATION` (transmission au contentieux, hors périmètre).

### Personnalisation
- Client stratégique jamais contacté → fiche d'appel immédiate, pas de relance automatique (préserve la relation).
- Client chronique (`chronicLatePayer`) qui ignore les emails → saute directement à WhatsApp.
- Réponse client non résolue → aucune action automatique, geré par l'agent Négociateur (humain doit trancher).

### Implémentation
- **Schéma** (`prisma/schema.prisma`) : `Client.contactPhone`, `Client.chronicLatePayer` ; `Reminder.channel` (EMAIL/WHATSAPP) ; nouveau modèle `CallTask` (reason, talkingPoints générés par l'IA, status A_FAIRE/FAIT, outcome, outcomeNote, promisedDate).
- **Moteur de décision** : `src/lib/workflow.ts`, fonction `computeNextAction()` — calcule le prochain canal/action à partir des signaux (jours de retard, historique par canal, tâches d'appel, profil client). C'est ce qui pilote le bouton d'action affiché à l'écran.
- **API** : `/api/reminders/generate` accepte maintenant un `channel` (adapte le format du prompt : email structuré vs WhatsApp court/direct sans "Objet :") ; nouvelles routes `/api/calls/generate` (génère la fiche d'appel) et `/api/calls/complete` (enregistre le résultat de l'appel : promesse de paiement + date, ne répond pas, conteste, payé).
- **UI** (`Worklist.tsx`) : badge "Appel à faire" sur la worklist, canal affiché dans l'historique, panneau d'action qui s'adapte automatiquement au type de prochaine action (email/WhatsApp/fiche d'appel + formulaire de résultat/alerte légale).
- **Testé en direct** (vrais appels API, pas juste relu) : génération WhatsApp (Al Amal), création + complétion d'une fiche d'appel avec résultat "Promesse de paiement", puis génération d'un message WhatsApp de suivi — la worklist et le raisonnement se sont mis à jour correctement à chaque étape.

## 22. Agent vocal (appels IA réels) — reporté à une phase séparée

L'utilisateur a demandé ce qu'il faudrait pour qu'un agent IA passe lui-même les appels (piste ElevenLabs). Prérequis identifiés :
- **Téléphonie programmable** (ex. Twilio) pour déclencher un appel sortant depuis un serveur — pas littéralement "installé sur le téléphone" du chargé de recouvrement (techniquement bloqué côté iOS/Android pour l'audio d'appel natif). Coût à la minute.
- **ElevenLabs Conversational AI** (ou équivalent) pour la conversation vocale, branché sur la téléphonie. Abonnement + usage payants.
- **WhatsApp Calling** : nécessite la WhatsApp Business Platform (Meta), vérification d'entreprise, modèles de messages pré-approuvés — un onboarding de plusieurs jours/semaines, pas une simple clé API.
- **Conformité** : consentement à l'enregistrement des appels, hébergement des données vocales hors Maroc (recoupe le point juridique déjà en suspens, §1bis), cadre ANRT pour la téléphonie.

**Décision (2026-09-15)** : reporté à une phase séparée, après le pilote, avec son propre budget — casse la contrainte "0€" de la démo actuelle. Ce qui est construit à la place (§21) : l'IA prépare la fiche d'appel, un humain appelle et saisit le résultat. C'est le comportement réaliste d'un outil de collections qui n'a pas encore d'agent vocal, pas un pis-aller honteux.

## 23. Agent Négociateur — rendu réel (2026-09-15)

Écart comblé : les réponses clients du scénario initial (Cosmétiques du Sud, BTP Rif Construction) restent pré-écrites dans le seed (ce sont des données d'amorçage, comme les relances initiales) — mais **toute nouvelle réponse passe maintenant par un vrai appel à Claude**.

- **Route** `/api/replies/classify` : reçoit le texte d'une réponse client, appelle Claude (format JSON strict), classe l'intention (DEMANDE_DELAI / CONTESTATION / CONFIRMATION / AUTRE), résume, propose une action — avec des règles différentes par intention (ex. jamais de relance automatique en cas de contestation).
- **UI** : un lien "Simuler une réponse client (test de l'agent Négociateur)" apparaît dans le panneau de détail pour tout dossier sans réponse en attente — permet de taper une réponse fictive en direct pendant une démo et de voir l'agent la traiter en temps réel, plutôt que de se limiter aux 2 cas pré-chargés. C'est aussi la réponse au point "next steps" évoqué plus tôt (simulateur de réponse en direct, plus impressionnant qu'un scénario figé).
- **Testé en direct** : réponse simulée "c'est payé, viré hier par virement" → classée correctement en **Confirmation de paiement**, résumé exact, action proposée cohérente (suspendre les relances, vérifier sous 3-5 jours ouvrables).

**Bilan mis à jour sur les 3 agents** : Rédacteur ✅ réel, Analyste ⚠️ formule de calcul (assumé, pas un mensonge), Négociateur ✅ réel désormais. Les 3 briques automatisées du workflow sont maintenant soit de la vraie IA générative, soit une règle métier explicite et assumée comme telle — plus d'écart caché entre le discours et le code.

## 24. Restructuration UX — d'un tableau de bord à un agent qui travaille (2026-09-15)

Retour direct de l'utilisateur : la démo "sonne comme un tableau de bord, pas comme un agent qui exécute des tâches." Il a pointé l'interface de l'autre projet sur cette machine (NAIOM / Léa, `localhost:3000/agents/createur-contenu`) comme repère : l'agent y est présenté comme une collègue — avatar, statut "En ligne", rôle, ce qu'elle sait faire — avant même d'entrer dans le chat. Vision produit VELOS IA rappelée à cette occasion : une plateforme d'affichage (SaaS) + un orchestrateur d'agents IA + des agents qui exécutent des workflows de A à Z, pas juste des boutons qui appellent une API.

**Deux changements structurels appliqués :**

### a) Trois écrans au lieu d'un, logique d'entonnoir par niveau de criticité
- **`/` (Cockpit)** : carte de présentation de l'agent (voir c), KPI, puis un **entonnoir cliquable** en 4 niveaux — Relance automatique → Appel humain requis → Réponse client à traiter → Urgent/plafond légal — chacun menant à la liste filtrée correspondante. Termine par le fil d'activité global.
- **`/dossiers?stage=...`** : liste des dossiers filtrée par niveau (composant `DossierCards`), avec un fil d'Ariane vers le Cockpit.
- **`/dossiers/[id]`** : écran dédié à un dossier (composant `DossierDetail`) — plus un panneau latéral étriqué, un écran plein qui rassemble raisonnement, réponse client, action recommandée, et le journal d'activité propre à ce dossier.
- Logique de décision (`computeNextAction`) et mapping DB→UI (`buildWorklistItem`) factorisés dans `src/lib/` pour être partagés par les 3 écrans sans dupliquer le code.

### b) Un fil d'activité unifié (`src/lib/activity.ts` + `ActivityFeed.tsx`)
Reconstitue un journal chronologique à partir des relances, fiches d'appel et réponses classées (pas de nouvelle table — recomposé à la volée). Affiché en global sur le Cockpit et par dossier sur l'écran détail, avec icônes et "il y a X jours" — c'est ce qui donne la sensation d'un agent qui travaille en continu, pas d'un tableau statique qu'on interroge.

### c) Agent personnifié — "Yasmine"
Inspiré directement de la carte de présentation de Léa (NAIOM) : `AgentProfileCard.tsx` affiche un avatar (initiale sur dégradé indigo→violet — pas d'illustration custom, à améliorer plus tard si besoin), un statut "En ligne", un rôle ("Agent recouvrement — CASH"), un nom ("Yasmine"), et une description d'une ligne. Le nom infuse le reste des textes (raisonnement, journal, états de chargement — "Yasmine rédige…", "Yasmine prépare la fiche…") pour une expérience cohérente de bout en bout plutôt qu'un mélange de "l'agent" impersonnel et de boutons.
**Nom provisoire** — facile à changer si l'utilisateur préfère un autre prénom ou un nom lié à la marque.

### d) Logo
Correction demandée : la ligne reliant le nœud haut-droit au nœud bas était en violet sur fond indigo (mauvaise lecture de la charte) — repassée en blanc comme les deux autres lignes. Seul le nœud bas reste violet (l'accent signature).

**Fichier supprimé** : `src/components/Worklist.tsx` (l'ancien écran unique), remplacé par `DossierCards.tsx` + `DossierDetail.tsx` + `Funnel.tsx` + `AgentProfileCard.tsx` + `ActivityFeed.tsx` + `AppHeader.tsx`.

**Vérifié en direct** : navigation Cockpit → niveau "Urgent/plafond légal" → dossier Meknès Industrie, journal d'activité du dossier complet et cohérent (7 événements, du plus récent au plus ancien), aucune erreur serveur.

## 25. Page de présentation (accueil) — inspirée de la page Léa de NAIOM (2026-09-15)

Demande : une page de présentation de l'agent, comme la page d'accueil de Léa (créateur de contenu) sur NAIOM. Structure retenue :
- **`/` devient la page de présentation** (nouvelle page d'accueil/vitrine) : avatar large, statut "En ligne", rôle "Agent recouvrement — CASH · VELOS IA", nom "Yasmine" en grand, accroche + paragraphe de vente (marché marocain, plafond légal, travail 24/7), **3 chiffres calculés en direct depuis les vraies données** (dossiers sous gestion, MAD en retard suivis, actions menées), 4 cartes "Ce qu'elle sait faire" (Analyse & priorise / Rédige les relances / Prépare les appels / Traite les réponses), et un bouton d'appel à l'action "Voir Yasmine au travail →".
- **Le Cockpit opérationnel déménage vers `/cockpit`** (ex-`/`). Le logo dans l'en-tête (`AppHeader`) pointe maintenant vers `/cockpit` (raccourci "retour à l'app" depuis n'importe quel écran), la page de présentation reste la vraie page d'accueil.
- Fil d'Ariane mis à jour partout : Yasmine (présentation) → Cockpit → Dossiers → [Client].
- Composant `AgentProfileCard.tsx` (la petite carte utilisée provisoirement sur le Cockpit) supprimé — remplacé par cette page dédiée, plus complète.

**Usage pour la démo commerciale** : cette page est maintenant le point d'entrée naturel — elle sert le temps 1+2 du script de démo (§15a, douleur/promesse) avant de cliquer vers le Cockpit pour la preuve en action (temps 3).

## 26. "Je ne vois pas d'agentique" — passer du log simulé à une vraie action (2026-09-15)

Retour direct : contrairement aux agents NAIOM (qui produisent un livrable concret après un plan validé), cliquer "Envoyer" chez nous n'écrivait qu'une ligne en base — aucune action réelle ne se produisait dans le monde. Corrigé sans casser la contrainte "0€" :

- **`src/lib/deeplinks.ts`** : construit une vraie URL `mailto:` (avec objet + corps extraits du brouillon) et une vraie URL `wa.me` (WhatsApp, message prérempli), plus un lien `tel:` pour l'appel.
- **`DossierDetail.tsx`** : au clic sur "Envoyer", le vrai outil s'ouvre (messagerie ou WhatsApp) avec le message de Yasmine déjà écrit dedans — l'humain n'a plus qu'à cliquer envoyer dans son propre outil. Le log en base (traçabilité) continue en parallèle. Le bouton "Appeler maintenant" sur la fiche d'appel ouvre un vrai lien `tel:`.
- **Important technique** : l'ouverture doit se faire de façon synchrone dans le gestionnaire de clic (avant tout `await`), sinon le navigateur bloque le pop-up. Vérifié : dans les tests automatisés (clics simulés par l'assistant), le navigateur bloque volontairement le pop-up ("popups open only from the user's own clicks") — c'est attendu et confirme que le mécanisme est correctement déclenché ; avec un vrai clic humain, WhatsApp/la messagerie s'ouvrent normalement.
- **Limite assumée** : les numéros/emails du scénario démo sont fictifs (domaines inventés) — l'ouverture de la messagerie/WhatsApp fonctionne quand même (c'est le comportement du navigateur/téléphone qui s'ouvre, pas une vérification que le destinataire existe). Avec le pilote réel (vrais contacts), ça enverra pour de vrai.

**Reste un écart avec le modèle NAIOM** (plan proposé → validation → livrable produit) : notre flux est "génère → modifie → ouvre le vrai canal", en une étape, pas un plan explicite validé avant exécution. Pas corrigé pour l'instant — à évaluer si l'utilisateur le demande explicitement, ce serait un changement de UX plus lourd (étape de plan visible avant génération).

## 29. Refonte majeure — PROJECT_CHARTER_AND_FUNCTIONAL_SPECIFICATIONS.md (2026-09-16)

L'utilisateur a fourni un document de cadrage complet ("AI Collections Platform") après avoir explicitement demandé un travail de spec avant de continuer à coder. C'est le document de référence désormais — **toute décision produit doit s'y référer en premier**, avant d'improviser. Fichier reçu dans la conversation, pas encore committé dans le repo en tant que tel (à demander à l'utilisateur de fournir le .md si on veut le committer).

### Ce qui a été reconstruit pour s'aligner

**Moteur métier** (`src/lib/workflow.ts`, réécrit) :
- **6 playbooks officiels par ancienneté** (§10) : PRE_DUE (avant échéance, rappel préventif) → EARLY (0-30j) → STANDARD (31-60j) → INTENSIVE (61-90j, appel + escalade commerciale) → PRE_LEGAL (91-120j, validation obligatoire) → LEGAL_TRANSFER (120j+, transmission avocat). `daysOverdue` n'est plus clampé à 0 — il peut être négatif pour représenter une facture pas encore échue.
- **Règles Human-in-the-loop explicites** (§11), Niveau d'autonomie 2 "Semi-Autonome" retenu pour le MVP (§8) : chaque action porte un flag `requiresValidation` — vrai si montant > 100 000 MAD (`HITL_AMOUNT_THRESHOLD_MAD`, configurable à terme), client stratégique, ou playbook ≥ INTENSIVE. Les actions standard (early/standard, montant normal) s'exécutent **sans** validation — testé en direct sur le pilotage automatique, qui ne traite plus que les dossiers non sensibles.
- **Promise to Pay** : nouveau modèle Prisma dédié (`PromiseToPay` : amountMad, promisedDate, status EN_COURS/TENUE/ROMPUE, source APPEL/REPONSE/MANUEL). Créé automatiquement quand un appel se conclut par une promesse de paiement. Une promesse en cours et non échue met le dossier en pause (`WAIT_PROMISE`) ; une promesse échue et non tenue déclenche un appel de relance.

**Scores** (`src/lib/scoring.ts`, étendu) — les 6 scores du §14, formules déterministes (pas de ML, comme demandé) : Collection Score (score existant, sert à la priorité), Risk Score, Payment Probability Score, Promise Reliability Score (basé sur l'historique tenue/rompue), Customer Health Score, Cash Impact Score.

**7 agents nommés** (`src/lib/agents.ts`, nouveau) : Portfolio Intelligence Analyst, Collection Strategist, Communication Specialist, Promise To Pay Manager, Dispute Specialist, Cash Forecast Analyst, Collection Supervisor — exactement la liste du §7. "Yas" reste le visage unique sur les écrans du quotidien (décision produit : garder ce qui marchait plutôt que de tout réinventer), mais chaque action porte maintenant un badge d'attribution au bon spécialiste (§3 des specs techniques, "badge explicatif"), visible dans le fil d'activité et sur la Collection Case.

**Écrans reconstruits/ajoutés** (§12), tous vérifiés en direct sans erreur serveur :
- **`/` Présentation** — inchangée (vitrine de vente).
- **`/cockpit` = Action Center (§02)** — reconstruite comme une to-do list ("Voici les N actions prioritaires pour sécuriser X MAD aujourd'hui", `PriorityActions.tsx`), plus le pilotage automatique et les Work Queues. Le KPI dashboard analytique en a été retiré (déplacé).
- **`/dashboard` = Executive Dashboard (§01)**, nouvelle page — KPI + répartition du portefeuille par playbook + scores moyens.
- **`/dossiers` = Work Queues (§03)**, recalibré sur les vraies catégories du spec : Urgent Cases, High Value, Promises Due, Strategic Accounts, Disputes, Pending Validation (`WorkQueues.tsx`, remplace l'ancien `Funnel.tsx` supprimé). Un dossier peut apparaître dans plusieurs files (pas de catégories exclusives).
- **`/dossiers/[id]` = Collection Case (§06)** — `ClassificationCard.tsx` enrichie : détail des 4 critères du Collection Score + les 5 scores complémentaires + playbook affiché + attribution par spécialiste + gate de validation conditionné à `requiresValidation` (plus systématique comme avant).
- **`/forecast` = Cash Forecast (§08)**, nouvelle page — projections J+7/30/60/90, formule déterministe (`src/lib/forecast.ts`) : promesses de paiement en priorité, sinon horizon typique par playbook pondéré par Payment Probability Score.
- **`/agents` = Agent Hub (§07)**, nouvelle page — les 7 agents avec rôle, responsabilité, et un compteur d'activité en direct par agent.
- **Non construits pour l'instant** : 04 Portfolio (grille complète), 05 Customer 360, 09 Team Performance, 10 Administration. Pas dans ce lot — à faire dans une prochaine passe.

**Scénario démo enrichi** (`prisma/seed.ts`) : 7ème client "Rabat Textile Export" ajouté pour incarner le playbook PRE_DUE (facture pas encore échue) ; une promesse de paiement ajoutée sur Cosmétiques du Sud pour peupler "Promises Due".

### Reste à faire pour coller pleinement au cahier des charges

1. **Import Excel/CSV de balance âgée** (§1 des specs techniques, première étape du scénario "effet wow" du §17) — **pas encore construit**, c'est le morceau le plus significatif qui manque. Nécessite un parseur (ex. lib `xlsx`), un mapping de colonnes auto/guidé, et un écran d'import.
2. **Customer 360** (§05) — vue agrégée par client (toutes ses factures, historique complet) — pas construite, actuellement tout est raisonné à l'échelle d'une facture.
3. **Portfolio** (§04) — grille complète type Growfin, triable/filtrable — pas construite (les Work Queues en tiennent lieu partiellement).
4. **Team Performance** (§09) et **Administration** (§10) — non construits, priorité basse pour un POC.
5. Le seuil `HITL_AMOUNT_THRESHOLD_MAD` est en dur dans le code — l'Administration (§10) devrait le rendre configurable par l'utilisateur.

**Checklist §18 du cahier des charges — 13/15 couverts** : Import Excel ❌, Analyse IA ✅, Work Queues ✅, Priorisation IA ✅, Customer 360 ❌, Collection Case ✅, Emails ✅, WhatsApp ✅, Promesses ✅, Cash Forecasting ✅, Human In The Loop ✅, Agent Hub ✅, Dashboard exécutif ✅, Traçabilité ✅, Architecture multi-agents ✅.

## 30. Import Excel/CSV + Customer 360 (2026-09-16)

Les deux derniers items de la checklist §18, construits dans la foulée.

**Import** (`src/lib/importParsing.ts`, `ImportWizard.tsx`, `/import`, `POST /api/import/commit`) :
- Parsing côté navigateur pour l'aperçu instantané ("Analyse instantanée", §17). Mapping de colonnes auto-deviné par mots-clés (français/anglais), éditable via menus déroulants avant import, avec validation ligne par ligne (lignes en erreur affichées mais ignorées, pas d'échec global).
- **Bug trouvé et corrigé pendant le développement** : la librairie `xlsx` interprète les dates ambiguës d'un CSV en anglais (mm/jj/aaaa) — "01/06/2026" devenait le 6 janvier au lieu du 1er juin, même sans l'option `cellDates`. Corrigé en écrivant un parseur CSV maison (gère guillemets, virgules dans les champs, détection auto du séparateur `,` vs `;`) utilisé pour les `.csv` ; `xlsx` reste utilisé uniquement pour les vrais binaires `.xlsx`/`.xls`, où les dates sont des numéros de série Excel non ambigus. **Vérifié par un script de test isolé** (pas juste supposé corrigé) avant de committer.
- `POST /api/import/commit` : retrouve un client existant par nom exact ou en crée un nouveau (avec des valeurs par défaut raisonnables — `behaviorNote` signale explicitement "importé, historique non disponible"), crée les factures, idempotent sur (client, référence) pour permettre un ré-import sans doublons.

**Customer 360** (`/customers`, `/customers/[id]`) : liste agrégée par client (montant en cours, Customer Health Score moyen, badge "Attention requise") et fiche complète (toutes les factures du client, historique fusionné toutes factures confondues, scores moyens). Lien ajouté depuis la Collection Case ("Voir la fiche client complète →").

**Checklist §18 — 15/15 désormais couverts.** Écrans encore non construits (hors checklist stricte, priorité basse) : 04 Portfolio (grille complète type Growfin — les Work Queues en tiennent lieu partiellement), 09 Team Performance, 10 Administration (le seuil `HITL_AMOUNT_THRESHOLD_MAD` reste en dur dans le code, pas encore configurable via UI).

## 27. "Complètement nul" — retour très négatif après test réel, refonte (2026-09-15)

L'utilisateur a testé la version avec l'entonnoir (cartes) et l'action réelle (mailto/wa.me) et l'a jugée "complètement nulle" — signal qu'un patch de plus ne suffirait pas. Clarifié par questions ciblées :
1. Version bien testée (confirmé), donc le problème n'était pas un cache.
2. "Action concrète" = **pilotage automatique du dossier** (option choisie explicitement) : Yasmine doit enchaîner plusieurs actions sans qu'on reclique à chaque étape — pas juste "génère un message, ouvre un lien".
3. "Entonnoir" = pas assez guidé/visuel — les 4 cartes côte à côte ne suffisaient pas, il fallait une vraie forme d'entonnoir.

### Ce qui a été construit en réponse

**a) Pilotage automatique du portefeuille** (`PortfolioAutopilot.tsx` + `POST /api/portfolio/run`) : un bouton unique sur le Cockpit — "Lancer Yasmine sur le portefeuille" — qui traite **d'affilée tous les dossiers ayant une relance email/WhatsApp due**, sans ouvrir chaque dossier un par un. Chaque dossier est réellement passé à l'agent (vrai appel Claude via `generateReminderDraft`, factorisé dans `src/lib/agentDraft.ts` pour être partagé entre le flux unitaire et le flux batch), le résultat est journalisé (traçabilité), et la liste des dossiers traités s'affiche avec un extrait du message généré. **Testé en direct** : 3 dossiers traités en une seule action (Tanger Fournitures, Groupe Al Amal, Atlas Négoce), contenu réellement généré par Claude pour chacun, fil d'activité mis à jour avec les 3 nouvelles entrées. C'est la vraie réponse à "action concrète" : plusieurs tâches exécutées par un seul déclenchement, comme un agent qui travaille, pas un formulaire qu'on remplit dossier par dossier.

**b) Entonnoir visuel réel** (`Funnel.tsx` refondu) : 4 segments en forme de trapèze empilés (CSS `clip-path`), qui se rétrécissent du haut (large, "Relance automatique") vers le bas (étroit, "Urgent / plafond légal") — une vraie silhouette d'entonnoir, pas des cartes côte à côte. Le rétrécissement est esthétique (largeurs fixes 100/78/56/36%), le compte réel de chaque niveau s'affiche en chiffre dans le segment. Chaque segment reste cliquable vers `/dossiers?stage=...`.

**c) Petit fix qualité** : le prompt de génération laissait parfois passer du markdown (`**gras**`) dans le texte d'un email — inapproprié pour un message censé être fini/prêt à envoyer. Règle ajoutée : "texte brut, pas de markdown."

**d) Fix technique seed** : `prisma.callTask.deleteMany()` manquait dans le script de seed (ajouté après le modèle CallTask) — provoquait une erreur de contrainte de clé étrangère au reseed. Corrigé.

**Encore non fait, à évaluer si demandé** : un "plan" multi-étapes visible par dossier avant exécution (comme Léa qui propose un plan puis livre) — actuellement le pilotage automatique exécute directement l'étape due, sans écran de plan intermédiaire à valider. Le pilotage automatique répond à "moins de clics, plus d'exécution groupée", pas encore à "voir le raisonnement complet avant que ça parte".

## 28. Retour "aucune réponse à mes attentes" → demande de prérequis, puis nouvelles specs concrètes (2026-09-15)

Face à un nouveau retour négatif, l'utilisateur a explicitement demandé qu'on fasse un travail de spécification métier avant de continuer à coder à l'aveugle — proposition acceptée mais reportée ("on fera ça dans un second temps"). En attendant, il a donné des specs concrètes pour finir ce premier POC :

1. **Renommer l'agent** : Yasmine → **Yas** (appliqué partout : UI, prompts, activité, présentation).
2. **Onglets cliquables** pour naviguer dans la démo, avec compréhension claire des niveaux.
3. **Validation humaine du niveau AVANT l'action de l'agent** (pas seulement avant l'envoi du message généré).
4. **Canaux** confirmés : WhatsApp, email, appel téléphonique (déjà couverts).
5. **Tons visibles selon le cas** (amical/ferme/dernier avertissement) — déjà modélisés, à rendre visibles explicitement.
6. **Transparence de classification** : voir comment chaque créance a été classée, selon quels critères, pour comprendre l'approche recommandée (canal + ton).
7. **Rajouter l'agent Négociation** dans cette logique de transparence si pertinent.

### Construit en réponse

- **`src/lib/scoring.ts`** : `computeRiskScore` retourne maintenant un `breakdown` détaillé (4 critères : ancienneté du retard, montant, relances déjà envoyées, silence prolongé — chacun avec sa valeur observée et ses points sur le total).
- **`src/lib/workflow.ts`** : chaque branche `EMAIL`/`WHATSAPP` de `computeNextAction` porte désormais un `reason` explicite (pourquoi ce canal, pourquoi ce ton) — avant, seul `CALL_TASK` en avait un.
- **`ClassificationCard.tsx`** (nouveau) : affiche le détail des critères de l'Agent Analyste (barres de progression par critère), l'analyse de l'Agent Négociateur quand une réponse existe, la recommandation canal+ton de Yas avec sa justification, et **un bouton "✓ Valider cette approche avant que Yas agisse"** — les contrôles d'action (générer/appeler) restent masqués tant que ce n'est pas cliqué.
- **`TabbedDossierList.tsx`** (nouveau) : remplace le filtrage par page/query-param sur `/dossiers` par de vrais **onglets cliquables côté client** (Tous / Relance automatique / Appel requis / Réponse à traiter / Urgent), bascule instantanée sans rechargement.
- **Testé en direct** : dossier Meknès Industrie → classification affichée (73/100, Urgent, détail des 4 critères) → recommandation "Email, dernier avertissement" avec justification → clic sur Valider → contrôle "Générer un email" apparaît alors seulement.

### Incident technique découvert et corrigé pendant cette session

Le script PowerShell de renommage en masse (Yasmine→Yas, tour précédent) a silencieusement **corrompu `src/app/dossiers/[id]/page.tsx`** : une erreur `Get-Content -Raw` sur un fichier a laissé la variable `$content` de l'itération précédente (celle du Cockpit) dans la boucle, qui a alors été écrite par erreur dans le fichier de la page détail — remplaçant le rendu du dossier par une copie du Cockpit. Resté invisible jusqu'à ce qu'on teste spécifiquement l'ouverture d'un dossier après le renommage. **Corrigé** en récrivant le fichier correctement. Leçon retenue : après un script de remplacement en masse via boucle PowerShell, vérifier qu'aucune erreur silencieuse n'a permis une réutilisation de variable entre fichiers — un `grep` de contenu croisé (comme celui fait ici avec "Pilotage automatique") est un bon filet de sécurité rapide.

## 31. Paramètres, Portefeuille, Performance équipe + guide de navigation — checklist 15/15 vraiment complète (2026-09-16)

Suite logique du §30 : les 3 derniers écrans de la spec manquaient (04 Portfolio, 09 Team Performance, 10 Administration). Demande utilisateur : "rajoute les 3 écrans qui manquent et trouve-leur un nom français clair et autoporteur", puis en cours de route : "sur la page d'accueil, explique la logique des différents onglets et leur articulation".

**Noms retenus** : **Portefeuille** (04), **Performance équipe** (09), **Paramètres** (10).

### a) Paramètres — rendu réellement fonctionnel, pas juste un formulaire décoratif

Point de vigilance explicite de l'utilisateur tout au long du projet : ne jamais construire un écran qui a l'air de faire quelque chose sans réellement changer le comportement du moteur. Donc :

- **Nouveau modèle `Settings`** (Prisma, ligne singleton `id: "singleton"`) : `hitlAmountThreshold`, `earlyMaxDays`, `standardMaxDays`, `intensiveMaxDays`, `preLegalMaxDays`.
- **`src/lib/settings.ts`** : `getSettings()` avec upsert-on-read (crée la ligne par défaut si absente : 100 000 MAD / 30 / 60 / 90 / 120 jours).
- **Refactor de fond dans `workflow.ts` et `scoring.ts`** : les anciennes constantes en dur `HITL_AMOUNT_THRESHOLD_MAD` et `LEGAL_CEILING_DAYS` ont été supprimées et remplacées par un objet `PlaybookThresholds` (défaut `DEFAULT_THRESHOLDS`) passé en paramètre à `computePlaybook`, `computeNextAction`, `computeRiskScore`, `computeExtendedScores`. `buildWorklistItem(invoice, thresholds)` fait circuler cet objet vers tout le pipeline de scoring. Toutes les pages qui appellent `buildWorklistItem` chargent désormais `getSettings()` en parallèle (`Promise.all`) de la requête Prisma.
- **`POST /api/settings/update`** : valide (nombres positifs, jours strictement croissants precoce < standard < intensif < pré-contentieux) puis upsert.
- **`SettingsForm.tsx`** (client) : formulaire numérique simple, `router.refresh()` après sauvegarde.
- **Testé en direct** : seuil de validation abaissé de 100 000 à 10 000 MAD via le formulaire → immédiatement après, Atlas Négoce (18 000 MAD) passe de "pas de validation" à **"Validation requise"** sur `/dossiers` et `/cockpit`. Confirme que le réglage agit réellement sur tout le moteur de décision, partout, sans redémarrage. Remis à 100 000 (valeur par défaut) après le test, via `POST /api/settings/update`.

**Régression introduite puis corrigée dans le même tour** : `WorkQueues.tsx` importait encore l'ancienne constante `HITL_AMOUNT_THRESHOLD_MAD` supprimée pendant ce refactor (utilisée pour la file "High Value") — cassait la compilation de `/dossiers` et `/cockpit`. Corrigé en transformant `WORK_QUEUES` (tableau statique) en `getWorkQueues(hitlAmountThreshold)` (fonction), et en propageant `settings.hitlAmountThreshold` en prop jusqu'à `WorkQueueGrid` et `TabbedDossierList`. Un `grep` sur tout `src/` après coup a confirmé qu'aucune autre référence aux constantes supprimées ne subsistait.

### b) Portefeuille (`/portfolio`, `PortfolioTable.tsx`)

Grille exhaustive de toutes les factures, triable par colonne (client, montant, retard, score) et filtrable par recherche texte (client ou référence) — en complément des Work Queues (qui, elles, segmentent par situation). Répond au besoin "chercher un dossier précis" ou "vue d'ensemble triable" à la Growfin.

### c) Performance équipe (`/team`)

Pendant humain de l'Agent Hub : KPIs agrégés sur ce que l'**équipe** (pas Yas) a traité — actions humaines réalisées, appels traités, fiabilité des promesses obtenues (% tenues vs rompues), montant sécurisé, montant en attente de validation humaine, répartition des résultats d'appel. Explicitement noté dans l'UI : vue agrégée pour ce POC, pas de suivi nominatif par collaborateur (pas de notion de compte utilisateur dans ce POC).

### d) Guide de navigation sur la page d'accueil (`page.tsx`, section "Comment se repérer dans l'application")

Liste des 10 écrans (Importer → Executive Dashboard 01 → Action Center 02 → Work Queues 03 → Portefeuille 04 → Customer 360 05 → Cash Forecast 08 → Agent Hub 07 → Performance équipe 09 → Paramètres 10), chacun avec icône, tag de positionnement ("point de départ", "vue la plus large", "le cœur de l'appli"...), description courte, et une ligne explicite d'articulation vers l'écran suivant (ex. "Se met à jour dès qu'une promesse ou un paiement change de statut" pour Cash Forecast). Répond directement à la demande "qu'on comprenne l'articulation entre onglets / complémentarités".

### e) Navigation réordonnée

`AppHeader.tsx` : ordre du plus général (vue globale du portefeuille) au plus particulier (le système lui-même), suivant la séquence réelle du workflow — Importer → Dashboard → Action Center → Work Queues → Portefeuille → Customer 360 → Cash Forecast → Agent Hub → Performance équipe → Paramètres.

**Checklist §18 — désormais réellement 15/15**, plus les 3 écrans complémentaires (04/09/10) qui n'étaient pas dans la checklist stricte mais faisaient partie des 10 écrans numérotés de la spec. Tous les 10 écrans numérotés (01 à 10, sans 06 qui n'a jamais été spécifié comme un écran distinct) + Importer sont construits et fonctionnels.

## 32. Refonte visuelle "premium épuré" — suppression des émoticones, harmonisation des noms d'onglets (2026-09-16)

Retour utilisateur : "les noms des onglets à revoir en français, pour harmoniser ; j'aime pas les émoticones... ça fait écolier, le design doit être high level, premium et épuré". Puis un deuxième retour ciblé : "j'ai du mal à comprendre la logique de l'onglet performance équipe... l'objectif c'est de traiter 90% des cas par IA" et "le nom files de travail est mal choisi et pas autoporteur".

**Renommage complet en français harmonisé** : Executive Dashboard → Tableau de bord, Action Center → Centre d'action, Work Queues → **Dossiers par priorité** (renommé une deuxième fois après le premier passage "Files de travail", jugé pas assez autoporteur), Customer 360 → Vue client 360, Cash Forecast → Prévisions de trésorerie, Agent Hub → Agents IA, Performance équipe → **Interventions humaines**. Sous-onglets internes de `WorkQueues.tsx` traduits aussi (Urgent, Gros montants, Promesses en cours, Comptes stratégiques, Litiges, En attente de validation).

**Suppression de toutes les émoticones** (icônes de navigation, capacités de l'agent, roster des 7 agents, fil d'activité, actions prioritaires) remplacées par un langage visuel sobre : badges numérotés (guide de navigation), avatars en initiales sur fond dégradé (Agents IA), points de couleur (fil d'activité, actions prioritaires). Symboles typographiques sobres conservés (★ stratégique, ✓ validation, →).

**Recadrage d'Interventions humaines** : l'écran mesurait implicitement une "performance" à maximiser, en contradiction avec le narratif produit (l'IA traite l'essentiel, l'humain ne traite que l'exception). Recadré avec un indicateur en tête de page — "Part du travail traitée par Yas sans intervention humaine" — calculé à partir du vrai fil d'activité (pas illustratif), qui affichait 89% au moment du changement.

## 33. Audit technique complet — deux bugs réels trouvés et corrigés (2026-09-16)

Demande : "Donne moi le lien et fais un audit". Méthode : `tsc --noEmit`, `next build` (build de production complet), `eslint .` sur tout le projet + vérification live des 10 écrans (aucune erreur console).

- **`PriorityActions.tsx`** : erreur de type réelle qui aurait fait échouer `npm run build` — `Array.filter()` ne restreint pas le type du tableau résultant en TypeScript, donc `item.nextAction.kind !== "CALL_TASK"` laissait passer des branches sans propriété `tone`. Corrigé avec `"tone" in item.nextAction`.
- **`PortfolioTable.tsx`** : `SortHeader` était défini comme composant React à l'intérieur du render (anti-pattern qui le recrée à chaque frappe dans la recherche) — flaggé par `eslint` (règle `react-hooks/static-components`). Sorti au niveau module.

Après correction : build, types et lint passent à zéro erreur sur tout le projet. Aucun secret commité (`.env`/`dev.db` bien exclus), clé API configurée.

## 34. Découverte d'un kit de cadrage externe et intégration pragmatique (2026-09-16)

L'utilisateur a fourni deux fichiers (`11-grille-de-recette.md` + `kit-poc-recouvrement-velos.zip`) — un **kit de cadrage complet et beaucoup plus rigoureux** que notre spec de travail (`PROJECT_CHARTER_AND_FUNCTIONAL_SPECIFICATIONS.md`), conçu pour être construit **depuis un dépôt vide**, phase par phase (~13 jours indicatifs), avec validation du plan à chaque étape. Contenu : `CLAUDE.md` + 12 docs (`00-arbitrages` à `11-grille-de-recette`), modèle de données riche (Organization/Company/Debtor/Invoice/Payment/Allocation/BankLine/PaymentPromise/PaymentPlan/Dispute/...), horloge simulée pilotable, validation Zod + retry/repli par agent, garde-fous de contenu (termes interdits, vérification montants/références), 7 "skills" de connaissance métier injectés au runtime, un sous-agent Claude Code `revue-conformite-metier`, 24 débiteurs / 586 factures de données de démo, harnais d'évaluation (`eval:qualification`, cible ≥90%).

**Décision utilisateur** (après discussion sur charge/délai) : ne PAS reconstruire depuis zéro, ne PAS intégrer d'entretiens prospects ni d'étapes de validation métier — "être pragmatique, intégrer directement ce qui manque dans la version actuelle. L'efficacité, la qualité et le delivery priment."

**Intégré dans le POC existant** (commit `454a539`) :
- **Bug critique corrigé** : les 3 prompts d'agents (`agentDraft.ts`, `calls/generate`, `replies/classify`) signaient encore **"Meridian Distribution"**, un nom resté d'une itération antérieure à la marque VELOS IA — jamais visible ailleurs dans l'UI, donc passé inaperçu jusqu'à cet audit. Remplacé par `settings.companyName`/`companySector`, configurables dans Paramètres (permet aussi d'adapter la démo par prospect).
- **Garde-fous de contenu** (`src/lib/contentGuardrails.ts`) : termes interdits + vérification que chaque montant/référence cité dans un message généré existe réellement dans le dossier. Bloque l'auto-envoi du pilotage automatique en cas d'échec (visible dans `PortfolioAutopilot`), affiche un avertissement dans le flux manuel (`DossierDetail`).
- **Horloge de démo simulée** (`Settings.simulatedDate`, `/api/clock/advance`, `ClockControl` dans le bandeau, boutons +1j/+7j) : tous les `Date.now()`/`new Date()` de la logique métier remplacés (9 emplacements à travers `buildWorklistItem.ts`, `agentDraft.ts`, `forecast.ts`, `ActivityFeed.tsx`, et 3 routes API). **Vérifié en direct** : avancer de 7 jours décale tous les jours de retard affichés de +7 partout, et fait basculer Rabat Textile Export de "pré-échéance" à "en retard" — preuve que le moteur lit bien l'horloge simulée de bout en bout.
- **Débiteur public** (`Client.isPublicDebtor`) : nouveau `NextAction` `PUBLIC_DEBTOR_REVIEW`, toujours `requiresValidation: true`, jamais de playbook automatique — rendu dans les 3 écrans concernés.
- **Validation de sortie de l'agent Qualificateur** (`replies/classify`) : `classifiedIntent` vérifié contre l'énumération attendue, repli sur `AUTRE` + lecture humaine forcée si la sortie est invalide.
- **Jeu de données élargi** (7 → 11 clients, 11 factures, 3 promesses) : un débiteur public (Commune Urbaine d'Oujda), un cas `LEGAL_TRANSFER` à 130j+ (Casa Métal Industrie — absent jusqu'ici, aucun cas ne dépassait 112j), un cas standard sans complication (Nord Plast Emballages), et une promesse rompue + une promesse tenue (Rif Agro Export / Cosmétiques du Sud) pour que "Fiabilité des promesses" ne soit plus vide sur Interventions humaines (passé de "—" à 50%, un chiffre crédible plutôt qu'un 0% qui aurait mal joué en démo).
- **Sous-agent `revue-conformite-metier`** adapté (`.claude/agents/` à la racine du projet) — checklist de conformité (pas de constante métier en dur, usage de l'horloge simulée, garde-fous de contenu, niveau de validation jamais abaissé par un agent) référencée sur nos fichiers réels plutôt que ceux du kit. Pas invocable depuis la session de travail en cours (répertoire racine différent) — disponible à la prochaine ouverture de Claude Code sur ce projet.

**Délibérément non repris du kit**, effort jugé disproportionné pour ce stade du POC : rapprochement bancaire (lettrage), validation Zod stricte par agent avec retry/repli formalisé, authentification par rôle, harnais d'évaluation formel (`eval:qualification`), structure multi-société (cabinets comptables — hors périmètre V1, voir §1bis de ce fichier).

Vérifié après intégration : `tsc --noEmit`, `eslint .`, `npm run build` passent tous à zéro erreur ; test en direct du garde-fou (message généré signé "Anfa Distribution SARL", confirmé via lecture du textarea), de l'horloge simulée, du badge débiteur public, du cas transmission avocat.
