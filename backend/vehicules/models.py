import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def valider_plaque_quebec(value: str) -> None:
    """
    Valide le format d'une plaque d'immatriculation émise par la SAAQ.
    """
    valeur = value.upper().replace(" ", "").replace("-", "")

    format_standard = r"^[A-Z]{3}\d{3}$"
    format_specialise = r"^[A-Z]{2,3}\d{3,4}$"

    if not (re.match(format_standard, valeur) or re.match(format_specialise, valeur)):
        raise ValidationError(
            "%(value)s n'est pas un format de plaque d'immatriculation "
            "valide pour le Québec (ex: ABC 123).",
            params={"value": value},
        )


def valider_vin(value: str) -> None:
    if value and not re.match(r"^[A-HJ-NPR-Z0-9]{17}$", value.upper()):
        raise ValidationError(
            "%(value)s n'est pas un NIV (VIN) valide : 17 caractères "
            "alphanumériques attendus (sans I, O, Q).",
            params={"value": value},
        )


class Vehicule(models.Model):
    class Carburant(models.TextChoices):
        ESSENCE = "ESSENCE", "Essence"
        DIESEL = "DIESEL", "Diesel"
        HYBRIDE = "HYBRIDE", "Hybride"
        HYBRIDE_RECHARGEABLE = "HYBRIDE_RECHARGEABLE", "Hybride rechargeable"
        ELECTRIQUE = "ELECTRIQUE", "Électrique"
        AUTRE = "AUTRE", "Autre"

    class CategorieVehicule(models.TextChoices):
        PROMENADE = "PROMENADE", "Véhicule de promenade"
        CAMION_LEGER = "CAMION_LEGER", "Camion léger / VUS"
        MOTO = "MOTO", "Motocyclette"
        REMORQUE = "REMORQUE", "Remorque"
        VEHICULE_LOURD = "VEHICULE_LOURD", "Véhicule lourd"
        AUTRE = "AUTRE", "Autre"

    proprietaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vehicules",
        verbose_name="Propriétaire",
    )
    marque = models.CharField(max_length=50)
    modele = models.CharField(max_length=50)
    annee = models.PositiveIntegerField(
        help_text="Année de fabrication du véhicule (ex: 2018)"
    )
    couleur = models.CharField(max_length=30, blank=True)

    categorie = models.CharField(
        "Catégorie de véhicule",
        max_length=20,
        choices=CategorieVehicule.choices,
        default=CategorieVehicule.PROMENADE,
    )

    plaque_immatriculation = models.CharField(
        "Plaque d'immatriculation (SAAQ)",
        max_length=10,
        unique=True,
        validators=[valider_plaque_quebec],
        db_index=True,
        help_text="Format SAAQ, ex: ABC 123",
    )
    numero_certificat_immatriculation = models.CharField(
        "Numéro de certificat d'immatriculation",
        max_length=20,
        blank=True,
        null=True,
    )
    vin = models.CharField(
        "NIV / Numéro de série (VIN)",
        max_length=17,
        unique=True,
        blank=True,
        null=True,
        validators=[valider_vin],
    )
    carburant = models.CharField(
        max_length=25, choices=Carburant.choices, default=Carburant.ESSENCE
    )
    kilometrage = models.PositiveIntegerField(
        "Kilométrage (km)",
        default=0,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"{self.marque} {self.modele} ({self.plaque_immatriculation})"

    def clean(self):
        if self.plaque_immatriculation:
            self.plaque_immatriculation = self.plaque_immatriculation.upper().strip()
        if self.vin:
            self.vin = self.vin.upper().strip()
