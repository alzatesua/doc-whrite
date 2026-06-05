from django.urls import path
from .views import login, me, usuario_detail, usuarios

urlpatterns = [
    path('auth/login/', login, name='login'),
    path('auth/me/', me, name='me'),
    path('usuarios/', usuarios, name='usuarios'),
    path('usuarios/<int:user_id>/', usuario_detail, name='usuario_detail'),
]
