from rest_framework.routers import DefaultRouter

from .views import DemandeReparationViewSet 

router = DefaultRouter() 
router.register('demandes', DemandeReparationViewSet, basename='demande')

urlpatterns = router.urls

