from django.conf import settings
from django.db import models


class DemandeReparation(models.Model):
    """Demande de reparation soumise par un client (#64).

    Le vehicule est un champ texte libre tant que la gestion des
    vehicules (#2) n'est pas implementee; il deviendra une cle
    etrangere a ce moment-la.
    """

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente'
        ACCEPTEE = 'acceptee', 'Acceptee'
        REFUSEE = 'refusee', 'Refusee'
        TERMINEE = 'terminee', 'Terminee'

    titre = models.CharField(max_length=200)
    vehicule = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_reparation',
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f'{self.titre} — {self.vehicule}'

