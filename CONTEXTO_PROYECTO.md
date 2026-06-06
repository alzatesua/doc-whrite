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

- **Cards de pacientes**: Cards con avatar circular, detalles en grid 2x2 (edad, sexo, EPS, telefono), header con gradiente y footer interactivo. Incluye controles de paginación para navegación eficiente.
- **Cards de historiales**: Cards informativas con doctor, motivo, diagnostico, signos vitales y fecha. Incluye controles de paginación para navegación eficiente.
- **Paneles**: Contenedores con header, subtitle y body para secciones principales
- **Tabs**: Navegacion simplificada con iconos y labels (Formato, Consulta, Pacientes, Perfil, Usuarios)
- **Botones**: Estilos con iconos, estados hover y disabled
- **Notificaciones**: Sistema flotante en la parte superior derecha con auto-ocultado e iconos de estado (Check/Alert)
- **Modales**: Ventanas emergentes con fondo desenfocado (backdrop-filter) para crear/editar pacientes, usuarios y consultas sin perder el contexto
- **Formularios**: Grid layouts, labels con iconos, inputs, textareas y selectores inteligentes (selects) con buscador integrado para filtrado rápido y ágil de opciones.

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
- Modo claro/oscuro ultra-moderno con persistencia en localStorage.
- Pestanas unificadas: 
  - **Formato** (FileText)
  - **Consulta** (Activity): Integra el listado histórico con paginación y el botón para nueva consulta (Modal).
  - **Pacientes** (Users): Gestión completa con búsqueda, paginación y edición en Modal.
  - **Mi perfil** (Settings)
  - **Usuarios** (UserCheck): Gestión administrativa con paginación y Modal.
- Panel de usuarios solo para administradores.
- Avatar de usuario.
- Estado online/offline y ultima actividad.
- Heartbeat cada 60 segundos usando `/api/auth/me/`.
- El endpoint `/api/auth/me/` permite editar el perfil propio: usuario, nombres, apellidos, correo, avatar y contrasena con validacion de contrasena actual.

### Iconos Lucide-React

Activity, AlertCircle, Camera, CheckCircle, Circle, Edit, File, FileText, Key, LogOut, Mic, MicOff, Moon, Pause, Play, RefreshCw, Save, Search, Settings, Sparkles, Stethoscope, Sun, Trash, User, UserCheck, UserPlus, UserX, Users.

### Secciones

- **Formato de informe**: Cards seleccionables con formatos predefinidos (general, soap, urgencias, control, odontologia), carga de documentos base, instrucciones personalizadas
- **Consulta e Historial**: Lista cronológica de atenciones previas. Botón superior para abrir el **Modal de Nueva Consulta** con transcripción de voz y Gemini.
- **Pacientes**: Buscador reactivo (nombre/documento), paginación optimizada para miles de registros y grid de cards informativas. Botón superior para abrir el **Modal de Registro/Edición** de pacientes con selectores buscables para tipo de documento, sexo y EPS.
- **Mi perfil**: Avatar grande con camara para cambio de foto, informacion de usuario, estado de conexion y formulario para editar usuario, nombres, apellidos, correo y contrasena
- **Usuarios**: Gestión administrativa de cuentas con soporte de paginación. Botón para **Modal de Nuevo Usuario** con buscador en la selección de roles y acciones en fila para gestión de cuentas.

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

- `frontend/src/App.jsx` - Orquestador de estado, navegación y persistencia
- `frontend/src/constants.js` - Modelos vacíos, opciones de roles y lógica de tiempos relativos
- `frontend/src/components.jsx` - Componentes reutilizables (Panel, UserRow, Notification, Card)
- `frontend/src/api.js` - Cliente HTTP con endpoints del backend
- `frontend/src/styles.css` - Estilos globales con variables CSS para temas claro/oscuro
- `frontend/src/ConsultaSection.jsx` - Vista unificada de historial y modal de consulta
- `frontend/src/PacientesListSection.jsx` - Vista de listado, búsqueda y control del modal de pacientes
- `frontend/src/PacienteFormSection.jsx` - Modal profesional para crear/editar pacientes
- `frontend/src/UsuariosSection.jsx` - Gestión de usuarios con modal integrado
- `frontend/src/PerfilSection.jsx` - Gestión de perfil personal

### Variables CSS

Modo claro:
- `--primary: #3b82f6` (azul)
- `--primary-2: #2563eb` (azul hover)
- `--bg: #f4f7f8`, `--surface: #fff`, `--surface-2: #eef4f5`

Modo oscuro:
- `--primary: #3b82f6` (azul brillante)
- `--primary-2: #60a5fa` (azul claro)
- `--bg: #0a0a0a`, `--surface: #1a1a1a`, `--surface-2: #2a2a2a`
