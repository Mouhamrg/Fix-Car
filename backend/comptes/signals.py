from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profil


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def creer_profil_automatiquement(sender, instance, created, **kwargs):
    """
    Garantit qu'un Profil existe pour chaque User, même pour les comptes
    créés hors de l'API (ex: python manage.py createsuperuser, ou via
    l'admin Django).
    """
    if created:
        Profil.objects.get_or_create(user=instance)
