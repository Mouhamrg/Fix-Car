from rest_framework import permissions, viewsets

from .models import Facture, Paiement
from .permissions import ROLES_STAFF, EstClientProprietaireOuStaff
from .serializers import FactureSerializer, PaiementSerializer


class _EstStaff(permissions.BasePermission):
    """Création/modification de factures réservée au staff, le temps que #12
    (génération automatique des factures) soit implémentée."""

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and (user.is_superuser or user.role in ROLES_STAFF)


class FactureViewSet(viewsets.ModelViewSet):
    """
    GET    /api/factures/            -> factures du client connecté (ou toutes pour le staff)
    GET    /api/factures/{id}/       -> détail d'une facture
    POST   /api/factures/            -> création (réservée au staff, en attendant #12)
    """

    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated, EstClientProprietaireOuStaff]

    def get_queryset(self):
        user = self.request.user
        queryset = Facture.objects.select_related('demande', 'demande__client')
        if user.is_superuser or user.role in ROLES_STAFF:
            return queryset
        return queryset.filter(demande__client=user)

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), _EstStaff()]
        return super().get_permissions()


class PaiementViewSet(viewsets.ModelViewSet):
    """
    GET    /api/paiements/            -> paiements du client connecté (ou tous pour le staff)
    POST   /api/paiements/            -> effectuer un paiement sur une facture
    GET    /api/paiements/{id}/       -> détail d'un paiement
    """

    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated, EstClientProprietaireOuStaff]

    def get_queryset(self):
        user = self.request.user
        queryset = Paiement.objects.select_related('facture', 'facture__demande')
        if user.is_superuser or user.role in ROLES_STAFF:
            return queryset
        return queryset.filter(facture__demande__client=user)

    def perform_create(self, serializer):
        paiement = serializer.save()
        facture = paiement.facture
        total_paye = sum(
            p.montant for p in facture.paiements.filter(statut=Paiement.Statut.REUSSI)
        )
        if total_paye >= facture.montant:
            facture.statut = Facture.Statut.PAYEE
            facture.save(update_fields=['statut', 'date_modification'])
