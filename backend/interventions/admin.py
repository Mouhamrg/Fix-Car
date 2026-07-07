from django.contrib import admin

from .models import Intervention


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ('titre', 'vehicule', 'date_intervention', 'statut', 'mecanicien')
    list_filter = ('statut', 'date_intervention')
    search_fields = ('titre', 'vehicule', 'description')
