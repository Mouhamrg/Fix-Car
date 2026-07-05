# FixMyCar — Structure du projet et conventions de développement

**Équipe FoxTrot — INF6150 Été 2026**

Ce document définit la structure et les conventions que **chaque membre doit respecter** pour garder le projet cohérent. L'issue **#67 — Gérer les interventions mécaniques** sert d'**implémentation de référence** : avant de commencer votre issue, lisez le code de `backend/interventions/` et `frontend/src/pages/InterventionsPage.jsx`, puis reproduisez le même patron.

---

## 1. Vue d'ensemble

```
fixmycar/
├── backend/                  # API Django + Django REST Framework
│   ├── fixmycar_backend/     # Projet Django (settings, urls racine)
│   ├── interventions/        # App de référence (#67)
│   ├── <votre_app>/          # Une app Django PAR domaine fonctionnel
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # SPA React 19 + Vite
│   └── src/
│       ├── api/              # Un module d'appels API par ressource
│       ├── components/       # Composants partagés (AppLayout, …)
│       ├── pages/            # Une page par écran (XxxPage.jsx)
│       ├── theme.js          # Thème noir et blanc global (NE PAS modifier sans accord d'équipe)
│       ├── App.jsx           # Routes
│       └── main.jsx          # Providers (Mantine, React Query, Router)
├── docs/                     # Chartes, backlog, sprints, ce document
├── diagrammes/               # Diagrammes PlantUML (.puml)
└── images/                   # Diagrammes exportés (.png)
```

**Stack imposée** : Django 6 + DRF + SimpleJWT (backend) · React 19 + Vite + Mantine + TanStack Query + React Router + Axios (frontend). N'ajoutez pas de dépendance sans accord de l'équipe.

**Langue** : interface utilisateur, modèles, champs et messages d'erreur **en français**. Code d'infrastructure (variables techniques, hooks) en anglais si c'est l'usage de la librairie.

---

## 2. Backend — conventions

### 2.1 Une app Django par domaine fonctionnel

```bash
cd backend && .venv/bin/python manage.py startapp <nom_app>
```

Chaque app contient obligatoirement : `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`. Ensuite :

1. Ajouter l'app dans `INSTALLED_APPS` (`fixmycar_backend/settings.py`, section « Apps du projet »).
2. Inclure ses routes dans `fixmycar_backend/urls.py` : `path('api/', include('<nom_app>.urls'))`.

### 2.2 Modèles

- Noms de classe au **singulier** en français (`Intervention`, `RendezVous`, `Facture`).
- Champs en français : `titre`, `description`, `statut`, `date_creation`…
- Statuts : `models.TextChoices` avec valeurs `snake_case` (`en_cours`, `terminee`).
- Toujours : `date_creation = DateTimeField(auto_now_add=True)` et `date_modification = DateTimeField(auto_now=True)`.
- Lien vers l'utilisateur : `ForeignKey(settings.AUTH_USER_MODEL, related_name='<pluriel>')` — jamais `User` importé directement.
- Dépendance vers une fonctionnalité pas encore implémentée → champ texte libre temporaire + commentaire (voir `Intervention.vehicule`), remplacé par une FK quand l'issue dépendante sera livrée.
- `Meta.ordering` explicite + méthode `__str__`.
- Après tout changement de modèle : `makemigrations` + `migrate`, et **commiter les migrations**.

### 2.3 Serializers, vues et permissions

- `ModelSerializer` avec liste `fields` **explicite** (pas de `'__all__'`).
- L'auteur (`mecanicien`, `client`…) est en `read_only_fields` et assigné dans `perform_create` — jamais fourni par le client HTTP.
- `ModelViewSet` + `DefaultRouter` (voir `interventions/urls.py`).
- Permissions : `IsAuthenticated` partout (défaut global dans `settings.py`) + permission objet si nécessaire, sur le modèle de `EstMecanicienAuteurOuLectureSeule` (lecture pour tous les authentifiés, écriture réservée à l'auteur).
- Enregistrer chaque modèle dans `admin.py` avec `list_display`.

### 2.4 API — contrat

- URL : `/api/<ressource-au-pluriel>/` avec slash final (ex. `/api/interventions/`, `/api/interventions/3/`).
- Authentification : en-tête `Authorization: Bearer <access_token>` (obtenu via `/api/token/`).
- Codes : 200/201 succès, 400 validation (détails par champ, en français), 401 non authentifié, 403 non autorisé, 404 introuvable.
- Endpoints transverses existants : `/api/token/`, `/api/token/refresh/`, `/api/me/`.

---

## 3. Frontend — conventions

### 3.1 Fichiers et nommage

| Élément | Emplacement | Nommage | Exemple |
|---|---|---|---|
| Page (écran) | `src/pages/` | `XxxPage.jsx` | `InterventionsPage.jsx` |
| Appels API | `src/api/` | `<ressource>.js` | `interventions.js` |
| Composant partagé | `src/components/` | `PascalCase.jsx` | `AppLayout.jsx` |

- **Toujours réutiliser** `src/api/client.js` (Axios + JWT + rafraîchissement automatique du jeton). Ne jamais créer une autre instance Axios ni appeler `fetch` directement.
- Chaque module `src/api/<ressource>.js` expose `listXxx`, `createXxx`, `updateXxx`, `deleteXxx`.

### 3.2 Pages

- Toute page authentifiée est enveloppée dans `<AppLayout>` (en-tête, navigation, déconnexion) et déclarée dans `App.jsx` sous `<ProtectedRoute>`.
- Ajouter le lien de la page dans le tableau `links` de `AppLayout.jsx`.
- Données : TanStack Query — `useQuery({ queryKey: ['<ressource>'] })` pour lire, `useMutation` + `invalidateQueries({ queryKey: ['<ressource>'] })` après création/modification/suppression. Pas de `useEffect` + `useState` pour charger des données.
- Formulaires de création/édition dans un `Modal` Mantine ; suppression avec confirmation.
- Afficher les erreurs de validation renvoyées par l'API (voir `surErreur` dans `InterventionsPage.jsx`).
- Interface entièrement en français.

### 3.3 Design noir et blanc (obligatoire)

Le thème global `src/theme.js` impose le monochrome : boutons noirs, bordures noires, fonds blancs.

- **Interdit** : couleurs Mantine (`color="red"`, `color="blue"`, etc.), CSS coloré, images décoratives colorées.
- Badges de statut : `variant="filled"` (noir) pour un état final, `variant="outline"` pour un état en cours — toujours `color="mono.9"`.
- Hiérarchie visuelle par la typographie (graisse, taille) et les bordures, pas par la couleur.

---

## 4. Correspondance backlog → structure

Réservez ces noms pour vos issues (app backend / endpoint / page frontend) :

| Issue | Fonctionnalité | App backend | Endpoint | Page frontend |
|---|---|---|---|---|
| #1 | Comptes et profils | `comptes` | `/api/comptes/` (+ `/api/me/`) | `ProfilPage.jsx` |
| #2 | Véhicules | `vehicules` | `/api/vehicules/` | `VehiculesPage.jsx` |
| #63 | Rendez-vous | `rendezvous` | `/api/rendez-vous/` | `RendezVousPage.jsx` |
| #64 | Demandes de réparation | `reparations` | `/api/demandes/` | `DemandesPage.jsx` |
| #65 | État des réparations | `reparations` | `/api/demandes/` (statut) | `SuiviReparationsPage.jsx` |
| #66 | Diagnostics | `diagnostics` | `/api/diagnostics/` | `DiagnosticsPage.jsx` |
| #67 | **Interventions (référence)** | `interventions` ✅ | `/api/interventions/` ✅ | `InterventionsPage.jsx` ✅ |
| #68 | Utilisateurs et rôles | `comptes` | `/api/utilisateurs/` | `UtilisateursPage.jsx` |
| #69 | Types de réparations | `reparations` | `/api/types-reparations/` | `TypesReparationsPage.jsx` |
| #70 | Affectation aux mécaniciens | `reparations` | `/api/affectations/` | `AffectationsPage.jsx` |
| #71 | Historique des réparations | `reparations` | `/api/historique/` | `HistoriquePage.jsx` |
| #72 | Factures | `facturation` | `/api/factures/` | `FacturesPage.jsx` |
| #73 | Paiements | `facturation` | `/api/paiements/` | `PaiementsPage.jsx` |
| #74 | Dossiers clients | `comptes` | `/api/clients/` | `DossiersClientsPage.jsx` |
| #75 | Pièces et inventaire | `inventaire` | `/api/pieces/` | `InventairePage.jsx` |

Une app regroupe les fonctionnalités d'un même domaine (ex. `reparations` couvre #64, #65, #69, #70, #71). Le premier membre qui travaille sur le domaine crée l'app ; les suivants y ajoutent leurs modèles.

**Rôles (en attendant #68)** : tout utilisateur authentifié a accès aux fonctionnalités ; la distinction client / mécanicien / admin sera introduite par #68. Protégez au minimum l'écriture par la règle « seul l'auteur modifie » comme dans #67.

---

## 5. Workflow Git

1. **Une branche par issue** depuis `main` : `<numéro>-<titre-en-kebab-case>` (ex. `67-gerer-interventions-mecaniques`).
2. Commits en français, **sans accents**, à l'impératif : `Ajoute la gestion des interventions mecaniques (#67)`.
3. Ne jamais commiter : `.venv/`, `node_modules/`, `db.sqlite3`, `.env` (déjà dans les `.gitignore`).
4. Toujours commiter les **migrations** avec le code du modèle.
5. Merge request vers `main` liée à l'issue GitLab ; au moins un autre membre relit avant la fusion.

---

## 6. Démarrage et comptes de test

```bash
# Backend (terminal 1)
cd backend && .venv/bin/python manage.py runserver     # http://localhost:8000

# Frontend (terminal 2)
cd frontend && npm run dev                             # http://localhost:5173
```

Première installation : `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt && backend/.venv/bin/python manage.py migrate`, puis `cd frontend && npm install`.

Comptes de test locaux : `testuser` / `MotDePasse123!` et `mecano2` / `MotDePasse123!` (base locale non versionnée — les recréer au besoin via `manage.py shell`).

---

## 7. Checklist « nouvelle fonctionnalité »

- [ ] Branche `<numéro>-<titre>` créée depuis `main` à jour
- [ ] App backend créée (ou réutilisée selon le tableau §4), enregistrée dans `settings.py` et `urls.py`
- [ ] Modèle + migrations + admin + serializer + ViewSet + permissions
- [ ] Module `src/api/<ressource>.js` utilisant `client.js`
- [ ] Page `XxxPage.jsx` avec `AppLayout`, route protégée dans `App.jsx`, lien dans la navigation
- [ ] Design noir et blanc respecté, interface en français
- [ ] Testé de bout en bout : API (codes 200/201/400/401/403) et navigateur (créer, modifier, supprimer)
- [ ] Migrations commitées, merge request ouverte et liée à l'issue
