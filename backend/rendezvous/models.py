from django.conf import settings
from django.db import models


class RendezVous(models.Model):
    class Statut(models.TextChoices):
        DEMANDE = "demande", "Demandé"
        CONFIRME = "confirme", "Confirmé"
        ANNULE = "annule", "Annulé"
        COMPLETE = "complete", "Complété"

    # Machine a etats (MCD 3.3). confirme -> demande : uniquement quand
    # le client modifie un RDV confirme (re-confirmation requise).
    TRANSITIONS_VALIDES = {
        Statut.DEMANDE: {Statut.CONFIRME, Statut.ANNULE},
        Statut.CONFIRME: {Statut.COMPLETE, Statut.ANNULE, Statut.DEMANDE},
        Statut.ANNULE: set(),
        Statut.COMPLETE: set(),
    }
    ETATS_TERMINAUX = {Statut.ANNULE, Statut.COMPLETE}

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="rendez_vous",
        verbose_name="client",
    )
    # TODO(#2) : FK vers vehicules.Vehicule (null=True, PROTECT) des que
    # l'app vehicules fusionnee dans main.  (MCD 3.3)
    date_heure = models.DateTimeField("date et heure du rendez-vous")
    motif = models.CharField("motif de la visite", max_length=200)
    statut = models.CharField(
        "statut", max_length=20, choices=Statut.choices, default=Statut.DEMANDE
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date_heure"]
        verbose_name = "rendez-vous"
        verbose_name_plural = "rendez-vous"

    def __str__(self):
        return f"RDV #{self.pk} — {self.date_heure:%Y-%m-%d %H:%M} ({self.get_statut_display()})"

    def transition_valide(self, nouveau_statut):
        return nouveau_statut in self.TRANSITIONS_VALIDES.get(self.statut, set())