from rest_framework import permissions, viewsets

from .models import DemandeReparation
from .serializers import DemandeReparationSerializer


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

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
