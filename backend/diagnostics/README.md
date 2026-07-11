# Module `diagnostics`

User story couverte :
> Le mécanicien ajoute des notes techniques de diagnostic, les
> réparations à faire, et envoie un devis au client pour validation.

Complète également :
> Lorsqu'une demande de réparation est affectée à un mécanicien, il
> peut refuser ou ajouter un diagnostic.

## 1. Dépendances

```python
INSTALLED_APPS = [
    ...
    "comptes",
    "vehicules",
    "demandes_reparation",
    "affectations",
    "diagnostics",
]
```

```bash
python manage.py makemigrations comptes vehicules demandes_reparation affectations diagnostics
python manage.py migrate
```

```python
# urls.py du projet
urlpatterns = [
    ...
    path("api/", include("comptes.urls")),
    path("api/", include("vehicules.urls")),
    path("api/", include("demandes_reparation.urls")),
    path("api/", include("affectations.urls")),
    path("api/", include("diagnostics.urls")),
]
```

## 2. Ce que « refuser ou ajouter un diagnostic » signifie concrètement

Deux actions distinctes, dans deux modules différents :

| Action | Endpoint | Module |
|---|---|---|
| Refuser l'affectation | `POST /api/affectations/{id}/refuser/` | `affectations` (mis à jour) |
| Ajouter un diagnostic | `POST /api/diagnostics/` | `diagnostics` (ce module) |

Refuser supprime l'affectation et repasse la demande à `EN_ATTENTE`
(le gestionnaire peut réaffecter). **Impossible de refuser une fois
qu'un diagnostic existe** — à ce stade, le travail a commencé.

## 3. Endpoints exposés

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | /api/diagnostics/ | Filtré selon le rôle | Liste des diagnostics |
| POST | /api/diagnostics/ | Mécanicien assigné | Créer le diagnostic (devis) |
| GET | /api/diagnostics/{id}/ | Client concerné, mécanicien auteur, gestionnaire, admin | Détail |
| PATCH | /api/diagnostics/{id}/ | Mécanicien auteur (si pas encore accepté) | Réviser le devis |
| POST | /api/diagnostics/{id}/valider/ | Client propriétaire de la demande | Accepter le devis |
| POST | /api/diagnostics/{id}/refuser/ | Client propriétaire de la demande | Refuser le devis |

## 4. Cycle de vie d'un diagnostic

```
                 ┌──────────────┐
   création  →   │ EN_ATTENTE_  │
                 │  VALIDATION  │
                 └──────┬───────┘
             valider ↙     ↘ refuser
        ┌──────────┐         ┌──────────┐
        │ ACCEPTE  │         │ REFUSE   │
        │ (figé)   │         │          │
        └──────────┘         └────┬─────┘
                                   │ le mécanicien révise (PATCH)
                                   ▼
                     retour à EN_ATTENTE_VALIDATION
```

## 5. Règles métier implémentées

- Seul le mécanicien **actuellement affecté** à la demande (via une
  `Affectation` active) peut créer son diagnostic — vérifié en
  interrogeant `affectations.models.Affectation`.
- Une demande doit être `EN_TRAITEMENT` (donc déjà affectée) pour
  recevoir un diagnostic.
- Un seul diagnostic par demande (`OneToOne`) : pas de doublon, on
  **révise** l'existant via `PATCH`.
- Une fois `ACCEPTE`, un diagnostic est figé (plus aucune modification).
- Réviser un diagnostic `REFUSE` le repasse automatiquement à
  `EN_ATTENTE_VALIDATION` et efface le commentaire/la date de réponse
  du refus précédent.
- Seul le client propriétaire de la demande peut valider/refuser le
  devis — pas le gestionnaire ni un autre client.

## 6. Exemple — créer un diagnostic (mécanicien)

```bash
curl -X POST http://localhost:8000/api/diagnostics/ \
  -H "Authorization: Bearer <token_mecanicien>" \
  -H "Content-Type: application/json" \
  -d '{
        "demande": 4,
        "notes_techniques": "Plaquettes de frein avant usées à 90 %.",
        "travaux_a_effectuer": "Remplacement des plaquettes et disques avant.",
        "cout_estime": "285.50"
      }'
```

## 7. Exemple — valider le devis (client)

```bash
curl -X POST http://localhost:8000/api/diagnostics/7/valider/ \
  -H "Authorization: Bearer <token_client>"
```

## 8. Prochaines évolutions suggérées

- Module **interventions mécaniques** : une fois le devis `ACCEPTE`,
  le mécanicien documente les travaux réalisés et fait passer la
  demande à `TERMINEE`.
- Devis itemisé (pièces / main-d'œuvre séparément) plutôt qu'un
  montant global.
- Notification au client à la création du devis, et au mécanicien
  lors de la validation/refus.
