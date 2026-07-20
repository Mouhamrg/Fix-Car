from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'telephone', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = ['username', 'email', 'first_name', 'last_name',
                   'telephone', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        utilisateur = Utilisateur(**validated_data)
        utilisateur.role = Utilisateur.Role.CLIENT
        utilisateur.set_password(password)
        utilisateur.save()
        return utilisateur


class CreationCompteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = ['username', 'email', 'first_name', 'last_name',
                  'telephone', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(password)
        utilisateur.save()
        return utilisateur


class IdentifiantTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Permet de se connecter avec le nom d'utilisateur, le courriel ou le téléphone."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        champ = self.fields.pop(self.username_field)
        champ.field_name = 'identifiant'
        champ.source = None
        self.fields['identifiant'] = champ

    def validate(self, attrs):
        identifiant = attrs.pop('identifiant')
        utilisateur = Utilisateur.objects.filter(
            Q(username__iexact=identifiant)
            | Q(email__iexact=identifiant)
            | Q(telephone=identifiant)
        ).first()
        attrs[self.username_field] = utilisateur.username if utilisateur else identifiant
        return super().validate(attrs)