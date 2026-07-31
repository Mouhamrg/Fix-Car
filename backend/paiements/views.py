from rest_framework import permissions, viewsets

from .models import Facture, Paiement
from .permissions import ROLES_STAFF, EstClientProprietaireOuStaff
from .serializers import PaiementSerializer


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
        if total_paye >= facture.montant_total:
            facture.statut = Facture.Statut.PAYEE
            facture.save(update_fields=['statut', 'date_modification'])
