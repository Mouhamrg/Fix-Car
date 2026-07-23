from django.contrib import admin

from .models import Facture


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('numero', 'demande', 'montant_total', 'statut', 'date_emission')
    list_filter = ('statut',)
    search_fields = ('numero', 'demande__titre')
    autocomplete_fields = ('demande',)
    readonly_fields = (
        'numero',
        'tps',
        'tvq',
        'montant_total',
        'date_emission',
        'date_creation',
        'date_modification',
    )
