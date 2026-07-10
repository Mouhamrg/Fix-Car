from django.contrib import admin

from .models import Vehicule


@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = (
        "plaque_immatriculation",
        "marque",
        "modele",
        "annee",
        "categorie",
        "proprietaire",
        "kilometrage",
        "actif",
    )
    list_filter = ("marque", "categorie", "carburant", "actif")
    search_fields = (
        "plaque_immatriculation",
        "numero_certificat_immatriculation",
        "vin",
        "marque",
        "modele",
        "proprietaire__username",
    )
    autocomplete_fields = ("proprietaire",)