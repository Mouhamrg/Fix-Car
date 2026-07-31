from rest_framework import serializers

from .models import Facture, Paiement
from .permissions import ROLES_STAFF


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = [
            'id',
            'facture',
            'montant',
            'methode',
            'statut',
            'reference_transaction',
            'date_paiement',
            'date_modification',
        ]
        read_only_fields = ['statut', 'reference_transaction', 'date_paiement', 'date_modification']

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError('Le montant doit être supérieur à zéro.')
        return value

    def validate_facture(self, value):
        if value.statut == Facture.Statut.PAYEE:
            raise serializers.ValidationError('Cette facture est déjà payée.')
        if value.statut == Facture.Statut.ANNULEE:
            raise serializers.ValidationError('Cette facture est annulée.')
        user = self.context['request'].user
        if not (user.is_superuser or user.role in ROLES_STAFF):
            if value.demande.client_id != user.id:
                raise serializers.ValidationError(
                    "Vous ne pouvez pas payer la facture d'un autre client."
                )
        return value
