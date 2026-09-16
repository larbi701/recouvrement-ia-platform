# PROJECT_CHARTER_AND_FUNCTIONAL_SPECIFICATIONS.md

> Document de cadrage fourni par l'utilisateur le 2026-09-16. Référence produit
> prioritaire — toute décision doit s'y référer avant d'improviser. Voir
> MEMOIRE-PROJET.md §29 pour le mapping vers l'implémentation.

## 1. EXECUTIVE SUMMARY

**Nom du projet** : AI Collections Platform

**Vision** : Construire une plateforme SaaS de recouvrement B2B augmentée par IA
permettant aux entreprises de transformer automatiquement leur portefeuille de
créances en plan d'action opérationnel maximisant les encaissements.

La plateforme doit combiner : Intelligence artificielle, Automatisation, Human In
The Loop, Expérience utilisateur ultra-simple.

L'objectif est de donner l'impression qu'une équipe d'employés IA spécialisés
travaille aux côtés des équipes humaines.

## 2. POSITIONNEMENT PRODUIT

**Marché cible** : Phase 1 PME Maroc · Phase 2 ETI Maroc · Phase 3 Afrique
Francophone · Phase 4 Europe.

**Inclus** : gestion créances clients B2B, recouvrement amiable, relances,
gestion des promesses de paiement, pré-contentieux, cash forecasting, pilotage
portefeuille, recommandations IA.

**Exclus** : procédures judiciaires, contentieux, saisies, gestion des avocats.
La plateforme s'arrête à : transmission du dossier à un avocat.

## 3. PRINCIPES FONDATEURS

- **AI FIRST** — l'utilisateur ne doit jamais chercher quoi faire ; la plateforme
  propose automatiquement priorités, actions, messages, opportunités
  d'encaissement.
- **HUMAN IN THE LOOP** — l'IA agit, l'humain décide pour les actions sensibles.
- **ACTION ORIENTED UX** — chaque écran doit répondre à "Que dois-je faire
  maintenant ?"
- **DIGITAL WORKFORCE** — les agents IA sont conçus comme des collaborateurs
  autonomes : rôle, responsabilités, objectif, mémoire, KPI, workflows. Ils
  collaborent entre eux.

## 4. CONTEXTE MAROCAIN

Workflows compatibles avec les usages du recouvrement B2B au Maroc et les
encadrements légaux applicables. Délais de référence : 60 jours par défaut,
jusqu'à 120 jours si délai conventionnel prévu contractuellement. Sources :
soustraitant.ma/juridique, upsilon-consulting.com/delais-de-paiement-au-maroc.
L'approche doit rester configurable (délais, règles, seuils, stratégies de
relance par client).

## 5. VISION DU PRODUIT

Transformer : Balance âgée + Emails + ERP + Excel
en : Plan d'action intelligent + Équipe IA autonome + Prévision d'encaissement +
Exécution immédiate.

## 6. PERSONAS

CEO (piloter le cash) · DAF (piloter les créances) · Credit Manager (piloter la
stratégie) · Chargé de Recouvrement (exécuter les actions) · Commercial
(préserver la relation client).

## 7. ORGANISATION HYBRIDE

**Employés humains** : CEO, DAF, Credit Manager, Chargé de Recouvrement,
Commercial.

**Employés IA** :
- Portfolio Intelligence Analyst — analyse portefeuille.
- Collection Strategist — choisit la stratégie optimale.
- Communication Specialist — produit les relances.
- Promise To Pay Manager — suit les engagements.
- Dispute Specialist — analyse les litiges.
- Cash Forecast Analyst — prévoit les encaissements.
- Collection Supervisor — contrôle qualité, déclenche Human In The Loop.

## 8. AUTONOMIE DES AGENTS

- Niveau 0 Manuel — IA recommande uniquement.
- Niveau 1 Assisté — IA prépare, humain valide.
- **Niveau 2 Semi-Autonome (mode recommandé pour le MVP)** — IA exécute les
  actions standards, humain valide les actions sensibles.
- Niveau 3 Autonome — IA exécute tous les workflows standards.

## 9. WORKFLOW GLOBAL

Import données → Analyse IA → Scoring → Segmentation → Classification → Choix
playbook → Next Best Action → Validation humaine si nécessaire → Exécution →
Réponse client → Réanalyse IA → Mise à jour portefeuille → Clôture.

## 10. PLAYBOOKS DE RECOUVREMENT

- **PRE-DUE** (avant échéance) — rappel préventif.
- **EARLY COLLECTION** (0-30j après échéance) — Email, WhatsApp, suivi
  automatique.
- **STANDARD COLLECTION** (31-60j) — Email, Téléphone, suivi.
- **INTENSIVE COLLECTION** (61-90j) — Téléphone, Escalade, Commercial.
- **PRE-LEGAL** (91-120j) — Validation humaine, pré-contentieux.
- **LEGAL TRANSFER** (120j+) — Transmission avocat, validation obligatoire.

## 11. HUMAN IN THE LOOP

Validation obligatoire : montant > seuil configurable, client stratégique,
échéancier, remise, litige important, pré-contentieux, transmission avocat.

## 12. ÉCRANS DE L'APPLICATION

01 Executive Dashboard (Comment se porte mon cash ?) · 02 Action Center (Que
dois-je faire aujourd'hui ? — inspiré des Work Queues de Growfin) · 03 Work
Queues (Urgent Cases, High Value, Promises Due, Strategic Accounts, Disputes,
Pending Validation) · 04 Portfolio (inspirée Growfin) · 05 Customer 360 · 06
Collection Case · 07 Agent Hub · 08 Cash Forecast (inspiré HighRadius) · 09 Team
Performance · 10 Administration.

## 13. ACTIONS CONCRÈTES DU MVP

Email (générer et envoyer) · WhatsApp (ouvrir WhatsApp avec message généré) ·
Téléphone (déclencher appel) · Promesse de paiement (créer et suivre) ·
Escalade (Manager, Commercial, DAF, Avocat).

## 14. SCORES IA

Collection Score (priorité de traitement) · Risk Score (risque global) ·
Payment Probability Score (probabilité d'encaissement) · Promise Reliability
Score (fiabilité promesses) · Customer Health Score (santé relationnelle) ·
Cash Impact Score (impact potentiel sur trésorerie).

## 15. CASH FORECASTING

Prévisions J+7 / J+30 / J+60 / J+90, basées sur comportements historiques,
délais réels de paiement, promesses, interactions, scores IA.

## 16. SOURCES DE DONNÉES

ERP : Sage, SAP, Odoo, Dynamics, Cegid. Fichiers : Excel, CSV, PDF, JSON, XML.
Emails : Outlook, Exchange, Gmail. Documents : factures, contrats, BL,
commandes, courriers.

## 17. EFFET WOW OBLIGATOIRE

Scénario de démonstration : Import d'une balance âgée Excel → Analyse
instantanée → Segmentation automatique → Classement des priorités → Prévision
des encaissements → Recommandation IA → Ouverture d'un dossier → Email généré
automatiquement → WhatsApp généré automatiquement → Création d'une promesse de
paiement → Mise à jour immédiate du forecast.

L'utilisateur doit comprendre en moins de 5 minutes : où est son argent, quels
dossiers sont prioritaires, quelles actions réaliser, quel cash peut être
récupéré, pourquoi l'IA recommande ces actions.

## 18. CRITÈRES DE SUCCÈS DU POC

Import Excel fonctionnel · Analyse IA automatique · Work Queues dynamiques ·
Priorisation IA · Customer 360 · Collection Case · Emails générés · WhatsApp
générés · Gestion des promesses · Cash Forecasting · Human In The Loop · Agent
Hub · Dashboard exécutif · Traçabilité complète · Architecture multi-agents
autonome.

## 19. INSTRUCTION FINALE

Concevoir la plateforme comme si elle remplaçait une équipe de recouvrement de
premier niveau. Les agents IA doivent être implémentés comme des collaborateurs
spécialisés collaborant entre eux via un orchestrateur central. S'inspirer
explicitement de Growfin, HighRadius, Sidetrade et YayPay : Work Queues, Action
Center, Customer 360, Collection Playbooks, Next Best Action, Cash Forecasting,
Customer Health Score, Human In The Loop, Collection Strategy Engine, Digital
Workforce.

L'objectif n'est pas de construire un CRM avec IA. L'objectif est de construire
un système intelligent orienté recouvrement et génération de cash avec une
expérience utilisateur exceptionnelle, simple, intuitive et démontrable en
quelques minutes.

---

## Annexe — Spécifications techniques des fonctionnalités clés

**Moteur d'Import & Parsing** (Étape 1 du workflow) : parser robuste pour les
fichiers Excel/CSV de balance âgée (mapping automatique ou semi-guidé des
colonnes : Nom Client, Numéro Facture, Date d'émission, Date d'échéance,
Montant TTC, Statut).

**Génération WhatsApp & Canaux** : pour WhatsApp, génération dynamique de liens
URL universels pré-formatés (`https://wa.me/[numero]?text=[message_genere]`)
permettant d'ouvrir l'application en un clic depuis l'Action Center. Pour
l'email, pré-remplir un encart d'édition modifiable avec un bouton "Envoyer
(Simulation API)".

**Moteur de Scoring & Forecast** : formules déterministes basées sur les jours
de retard (Aging Days) et l'historique pour simuler instantanément les scores
(Risk Score, Payment Probability) et alimenter le Cash Forecasting à
J+7/30/60/90, sans lourdeur de machine learning au démarrage.

**UX / UI — Effet Wow** : Action Center en page d'accueil — jamais un tableau
de bord analytique complexe, une "To-Do List intelligente" dictée par l'IA
("Voici les 3 actions prioritaires pour sécuriser 120 000 MAD aujourd'hui").
Traçabilité et transparence : chaque action/recommandation d'un agent affiche
un badge explicatif (ex. "Suggéré par Collection Strategist — Risque de
dépassement de 60 jours").
