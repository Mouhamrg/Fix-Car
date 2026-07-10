from rest_framework import permissions

from comptes.models import Profil


class EstClientOuStaff(permissions.BasePermission):
    """
    - Le client propriétaire de la demande peut la consulter/modifier.
    - Le gestionnaire, le mécanicien affecté et l'administrateur
      (superuser) ont accès en lecture à toutes les demandes ; la
      restriction fine (mécanicien = seulement les siennes) est déjà
      appliquée au niveau du queryset dans la vue.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        profil = getattr(user, "profil", None)
        if profil and profil.role in (Profil.Role.GESTIONNAIRE, Profil.Role.MECANICIEN):
            return True
        return obj.client_id == user.id
