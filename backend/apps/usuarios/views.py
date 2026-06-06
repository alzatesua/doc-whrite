from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, User, update_last_login
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import PerfilUsuario


ROLES = {
    'Administrador': ['usuarios:gestionar', 'pacientes:leer', 'pacientes:escribir', 'historiales:leer', 'historiales:escribir', 'formatos:gestionar'],
    'Medico': ['pacientes:leer', 'pacientes:escribir', 'historiales:leer', 'historiales:escribir', 'formatos:usar'],
    'Odontologo': ['pacientes:leer', 'pacientes:escribir', 'historiales:leer', 'historiales:escribir', 'formatos:usar', 'odontologia:usar'],
    'Administrativo': ['pacientes:leer', 'pacientes:escribir', 'historiales:leer'],
}

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8
ONLINE_THRESHOLD_SECONDS = 60 * 5
signer = TimestampSigner(salt='doc-write-auth')


def ensure_role(role):
    if role not in ROLES:
        role = 'Medico'
    group, _ = Group.objects.get_or_create(name=role)
    return group


def get_role(user):
    if user.is_superuser:
        return 'Administrador'
    group = user.groups.filter(name__in=ROLES.keys()).first()
    return group.name if group else 'Medico'


def get_profile(user):
    profile, _ = PerfilUsuario.objects.get_or_create(user=user)
    return profile


def get_initials(user):
    initials = f"{user.first_name[:1]}{user.last_name[:1]}".strip()
    return (initials or user.username[:2] or '?').upper()


def touch_user(user):
    profile = get_profile(user)
    profile.last_seen = timezone.now()
    profile.save(update_fields=['last_seen'])
    return profile


def serialize_user(user, include_token=False):
    role = get_role(user)
    profile = get_profile(user)
    now = timezone.now()
    is_online = bool(profile.last_seen and (now - profile.last_seen).total_seconds() <= ONLINE_THRESHOLD_SECONDS)
    data = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'role': role,
        'permissions': ROLES.get(role, []),
        'is_active': user.is_active,
        'is_superuser': user.is_superuser,
        'avatar_url': profile.avatar_url,
        'dictation_language': profile.dictation_language,
        'voice_profile': profile.voice_profile,
        'avatar_initials': get_initials(user),
        'last_seen': profile.last_seen.isoformat() if profile.last_seen else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'is_online': is_online,
    }
    if include_token:
        data['token'] = signer.sign(str(user.id))
    return data


def authenticated_user(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.removeprefix('Bearer ').strip()
    try:
        user_id = signer.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
        return User.objects.get(id=user_id, is_active=True)
    except (BadSignature, SignatureExpired, User.DoesNotExist):
        return None


def admin_user(request):
    user = authenticated_user(request)
    if not user:
        return None
    return user if user.is_superuser or get_role(user) == 'Administrador' else None


def assign_role(user, role):
    group = ensure_role(role)
    user.groups.clear()
    user.groups.add(group)


@api_view(['POST'])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'detail': 'Usuario o contrasena invalidos.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({'detail': 'Usuario inactivo.'}, status=status.HTTP_403_FORBIDDEN)
    update_last_login(None, user)
    touch_user(user)
    return Response(serialize_user(user, include_token=True))


@api_view(['GET', 'PATCH'])
def me(request):
    user = authenticated_user(request)
    if not user:
        return Response({'detail': 'Sesion invalida.'}, status=status.HTTP_401_UNAUTHORIZED)
    profile = touch_user(user)
    if request.method == 'PATCH':
        if 'username' in request.data:
            username = request.data.get('username', '').strip()
            if not username:
                return Response({'detail': 'El usuario no puede quedar vacio.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.exclude(id=user.id).filter(username=username).exists():
                return Response({'detail': 'Ya existe un usuario con ese nombre.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username

        for field in ('first_name', 'last_name', 'email'):
            if field in request.data:
                setattr(user, field, request.data.get(field, '').strip())

        new_password = request.data.get('new_password', '')
        if new_password:
            current_password = request.data.get('current_password', '')
            if not user.check_password(current_password):
                return Response({'detail': 'La contrasena actual no es correcta.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(new_password) < 6:
                return Response({'detail': 'La nueva contrasena debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)

        if 'avatar_url' in request.data:
            profile.avatar_url = request.data.get('avatar_url', '')

        if 'dictation_language' in request.data:
            profile.dictation_language = request.data.get('dictation_language', 'es-CO').strip() or 'es-CO'

        if 'voice_profile' in request.data:
            profile.voice_profile = request.data.get('voice_profile', '').strip()

        profile.save(update_fields=['avatar_url', 'dictation_language', 'voice_profile', 'last_seen'])

        user.save()
    return Response(serialize_user(user, include_token=True))


@api_view(['GET', 'POST'])
def usuarios(request):
    if not admin_user(request):
        return Response({'detail': 'Solo administradores pueden gestionar usuarios.'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'GET':
        users = User.objects.all().order_by('username')
        return Response([serialize_user(user) for user in users])

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    role = request.data.get('role', 'Medico')
    if not username or not password:
        return Response({'detail': 'Usuario y contrasena son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Ya existe un usuario con ese nombre.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=request.data.get('email', ''),
        first_name=request.data.get('first_name', ''),
        last_name=request.data.get('last_name', ''),
        is_active=request.data.get('is_active', True),
    )
    assign_role(user, role)
    return Response(serialize_user(user), status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
def usuario_detail(request, user_id):
    if not admin_user(request):
        return Response({'detail': 'Solo administradores pueden gestionar usuarios.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(serialize_user(user))

    for field in ('first_name', 'last_name', 'email', 'username'):
        if field in request.data:
            setattr(user, field, request.data.get(field, ''))
    if 'is_active' in request.data:
        user.is_active = request.data.get('is_active')
    if request.data.get('password'):
        user.set_password(request.data['password'])
    user.save()
    if request.data.get('role'):
        assign_role(user, request.data['role'])
    return Response(serialize_user(user))
