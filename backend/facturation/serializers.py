from rest_framework import serializers

from reparations.models import DemandeReparation
from .models import Facture


class FactureSerializer(serializers.ModelSerializer):
    demande_titre = serializers.CharField(source='demande.titre', read_only=True)
    demande_vehicule = serializers.CharField(source='demande.vehicule', read_only=True)
    demande_client_nom = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id',
            'demande',
            'demande_titre',
            'demande_vehicule',
            'demande_client_nom',
            'numero',
            'date_emission',
            'montant_main_oeuvre',
            'montant_pieces',
            'tps',
            'tvq',
            'montant_total',
            'statut',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = [
            'numero',
            'date_emission',
            'tps',
            'tvq',
            'montant_total',
            'statut',
            'date_creation',
            'date_modification',
        ]

    def get_demande_client_nom(self, obj):
        return obj.demande.client.get_full_name() or obj.demande.client.username

    def validate_demande(self, value):
        # Garde préventive : le statut 'annulee' n'existe pas encore dans
        # DemandeReparation.Statut (voir docs/mcd.md RG5). Cette
        # comparaison par chaîne littérale reste donc inactive tant que
        # ce statut n'est pas ajouté au modèle DemandeReparation ; elle
        # évitera d'oublier la règle le jour où il le sera.
        if value.statut == 'annulee':
            raise serializers.ValidationError(
                "Impossible de facturer une demande annulée."
            )
        # Règle métier (#12, validée par le PO) : une facture ne peut être
        # émise qu'une fois la réparation terminée.
        if value.statut != DemandeReparation.Statut.TERMINEE:
            raise serializers.ValidationError(
                "La demande doit être terminée avant d'être facturée."
            )
        return value
