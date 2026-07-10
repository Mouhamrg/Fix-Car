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

    @action(detail=True, methods=['patch'], url_path='changer-role')
    def changer_role(self, request, pk=None):
        utilisateur = self.get_object()
        if request.user.role != 'administrateur':
            return Response(
                {'detail': 'Seul un administrateur peut changer le rôle.'},
                status=status.HTTP_403_FORBIDDEN
            )
        role = request.data.get('role')
        if role not in [r[0] for r in Utilisateur.Role.choices]:
            return Response(
                {'detail': 'Rôle invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        utilisateur.role = role
        utilisateur.save()
        return Response({'statut': f'rôle changé en {role}'})

    @action(detail=True, methods=['patch'])
    def reactiver(self, request, pk=None):
        if request.user.role != 'administrateur':
            return Response(
                {'detail': 'Seul un administrateur peut réactiver un compte.'},
                status=status.HTTP_403_FORBIDDEN
            )
        utilisateur = self.get_object()
        utilisateur.is_active = True
        utilisateur.save()
        return Response({'statut': 'compte réactivé'})

    def get_queryset(self):
        queryset = Utilisateur.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
