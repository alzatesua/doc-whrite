from rest_framework import viewsets
from .models import Paciente
from .serializers import PacienteSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all().order_by('apellido', 'nombre')
    serializer_class = PacienteSerializer
    search_fields = ('numero_documento', 'nombre', 'apellido', 'email')
    filterset_fields = ('tipo_documento', 'sexo', 'eps')
