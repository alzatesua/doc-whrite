from rest_framework import viewsets
from .models import HistorialClinico, Medicamento
from .serializers import HistorialClinicoSerializer, MedicamentoSerializer


class HistorialClinicoViewSet(viewsets.ModelViewSet):
    queryset = HistorialClinico.objects.select_related('paciente').prefetch_related('medicamentos').all()
    serializer_class = HistorialClinicoSerializer
    search_fields = ('paciente__numero_documento', 'paciente__nombre', 'paciente__apellido', 'doctor', 'diagnostico')
    filterset_fields = ('paciente', 'doctor')


class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.select_related('historial', 'historial__paciente').all()
    serializer_class = MedicamentoSerializer
    search_fields = ('nombre', 'dosis', 'frecuencia')
    filterset_fields = ('historial',)
