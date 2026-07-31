from decimal import Decimal

from django.db.models import Sum
from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reparations.models import DemandeReparation

from .models import Facture
from .pdf import generer_pdf_facture
from .serializers import FactureSerializer


def _calculer_montant_main_oeuvre(diagnostic):
    """
    Montant de main-d'œuvre = somme des prix_standard des types de
    réparation préconisés au diagnostic (#12).

    Fallback sur cout_estime (devis saisi à la main par le mécanicien)
    si le diagnostic n'a aucun type de réparation lié — catalogue pas
    encore utilisé pour cette demande — ou s'il n'y a pas de diagnostic
    du tout, auquel cas le montant est de 0.
    """
    if diagnostic is None:
        return Decimal('0')

    total = diagnostic.types_reparation.aggregate(total=Sum('prix_standard'))['total']
    if total is not None:
        return total

    return diagnostic.cout_estime


class FactureViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    GET  /api/factures/            -> liste des factures
    GET  /api/factures/{id}/       -> détail d'une facture
    GET  /api/factures/{id}/pdf/   -> télécharge la facture en PDF
    POST /api/factures/generer/    -> le client génère la facture d'une de ses demandes terminées

    Pas de création manuelle (#12, changement de conception validé par
    le PO) : la facture ne peut naître que de l'action /generer/,
    initiée par le client lui-même, sans saisie de montant.
    """

    queryset = Facture.objects.select_related('demande', 'demande__client').all()
    serializer_class = FactureSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        facture = self.get_object()
        contenu = generer_pdf_facture(facture)
        reponse = HttpResponse(contenu, content_type='application/pdf')
        reponse['Content-Disposition'] = f'attachment; filename="{facture.numero}.pdf"'
        return reponse

    @action(detail=False, methods=['post'])
    def generer(self, request):
        """
        Le client génère lui-même la facture d'une de ses demandes
        terminées, sans saisir aucun montant (#12, changement de
        conception validé par le PO).
        """
        demande_id = request.data.get('demande')
        try:
            demande = DemandeReparation.objects.get(pk=demande_id, client=request.user)
        except (DemandeReparation.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': "Demande introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if demande.statut != DemandeReparation.Statut.TERMINEE:
            return Response(
                {'detail': "La demande doit être terminée avant de générer une facture."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(demande, 'facture'):
            return Response(
                {'detail': "Cette demande est déjà facturée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diagnostic = getattr(demande, 'diagnostic', None)
        montant_main_oeuvre = _calculer_montant_main_oeuvre(diagnostic)

        # TODO: montant_pieces à 0 tant que LignePiece (#15) n'existe pas.
        facture = Facture.objects.create(
            demande=demande,
            montant_main_oeuvre=montant_main_oeuvre,
            montant_pieces=Decimal('0'),
        )

        serializer = self.get_serializer(facture)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
