import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('pacientes', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='HistorialClinico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_consulta', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.CharField(max_length=100)),
                ('temperatura', models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True)),
                ('presion_arterial', models.CharField(blank=True, max_length=20)),
                ('frecuencia_cardiaca', models.IntegerField(blank=True, null=True)),
                ('frecuencia_respiratoria', models.IntegerField(blank=True, null=True)),
                ('peso', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('talla', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('motivo_consulta', models.TextField(blank=True)),
                ('enfermedad_actual', models.TextField(blank=True)),
                ('antecedentes', models.TextField(blank=True)),
                ('examen_fisico', models.TextField(blank=True)),
                ('diagnostico', models.TextField(blank=True)),
                ('tratamiento', models.TextField(blank=True)),
                ('observaciones', models.TextField(blank=True)),
                ('informe_clinico', models.TextField(blank=True)),
                ('transcripcion_audio', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('paciente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historiales', to='pacientes.paciente')),
            ],
            options={'verbose_name': 'Historial Clinico', 'verbose_name_plural': 'Historiales Clinicos', 'ordering': ['-fecha_consulta']},
        ),
        migrations.CreateModel(
            name='Medicamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('dosis', models.CharField(max_length=100)),
                ('frecuencia', models.CharField(max_length=100)),
                ('duracion', models.CharField(blank=True, max_length=100)),
                ('indicaciones', models.TextField(blank=True)),
                ('historial', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medicamentos', to='historiales.historialclinico')),
            ],
        ),
    ]
