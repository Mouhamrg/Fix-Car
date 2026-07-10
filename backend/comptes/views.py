from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Profil
from .serializers import (
    ChangerMotDePasseSerializer,
    InscriptionSerializer,
    MonTokenObtainPairSerializer,
    ProfilSerializer,
)


class MonTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/connexion/
    Corps attendu : { "username": "...", "password": "..." }
    Réponse : { "access": "...", "refresh": "...", "user": {...} }
    """

    serializer_class = MonTokenObtainPairSerializer


class InscriptionView(generics.CreateAPIView):
    """
    POST /api/comptes/inscription/

    Endpoint public (aucune authentification requise) permettant à un
    client de créer son compte. Le rôle est automatiquement CLIENT.
    """

    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]


class MonProfilView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/comptes/profil/  -> consulter son propre profil
    PUT   /api/comptes/profil/  -> mise à jour complète
    PATCH /api/comptes/profil/  -> mise à jour partielle

    Un utilisateur ne peut consulter/modifier que son propre profil :
    il n'y a pas de paramètre {id} dans l'URL, get_object() renvoie
    toujours request.user.profil.
    """

    serializer_class = ProfilSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # get_or_create couvre le cas des comptes déjà existants avant
        # l'ajout de ce module (ex: superuser créé via createsuperuser).
        profil, _ = Profil.objects.get_or_create(user=self.request.user)
        return profil


class ChangerMotDePasseView(APIView):
    """
    POST /api/comptes/changer-mot-de-passe/
    Corps attendu : ancien_mot_de_passe, nouveau_mot_de_passe, nouveau_mot_de_passe2
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangerMotDePasseSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK
        )
