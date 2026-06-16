# Charte de Projet — FixMyCar

**Cours :** INF6150 – Génie logiciel III | **Session :** Été 2026 | **Équipe :** FoxTrot
**Membres :** Sileye Lamine Guisse (GUIS08369403), Mouhamed Rassoul Guiro (GUIM73340206), Aboubacar Niang (NIAA86340105), Ibrahima Berete (BERI75290402), Marius Guimatsia Akalong (GUIM27309006)

---

## 1. Mission de l'équipe

Notre équipe conçoit et développe **FixMyCar**, une plateforme web de gestion de flotte automobile pour les garages, afin d'en faire une solution complète, fiable et facile à utiliser. Notre contribution unique : bâtir cette application en livrant des fonctionnalités robustes et bien documentées, alignées sur les besoins de trois utilisateurs (**clients**, **mécaniciens**, **administrateurs**). Sans nous, les modules essentiels (comptes, véhicules, réparations) ne verraient pas le jour, privant les utilisateurs des outils dont ils dépendent au quotidien.

## 2. Client de l'équipe (Product Owner)

**Client / PO :** Sileye Lamine Guisse. L'équipe lui offre ses services de développement; il valide les priorités, les exigences et l'acceptation des fonctionnalités livrées.

## 3. Objectifs SMART

1. **Livrer les fonctionnalités essentielles attribuées** (scénarios opérationnels, maquettes et données d'affaires COSMIC) validées par le PO, d'ici la fin de la session (fin août 2026).
2. **Documenter le carnet de produit attribué dans GitLab** : raffiner les 2 issues essentielles prioritaires (*comptes utilisateurs*, *véhicules*) d'ici fin juin 2026, puis les issues importantes restantes d'ici fin juillet 2026.
3. **Déployer un prototype fonctionnel** des modules essentiels, testé et accessible via Vercel, d'ici la fin de la session.

## 4. Portée du projet

Portée détaillée : **TP1-Portée-FoxTrot.xlsx** et [projet GitLab](https://gitlab.info.uqam.ca/guisse.sileye_lamine/fixmycar). Total initial : **175 USP**.

| Priorité | USP | Fonctionnalités incluses |
|---|---|---|
| Essentiel | 68 | Comptes utilisateurs, véhicules, rendez-vous, demandes de réparation, état des réparations, diagnostics, interventions mécaniques |
| Important | 60 | Utilisateurs/rôles, types de réparations, affectation aux mécaniciens, historique, factures, paiements, dossiers clients, pièces/inventaire |
| Souhaitable\* | 47 | Notifications/rappels, évaluations clients, rapports/statistiques, multi-garages, tableau de bord admin |

**Hors portée :** application mobile native, intégrations externes (ERP, fournisseurs, GPS/télématique), paie/RH, migration de données, support multilingue, hébergement/maintenance après la session.

## 5. Matrice des leviers

| Levier | Rigide | Moyen | Souple |
| --- | --- | --- | --- |
| **Échéancier** | ✅ | | |
| **Budget** | | ✅ | |
| **Portée** | | | ✅ |

**Échéancier (rigide)** : date de fin de session fixe et non négociable. **Budget (moyen)** : équipe de taille fixe, heures/semaine variables selon la charge de cours. **Portée (souple)** : en cas de retard, les éléments « Souhaitable » (voire certains « Important ») peuvent être réduits ou reportés.

## 6. Résumé des coûts anticipés

5 membres × 5 h/semaine × 11 semaines (mi-juin à fin août 2026) = **275 heures-personne**. Au tarif H26 de 110 $/h : **275 × 110 $ = 30 250 $**. Aucun autre coût (licence, infrastructure) n'est prévu.

## 7. Critères de succès

Du point de vue du PO : les fonctionnalités essentielles sont développées, testées et fonctionnelles; les exigences sont documentées dans GitLab (scénarios + COSMIC); le prototype est déployé et démontrable; et les trois types d'utilisateurs (Client, Mécanicien, Admin) réalisent leurs tâches principales sans erreur bloquante.

## 8. Risques — mitigation (M) et contingence (C)

| # | Risque | Mitigation (M) | Contingence (C) |
|---|---|---|---|
| 1 | Dépendances entre fonctionnalités (*véhicules* dépend de *comptes*) | Développer les fonctionnalités de base (comptes/authentification) en premier | Utiliser des données fictives (mock) pour développer en parallèle |
| 2 | Disponibilités variables des membres (cours, travail, stages) | Répartir les tâches dès le départ selon les disponibilités connues | Réassigner les tâches d'un membre indisponible aux autres |
| 3 | Changement de portée demandé par le PO | Garder les éléments « Souhaitable » comme zone tampon | Renégocier l'échéancier des éléments « Important » avec le PO |
| 4 | Difficultés techniques avec une nouvelle technologie | Réaliser une preuve de concept (POC) tôt dans le projet | Simplifier ou retirer la fonctionnalité bloquante de la portée |
| 5 | Couverture de tests insuffisante avant la livraison | Intégrer les tests au fil du développement | Prioriser les tests sur les fonctionnalités essentielles avant l'échéance |
