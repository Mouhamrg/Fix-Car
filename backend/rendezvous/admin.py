from django.contrib import admin

from .models import RendezVous


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "date_heure", "statut", "date_modification")
    list_filter = ("statut", "date_heure")
    search_fields = ("motif", "client__username")
    ordering = ("date_heure",)