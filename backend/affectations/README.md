# Module `affectations`

User story couverte :
> Le gestionnaire affecte une réparation à un mécanicien disponible,
> tandis que l'administrateur peut consulter les affectations et les
> modifier au besoin.

## 1. Dépendances

Ce module dépend de `comptes` (rôles) et `demandes_reparation`
(demande à affecter). Ordre d'installation :

```python
INSTALLED_APPS = [
    ...
    "comptes",
    "vehicules",
    "demandes",
    "affectations",
]
```

```bash
python manage.py makemigrations comptes demandes_reparation affectations
python manage.py migrate
```

```python
# urls.py du projet
urlpatterns = [
    ...
    path("api/", include("comptes.urls")),
    path("api/", include("vehicules.urls")),
    path("api/", include("demandes.urls")),
    path("api/", include("affectations.urls")),
]
```

## 2. Qui est « administrateur » ?

Ce n'est **pas** un rôle métier ajouté à `Profil` (qui reste
`CLIENT` / `MECANICIEN` / `GESTIONNAIRE`) : c'est un superutilisateur
Django (`is_superuser=True`), créé via `createsuperuser` ou promu dans
l'admin. Il a accès à tout, comme une supervision globale du système,
distincte du rôle opérationnel `GESTIONNAIRE`.

## 3. Endpoints exposés

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | /api/affectations/ | Gestionnaire/admin : toutes · Mécanicien : les siennes | Liste des affectations |
| POST | /api/affectations/ | Gestionnaire ou admin | Affecter une demande à un mécanicien |
| GET | /api/affectations/{id}/ | Gestionnaire/admin/mécanicien concerné | Détail |
| PATCH | /api/affectations/{id}/ | Gestionnaire ou admin | Réaffecter à un autre mécanicien, modifier le commentaire |
| GET | /api/affectations/mecaniciens-disponibles/ | Gestionnaire/admin/mécanicien | Liste des mécaniciens (triés : disponibles d'abord) |

Un client n'a **aucun accès** à ce module (403). Il voit qui répare
son véhicule indirectement via le champ `mecanicien_assigne` exposé
par `GET /api/demandes-reparation/{id}/`.

## 4. Exemple d'utilisation

- Se connecter avec un compte GESTIONNAIRE
- Aller sur "Mes taches"
- s'il y a des reparations en attente, le lien Affecter apparaitra sur chque demande de reparation
- cliquer sur une Affecter pour aller a l'interface Admin pour les affections 
- se connecter avec `admin` et `admin12345`
- Puis vous pouvez assigner des taches aux mecaniciens.






