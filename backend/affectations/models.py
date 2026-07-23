from django.conf import settings
from django.db import models

from reparations.models import DemandeReparation


class Affectation(models.Model):
    """
    Affecte une demande de réparation à un mécanicien. Relation
    OneToOne : une demande n'a qu'une affectation active à la fois,
    modifiable (réaffectation) plutôt que dupliquée.
    """

    demande = models.OneToOneField(
        DemandeReparation,
        on_delete=models.CASCADE,
        related_name="affectation",
        verbose_name="Demande de réparation",
    )
    mecanicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="affectations",
        verbose_name="Mécanicien assigné",
    )
    affecte_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="affectations_realisees",
        verbose_name="Affecté par",
        help_text="Le gestionnaire (ou administrateur) ayant réalisé l'affectation.",
    )
    commentaire = models.TextField(
        blank=True, help_text="Note interne du gestionnaire (facultatif)."
    )
    date_affectation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Affectation"
        verbose_name_plural = "Affectations"
        ordering = ["-date_affectation"]

    def __str__(self):
        return f"{self.demande.titre} → {self.mecanicien.get_username()}"
