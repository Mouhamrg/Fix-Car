import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def valider_telephone_quebec(value: str) -> None:
    """
    Valide un numéro de téléphone nord-américain (10 chiffres),
    avec ou sans indicatif +1, espaces, tirets ou parenthèses.
    Ex: 514-123-4567, (450) 123-4567, +1 418 123 4567
    """
    if not value:
        return
    chiffres = re.sub(r"\D", "", value)
    if chiffres.startswith("1") and len(chiffres) == 11:
        chiffres = chiffres[1:]
    if len(chiffres) != 10:
        raise ValidationError(
            "%(value)s n'est pas un numéro de téléphone valide (10 chiffres attendus).",
            params={"value": value},
        )


def valider_code_postal_canadien(value: str) -> None:
    """
    Valide un code postal canadien, format A1A 1A1 (espace optionnel).
    """
    if not value:
        return
    pattern = r"^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$"
    if not re.match(pattern, value):
        raise ValidationError(
            "%(value)s n'est pas un code postal canadien valide (ex: H2X 1Y6).",
            params={"value": value},
        )


class Profil(models.Model):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        MECANICIEN = "MECANICIEN", "Mécanicien"
        GESTIONNAIRE = "GESTIONNAIRE", "Gestionnaire"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil",
    )
    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.CLIENT,
        help_text=(
            "Le rôle détermine les fonctionnalités accessibles. "
            "L'inscription publique ne crée que des comptes CLIENT ; "
            "les rôles MECANICIEN et GESTIONNAIRE sont attribués via "
            "l'administration."
        ),
    )
    telephone = models.CharField(
        max_length=20, blank=True, validators=[valider_telephone_quebec]
    )
    adresse = models.CharField(max_length=150, blank=True)
    ville = models.CharField(max_length=80, blank=True)
    province = models.CharField(max_length=50, default="Québec", blank=True)
    code_postal = models.CharField(
        max_length=10, blank=True, validators=[valider_code_postal_canadien]
    )
    date_naissance = models.DateField(null=True, blank=True)
    disponible = models.BooleanField(
        default=True,
        help_text=(
            "Pour un mécanicien : indique s'il peut actuellement recevoir "
            "de nouvelles réparations à affecter. Sans effet pour les "
            "autres rôles."
        ),
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"

    def __str__(self):
        return f"Profil de {self.user.username} ({self.get_role_display()})"

    def clean(self):
        if self.code_postal:
            self.code_postal = self.code_postal.upper().strip()
