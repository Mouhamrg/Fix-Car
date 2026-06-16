# CHARTE DE L'ÉQUIPE

## 1. Nom de l'équipe et liste des membres

* **Nom de l'équipe :** FoxTrot
* **Nom du projet :** fixmycar
* **Membres :** Mouhamed Rassoul Guiro (GUIM73340206)
* Aboubacar Niang (NIAA86340105)
* Ibrahima Berete (BERI75290402)
* Marius Guimatsia Akalong (GUIM27309006)
* Sileye Lamine Guisse (GUIS08369403)

L'équipe est responsable du sous-ensemble de fonctionnalités retenu dans le document de portée *TP1-Portée-FoxTrot* (demandes de réparation, diagnostics, interventions, rendez-vous, factures et paiements), qui sert de référence à toute la charte.

---

## 2. Contraintes et autonomie

**Contraintes imposées :** respecter les échéances et les exigences définies par le PO, utiliser les technologies approuvées par l'équipe, produire les livrables dans les formats demandés, composer avec des ressources en temps limitées et des horaires différents.

**Responsabilités déléguées à l'équipe :** analyse des besoins, conception, développement, tests, documentation, gestion du code source et organisation interne du travail.

**Responsabilités du gestionnaire (enseignant) :** validation finale de la conformité académique et arbitrage ultime en cas de conflit majeur persistant ou d'exclusion d'un membre.

---

## 3. Rôles et responsabilités

| Rôle | Affectation | Responsabilités principales |
|------|-------------|------------------------------|
| Coordonnateur | Aboubacar Niang | Planifier les activités, organiser les réunions, suivre les échéances, faciliter la communication, arbitrer les décisions urgentes. |
| Développeur | Marius Guimatsia Akalong (backend), Aboubacar Niang (frontend) | Concevoir et développer les fonctionnalités, corriger les anomalies, participer aux revues de code, produire la documentation technique. |
| Responsable Assurance Qualité | Ibrahima Berete | Vérifier le respect de la Définition de Terminé, préparer et réaliser les tests, valider les corrections. |
| Responsable Gestion de Configuration | Mouhamed Guiro | Administrer le dépôt Git, gérer les branches, garantir l'intégrité des artéfacts, contrôler les versions des livrables. |
| Point de Contact Technique | Sileye Lamine Guisse | Communiquer avec les autres équipes, identifier les dépendances, résoudre les problèmes d'intégration. |
| Product Owner (PO) | Sileye Lamine Guisse | Prioriser le carnet de produit, clarifier les exigences, valider les fonctionnalités selon les critères d'acceptation. Représente le client, absent dans le cadre du cours. |

---

## 4. Normes de fonctionnement

* **Participation et disponibilité :** chaque membre participe activement aux réunions en y étant préparé, consulte les canaux de l'équipe chaque jour ouvrable et répond sous 24 h en semaine. Toute absence est annoncée à l'avance au coordonnateur.
* **Engagement :** les tâches acceptées sont réalisées dans les délais, leur statut est tenu à jour sur le tableau de suivi, et toute difficulté ou risque de retard est signalé rapidement.
* **Communication :** échanges respectueux et orientés vers la résolution ; décisions importantes documentées (compte-rendu ou issue GitLab) ; échanges techniques structurés via GitLab plutôt que par messagerie instantanée.
* **Qualité et documentation :** toute fonctionnalité est testée et documentée, versionnée dans GitLab ; toute fusion dans la branche principale passe par une Merge Request approuvée par au moins un autre membre ; le respect de la Définition de Terminé est vérifié par le responsable AQ.

---

## 5. Processus de développement

L'équipe adopte une approche **Agile inspirée de Scrum**, adaptée au projet car elle permet de livrer les fonctionnalités prioritaires de façon incrémentale tout en recueillant régulièrement la rétroaction du PO. Le travail est découpé en **sprints de deux semaines**.

**Flux d'un sprint :** Product Backlog → Sprint Planning → Sprint Backlog → Développement → Tests et validation → Sprint Review → Sprint Rétrospective → sprint suivant.

* **Product Backlog :** ensemble des fonctionnalités et exigences, priorisé par le PO.
* **Sprint Planning :** sélection des fonctionnalités prioritaires, clarification des exigences, découpage en tâches estimées (livrable : Sprint Backlog).
* **Développement :** conception, implémentation, documentation technique et tests unitaires.
* **Revue de code :** un autre membre vérifie le code et les normes avant l'intégration.
* **Validation et tests :** le responsable AQ vérifie les critères d'acceptation, réalise les tests fonctionnels et confirme le respect de la Définition de Terminé ; toute anomalie est corrigée avant la fin du sprint.
* **Sprint Review :** présentation des fonctionnalités et validation par le PO.
* **Sprint Rétrospective :** analyse du fonctionnement de l'équipe et définition des améliorations.

Ce processus est cohérent avec la **Définition de Terminé** (revue par les pairs, tests, critères d'acceptation, intégration dans `main`). Le suivi se fait sur un tableau inspiré de Kanban :

| Product Backlog | À faire | En cours | Validation | Terminé |
|-----------------|---------|----------|------------|---------|
| Élément priorisé au carnet | Approuvé, prêt à développer | En développement | Développé, en attente de tests et de la DoD | Validé selon la DoD |

---

## 6. Outils et leur usage

| Outil | Usage |
|-------|-------|
| GitLab / Git | Gestion du code source et des versions |
| Visual Studio Code | Développement |
| PlantUML + Makefile | Diagrammes UML (production automatisée en PNG) |
| Docker | Conteneurisation de l'application |
| Discord | Communication instantanée |
| Microsoft Teams / Zoom | Réunions |
| Markdown | Documentation |

Les extrants sont transmissibles dans des formats lisibles (PNG, PDF, Markdown).

---

## 7. Logistique de coordination

* **Réunions hebdomadaires :** une rencontre par semaine (60 min) en ligne via Discord ou Teams ; jour et heure fixés en début de session selon les disponibilités communes (par défaut en soirée de semaine).
* **Réunions extraordinaires :** au besoin, convoquées par le coordonnateur avec préavis raisonnable.
* **Communication quotidienne :** Discord (coordination) et GitLab (suivi technique : issues, Merge Requests).
* **Partage de documents :** GitLab (code et livrables versionnés) et Google Drive (documents de travail).

---

## 8. Modes décisionnels

* **Mode principal — Consensus :** une décision est adoptée lorsqu'une majorité est favorable et que les autres l'acceptent sans en être dérangés. Le sujet est présenté en réunion ou sur Discord, chacun s'exprime, puis la décision retenue est consignée (compte-rendu ou issue GitLab).
* **Mode secondaire — Majorité :** si le consensus échoue après discussion, l'équipe vote et retient l'option majoritaire. En cas d'égalité, le coordonnateur tranche afin d'éviter tout blocage, notamment près d'une échéance.

---

## 9. Comportements attendus

Respect mutuel, ponctualité, collaboration, transparence, communication proactive, respect des engagements, ouverture aux commentaires constructifs et participation active aux réunions.

## 10. Comportements non tolérés

Retards répétés sans justification, manque de respect, plagiat, non-respect des normes établies, absence non signalée, suppression ou modification non autorisée du travail d'autrui, refus systématique de collaborer.

---

## 11. Résolution des conflits

**Démarche générale :** (1) discussion directe entre les membres concernés ; (2) médiation du coordonnateur si le conflit persiste ; (3) réunion d'équipe pour une solution collective ; (4) documentation de la décision retenue. Les conflits sont résolus rapidement, dans le respect et l'intérêt du projet.

**Non-respect des engagements :** c'est l'équipe, et non la professeure, qui juge du sort d'un membre défaillant et de sa part de la note. La démarche est progressive :

* **1ʳᵉ occurrence :** discussion avec le membre et réévaluation de sa charge de travail.
* **2ᵉ occurrence :** avertissement formel consigné au compte-rendu.
* **3ᵉ occurrence :** redistribution des tâches, réduction de la reconnaissance de la contribution dans les livrables (impact sur la note) et signalement au professeur si nécessaire.
