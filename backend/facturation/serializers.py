from rest_framework import serializers

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
            'demande',
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
