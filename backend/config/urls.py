from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.pacientes.urls')),
    path('api/', include('apps.historiales.urls')),
    path('api/', include('apps.gemini_app.urls')),
    path('api/', include('apps.usuarios.urls')),
]
