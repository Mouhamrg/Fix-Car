from django.contrib import admin

from .models import Affectation


@admin.register(Affectation)
class AffectationAdmin(admin.ModelAdmin):
    list_display = ("demande", "mecanicien", "affecte_par", "date_affectation")
    search_fields = (
        "demande__titre",
        "mecanicien__username",
        "affecte_par__username",
    )
    autocomplete_fields = ("demande", "mecanicien", "affecte_par")
    readonly_fields = ("date_affectation", "date_modification")
