from rest_framework.permissions import BasePermission

from comptes.models import Utilisateur


class PeutAccederDiagnostic(BasePermission):
    """
    - Création (POST) : réservée aux mécaniciens (vérification fine —
      être bien le mécanicien assigné — faite dans le serializer).
    - Consultation/modification d'un diagnostic précis : le mécanicien
      auteur, le gestionnaire, l'administrateur, ou le client
      propriétaire de la demande (pour voir/valider son devis).
    - valider/refuser : réservées au client propriétaire de la demande.
    """

    def has_permission(self, request, view):
        user = request.user
        if user.role == "MECANICIEN":
            return True
        if user.role == "MECANICIEN":
            return True
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True
        if user.role == "MECANICIEN":
            return True
        if user.role == "GESTIONNAIRE":
            return True
