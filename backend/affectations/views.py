from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from comptes.models import Utilisateur
from reparations.models import DemandeReparation

from .models import Affectation
from .permissions import PeutConsulterAffectations, PeutModifierAffectations
from .serializers import AffectationSerializer, MecanicienDisponibleSerializer


class AffectationViewSet(viewsets.ModelViewSet):
    """
    GET   /api/affectations/                       -> liste (gestionnaire/admin: toutes ; mécanicien: les siennes)
    POST  /api/affectations/                        -> affecter une demande à un mécanicien
    GET   /api/affectations/{id}/                   -> détail
    PATCH /api/affectations/{id}/                   -> réaffecter / modifier le commentaire
    GET   /api/affectations/mecaniciens-disponibles/ -> liste des mécaniciens pour peupler un sélecteur

    Pas de DELETE : une affectation se modifie (réaffectation), elle ne
    se supprime pas, pour conserver un historique.
    """

    serializer_class = AffectationSerializer
    permission_classes = [IsAuthenticated, PeutConsulterAffectations, PeutModifierAffectations]
    http_method_names = ["get", "post", "patch", "head", "options"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["mecanicien", "demande"]
    ordering_fields = ["date_affectation", "date_modification"]
    ordering = ["-date_affectation"]

    def get_queryset(self):
        user = self.request.user
        profil = getattr(user, "profil", None)
        qs = Affectation.objects.select_related(
            "demande", "demande__client", "demande__vehicule", "mecanicien", "affecte_par"
        )

        if user.is_superuser or (profil and profil.role == Utilisateur.Role.GESTIONNAIRE):
            return qs
        if profil and Utilisateur.role == Utilisateur.Role.MECANICIEN:
            return qs.filter(mecanicien=user)
        return qs.none()

    def perform_create(self, serializer):
        # La transition EN_ATTENTE -> EN_TRAITEMENT est gérée par le
        # signal post_save (affectations/signals.py), qui s'applique
        # peu importe le point d'entrée de création.
        serializer.save(affecte_par=self.request.user)

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        """
        Le mécanicien assigné refuse la réparation. Possible uniquement
        tant qu'aucun diagnostic n'a encore été ajouté (une fois le
        diagnostic commencé, il n'est plus question de refuser mais de
        terminer ou d'escalader au gestionnaire).
        """
        affectation = self.get_object()

        if affectation.mecanicien_id != request.user.id:
            return Response(
                {"detail": "Seul le mécanicien assigné peut refuser cette affectation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # hasattr fonctionne ici sans importer le modèle Diagnostic :
        # Django fait hériter l'exception "DoesNotExist" d'une relation
        # OneToOne inverse de AttributeError précisément pour ce cas.
        if hasattr(affectation.demande, "diagnostic"):
            return Response(
                {"detail": "Un diagnostic a déjà été ajouté ; l'affectation ne peut plus être refusée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        demande = affectation.demande
        demande.statut = DemandeReparation.Statut.EN_ATTENTE
        demande.save(update_fields=["statut"])
        affectation.delete()

        return Response(
            {"detail": "Affectation refusée. La demande est de nouveau en attente d'affectation."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="mecaniciens-disponibles")
    def mecaniciens_disponibles(self, request):
        """
        Liste des comptes ayant le rôle MECANICIEN, triés par
        disponibilité (les disponibles en premier), pour aider le
        gestionnaire à choisir à qui affecter une réparation.
        """
        profils = (
            Utilisateur.objects.filter(role=Utilisateur.Role.MECANICIEN)
            .select_related("user")
            .order_by("-disponible", "user__username")
        )
        serializer = MecanicienDisponibleSerializer(profils, many=True)
        return Response(serializer.data)