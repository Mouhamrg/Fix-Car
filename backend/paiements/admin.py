from django.contrib import admin

from .models import Facture, Paiement


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('id', 'demande', 'montant', 'statut', 'date_emission')
    list_filter = ('statut',)
    search_fields = ('demande__titre',)


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('id', 'facture', 'montant', 'methode', 'statut', 'date_paiement')
    list_filter = ('methode', 'statut')
