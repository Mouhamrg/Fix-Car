from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
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