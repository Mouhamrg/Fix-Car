# Module `demandes_reparation`

User story couverte :
> En tant que client, je veux créer une demande de réparation pour un
> véhicule afin de décrire mon problème.

## 1. Dépendance

Ce module dépend de `vehicules` (une demande est toujours rattachée à
un véhicule existant). `vehicules` doit donc être installé et migré
avant `demandes_reparation`.

## 2. Installation

```python
INSTALLED_APPS = [
    ...
    "comptes",
    "vehicules",
    "demandes_reparation",
]
```

```bash
python manage.py makemigrations demandes_reparation
python manage.py migrate
```

```python
# urls.py du projet
urlpatterns = [
    ...
    path("api/", include("comptes.urls")),
    path("api/", include("vehicules.urls")),
    path("api/", include("demandes_reparation.urls")),
]
```

## 3. Endpoints exposés

| Méthode | URL | Description | Accès |
|---|---|---|---|
| GET | /api/demandes-reparation/ | Liste des demandes du client (staff: toutes) | Authentifié |
| POST | /api/demandes-reparation/ | Créer une demande | Authentifié |
| GET | /api/demandes-reparation/{id}/ | Détail d'une demande | Client propriétaire ou staff |
| PATCH | /api/demandes-reparation/{id}/ | Modifier titre/description (si `EN_ATTENTE`) | Client propriétaire ou staff |
| POST | /api/demandes-reparation/{id}/annuler/ | Annuler (si `EN_ATTENTE`) | Client propriétaire ou staff |

Pas de `PUT` ni de `DELETE` : une demande n'est jamais supprimée, elle
passe au statut `ANNULEE` pour conserver l'historique (utile pour le
futur tableau de bord du garage).

Filtres : `?statut=EN_ATTENTE`, `?vehicule=<id>`
Tri : `?ordering=date_creation` ou `?ordering=-date_creation`

## 4. Cycle de vie d'une demande

```
EN_ATTENTE  →  EN_TRAITEMENT  →  TERMINEE
    ↓
 ANNULEE
```

- `EN_ATTENTE` : statut initial, à la création.
- `EN_TRAITEMENT` / `TERMINEE` : seront positionnés par les futurs
  modules **diagnostic** et **intervention mécanique** (réservés au
  rôle `MECANICIEN`), pas encore implémentés dans ce module.
- `ANNULEE` : le client annule sa propre demande, uniquement possible
  tant qu'elle est `EN_ATTENTE`.

## 5. Règles métier implémentées

- Le véhicule sélectionné doit appartenir au client connecté et être
  actif (`vehicule.actif == True`).
- Le titre doit contenir au moins 5 caractères, la description au
  moins 10 — pour éviter les demandes vides ou inexploitables par
  l'atelier.
- Un client ne voit et ne modifie que ses propres demandes ; le staff
  (mécaniciens/gestionnaires) voit tout.
- Une fois la demande prise en charge (`EN_TRAITEMENT` ou `TERMINEE`),
  le client ne peut plus ni la modifier ni l'annuler.
- Le véhicule associé ne peut pas être changé après la création d'une
  demande (seuls le titre et la description sont modifiables).


## 6. Prochaines évolutions suggérées

- Module **diagnostics** (mécanicien) : ajoute une entité `Diagnostic`
  liée à `DemandeReparation`, fait passer le statut à `EN_TRAITEMENT`.
- Module **interventions mécaniques** (mécanicien) : documente les
  travaux réalisés, fait passer le statut à `TERMINEE`.
- Notification au client lors d'un changement de statut.
- Pièces jointes (photos du problème) sur la demande.
