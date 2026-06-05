from django.contrib import admin
from .models import Paciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('numero_documento', 'tipo_documento', 'nombre', 'apellido', 'sexo', 'telefono', 'eps')
    search_fields = ('numero_documento', 'nombre', 'apellido', 'email')
    list_filter = ('tipo_documento', 'sexo', 'eps')
    ordering = ('apellido', 'nombre')
