from django.contrib import admin

from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('id', 'facture', 'montant', 'methode', 'statut', 'date_paiement')
    list_filter = ('methode', 'statut')
