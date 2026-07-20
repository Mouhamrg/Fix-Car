"""
URL configuration for fixmycar_backend project.

https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from comptes.views import IdentifiantTokenObtainPairView


@api_view(['GET'])
def me(request):
    """Renvoie l'utilisateur connecté — sert à valider la chaîne JWT."""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', IdentifiantTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', me, name='me'),
    path('api/', include('rendezvous.urls')),
    path('api/', include('reparations.urls')),
    path('api/', include('interventions.urls')),
    path('api/', include('comptes.urls')),
]
