from django.db.models.signals import post_save
from django.dispatch import receiver

from demandes_reparation.models import DemandeReparation

from .models import Affectation


@receiver(post_save, sender=Affectation)
def demarrer_traitement_demande(sender, instance, created, **kwargs):
    """
    Fait passer la demande à EN_TRAITEMENT dès qu'une affectation est
    créée — peu importe le point d'entrée (API, admin Django, shell,
    script de données). Contrairement à une logique placée uniquement
    dans AffectationViewSet.perform_create(), un signal s'applique de
    façon garantie à toute création, quelle que soit son origine.
    """
    if not created:
        return
    demande = instance.demande
    if demande.statut == DemandeReparation.Statut.EN_ATTENTE:
        demande.statut = DemandeReparation.Statut.EN_TRAITEMENT
        demande.save(update_fields=["statut"])
