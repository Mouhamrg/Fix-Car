from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Utilisateur
from .serializers import UtilisateurSerializer, InscriptionSerializer


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'inscription':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'inscription':
            return InscriptionSerializer
        return UtilisateurSerializer

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def inscription(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def desactiver(self, request, pk=None):
        utilisateur = self.get_object()
        utilisateur.is_active = False
        utilisateur.save()
        return Response({'statut': 'compte désactivé'})

    @action(detail=True, methods=['delete'], url_path='supprimer-mon-compte')
    def supprimer_mon_compte(self, request, pk=None):
        utilisateur = self.get_object()
        if utilisateur.id != request.user.id:
            return Response(
                {'detail': 'Vous ne pouvez supprimer que votre propre compte.'},
                status=status.HTTP_403_FORBIDDEN
            )
        utilisateur.is_active = False
        utilisateur.save()
        return Response({'statut': 'compte supprimé'})