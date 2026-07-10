from django.contrib import admin

from .models import DemandeReparation


@admin.register(DemandeReparation)
class DemandeReparationAdmin(admin.ModelAdmin):
    list_display = ("titre", "client", "vehicule", "statut", "date_creation")
    list_filter = ("statut",)
    search_fields = (
        "titre",
        "description_probleme",
        "client__username",
        "vehicule__plaque_immatriculation",
    )
    autocomplete_fields = ("client", "vehicule")
    readonly_fields = ("date_creation", "date_modification", "date_annulation")
