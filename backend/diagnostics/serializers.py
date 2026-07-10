from rest_framework import serializers

from demandes_reparation.models import DemandeReparation

from .models import Diagnostic


class DiagnosticSerializer(serializers.ModelSerializer):
    mecanicien = serializers.PrimaryKeyRelatedField(read_only=True)
    mecanicien_nom = serializers.CharField(source="mecanicien.get_username", read_only=True)
    demande_titre = serializers.CharField(source="demande.titre", read_only=True)
    demande_client_nom = serializers.CharField(
        source="demande.client.get_username", read_only=True
    )
    demande_vehicule_plaque = serializers.CharField(
        source="demande.vehicule.plaque_immatriculation", read_only=True
    )
    statut_affichage = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Diagnostic
        fields = [
            "id",
            "demande",
            "demande_titre",
            "demande_client_nom",
            "demande_vehicule_plaque",
            "mecanicien",
            "mecanicien_nom",
            "notes_techniques",
            "travaux_a_effectuer",
            "cout_estime",
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
            "demande_vehicule_plaque",
            "mecanicien",
            "mecanicien_nom",
            "statut",
            "statut_affichage",
            "commentaire_client",
            "date_creation",
            "date_modification",
            "date_reponse_client",
        ]

    def validate_demande(self, value):
        request = self.context.get("request")

        if value.statut != DemandeReparation.Statut.EN_TRAITEMENT:
            raise serializers.ValidationError(
                "Cette demande doit être affectée à un mécanicien (statut « en traitement ») "
                "avant de pouvoir recevoir un diagnostic."
            )

        # Import local pour éviter un couplage au niveau du module :
        # diagnostics dépend de affectations, jamais l'inverse.
        from affectations.models import Affectation

        affectation = Affectation.objects.filter(demande=value).first()
        est_mecanicien_assigne = (
            affectation and request and affectation.mecanicien_id == request.user.id
        )
        if request and not request.user.is_superuser and not est_mecanicien_assigne:
            raise serializers.ValidationError(
                "Vous n'êtes pas le mécanicien assigné à cette demande."
            )
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
