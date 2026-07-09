from rest_framework.routers import DefaultRouter

from .views import DemandeReparationViewSet, TypeReparationViewSet

router = DefaultRouter()
router.register('demandes', DemandeReparationViewSet, basename='demande')
router.register('types-reparations', TypeReparationViewSet, basename='type-reparation')

urlpatterns = router.urls

