from rest_framework import permissions


class EstProprietaireOuStaff(permissions.BasePermission):
    """
    - Lecture/écriture autorisée au propriétaire du véhicule.
    - Le staff (ex: mécaniciens, gestionnaires) a un accès en lecture à tous
      les véhicules (utile pour rattacher une demande de réparation), et en
      écriture si besoin (ex: mise à jour du kilométrage lors d'une intervention).
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.proprietaire_id == request.user.id