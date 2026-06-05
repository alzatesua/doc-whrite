from django.db import models
from apps.pacientes.models import Paciente


class HistorialClinico(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='historiales')
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    doctor = models.CharField(max_length=100)
    temperatura = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    presion_arterial = models.CharField(max_length=20, blank=True)
    frecuencia_cardiaca = models.IntegerField(null=True, blank=True)
    frecuencia_respiratoria = models.IntegerField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    talla = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    motivo_consulta = models.TextField(blank=True)
    enfermedad_actual = models.TextField(blank=True)
    antecedentes = models.TextField(blank=True)
    examen_fisico = models.TextField(blank=True)
    diagnostico = models.TextField(blank=True)
    tratamiento = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    informe_clinico = models.TextField(blank=True)
    transcripcion_audio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Historial Clinico'
        verbose_name_plural = 'Historiales Clinicos'
        ordering = ['-fecha_consulta']

    def __str__(self):
        return f"Consulta {self.paciente} - {self.fecha_consulta:%d/%m/%Y}"


class Medicamento(models.Model):
    historial = models.ForeignKey(HistorialClinico, on_delete=models.CASCADE, related_name='medicamentos')
    nombre = models.CharField(max_length=200)
    dosis = models.CharField(max_length=100)
    frecuencia = models.CharField(max_length=100)
    duracion = models.CharField(max_length=100, blank=True)
    indicaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nombre} - {self.dosis}"
