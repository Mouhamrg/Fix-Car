from django.contrib import admin

from .models import Profil


@admin.register(Profil)
class ProfilAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "telephone", "ville", "date_creation")
    list_filter = ("role", "ville")
    search_fields = ("user__username", "user__email", "telephone")
    autocomplete_fields = ("user",)
