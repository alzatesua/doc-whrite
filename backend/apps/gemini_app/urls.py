from django.urls import path
from .views import estructurar_historia, transcribir_audio

urlpatterns = [
    path('gemini/estructurar-historia/', estructurar_historia, name='estructurar_historia'),
    path('gemini/transcribir-audio/', transcribir_audio, name='transcribir_audio'),
]
