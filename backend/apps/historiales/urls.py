from rest_framework.routers import DefaultRouter
from .views import HistorialClinicoViewSet, MedicamentoViewSet

router = DefaultRouter()
router.register(r'historiales', HistorialClinicoViewSet, basename='historial')
router.register(r'medicamentos', MedicamentoViewSet, basename='medicamento')

urlpatterns = router.urls
