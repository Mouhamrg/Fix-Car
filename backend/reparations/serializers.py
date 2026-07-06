from rest_framework import serializers

from .models import DemandeReparation 

class DemandeReparationSerializer(serializers.ModelSerializer):
  class Meta: 
    model = DemandeReparation
    fields = [
            'id',
            'titre',
            'description',
            'vehicule',
            'statut',
            'client',
            'date_creation',
            'date_modification',
    ]
    read_only_fields = ['client', 'date_creation', 'date_modification']
