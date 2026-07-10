# Module `comptes` — Gestion des comptes utilisateurs

User story couverte :
> En tant que client, je veux créer un compte et gérer mon profil afin
> d'accéder aux services du garage.

## 0. Authentification JWT (pour le frontend React)

Le frontend React consomme l'API via des jetons JWT (access + refresh).

```bash
pip install djangorestframework-simplejwt django-cors-headers
```

Dans `settings.py` :

```python
from datetime import timedelta

INSTALLED_APPS = [
    ...
    "corsheaders",
    "rest_framework",
    "comptes",
    "vehicules",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # doit être avant CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    ...
]

# Origine du serveur de développement Vite
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

Endpoints JWT exposés (voir section 5) : `/api/auth/connexion/`,
`/api/auth/rafraichir/`, `/api/auth/verifier/`.

## 1. Choix d'architecture

On **conserve le modèle `User` natif de Django** (utilisé pour
l'authentification) et on lui associe un modèle `Profil` en relation
`OneToOne`, qui porte les champs métier propres au garage :
téléphone, adresse, rôle, etc.

Pourquoi ce choix plutôt qu'un `AUTH_USER_MODEL` personnalisé :
remplacer le modèle `User` par défaut après coup (une fois des
migrations déjà appliquées, comme c'est votre cas) est risqué et
demande de repartir de zéro. Le modèle `Profil` apporte la même
flexibilité sans ce risque.

Le champ `role` (CLIENT / MECANICIEN / GESTIONNAIRE) prépare les
prochains modules : diagnostics et interventions seront réservés aux
mécaniciens, la demande de réparation aux clients, etc.

## 2. Installation

Ajouter dans `settings.py` :

```python
INSTALLED_APPS = [
    ...
    "rest_framework",
    "comptes",
    "vehicules",
]
```

## 3. Migrations

```bash
python manage.py makemigrations comptes
python manage.py migrate
```

## 4. Routing

Dans `urls.py` du projet :

```python
urlpatterns = [
    ...
    path("api/", include("comptes.urls")),
    path("api/", include("vehicules.urls")),
]
```

## 5. Endpoints exposés

| Méthode | URL | Accès | Description |
|---|---|---|---|
| POST | /api/comptes/inscription/ | Public (AllowAny) | Création d'un compte client |
| GET | /api/comptes/profil/ | Authentifié | Consultation de son propre profil |
| PUT/PATCH | /api/comptes/profil/ | Authentifié | Mise à jour de son profil |
| POST | /api/comptes/changer-mot-de-passe/ | Authentifié | Changement de mot de passe |
| POST | /api/auth/connexion/ | Public | Connexion : renvoie `access`, `refresh`, `user` |
| POST | /api/auth/rafraichir/ | Public (avec refresh valide) | Renouvelle un `access` token |
| POST | /api/auth/verifier/ | Public | Vérifie la validité d'un token |

## 8. Règles métier implémentées

- L'inscription est publique, mais crée toujours un compte de rôle
  `CLIENT` — impossible de s'auto-attribuer un rôle `MECANICIEN` ou
  `GESTIONNAIRE` via l'API (ces rôles sont attribués via l'admin
  Django, par un gestionnaire).
- Le mot de passe est validé par les validateurs standards de Django
  (`AUTH_PASSWORD_VALIDATORS`) : longueur minimale, pas trop commun,
  pas uniquement numérique, etc.
- L'e-mail doit être unique.
- Le téléphone et le code postal sont validés selon les formats
  nord-américain / canadien.
- Un utilisateur ne peut consulter/modifier que **son propre** profil
  (pas de paramètre `{id}` dans l'URL — `get_object()` renvoie
  toujours `request.user.profil`).
- Un `Profil` est créé automatiquement pour tout nouveau `User`, même
  hors API (signal `post_save`), pour éviter les erreurs
  `DoesNotExist` sur d'anciens comptes.

## 9. Prochaines évolutions suggérées

- Confirmation d'e-mail avant activation du compte.
- Endpoint de réinitialisation de mot de passe oublié (envoi d'un lien
  par e-mail).
- Endpoint admin dédié pour créer des comptes `MECANICIEN` /
  `GESTIONNAIRE` (au lieu de passer uniquement par l'admin Django).
