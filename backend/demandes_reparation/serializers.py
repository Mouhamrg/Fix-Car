from rest_framework import serializers

from .models import DemandeReparation


class DemandeReparationSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    client_nom = serializers.CharField(source="client.get_username", read_only=True)

    vehicule_marque = serializers.CharField(source="vehicule.marque", read_only=True)
    vehicule_modele = serializers.CharField(source="vehicule.modele", read_only=True)
    vehicule_plaque = serializers.CharField(
        source="vehicule.plaque_immatriculation", read_only=True
    )

    statut_affichage = serializers.CharField(source="get_statut_display", read_only=True)
    modifiable = serializers.BooleanField(source="est_modifiable_par_client", read_only=True)
    mecanicien_assigne = serializers.SerializerMethodField()
    devis = serializers.SerializerMethodField()

    class Meta:
        model = DemandeReparation
        fields = [
            "id",
            "client",
            "client_nom",
            "vehicule",
            "vehicule_marque",
            "vehicule_modele",
            "vehicule_plaque",
            "titre",
            "description_probleme",
            "statut",
            "statut_affichage",
            "modifiable",
            "mecanicien_assigne",
            "devis",
            "date_creation",
            "date_modification",
            "date_annulation",
        ]
        read_only_fields = [
            "id",
            "client",
            "client_nom",
            "vehicule_marque",
            "vehicule_modele",
            "vehicule_plaque",
            "statut",
            "statut_affichage",
            "modifiable",
            "mecanicien_assigne",
            "devis",
            "date_creation",
            "date_modification",
            "date_annulation",
        ]

    def get_mecanicien_assigne(self, obj):
        """
        Ne dépend pas d'un import du modèle Affectation (pour éviter un
        couplage circulaire entre apps) : s'appuie uniquement sur la
        relation inverse "affectation" créée par le OneToOneField du
        module affectations, si celui-ci est installé.
        """
        affectation = getattr(obj, "affectation", None)
        if not affectation:
            return None
        return {
            "id": affectation.mecanicien.id,
            "nom": affectation.mecanicien.get_username(),
        }

    def get_devis(self, obj):
        """
        Même principe : s'appuie sur la relation inverse "diagnostic"
        du module diagnostics, sans en importer le modèle.
        """
        diagnostic = getattr(obj, "diagnostic", None)
        if not diagnostic:
            return None
        return {
            "id": diagnostic.id,
            "statut": diagnostic.statut,
            "statut_affichage": diagnostic.get_statut_display(),
            "cout_estime": str(diagnostic.cout_estime),
        }

    def validate_titre(self, value):
        valeur = value.strip()
        if len(valeur) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caractères.")
        return valeur

    def validate_description_probleme(self, value):
        valeur = value.strip()
        if len(valeur) < 10:
            raise serializers.ValidationError(
                "Merci de décrire le problème plus précisément (10 caractères minimum)."
            )
        return valeur

    def validate_vehicule(self, value):
        request = self.context.get("request")
        if request and not request.user.is_staff and value.proprietaire_id != request.user.id:
            raise serializers.ValidationError("Ce véhicule ne vous appartient pas.")
        if not value.actif:
            raise serializers.ValidationError(
                "Ce véhicule est désactivé et ne peut pas faire l'objet d'une nouvelle demande."
            )
        return value

    def update(self, instance, validated_data):
        request = self.context.get("request")
        est_staff = bool(request and request.user.is_staff)

        if not instance.est_modifiable_par_client and not est_staff:
            raise serializers.ValidationError(
                "Cette demande ne peut plus être modifiée : elle est déjà prise en charge."
            )

        # Le véhicule d'une demande ne peut pas être changé après coup ;
        # seuls le titre et la description sont modifiables.
        validated_data.pop("vehicule", None)
        return super().update(instance, validated_data)
