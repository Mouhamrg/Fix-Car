from django.conf import settings
from django.db import models

from vehicules.models import Vehicule


class DemandeReparation(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        EN_TRAITEMENT = "EN_TRAITEMENT", "En traitement"
        TERMINEE = "TERMINEE", "Terminée"
        ANNULEE = "ANNULEE", "Annulée"

    # Statuts pour lesquels le client peut encore modifier ou annuler
    # sa demande (avant qu'un mécanicien ne l'ait prise en charge).
    STATUTS_MODIFIABLES_PAR_CLIENT = [Statut.EN_ATTENTE]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="demandes_reparation",
        verbose_name="Client",
    )
    vehicule = models.ForeignKey(
        Vehicule,
        on_delete=models.PROTECT,
        related_name="demandes_reparation",
        verbose_name="Véhicule concerné",
    )
    titre = models.CharField(
        max_length=120,
        help_text="Résumé court du problème (ex: Bruit anormal au freinage)",
    )
    description_probleme = models.TextField(
        help_text="Description détaillée du problème rencontré par le client."
    )
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_annulation = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Demande de réparation"
        verbose_name_plural = "Demandes de réparation"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"{self.titre} — {self.vehicule.plaque_immatriculation} ({self.get_statut_display()})"

    @property
    def est_modifiable_par_client(self) -> bool:
        return self.statut in self.STATUTS_MODIFIABLES_PAR_CLIENT
