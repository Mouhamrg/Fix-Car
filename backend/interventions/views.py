from rest_framework import permissions, viewsets

from .models import Intervention
from .serializers import InterventionSerializer


class EstMecanicienAuteurOuLectureSeule(permissions.BasePermission):
    """Lecture pour tout utilisateur authentifié (traçabilité);
    modification et suppression réservées au mécanicien auteur."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.mecanicien == request.user


class InterventionViewSet(viewsets.ModelViewSet):
    queryset = Intervention.objects.select_related('mecanicien')
    serializer_class = InterventionSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        EstMecanicienAuteurOuLectureSeule,
    ]

    def perform_create(self, serializer):
        serializer.save(mecanicien=self.request.user)
