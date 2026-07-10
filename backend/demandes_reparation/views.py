from django.core.exceptions import FieldError
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from comptes.models import Profil

from .models import DemandeReparation
from .permissions import EstClientOuStaff
from .serializers import DemandeReparationSerializer


class DemandeReparationViewSet(viewsets.ModelViewSet):
    """
    GET    /api/demandes-reparation/            -> liste des demandes du client connecté
    POST   /api/demandes-reparation/            -> création d'une demande
    GET    /api/demandes-reparation/{id}/       -> détail d'une demande
    PATCH  /api/demandes-reparation/{id}/       -> modification (titre/description, si EN_ATTENTE)
    POST   /api/demandes-reparation/{id}/annuler/ -> annulation (si EN_ATTENTE)

    Pas de PUT ni de DELETE : une demande n'est jamais supprimée, elle
    passe au statut ANNULEE pour conserver l'historique.
    """

    serializer_class = DemandeReparationSerializer
    permission_classes = [IsAuthenticated, EstClientOuStaff]
    http_method_names = ["get", "post", "patch", "head", "options"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["statut", "vehicule"]
    ordering_fields = ["date_creation", "date_modification"]
    ordering = ["-date_creation"]

    def get_queryset(self):
        user = self.request.user
        profil = getattr(user, "profil", None)
        role = profil.role if profil else None
        base_qs = DemandeReparation.objects.select_related("client", "vehicule")

        # Le gestionnaire (et l'administrateur) doit voir toutes les
        # demandes pour pouvoir les affecter à un mécanicien.
        if user.is_staff or user.is_superuser or role == Profil.Role.GESTIONNAIRE:
            return base_qs

        # Un mécanicien ne voit que les demandes qui lui sont affectées
        # (relation inverse fournie par le module affectations, si
        # celui-ci est installé).
        if role == Profil.Role.MECANICIEN:
            try:
                return base_qs.filter(affectation__mecanicien=user)
            except FieldError:
                return base_qs.none()

        return base_qs.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user, statut=DemandeReparation.Statut.EN_ATTENTE)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != DemandeReparation.Statut.EN_ATTENTE:
            return Response(
                {"detail": "Seule une demande en attente peut être annulée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        demande.statut = DemandeReparation.Statut.ANNULEE
        demande.date_annulation = timezone.now()
        demande.save(update_fields=["statut", "date_annulation"])
        serializer = self.get_serializer(demande)
        return Response(serializer.data, status=status.HTTP_200_OK)
