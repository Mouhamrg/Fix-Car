from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet

router = DefaultRouter()
router.register(r'comptes', UtilisateurViewSet, basename='comptes')

urlpatterns = router.urls