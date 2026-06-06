from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfilusuario',
            name='dictation_language',
            field=models.CharField(default='es-CO', max_length=16),
        ),
        migrations.AddField(
            model_name='perfilusuario',
            name='voice_profile',
            field=models.TextField(blank=True),
        ),
    ]
