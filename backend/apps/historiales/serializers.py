from rest_framework import serializers
from .models import HistorialClinico, Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = '__all__'


class HistorialClinicoSerializer(serializers.ModelSerializer):
    medicamentos = MedicamentoSerializer(many=True, required=False)

    class Meta:
        model = HistorialClinico
        fields = '__all__'
        read_only_fields = ('fecha_consulta', 'created_at', 'updated_at')

    def create(self, validated_data):
        medicamentos_data = validated_data.pop('medicamentos', [])
        historial = HistorialClinico.objects.create(**validated_data)
        for medicamento_data in medicamentos_data:
            Medicamento.objects.create(historial=historial, **medicamento_data)
        return historial

    def update(self, instance, validated_data):
        medicamentos_data = validated_data.pop('medicamentos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if medicamentos_data is not None:
            instance.medicamentos.all().delete()
            for medicamento_data in medicamentos_data:
                Medicamento.objects.create(historial=instance, **medicamento_data)
        return instance
