from django.utils import timezone
from rest_framework import serializers

from .models import Vehicule


class VehiculeSerializer(serializers.ModelSerializer):
    proprietaire = serializers.PrimaryKeyRelatedField(read_only=True)
    proprietaire_nom = serializers.CharField(
        source="proprietaire.get_username", read_only=True
    )

    class Meta:
        model = Vehicule
        fields = [
            "id",
            "proprietaire",
            "proprietaire_nom",
            "marque",
            "modele",
            "annee",
            "couleur",
            "categorie",
            "plaque_immatriculation",
            "numero_certificat_immatriculation",
            "vin",
            "carburant",
            "kilometrage",
            "actif",
            "date_creation",
            "date_modification",
        ]
        read_only_fields = [
            "id",
            "proprietaire",
            "proprietaire_nom",
            "date_creation",
            "date_modification",
        ]

    def validate_annee(self, value):
        annee_courante = timezone.now().year
        if value < 1900 or value > annee_courante + 1:
            raise serializers.ValidationError(
                f"L'année doit être comprise entre 1900 et {annee_courante + 1}."
            )
        return value

    def validate_plaque_immatriculation(self, value):
        return value.upper().strip()

    def validate_vin(self, value):
        if value:
            return value.upper().strip()
        return value

    def validate_kilometrage(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Le kilométrage ne peut pas être négatif."
            )
        return value

    def update(self, instance, validated_data):
        """
        Empêche de diminuer le kilométrage (règle métier simple).
        """
        nouveau_km = validated_data.get("kilometrage")
        if nouveau_km is not None and nouveau_km < instance.kilometrage:
            raise serializers.ValidationError(
                {
                    "kilometrage": (
                        "Le nouveau kilométrage "
                        f"({nouveau_km} km) ne peut pas être inférieur "
                        f"au kilométrage actuel ({instance.kilometrage} km)."
                    )
                }
            )
        return super().update(instance, validated_data)


class VehiculeListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes (utilisée par ex. par le module rendez-vous)."""

    class Meta:
        model = Vehicule
        fields = ["id", "marque", "modele", "plaque_immatriculation", "annee"]