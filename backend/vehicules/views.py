from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Vehicule
from .permissions import EstProprietaireOuStaff
from .serializers import VehiculeListSerializer, VehiculeSerializer


class VehiculeViewSet(viewsets.ModelViewSet):
    """
    Endpoints exposés (routeur DRF) :

    GET    /api/vehicules/            -> liste des véhicules du client connecté
    POST   /api/vehicules/            -> création d'un véhicule
    GET    /api/vehicules/{id}/       -> détail d'un véhicule
    PUT    /api/vehicules/{id}/       -> mise à jour complète
    PATCH  /api/vehicules/{id}/       -> mise à jour partielle
    DELETE /api/vehicules/{id}/       -> désactivation (soft delete)
    POST   /api/vehicules/{id}/reactiver/ -> réactivation d'un véhicule désactivé
    """

    serializer_class = VehiculeSerializer
    permission_classes = [IsAuthenticated, EstProprietaireOuStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["marque", "carburant", "categorie", "actif"]
    search_fields = ["marque", "modele", "plaque_immatriculation", "vin"]
    ordering_fields = ["date_creation", "annee", "kilometrage"]
    ordering = ["-date_creation"]

    def get_queryset(self):
        """
        Un client authentifié ne voit que ses propres véhicules.
        Le staff (mécanicien / gestionnaire) voit l'ensemble des véhicules,
        ce qui est nécessaire pour la création des demandes de réparation.
        """
        user = self.request.user
        base_qs = Vehicule.objects.select_related("proprietaire")
        if user.is_staff:
            return base_qs
        return base_qs.filter(proprietaire=user)

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("format_simple"):
            return VehiculeListSerializer
        return VehiculeSerializer

    def perform_create(self, serializer):
        # Le véhicule créé est automatiquement associé au client connecté
        serializer.save(proprietaire=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Suppression logique (soft delete) : on conserve l'historique
        car un véhicule désactivé peut être lié à d'anciennes réparations.
        """
        instance = self.get_object()
        instance.actif = False
        instance.save(update_fields=["actif"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def reactiver(self, request, pk=None):
        vehicule = self.get_object()
        vehicule.actif = True
        vehicule.save(update_fields=["actif"])
        serializer = self.get_serializer(vehicule)
        return Response(serializer.data, status=status.HTTP_200_OK)