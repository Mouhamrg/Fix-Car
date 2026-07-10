from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from demandes_reparation.models import DemandeReparation


class Diagnostic(models.Model):
    """
    Diagnostic technique établi par le mécanicien assigné à une
    demande de réparation : notes techniques, travaux proposés et
    devis (coût estimé), soumis à la validation du client.
    """

    class Statut(models.TextChoices):
        EN_ATTENTE_VALIDATION = "EN_ATTENTE_VALIDATION", "En attente de validation du client"
        ACCEPTE = "ACCEPTE", "Accepté par le client"
        REFUSE = "REFUSE", "Refusé par le client"

    demande = models.OneToOneField(
        DemandeReparation,
        on_delete=models.CASCADE,
        related_name="diagnostic",
        verbose_name="Demande de réparation",
    )
    mecanicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="diagnostics",
        verbose_name="Mécanicien",
    )
    notes_techniques = models.TextField(
        help_text="Observations techniques du mécanicien (cause du problème, état constaté)."
    )
    travaux_a_effectuer = models.TextField(
        help_text="Description des réparations proposées au client."
    )
    cout_estime = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Montant estimé du devis, en dollars canadiens.",
    )
    statut = models.CharField(
        max_length=25, choices=Statut.choices, default=Statut.EN_ATTENTE_VALIDATION
    )
    commentaire_client = models.TextField(
        blank=True, help_text="Motif du refus, fourni par le client (facultatif)."
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_reponse_client = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Diagnostic"
        verbose_name_plural = "Diagnostics"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"Diagnostic — {self.demande.titre} ({self.get_statut_display()})"
