from rest_framework import serializers

from reparations.models import DemandeReparation

from .models import Diagnostic


class DiagnosticSerializer(serializers.ModelSerializer):
    mecanicien = serializers.PrimaryKeyRelatedField(read_only=True)
    mecanicien_nom = serializers.CharField(source="mecanicien.get_username", read_only=True)
    demande_titre = serializers.CharField(source="demande.titre", read_only=True)
    demande_client_nom = serializers.CharField(
        source="demande.client.get_username", read_only=True
    )

    statut_affichage = serializers.CharField(source="get_statut_display", read_only=True)
    types_reparation_noms = serializers.SerializerMethodField()

    class Meta:
        model = Diagnostic
        fields = [
            "id",
            "demande",
            "demande_titre",
            "demande_client_nom",
            "mecanicien",
            "mecanicien_nom",
            "notes_techniques",
            "travaux_a_effectuer",
            "cout_estime",
            "types_reparation",
            "types_reparation_noms",
            "statut",
            "statut_affichage",
            "commentaire_client",
            "date_creation",
            "date_modification",
            "date_reponse_client",
        ]
        read_only_fields = [
            "id",
            "demande_titre",
            "demande_client_nom",
            "mecanicien",
            "mecanicien_nom",
            "types_reparation_noms",
            "statut",
            "statut_affichage",
            "commentaire_client",
            "date_creation",
            "date_modification",
            "date_reponse_client",
        ]

    def get_types_reparation_noms(self, obj):
        return [type_reparation.nom for type_reparation in obj.types_reparation.all()]

    def validate_demande(self, value):
        if value.statut != DemandeReparation.Statut.EN_ATTENTE:
            raise serializers.ValidationError(
                "Cette demande doit être affectée à un mécanicien (statut « en traitement ») "
                "avant de pouvoir recevoir un diagnostic."
            )

        # Vérification "mécanicien assigné" désactivée temporairement,
        # le temps que le flux d'affectation soit stabilisé/testé.
        return value

    def validate_cout_estime(self, value):
        if value < 0:
            raise serializers.ValidationError("Le coût estimé ne peut pas être négatif.")
        return value

    def update(self, instance, validated_data):
        if instance.statut == Diagnostic.Statut.ACCEPTE:
            raise serializers.ValidationError(
                "Ce diagnostic a déjà été accepté par le client et ne peut plus être modifié."
            )

        # La demande associée à un diagnostic ne change jamais.
        validated_data.pop("demande", None)

        # Réviser un diagnostic refusé relance la validation du client.
        if instance.statut == Diagnostic.Statut.REFUSE:
            validated_data["statut"] = Diagnostic.Statut.EN_ATTENTE_VALIDATION
            validated_data["commentaire_client"] = ""
            validated_data["date_reponse_client"] = None

        return super().update(instance, validated_data)
