## Contribuer 

Pour maintenir la qualité du projet, merci de respecter les régles suivantes,
lors de vos contributions

### 1. Format des messages de commit 
Nous utilisons la spécification **Conventional Commits**. Chaque commit,
doit suivre la structure suivante : `<type>: <description>`

*	`feat:` Ajout d'une nouvelle fonctionnalité. 
*	`fix:`Correction d'un bug.
*	`docs:` Modifications ou ajouts dans la documentation. 
*	`chore:` Tâches répétitives, maintenance ou configuration (sans modification de code).
*	`test:` Ajout ou correction de test sans modifier le code de l'application. 
*	`ci:` Modification du pipeline d'intégration continue (fichier de Workflow GitHub actions dans .github/Workflows/).
*	`build:` Modification de la construction ou de l'empaquetage de l'application (Dockerfile, Dépendances).


*Exemple :* `docs: ajouter les regles de contribution au README`

### 2. Nommage des branches 
Les branches doivent être nommées en minuscules, utiliser des tirets
comme séparateurs et inclure le numéro d'issue et le type de tâche :
*	Fonctionnalité : `feat/<numéro>-nom-de-la-feature` ou `docs/4-corrections-revues`
*	Correction : `fix/numéro-nom-du-bug`
*	Documentation: docs/4-correction-revue

### 3. Flux par Pull Request (PR) 
1. Créez votre branche à partir de `main` à jour (`git pull`d'abord).
2. Ouvrez une Pull Request dès que votre travail est prêt pour la révision. 
3. Liez l'issue correspondante dans la description de la PR en utilisant le mot-clé `Closes #numéro`.
4. La fusion dans main passe obligatoirement par un Pull Request. Aucune approbation
   n'est exigée pour le moment car le projet n'a qu'un seul mainteneur. 
