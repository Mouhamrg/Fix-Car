from rest_framework.routers import DefaultRouter

from .views import FactureViewSet, PaiementViewSet

router = DefaultRouter()
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')

urlpatterns = router.urls
