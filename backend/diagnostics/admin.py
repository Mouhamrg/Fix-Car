from django.contrib import admin

from .models import Diagnostic


@admin.register(Diagnostic)
class DiagnosticAdmin(admin.ModelAdmin):
    list_display = ("demande", "mecanicien", "cout_estime", "statut", "date_creation")
    list_filter = ("statut",)
    search_fields = ("demande__titre", "mecanicien__username", "demande__client__username")
    autocomplete_fields = ("demande", "mecanicien")
    readonly_fields = ("date_creation", "date_modification", "date_reponse_client")
