from rest_framework.routers import DefaultRouter

from .views import VehiculeViewSet

router = DefaultRouter()
router.register(r"vehicules", VehiculeViewSet, basename="vehicule")

urlpatterns = router.urls