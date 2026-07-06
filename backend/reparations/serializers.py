from rest_framework import serializers

from .models import DemandeReparation


class DemandeReparationSerializer(serializers.ModelSerializer):
    client_nom = serializers.SerializerMethodField()

    class Meta:
        model = DemandeReparation
        fields = [
            'id',
            'titre',
            'description',
            'vehicule',
            'statut',
            'client',
            'client_nom',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = ['statut', 'client', 'date_creation', 'date_modification']

    def get_client_nom(self, obj):
        return obj.client.get_full_name() or obj.client.username
