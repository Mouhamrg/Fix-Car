from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    """Modèle utilisateur personnalisé avec rôle."""

    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Client'
        MECANICIEN = 'MECANICIEN', 'Mécanicien'
        GESTIONNAIRE = 'GESTIONNAIRE', 'Gestionnaire'
        ADMINISTRATEUR = 'ADMINISTRATEUR', 'Administrateur'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
    telephone = models.CharField(max_length=20, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.role})"