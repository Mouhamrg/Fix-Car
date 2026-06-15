# Charte de Projet — FixMyCar

**Cours :** INF6150 – Génie logiciel III : Conduite de projets informatiques
**Session :** Été 2026
**Équipe :** FoxTrot
**Projet :** FixMyCar
**Membres :**
- Sileye Lamine Guisse (GUIS08369403)
- Mouhamed Rassoul Guiro (GUIM73340206)
- Aboubacar Niang (NIAA86340105)
- Ibrahima Berete (BERI75290402)
- Marius Guimatsia Akalong (GUIM27309006)
---

## 1. Mission de l'équipe

Notre équipe existe pour faire évoluer **FixMyCar**, une plateforme de gestion de flotte automobile destinée aux garages, en une solution complète, fiable et facile à utiliser pour la gestion des véhicules, des réparations et des comptes utilisateurs.

Notre contribution unique est de poursuivre le développement d'un logiciel existant en livrant des fonctionnalités robustes, bien documentées et alignées sur les besoins réels de trois types d'utilisateurs : les **clients**, les **mécaniciens** et les **administrateurs**.

Si notre équipe cessait d'exister, le projet perdrait une expertise technique acquise sur la base de code existante, et les fonctionnalités essentielles (gestion des comptes, des véhicules et des réparations) ne seraient pas livrées à temps, retardant l'accès des utilisateurs finaux à des outils dont ils dépendent au quotidien pour gérer leur flotte et leurs interventions.
 
---

## 2. Client de l'équipe (Product Owner)

**Client / PO :** Jacques Berger

Durant cette session, notre équipe offre ses services de développement au PO du projet FixMyCar, qui valide les priorités, les exigences détaillées et l'acceptation des fonctionnalités livrées.
 
---

## 3. Objectifs SMART

1. **Livrer les fonctionnalités essentielles attribuées** (ex. *Gérer les comptes utilisateurs*, *Gérer les véhicules*) avec scénarios opérationnels, maquettes et données d'affaires (COSMIC) validés par le PO, d'ici la fin de la session (fin août 2026).
2. **Documenter l'intégralité du carnet de produit attribué dans GitLab**, en raffinant au minimum les 2 issues essentielles les plus prioritaires (*Gérer les comptes utilisateurs*, *Gérer les véhicules*) d'ici fin juin 2026, puis les issues importantes restantes d'ici fin juillet 2026.
3. **Développer et déployer un prototype fonctionnel** des modules essentiels (gestion des comptes et des véhicules), testé et accessible via Vercel, d'ici la fin de la session.

## 4. Portée du projet

La portée détaillée est documentée dans :
- Le fichier **TP1-Portée-FoxTrot.xlsx** (résumé des 20 exigences par priorité)
- Le projet GitLab : [fixmycar / FixMyCar](https://gitlab.info.uqam.ca/guisse.sileye_lamine/fixmycar)
  **Inclus dans la portée — Essentiel (68 USP) :**
- Gérer les comptes utilisateurs (8)
- Gérer les véhicules (5)
- Gérer les rendez-vous (13)
- Créer une demande de réparation (8)
- Consulter l'état des réparations (8)
- Gérer les diagnostics (13)
- Gérer les interventions mécaniques (13)
  **Inclus dans la portée — Important (60 USP) :**
- Gérer les utilisateurs et rôles (8)
- Gérer les types de réparations (8)
- Affecter les réparations aux mécaniciens (8)
- Consulter l'historique des réparations (5)
- Générer les factures (8)
- Gérer les paiements (5)
- Rechercher et consulter les dossiers clients (5)
- Gérer les pièces et l'inventaire (13)
  **Souhaitable — sujet à réduction si nécessaire (47 USP) :**
- Envoyer des notifications et rappels (8)
- Gérer les évaluations et avis clients (5)
- Produire des rapports et statistiques (13)
- Gérer plusieurs garages ou ateliers (13)
- Gérer le tableau de bord administratif (8)
  **Total de la portée initiale :** 175 USP

---

## 5. Matrice des leviers

| Levier | Rigide | Moyen | Souple |
|---|---|---|---|
| **Échéancier** | ✅ | | |
| **Budget** | | ✅ | |
| **Portée** | | | ✅ |

- **Échéancier (Rigide) :** la date de fin de session est fixe et non négociable.
- **Budget (Moyen) :** la taille de l'équipe est fixe, mais le nombre d'heures investies par semaine peut varier légèrement selon la charge de cours.
- **Portée (Souple) :** en cas de retard, les éléments « Souhaitable » (et possiblement certains « Important ») peuvent être réduits ou reportés afin de respecter l'échéancier.
---

## 6. Résumé des coûts anticipés

- Nombre de membres : 5
- Heures investies par membre par semaine : 5 h
- Nombre de semaines restantes (mi-juin à fin août 2026) : 11
- Taux horaire (H26) : 110 $/h
  **Calcul :**
  Effort total = 5 × 5 × 11 = 275 heures-personne
  Coût total anticipé = 275 × 110 $ = **30 250 $**

---

## 7. Critères de succès

Du point de vue du PO, le projet sera considéré comme un succès si :

- Les fonctionnalités essentielles attribuées sont développées, testées et fonctionnelles.
- Les exigences sont documentées dans GitLab avec scénarios opérationnels et données d'affaires (COSMIC).
- Le prototype est déployé et accessible pour démonstration.
- Les trois types d'utilisateurs (Client, Mécanicien, Admin) peuvent réaliser leurs tâches principales sans erreur bloquante.
---

## 8. Risques et plans de mitigation/contingence

| # | Risque | Mitigation (M) | Contingence (C) |
|---|---|---|---|
| 1 | Dépendances entre fonctionnalités (ex. *Gérer les véhicules* dépend de *Gérer les comptes utilisateurs*) | Prioriser le développement des fonctionnalités de base (comptes/authentification) en premier | Utiliser des comptes/données fictives (mock) pour développer en parallèle sans bloquer |
| 2 | Disponibilités variables des membres (cours, travail, stages) | Répartir les tâches dès le départ selon les disponibilités connues de chacun | Réassigner les tâches d'un membre indisponible aux autres membres |
| 3 | Changement de portée demandé par le PO en cours de session | Garder les éléments « Souhaitable » comme zone tampon | Renégocier l'échéancier des éléments « Important » avec le PO si nécessaire |
| 4 | Difficultés techniques avec une nouvelle technologie (ex. intégration GPS/tracker) | Réaliser une preuve de concept (POC) tôt dans le projet | Simplifier ou retirer la fonctionnalité bloquante de la portée essentielle |
| 5 | Couverture de tests insuffisante avant la livraison | Intégrer les tests au fur et à mesure du développement | Prioriser les tests sur les fonctionnalités essentielles uniquement avant la date limite |
 
 