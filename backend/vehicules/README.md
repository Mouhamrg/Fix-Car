# Module `vehicules` — API REST de gestion des véhicules

Ce module implémente la user story :
> En tant que client, je veux enregistrer et gérer mes véhicules afin de les
> associer à mes demandes de réparation.

Hypothèse retenue : l'authentification est déjà en place dans le projet
(session, JWT, etc.) — ce module se contente d'exiger `IsAuthenticated` et
de scoper les données via `request.user`.

## 1. Installation

```bash
pip install djangorestframework django-filter
```

Ajouter dans `settings.py` :

```python
INSTALLED_APPS = [
    ...
    "rest_framework",
    "django_filters",
    "vehicules",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # ex: "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
```

## 2. Routing

Dans `urls.py` du projet :

```python
from django.urls import path, include

urlpatterns = [
    ...
    path("api/", include("vehicules.urls")),
]
```

## 3. Migrations

```bash
python manage.py makemigrations vehicules
python manage.py migrate
```

## 4. Endpoints exposés

| Méthode | URL                              | Description                          | Accès                     |
|---------|-----------------------------------|---------------------------------------|----------------------------|
| GET     | /api/vehicules/                  | Liste des véhicules du client connecté (staff: tous) | Authentifié |
| POST    | /api/vehicules/                  | Création d'un véhicule                | Authentifié |
| GET     | /api/vehicules/{id}/             | Détail d'un véhicule                  | Propriétaire ou staff |
| PUT/PATCH | /api/vehicules/{id}/            | Mise à jour                           | Propriétaire ou staff |
| DELETE  | /api/vehicules/{id}/             | Désactivation (soft delete)           | Propriétaire ou staff |
| POST    | /api/vehicules/{id}/reactiver/   | Réactivation                          | Propriétaire ou staff |

Filtres disponibles : `?marque=`, `?carburant=`, `?actif=`
Recherche : `?search=` (marque, modèle, immatriculation, VIN)
Tri : `?ordering=annee` ou `?ordering=-kilometrage`

## 5. Exemple de requête

```bash
curl -X POST http://localhost:8000/api/vehicules/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "marque": "Renault",
        "modele": "Clio",
        "annee": 2019,
        "immatriculation": "AB-123-CD",
        "kilometrage": 45000
      }'
```

## 6. Règles métier implémentées

- Un client ne voit/modifie que ses propres véhicules.
- Le staff (mécaniciens/gestionnaires) a accès à tous les véhicules, car les
  autres modules (diagnostic, demande de réparation) devront pouvoir
  rattacher un véhicule existant.
- L'immatriculation et le VIN sont uniques et normalisés en majuscules.
- Le kilométrage ne peut pas diminuer lors d'une mise à jour.
- La suppression est une désactivation logique (`actif=False`) afin de
  conserver l'historique des réparations liées.

## 7. Prochaines évolutions suggérées

- Lier `Vehicule` au futur modèle `DemandeReparation` (FK).
- Ajouter un endpoint `/api/vehicules/{id}/historique/` listant les
  réparations passées une fois le module correspondant développé.
- Ajouter la gestion multi-garage (SaaS multi-tenant) via un champ
  `garage` ou un middleware de tenant si nécessaire.