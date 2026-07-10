from rest_framework.routers import DefaultRouter

from .views import AffectationViewSet

router = DefaultRouter()
router.register(r"affectations", AffectationViewSet, basename="affectation")

urlpatterns = router.urls
