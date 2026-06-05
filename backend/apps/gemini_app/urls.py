from django.urls import path
from .views import estructurar_historia

urlpatterns = [
    path('gemini/estructurar-historia/', estructurar_historia, name='estructurar_historia'),
]
