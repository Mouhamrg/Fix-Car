from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import RendezVous
from .serializers import RendezVousSerializer


class RendezVousViewSet(viewsets.ModelViewSet):
    serializer_class = RendezVousSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return (
            RendezVous.objects.select_related("client")
            .filter(client=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def _changer_statut(self, nouveau_statut):
        rendez_vous = self.get_object()
        if not rendez_vous.transition_valide(nouveau_statut):
            return Response(
                {
                    "detail": (
                        f"Transition invalide : un rendez-vous "
                        f"« {rendez_vous.get_statut_display()} » ne peut pas passer à "
                        f"« {RendezVous.Statut(nouveau_statut).label} »."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        rendez_vous.statut = nouveau_statut
        rendez_vous.save(update_fields=["statut", "date_modification"])
        return Response(self.get_serializer(rendez_vous).data)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        return self._changer_statut(RendezVous.Statut.ANNULE)

    # TODO(roles) : confirmer/completer devraient etre reserves au staff.
    # En attente de la decision d'equipe sur les roles (#1/#68) —
    # a brancher ici via une permission dediee.
    @action(detail=True, methods=["post"])
    def confirmer(self, request, pk=None):
        return self._changer_statut(RendezVous.Statut.CONFIRME)

    @action(detail=True, methods=["post"])
    def completer(self, request, pk=None):
        return self._changer_statut(RendezVous.Statut.COMPLETE)