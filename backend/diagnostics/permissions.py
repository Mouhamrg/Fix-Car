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
        if getattr(view, "action", None) == "create":
            profil = getattr(request.user, "profil", None)
            return bool(profil and Utilisateur.role == Utilisateur.Role.MECANICIEN)
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True

        if getattr(view, "action", None) in ("valider", "refuser"):
            return obj.demande.client_id == user.id

        profil = getattr(user, "profil", None)
        role = Utilisateur.role if profil else None

        if role == Utilisateur.Role.GESTIONNAIRE:
            return True
        if role == Utilisateur.Role.MECANICIEN:
            return obj.mecanicien_id == user.id
        return obj.demande.client_id == user.id
