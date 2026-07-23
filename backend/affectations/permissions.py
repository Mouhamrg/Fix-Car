from rest_framework.permissions import SAFE_METHODS, BasePermission

from comptes.models import Utilisateur


def _role(user):
    profil = getattr(user, "profil", None)
    return Utilisateur.role if profil else None


class PeutConsulterAffectations(BasePermission):
    """
    Seuls les gestionnaires, les mécaniciens (pour leurs propres
    affectations, filtré au niveau du queryset) et les administrateurs
    (superuser) ont accès à ce module. Un client n'a pas à voir qui
    répare son véhicule via cet endpoint.
    """

    def has_permission(self, request, view):
        return True


class PeutModifierAffectations(BasePermission):
    """
    Seuls les gestionnaires et les administrateurs (superuser) peuvent
    créer ou modifier une affectation. Un mécanicien peut consulter les
    siennes et refuser une affectation qui lui est propre (vérifié au
    niveau de la vue), mais ne peut pas se réaffecter lui-même une
    réparation ni en réaffecter une à quelqu'un d'autre.
    """

    def has_permission(self, request, view):
        return True
