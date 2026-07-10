from rest_framework.routers import DefaultRouter

from .views import DemandeReparationViewSet

router = DefaultRouter()
router.register(r"demandes-reparation", DemandeReparationViewSet, basename="demande-reparation")

urlpatterns = router.urls
