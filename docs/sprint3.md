# FixMyCar — Sprint 3 (final) — 13 juillet au 2 août 2026

**But :** en tant que client, je peux consulter l'historique de mon véhicule, obtenir ma facture et la payer ; et surtout, le **prototype complet est intégré de bout en bout, testé et déployé** — de la création de compte au paiement.

## 1. État d'entrée — implémentation à la fin du Sprint 2

| Statut | Fonctionnalités |
|---|---|
| ✅ Terminé (S1) | #2 Véhicules · #3 Rendez-vous · #4 Demande de réparation |
| ✅ Terminé (S2) | #5 État des réparations · #6 Diagnostics · #7 Interventions · #9 Types de réparations |
| 🔧 En cours (à reprendre) | #1 Comptes utilisateurs (report S1) · #8 Utilisateurs & rôles (report S2) · #10 Affectations (report S2) |
| ⬜ Non commencé | #11 à #18 |

## 2. Reprise prioritaire — dette des sprints 1-2 (à finir AVANT tout nouveau développement)

| Issue | Story | USP | Effort (finalisation) | Responsable |
|---|---|---|---|---|
| #1 | Finaliser la gestion des comptes utilisateurs | 8 | ~4 h | **AN** |
| #8 | Finaliser la gestion des utilisateurs et rôles | 8 | ~4 h | **AN** |
| #10 | Finaliser l'affectation des réparations aux mécaniciens | 8 | 4 h | **GAM** |
| **Sous-total reprise** | | **(24)** | **~12 h** | |

## 3. Nouveau développement — portée ajustée (cœur facturation)

| Issue | Story | USP | Effort | Responsable |
|---|---|---|---|---|
| #11 | Consulter l'historique des réparations | 5 | 10 h | **SLG** |
| #12 | Générer les factures | 8 | 15 h | **BI** |
| #13 | Gérer les paiements | 5 | 12 h | **MG** |
| #14 | Rechercher et consulter les dossiers clients | 5 | 12 h | **BI** |
| #15 | Gérer les pièces et l'inventaire | 13 | 15 h | **MG** |
| **Sous-total** | | **36** | **64 h** | |

## 4. 🧩 Tâche d'intégration — « recoller tous les morceaux »

**Responsable : SLG** (Point de Contact Technique — résout les problèmes d'intégration, charte §3), en **coordination avec toute l'équipe** · **Effort estimé : ~16 h**

## 5. Reporté hors portée du Sprint 3 (levier « portée souple » — à confirmer avec le PO)

L'échéancier étant rigide, ~26 USP de fonctionnalités « Souhaitable » sont retirés du sprint final :

| Issue | Story | USP | Priorité |
|---|---|---|---|
| #16 | Envoyer des notifications et rappels | 8 | Souhaitable |
| #17 | Gérer les évaluations et avis clients | 5 | Souhaitable |
| #18 | Produire des rapports et statistiques | 13 | Souhaitable |
| **Total reporté** | | **26** | |

## Engagement du Sprint 3

**Reprise 24 USP (~12 h) + nouveau développement 36 USP (64 h) + intégration (~16 h) ≈ 60 USP livrables / ~92 h.**
Objectif de fin de session : un prototype **intégré et déployé** couvrant le parcours essentiel de bout en bout (comptes → véhicules → rendez-vous → demandes → diagnostics → interventions → affectations → facturation → paiement).

## Tâches de gestion du sprint (livrables TP3c) — en plus des responsabilités fixes de la section 1 du [product backlog](product-backlog.md)

| Tâche tournante | Responsable |
|---|---|
| MAJ carnet des risques et carnet des obstacles | AN |
| Consolidation de la documentation produit dans GitLab | GAM |
| Démonstration / validation avec le PO (2 membres min.) | MG + BI |
