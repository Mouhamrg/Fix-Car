from rest_framework.decorators import api_view, permission_classes
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Utilisateur
from .serializers import UtilisateurSerializer, InscriptionSerializer, CreationCompteSerializer, IdentifiantTokenObtainPairSerializer

class EstProprietaireOuAdmin(permissions.BasePermission):
    """Un utilisateur peut modifier son propre compte.
    Un administrateur peut modifier n'importe quel compte."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == Utilisateur.Role.ADMINISTRATEUR:
            return True
        return obj.id == request.user.id

class EstAdmin(permissions.BasePermission):
    """Seul un administrateur peut effectuer cette action."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == Utilisateur.Role.ADMINISTRATEUR
        )

REGLES_CREATION_COMPTE = {
    Utilisateur.Role.MECANICIEN: [Utilisateur.Role.GESTIONNAIRE, Utilisateur.Role.ADMINISTRATEUR],
    Utilisateur.Role.GESTIONNAIRE: [Utilisateur.Role.GESTIONNAIRE, Utilisateur.Role.ADMINISTRATEUR],
    Utilisateur.Role.ADMINISTRATEUR: [Utilisateur.Role.ADMINISTRATEUR],
}

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'inscription':
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), EstProprietaireOuAdmin()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), EstAdmin()]
        if self.action == 'creer_compte':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'inscription':
            return InscriptionSerializer
        if self.action == 'creer_compte':
            return CreationCompteSerializer
        return UtilisateurSerializer

    def _nettoyer_donnees_modifiables(self, request):
        """role et is_active ne passent jamais par la mise à jour générique :
        ils ont leurs propres actions (changer-role, desactiver, reactiver)
        avec leur propre contrôle d'accès."""
        donnees = request.data.copy()
        donnees.pop('role', None)
        donnees.pop('is_active', None)
        return donnees

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        donnees = self._nettoyer_donnees_modifiables(request)
        serializer = self.get_serializer(instance, data=donnees, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def inscription(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='creer')
    def creer_compte(self, request):
        role_demande = request.data.get('role')

        if role_demande == Utilisateur.Role.CLIENT:
            return Response(
                {'detail': "Utilisez /api/comptes/inscription/ pour créer un compte client."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role_demande not in [r[0] for r in Utilisateur.Role.choices]:
            return Response(
                {'detail': 'Rôle invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        roles_autorises = REGLES_CREATION_COMPTE.get(role_demande, [])
        if request.user.role not in roles_autorises:
            return Response(
                {'detail': "Vous n'avez pas la permission de créer un compte avec ce rôle."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreationCompteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def desactiver(self, request, pk=None):
        if request.user.role != Utilisateur.Role.ADMINISTRATEUR:
            return Response(
                {'detail': 'Seul un administrateur peut désactiver un compte.'},
                status=status.HTTP_403_FORBIDDEN
            )
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
        if request.user.role != Utilisateur.Role.ADMINISTRATEUR:
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
        if request.user.role != Utilisateur.Role.ADMINISTRATEUR:
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
class IdentifiantTokenObtainPairView(TokenObtainPairView):
    serializer_class = IdentifiantTokenObtainPairSerializer
