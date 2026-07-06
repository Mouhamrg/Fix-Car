from django.contrib import admin

from .models import DemandeReparation


@admin.register(DemandeReparation)
class DemandeReparationAdmin(admin.ModelAdmin):
    list_display = ('titre', 'vehicule', 'statut', 'client', 'date_creation')
    list_filter = ('statut',)
    search_fields = ('titre', 'vehicule', 'description')
