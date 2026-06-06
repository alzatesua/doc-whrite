import json
import os

from google import genai
from google.genai import types
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


HISTORIA_SCHEMA = {
    'motivo_consulta': '',
    'enfermedad_actual': '',
    'antecedentes': '',
    'examen_fisico': '',
    'diagnostico': '',
    'tratamiento': '',
    'observaciones': '',
    'informe_clinico': '',
    'temperatura': '',
    'presion_arterial': '',
    'frecuencia_cardiaca': '',
    'frecuencia_respiratoria': '',
    'peso': '',
    'talla': '',
}

SUPPORTED_TEMPLATE_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
}

SUPPORTED_AUDIO_MIME_TYPES = {
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
}


def parse_json_response(text):
    clean_text = (text or '{}').strip()
    if clean_text.startswith('```'):
        clean_text = clean_text.strip('`')
        clean_text = clean_text.replace('json\n', '', 1).replace('JSON\n', '', 1)
    return json.loads(clean_text)


@api_view(['POST'])
def estructurar_historia(request):
    transcripcion = request.data.get('transcripcion', '').strip()
    formato_clinica = request.data.get('formato_clinica', 'General').strip()
    instrucciones_clinica = request.data.get('instrucciones_clinica', '').strip()
    formato_base = request.data.get('formato_base', '').strip()
    perfil_voz = request.data.get('perfil_voz', '').strip()
    formato_archivo = request.FILES.get('formato_archivo')

    if not transcripcion:
        return Response({'detail': 'La transcripcion es obligatoria.'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return Response({'detail': 'No esta configurada GEMINI_API_KEY.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    prompt = f"""
Eres un asistente clinico para documentacion medica u odontologica en Colombia.
Extrae informacion de la transcripcion y devuelvela como JSON valido.

Reglas:
- No inventes datos.
- Si un campo no aparece, usa string vacio.
- No des recomendaciones nuevas; solo organiza lo dictado.
- En informe_clinico redacta el informe final segun el formato de la clinica.
- Si se adjunta un documento base, usalo como referencia principal de titulos, orden, estilo y estructura.
- Si el formato corresponde a odontologia, adapta el informe a cita dental: motivo odontologico, hallazgos, dientes/superficies, procedimiento, diagnostico, plan, recomendaciones y control.

Formato de clinica:
{formato_clinica}

Instrucciones propias:
{instrucciones_clinica or 'Sin instrucciones adicionales.'}

Perfil de voz y dictado del doctor:
{perfil_voz or 'Sin perfil de voz configurado.'}

Texto base adicional:
{formato_base or 'No se proporciono texto base.'}

Campos exactos:
{json.dumps(HISTORIA_SCHEMA, ensure_ascii=False)}

Transcripcion:
{transcripcion}
"""

    try:
        client = genai.Client(api_key=api_key)
        contents = [prompt]
        if formato_archivo:
            if formato_archivo.size > 10 * 1024 * 1024:
                return Response({'detail': 'El documento base no puede superar 10 MB.'}, status=status.HTTP_400_BAD_REQUEST)
            mime_type = formato_archivo.content_type or 'application/octet-stream'
            if mime_type not in SUPPORTED_TEMPLATE_MIME_TYPES:
                return Response({'detail': f'Tipo de archivo no soportado: {mime_type}'}, status=status.HTTP_400_BAD_REQUEST)
            contents.append(types.Part.from_bytes(data=formato_archivo.read(), mime_type=mime_type))

        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
            contents=contents,
            config=types.GenerateContentConfig(response_mime_type='application/json', temperature=0.2),
        )
        data = parse_json_response(response.text)
    except Exception as exc:
        return Response({'detail': f'Gemini no pudo estructurar la historia: {exc}'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({field: str(data.get(field, '') or '') for field in HISTORIA_SCHEMA})


@api_view(['POST'])
def transcribir_audio(request):
    audio = request.FILES.get('audio')
    idioma = request.data.get('idioma', 'es-CO').strip() or 'es-CO'

    if not audio:
        return Response({'detail': 'El audio es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
    if audio.size > 12 * 1024 * 1024:
        return Response({'detail': 'El audio no puede superar 12 MB.'}, status=status.HTTP_400_BAD_REQUEST)

    mime_type = audio.content_type or 'audio/webm'
    if mime_type not in SUPPORTED_AUDIO_MIME_TYPES:
        return Response({'detail': f'Tipo de audio no soportado: {mime_type}'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return Response({'detail': 'No esta configurada GEMINI_API_KEY.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    prompt = f"""
Transcribe este audio clinico de calibracion de voz.
Idioma esperado: {idioma}.
Devuelve solo el texto transcrito, sin explicaciones.
"""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
            contents=[
                prompt,
                types.Part.from_bytes(data=audio.read(), mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(temperature=0.1),
        )
    except Exception as exc:
        return Response({'detail': f'Gemini no pudo transcribir el audio: {exc}'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({'transcripcion': (response.text or '').strip()})
