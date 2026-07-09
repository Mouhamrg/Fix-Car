from django.conf import settings
from django.db import models


class Intervention(models.Model):
    """Intervention mécanique documentée par un mécanicien (#67).

    Le véhicule est un champ texte libre tant que les demandes de
    réparation (#64) ne sont pas implémentées; il deviendra une clé
    étrangère à ce moment-là.
    """

    class Statut(models.TextChoices):
        EN_COURS = 'en_cours', 'En cours'
        TERMINEE = 'terminee', 'Terminée'

    titre = models.CharField(max_length=200)
    vehicule = models.CharField(max_length=200)
    description = models.TextField()
    date_intervention = models.DateField()
    duree_heures = models.DecimalField(max_digits=4, decimal_places=2)
    pieces_utilisees = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_COURS,
    )
    mecanicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interventions',
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_intervention']

    def __str__(self):
        return f'{self.titre} — {self.vehicule}'
