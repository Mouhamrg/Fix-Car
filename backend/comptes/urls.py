from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import ChangerMotDePasseView, InscriptionView, MonProfilView, MonTokenObtainPairView

urlpatterns = [
    path("comptes/inscription/", InscriptionView.as_view(), name="inscription"),
    path("comptes/profil/", MonProfilView.as_view(), name="mon-profil"),
    path(
        "comptes/changer-mot-de-passe/",
        ChangerMotDePasseView.as_view(),
        name="changer-mot-de-passe",
    ),
    path("auth/connexion/", MonTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/rafraichir/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verifier/", TokenVerifyView.as_view(), name="token_verify"),
]
