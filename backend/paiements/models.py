from django.core.exceptions import ValidationError
from django.db import models

from reparations.models import DemandeReparation


class Facture(models.Model):
    """Facture minimale émise pour une demande de réparation (#13).

    Modèle provisoire tant que la génération de factures (#12) n'est
    pas implémentée par ailleurs; à faire évoluer (numérotation,
    détail des lignes, taxes...) lors de l'intégration de #12.
    """

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente de paiement'
        PAYEE = 'payee', 'Payée'
        ANNULEE = 'annulee', 'Annulée'

    demande = models.ForeignKey(
        DemandeReparation,
        on_delete=models.CASCADE,
        related_name='factures',
        verbose_name='Demande de réparation',
    )
    montant = models.DecimalField(max_digits=8, decimal_places=2)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )
    date_emission = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-date_emission']

    def __str__(self):
        return f'Facture #{self.pk} — {self.demande.titre} ({self.montant} $)'


class Paiement(models.Model):
    """Paiement effectué par un client pour régler une facture (#13)."""

    class Methode(models.TextChoices):
        CARTE = 'carte', 'Carte de crédit/débit'
        VIREMENT = 'virement', 'Virement bancaire'
        ESPECES = 'especes', 'Espèces'
        AUTRE = 'autre', 'Autre'

    class Statut(models.TextChoices):
        REUSSI = 'reussi', 'Réussi'
        ECHOUE = 'echoue', 'Échoué'
        REMBOURSE = 'rembourse', 'Remboursé'

    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='paiements',
        verbose_name='Facture',
    )
    montant = models.DecimalField(max_digits=8, decimal_places=2)
    methode = models.CharField(max_length=20, choices=Methode.choices)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.REUSSI,
    )
    reference_transaction = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']

    def __str__(self):
        return f'Paiement {self.montant} $ — Facture #{self.facture_id}'

    def clean(self):
        if self.montant is not None and self.montant <= 0:
            raise ValidationError({'montant': 'Le montant doit être supérieur à zéro.'})
