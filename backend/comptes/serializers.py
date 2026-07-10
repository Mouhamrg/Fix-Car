from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profil, valider_code_postal_canadien, valider_telephone_quebec

User = get_user_model()


class InscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé pour la création d'un compte (endpoint public).
    Crée à la fois le User Django et son Profil associé, avec le rôle
    forcé à CLIENT (un client ne peut pas s'auto-attribuer un rôle
    mécanicien ou gestionnaire).
    """

    password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True, style={"input_type": "password"}, label="Confirmation du mot de passe"
    )
    telephone = serializers.CharField(
        source="profil.telephone",
        required=False,
        allow_blank=True,
        validators=[valider_telephone_quebec],
    )
    adresse = serializers.CharField(source="profil.adresse", required=False, allow_blank=True)
    ville = serializers.CharField(source="profil.ville", required=False, allow_blank=True)
    code_postal = serializers.CharField(
        source="profil.code_postal",
        required=False,
        allow_blank=True,
        validators=[valider_code_postal_canadien],
    )
    date_naissance = serializers.DateField(
        source="profil.date_naissance", required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
            "telephone",
            "adresse",
            "ville",
            "code_postal",
            "date_naissance",
        ]
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet e-mail.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError(
                {"password2": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        profil_data = validated_data.pop("profil", {})
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()  # déclenche le signal post_save qui crée déjà un Profil vide

        # On met à jour le Profil créé par le signal plutôt que d'en
        # créer un second (OneToOne = contrainte UNIQUE sur user_id).
        profil = user.profil
        profil.role = Profil.Role.CLIENT
        for champ, valeur in profil_data.items():
            setattr(profil, champ, valeur)
        profil.save()

        return user

    def to_representation(self, instance):
        """Ne jamais renvoyer le mot de passe, même hashé."""
        data = super().to_representation(instance)
        data.pop("password", None)
        data.pop("password2", None)
        return data


class ProfilSerializer(serializers.ModelSerializer):
    """
    Serializer pour la consultation/mise à jour du profil de
    l'utilisateur connecté. Le rôle est en lecture seule : un client ne
    peut pas se promouvoir mécanicien ou gestionnaire lui-même.
    """

    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    role = serializers.CharField(read_only=True)
    est_administrateur = serializers.BooleanField(source="user.is_superuser", read_only=True)

    class Meta:
        model = Profil
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "est_administrateur",
            "telephone",
            "adresse",
            "ville",
            "province",
            "code_postal",
            "date_naissance",
            "disponible",
            "date_creation",
            "date_modification",
        ]
        read_only_fields = ["date_creation", "date_modification"]

    def validate_email(self, value):
        user_actuel = self.instance.user if self.instance else None
        if User.objects.filter(email__iexact=value).exclude(pk=getattr(user_actuel, "pk", None)).exists():
            raise serializers.ValidationError("Cet e-mail est déjà utilisé par un autre compte.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        user = instance.user
        for champ, valeur in user_data.items():
            setattr(user, champ, valeur)
        user.save()
        return super().update(instance, validated_data)


class MonTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Étend le serializer JWT standard pour :
    - inclure le rôle (CLIENT/MECANICIEN/GESTIONNAIRE) directement dans
      le payload du token (utile si un jour on veut décoder le rôle
      côté frontend sans appel réseau supplémentaire) ;
    - renvoyer les informations de l'utilisateur dans la réponse de
      connexion, pour éviter à React de faire un second appel
      immédiatement après le login.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profil, _ = Profil.objects.get_or_create(user=user)
        token["username"] = user.username
        token["role"] = profil.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        profil, _ = Profil.objects.get_or_create(user=self.user)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": profil.role,
        }
        return data


class ChangerMotDePasseSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, validators=[validate_password])
    nouveau_mot_de_passe2 = serializers.CharField(write_only=True)

    def validate_ancien_mot_de_passe(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value

    def validate(self, attrs):
        if attrs["nouveau_mot_de_passe"] != attrs.pop("nouveau_mot_de_passe2"):
            raise serializers.ValidationError(
                {"nouveau_mot_de_passe2": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["nouveau_mot_de_passe"])
        user.save()
        return user
