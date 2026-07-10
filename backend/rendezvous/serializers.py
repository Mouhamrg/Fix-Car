from django.utils import timezone
from rest_framework import serializers

from .models import RendezVous


class RendezVousSerializer(serializers.ModelSerializer):
    statut_affiche = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            "id",
            "client",
            "date_heure",
            "motif",
            "statut",
            "statut_affiche",
            "date_creation",
            "date_modification",
        ]
        read_only_fields = [
            "id",
            "client",
            "statut",
            "date_creation",
            "date_modification",
        ]

    def validate_date_heure(self, valeur):
        if valeur <= timezone.now():
            raise serializers.ValidationError(
                "La date du rendez-vous doit être dans le futur."
            )
        if valeur.minute % 15 != 0 or valeur.second != 0:
            raise serializers.ValidationError(
                "Les rendez-vous se prennent aux 15 minutes (ex. 13 h 00, 13 h 15)."
            )
        return valeur

    def validate(self, donnees):
        if self.instance is not None and self.instance.statut in RendezVous.ETATS_TERMINAUX:
            raise serializers.ValidationError(
                "Un rendez-vous annulé ou complété ne peut plus être modifié."
            )
        return donnees

    def update(self, instance, donnees_validees):
        # Un RDV confirme dont on change la date/le motif repasse a "demande" :
        # le garage doit re-confirmer. (Decision de conception a valider avec le PO.)
        if instance.statut == RendezVous.Statut.CONFIRME:
            instance.statut = RendezVous.Statut.DEMANDE
        return super().update(instance, donnees_validees)