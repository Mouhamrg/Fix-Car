from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Facture
from .serializers import FactureSerializer


class FactureViewSet(viewsets.ModelViewSet):
    """
    GET  /api/factures/       -> liste des factures
    POST /api/factures/       -> émettre une facture pour une demande
    GET  /api/factures/{id}/  -> détail d'une facture
    """

    queryset = Facture.objects.select_related('demande', 'demande__client').all()
    serializer_class = FactureSerializer
    permission_classes = [IsAuthenticated]
