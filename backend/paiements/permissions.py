from rest_framework import permissions

from comptes.models import Utilisateur

ROLES_STAFF = (
    Utilisateur.Role.MECANICIEN,
    Utilisateur.Role.GESTIONNAIRE,
    Utilisateur.Role.ADMINISTRATEUR,
)


class EstClientProprietaireOuStaff(permissions.BasePermission):
    """
    - Le staff (mécaniciens, gestionnaires, administrateurs) a un accès complet.
    - Un client ne peut voir/payer que les paiements liés à ses
      propres factures (elles-mêmes liées à ses demandes de réparation).

    Basé sur `role` plutôt que `is_staff` : ce dernier n'est pas
    synchronisé avec le rôle métier tant que #1/#8 ne le font pas.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role in ROLES_STAFF:
            return True
        return obj.facture.demande.client_id == user.id
