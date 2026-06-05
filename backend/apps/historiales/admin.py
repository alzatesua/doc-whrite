from django.contrib import admin
from .models import HistorialClinico, Medicamento


class MedicamentoInline(admin.TabularInline):
    model = Medicamento
    extra = 1


@admin.register(HistorialClinico)
class HistorialClinicoAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'fecha_consulta', 'doctor', 'diagnostico')
    search_fields = ('paciente__numero_documento', 'paciente__nombre', 'paciente__apellido', 'doctor', 'diagnostico')
    list_filter = ('fecha_consulta', 'doctor')
    date_hierarchy = 'fecha_consulta'
    inlines = [MedicamentoInline]


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'dosis', 'frecuencia', 'duracion', 'historial')
    search_fields = ('nombre', 'dosis', 'frecuencia', 'historial__paciente__numero_documento')
