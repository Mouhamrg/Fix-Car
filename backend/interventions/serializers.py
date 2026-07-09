from rest_framework import serializers

from .models import Intervention


class InterventionSerializer(serializers.ModelSerializer):
    mecanicien_nom = serializers.SerializerMethodField()

    class Meta:
        model = Intervention
        fields = [
            'id',
            'titre',
            'vehicule',
            'description',
            'date_intervention',
            'duree_heures',
            'pieces_utilisees',
            'statut',
            'mecanicien',
            'mecanicien_nom',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = ['mecanicien', 'date_creation', 'date_modification']

    def get_mecanicien_nom(self, obj):
        return obj.mecanicien.get_full_name() or obj.mecanicien.username
