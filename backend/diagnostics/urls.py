from rest_framework.routers import DefaultRouter

from .views import DiagnosticViewSet

router = DefaultRouter()
router.register(r"diagnostics", DiagnosticViewSet, basename="diagnostic")

urlpatterns = router.urls
