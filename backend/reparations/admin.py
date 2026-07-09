from django.contrib import admin

from .models import DemandeReparation, TypeReparation


@admin.register(DemandeReparation)
class DemandeReparationAdmin(admin.ModelAdmin):
    list_display = ('titre', 'vehicule', 'statut', 'client', 'date_creation')
    list_filter = ('statut',)
    search_fields = ('titre', 'vehicule', 'description')


@admin.register(TypeReparation)
class TypeReparationAdmin(admin.ModelAdmin):
    list_display = ('nom', 'duree_estimee_heures', 'prix_standard')
    search_fields = ('nom', 'description')
