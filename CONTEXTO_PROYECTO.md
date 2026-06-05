# Contexto del proyecto

Proyecto reconstruido en `/home/juan/Distritec/private/doc-write`.

## Resumen

Aplicacion clinica con backend Django/DRF y frontend React/Vite. Permite gestionar pacientes, historias clinicas, usuarios con roles, presencia online, avatar, dictado por voz y generacion de informes con Gemini adaptados a formatos institucionales.

## Interfaz

### Diseño Visual

- **Esquema de color**: Azul claro profesional (#3b82f6) como color primario
- **Modo oscuro ultra-moderno**: Fondo casi negro (#0a0a0a) con superficies oscuras (#1a1a1a)
- **Iconos profesionales**: Sistema de iconos lucide-react (Activity, Camera, File, User, Settings, etc.)
- **Tipografia**: Inter, sans-serif moderna
- **Responsive**: Grid layouts adaptativos para mobile, tablet y desktop

### Componentes de UI

- **Cards de pacientes**: Cards con avatar circular, detalles en grid 2x2 (edad, sexo, EPS, telefono), header con gradiente, footer interactivo
- **Cards de historiales**: Cards informativas con doctor, motivo, diagnostico, signos vitales y fecha
- **Paneles**: Contenedores con header, subtitle y body para secciones principales
- **Tabs**: Navegacion con iconos y labels (Formato, Consulta, Paciente, Pacientes, Historiales, Perfil, Usuarios)
- **Botones**: Estilos con iconos, estados hover y disabled
- **Formularios**: Grid layouts, labels con iconos, inputs y textareas estilizados

## Backend

- Django 6.
- Django REST Framework.
- PostgreSQL por variables de entorno.
- Apps:
  - `pacientes`
  - `historiales`
  - `usuarios`
  - `gemini_app`

Endpoints:

```text
/api/auth/login/
/api/auth/me/
/api/usuarios/
/api/usuarios/<id>/
/api/pacientes/
/api/historiales/
/api/medicamentos/
/api/gemini/estructurar-historia/
```

Roles:

- Administrador
- Medico
- Odontologo
- Administrativo

El login valida contra usuarios reales de Django. El token es firmado por Django y dura 8 horas.

## Frontend

- React/Vite.
- Login real.
- Modo claro/oscuro ultra-moderno.
- Pestanas con iconos: Formato (FileText), Consulta (Activity), Paciente (UserPlus), Pacientes (Users), Historiales (File), Mi perfil (Settings), Usuarios (UserCheck).
- Panel de usuarios solo para administradores.
- Avatar de usuario.
- Estado online/offline y ultima actividad.
- Heartbeat cada 60 segundos usando `/api/auth/me/`.
- El endpoint `/api/auth/me/` permite editar el perfil propio: usuario, nombres, apellidos, correo, avatar y contrasena con validacion de contrasena actual.

### Iconos Lucide-React

Actividad, Camera, CheckCircle, Circle, File, FileText, Key, LogOut, Mic, MicOff, Moon, Pause, Play, RefreshCw, Save, Settings, Sparkles, Stethoscope, Sun, Trash, User, UserCheck, UserPlus, UserX, Users.

### Secciones

- **Formato de informe**: Cards seleccionables con formatos predefinidos (general, soap, urgencias, control, odontologia), carga de documentos base, instrucciones personalizadas
- **Nueva consulta**: Formulario con paciente, doctor, transcripcion de voz (SpeechRecognition), auto-completado con IA, signos vitales, campos clinicos completos
- **Registrar paciente**: Grid form con todos los campos del paciente (documento, nombre, apellido, fecha nacimiento, sexo, telefono, email, direccion, EPS)
- **Pacientes**: Grid de cards con avatar, informacion demografica, edad calculada automaticamente, footer interactivo para crear consulta
- **Historiales**: Grid de cards con informacion de consultas previas, doctor, motivo, diagnostico, signos vitales, fecha
- **Mi perfil**: Avatar grande con camara para cambio de foto, informacion de usuario, estado de conexion y formulario para editar usuario, nombres, apellidos, correo y contrasena
- **Usuarios**: Tabla con avatar, informacion, estado (Activo/Inactivo), presencia (Online/Offline), selector de rol, acciones (Inactivar/Activar, Clave, Baja)

## Gemini

`POST /api/gemini/estructurar-historia/` recibe:

- transcripcion
- formato de clinica
- instrucciones
- texto base
- archivo base PDF/Word/Excel/TXT/MD

Devuelve campos estructurados e `informe_clinico`.

## Comandos

Backend:

```bash
cd backend
source ../venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --force
npm run build  # Produccion
```

### Estructura de archivos

- `frontend/src/App.jsx` - Componente principal con toda la logica de UI
- `frontend/src/styles.css` - Estilos globales con variables CSS para temas claro/oscuro
- `frontend/src/api.js` - Cliente HTTP con endpoints del backend

### Variables CSS

Modo claro:
- `--primary: #3b82f6` (azul)
- `--primary-2: #2563eb` (azul hover)
- `--bg: #f4f7f8`, `--surface: #fff`, `--surface-2: #eef4f5`

Modo oscuro:
- `--primary: #3b82f6` (azul brillante)
- `--primary-2: #60a5fa` (azul claro)
- `--bg: #0a0a0a`, `--surface: #1a1a1a`, `--surface-2: #2a2a2a`

