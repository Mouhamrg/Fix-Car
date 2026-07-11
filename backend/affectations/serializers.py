from django.contrib.auth import get_user_model
from rest_framework import serializers

from comptes.models import Utilisateur
from reparations.models import DemandeReparation

from .models import Affectation

User = get_user_model()

STATUTS_AFFECTABLES = [
    DemandeReparation.Statut.EN_ATTENTE,
    DemandeReparation.Statut.ACCEPTEE,
]


class AffectationSerializer(serializers.ModelSerializer):
    affecte_par = serializers.PrimaryKeyRelatedField(read_only=True)
    affecte_par_nom = serializers.SerializerMethodField()
    mecanicien_nom = serializers.CharField(source="mecanicien.get_username", read_only=True)
    demande_titre = serializers.CharField(source="demande.titre", read_only=True)
    demande_statut = serializers.CharField(source="demande.statut", read_only=True)
    demande_client_nom = serializers.CharField(
        source="demande.client.get_username", read_only=True
    )
    demande_vehicule_plaque = serializers.CharField(
        source="demande.vehicule.plaque_immatriculation", read_only=True
    )

    class Meta:
        model = Affectation
        fields = [
            "id",
            "demande",
            "demande_titre",
            "demande_statut",
            "demande_client_nom",
            "demande_vehicule_plaque",
            "mecanicien",
            "mecanicien_nom",
            "affecte_par",
            "affecte_par_nom",
            "commentaire",
            "date_affectation",
            "date_modification",
        ]
        read_only_fields = [
            "id",
            "demande_titre",
            "demande_statut",
            "demande_client_nom",
            "demande_vehicule_plaque",
            "mecanicien_nom",
            "affecte_par",
            "affecte_par_nom",
            "date_affectation",
            "date_modification",
        ]

    def get_affecte_par_nom(self, obj):
        return obj.affecte_par.get_username() if obj.affecte_par else None

    def validate_mecanicien(self, value):
        profil = getattr(value, "profil", None)
        if not profil or profil.role != Utilisateur.Role.MECANICIEN:
            raise serializers.ValidationError(
                "L'utilisateur sélectionné n'a pas le rôle mécanicien."
            )
        return value

    def validate_demande(self, value):
        if value.statut not in STATUTS_AFFECTABLES:
            raise serializers.ValidationError(
                "Cette demande ne peut plus être affectée (terminée ou annulée)."
            )
        return value

    def validate(self, attrs):
        # À la création uniquement : une demande ne peut avoir qu'une
        # seule affectation (relation OneToOne).
        if self.instance is None:
            demande = attrs.get("demande")
            if demande is not None and Affectation.objects.filter(demande=demande).exists():
                raise serializers.ValidationError(
                    {
                        "demande": (
                            "Cette demande a déjà une affectation. "
                            "Modifiez l'affectation existante pour la réaffecter."
                        )
                    }
                )
        return attrs

    def update(self, instance, validated_data):
        # La demande associée à une affectation ne change jamais ;
        # seuls le mécanicien et le commentaire sont modifiables
        # (réaffectation).
        validated_data.pop("demande", None)
        return super().update(instance, validated_data)


class MecanicienDisponibleSerializer(serializers.Serializer):
    """Représentation légère d'un mécanicien, pour peupler un sélecteur."""

    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    nom_complet = serializers.SerializerMethodField()
    telephone = serializers.CharField()
    disponible = serializers.BooleanField()

    def get_nom_complet(self, obj):
        complet = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return complet or obj.user.username
