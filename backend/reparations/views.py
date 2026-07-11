from rest_framework import permissions, viewsets

from .models import DemandeReparation, TypeReparation
from .serializers import DemandeReparationSerializer, TypeReparationSerializer


class EstClientAuteurOuLectureSeule(permissions.BasePermission):
    """Lecture pour tout utilisateur authentifie (traçabilite);
    modification et suppression reservees au client auteur."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.client == request.user


class DemandeReparationViewSet(viewsets.ModelViewSet):
    queryset = DemandeReparation.objects.select_related('client')
    serializer_class = DemandeReparationSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        EstClientAuteurOuLectureSeule,
    ]

    def get_queryset(self):
        """Par defaut : toutes les demandes (comportement documente de #4).
        Avec ?mes=1 : uniquement celles du client connecte (#5, suivi)."""
        queryset = super().get_queryset()
        if self.request.query_params.get('mes') == '1':
            queryset = queryset.filter(client=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

class TypeReparationViewSet(viewsets.ModelViewSet):
    queryset = TypeReparation.objects.all()
    serializer_class = TypeReparationSerializer
    permission_classes = [permissions.IsAuthenticated]
