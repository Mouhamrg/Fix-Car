from decimal import ROUND_HALF_UP, Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from reparations.models import DemandeReparation

DEUX_DECIMALES = Decimal('0.01')


class Facture(models.Model):
    """
    Facture émise pour une demande de réparation : reprend la
    main-d'œuvre et les pièces saisies par le gestionnaire, calcule
    TPS/TVQ/total, et suit son propre cycle de règlement (#12).
    """

    class Statut(models.TextChoices):
        EMISE = 'emise', 'Émise'
        PAYEE = 'payee', 'Payée'
        ANNULEE = 'annulee', 'Annulée'

    TAUX_TPS = Decimal('0.05')
    TAUX_TVQ = Decimal('0.09975')

    demande = models.OneToOneField(
        DemandeReparation,
        on_delete=models.PROTECT,
        related_name='facture',
        verbose_name='Demande de réparation',
    )
    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        verbose_name='Numéro de facture',
    )
    date_emission = models.DateField(auto_now_add=True)
    montant_main_oeuvre = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Montant main-d'œuvre",
    )
    montant_pieces = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Montant pièces',
    )
    tps = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    tvq = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    montant_total = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EMISE,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-date_emission', '-id']

    def __str__(self):
        return self.numero

    def _calculer_montants(self):
        sous_total = self.montant_main_oeuvre + self.montant_pieces
        self.tps = (sous_total * self.TAUX_TPS).quantize(DEUX_DECIMALES, rounding=ROUND_HALF_UP)
        self.tvq = (sous_total * self.TAUX_TVQ).quantize(DEUX_DECIMALES, rounding=ROUND_HALF_UP)
        self.montant_total = sous_total + self.tps + self.tvq

    def _generer_numero(self):
        annee = timezone.now().year
        prefixe = f'FAC-{annee}-'
        dernier = (
            Facture.objects.filter(numero__startswith=prefixe)
            .order_by('-numero')
            .values_list('numero', flat=True)
            .first()
        )
        prochain_sequentiel = int(dernier.rsplit('-', 1)[1]) + 1 if dernier else 1
        return f'{prefixe}{prochain_sequentiel:04d}'

    def save(self, *args, **kwargs):
        self._calculer_montants()
        if not self.numero:
            self.numero = self._generer_numero()
        super().save(*args, **kwargs)
