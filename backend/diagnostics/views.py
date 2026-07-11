from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from comptes.models import Utilisateur

from .models import Diagnostic
from .permissions import PeutAccederDiagnostic
from .serializers import DiagnosticSerializer


class DiagnosticViewSet(viewsets.ModelViewSet):
    """
    GET   /api/diagnostics/               -> liste (filtrée selon le rôle)
    POST  /api/diagnostics/               -> le mécanicien assigné crée le diagnostic (devis)
    GET   /api/diagnostics/{id}/          -> détail
    PATCH /api/diagnostics/{id}/          -> réviser (si pas encore accepté)
    POST  /api/diagnostics/{id}/valider/  -> le client accepte le devis
    POST  /api/diagnostics/{id}/refuser/  -> le client refuse le devis

    Pas de DELETE : un diagnostic refusé se révise (PATCH), il ne
    disparaît jamais, pour conserver l'historique du dossier.
    """

    serializer_class = DiagnosticSerializer
    permission_classes = [IsAuthenticated, PeutAccederDiagnostic]
    http_method_names = ["get", "post", "patch", "head", "options"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["statut", "demande"]
    ordering_fields = ["date_creation", "date_modification"]
    ordering = ["-date_creation"]

    def get_queryset(self):
        user = self.request.user
        profil = getattr(user, "Utilisateur", None)
        role = Utilisateur.role if profil else None
        qs = Diagnostic.objects.select_related(
            "demande", "demande__client", "demande__vehicule", "mecanicien"
        )

        if user.is_superuser or role == Utilisateur.Role.GESTIONNAIRE:
            return qs
        if role == Utilisateur.Role.MECANICIEN:
            return qs.filter(mecanicien=user)
        return qs.filter(demande__client=user)

    def perform_create(self, serializer):
        serializer.save(mecanicien=self.request.user)

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        diagnostic = self.get_object()
        if diagnostic.statut != Diagnostic.Statut.EN_ATTENTE_VALIDATION:
            return Response(
                {"detail": "Ce devis n'est plus en attente de validation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        diagnostic.statut = Diagnostic.Statut.ACCEPTE
        diagnostic.date_reponse_client = timezone.now()
        diagnostic.save(update_fields=["statut", "date_reponse_client"])
        return Response(self.get_serializer(diagnostic).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        diagnostic = self.get_object()
        if diagnostic.statut != Diagnostic.Statut.EN_ATTENTE_VALIDATION:
            return Response(
                {"detail": "Ce devis n'est plus en attente de validation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        diagnostic.statut = Diagnostic.Statut.REFUSE
        diagnostic.commentaire_client = request.data.get("commentaire_client", "")
        diagnostic.date_reponse_client = timezone.now()
        diagnostic.save(update_fields=["statut", "commentaire_client", "date_reponse_client"])
        return Response(self.get_serializer(diagnostic).data, status=status.HTTP_200_OK)
