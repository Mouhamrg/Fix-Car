# FixMyCar — Frontend React

Application React (Vite) consommant les API `comptes` et `vehicules` du
backend Django, avec authentification JWT (access + refresh token).

## 1. Prérequis côté backend

Le backend doit exposer le JWT (voir `comptes/README.md`, section
« Authentification JWT ») :

```bash
pip install djangorestframework-simplejwt django-cors-headers
```

Et autoriser l'origine du frontend dans `settings.py` :

```python
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

## 2. Installation du frontend

```bash
npm install
cp .env.example .env
npm run dev
```

## 3. Structure du projet

```
src/
  api/            appels HTTP (axios) vers le backend
    axiosClient.js   instance axios + intercepteur de refresh JWT
    authApi.js       connexion / déconnexion
    comptesApi.js    inscription, profil, changement de mot de passe
    vehiculesApi.js  CRUD véhicules
  context/
    AuthContext.jsx  état d'authentification global (utilisateur courant)
  routes/
    RouteProtegee.jsx  redirige vers /connexion si non authentifié
  components/
    BarreNav.jsx       barre de navigation
    MiseEnPage.jsx     layout commun (nav + contenu) des pages protégées
    FicheVehicule.jsx  carte d'affichage d'un véhicule
    Champ.jsx          champ de formulaire réutilisable (label + erreur)
  pages/
    PageConnexion.jsx
    PageInscription.jsx
    PageVehicules.jsx
    PageFormulaireVehicule.jsx  (création ET modification, selon la route)
    PageDemandes.jsx
    PageFormulaireDemande.jsx   (création ET modification, selon la route)
    PageProfil.jsx
    PageIntrouvable.jsx
  constants/
    vehiculeChoix.js   miroir des TextChoices Django (catégorie, carburant)
    demandeChoix.js    miroir des TextChoices Django (statuts de demande)
  utils/
    erreurs.js         normalise les erreurs de validation DRF pour l'UI
  styles/
    tokens.css         palette et typographie (thème "fiche technique d'atelier")
    global.css         styles globaux
```

## 4. Fonctionnement de l'authentification JWT

1. `POST /api/auth/connexion/` renvoie `{ access, refresh, user }`.
2. `access` et `refresh` sont stockés dans `localStorage`.
3. Chaque requête API attache `Authorization: Bearer <access>`.
4. Si une requête échoue avec `401` (access expiré), le client tente
   **une seule fois** un rafraîchissement via
   `POST /api/auth/rafraichir/`, puis rejoue la requête d'origine.
   Si le refresh échoue aussi, l'utilisateur est déconnecté et
   redirigé vers `/connexion`.

###  Note de sécurité

Stocker les tokens JWT dans `localStorage` est pratique mais expose à
un risque de vol via une faille XSS (le JS de n'importe quel script
injecté peut lire `localStorage`). Pour une mise en production plus
robuste, on migrerait vers :
- un `refresh` token dans un cookie `httpOnly` + `secure` (nécessite
  une vue Django personnalisée qui pose le cookie plutôt que de le
  renvoyer dans le corps JSON), et
- un `access` token gardé uniquement en mémoire (état React, jamais
  persisté).

Ce n'était pas demandé pour cette première version ; à considérer
avant un déploiement réel.

## 5. Routes de l'application

| Route | Protégée | Page |
|---|---|---|
| `/connexion` | Non | Connexion |
| `/inscription` | Non | Création de compte |
| `/vehicules` | Oui | Liste des véhicules |
| `/vehicules/nouveau` | Oui | Ajout d'un véhicule |
| `/vehicules/:id/modifier` | Oui | Modification d'un véhicule |
| `/demandes` | Oui | Liste des demandes de réparation |
| `/demandes/nouvelle` | Oui | Nouvelle demande de réparation |
| `/demandes/:id/modifier` | Oui | Modification d'une demande (si `EN_ATTENTE`) |
| `/profil` | Oui | Consultation/modification du profil, changement de mot de passe |

## 6. Prochaines évolutions suggérées

- Rafraîchissement proactif du token avant expiration (plutôt que
  d'attendre un 401).
- Gestion des rôles côté UI (ex: masquer certaines actions pour un
  rôle `CLIENT` une fois les modules diagnostics/interventions ajoutés).
- Passage des tokens en cookies `httpOnly` (voir note de sécurité).
- Tests avec Vitest + React Testing Library.
