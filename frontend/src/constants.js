export const roles = ['Administrador', 'Medico', 'Odontologo', 'Administrativo']

export const formatos = {
  general: 'Informe narrativo claro con motivo, antecedentes, hallazgos, diagnostico, conducta y plan.',
  soap: 'Organizar con encabezados: Subjetivo, Objetivo, Analisis y Plan.',
  urgencias: 'Priorizar motivo, signos vitales, impresion diagnostica, conducta inmediata y criterios de alarma.',
  control: 'Enfocar en evolucion, adherencia, respuesta al tratamiento, ajustes y seguimiento.',
  odontologia: 'Cita dental: motivo odontologico, hallazgos, dientes/superficies, procedimiento, diagnostico, plan y control.',
}

export const emptyPaciente = {
  tipo_documento: 'CC',
  numero_documento: '',
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  sexo: 'M',
  telefono: '',
  email: '',
  direccion: '',
  eps: '',
}

export const emptyHistorial = {
  paciente: '',
  doctor: '',
  temperatura: '',
  presion_arterial: '',
  frecuencia_cardiaca: '',
  frecuencia_respiratoria: '',
  peso: '',
  talla: '',
  motivo_consulta: '',
  enfermedad_actual: '',
  antecedentes: '',
  examen_fisico: '',
  diagnostico: '',
  tratamiento: '',
  observaciones: '',
  informe_clinico: '',
  transcripcion_audio: '',
}

export const emptyUsuario = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'Medico',
  is_active: true,
}

export function relativeTime(value) {
  if (!value) return 'Sin registro'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Conectado ahora'
  if (minutes < 60) return `Conectado hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Conectado hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Conectado hace ${days} dia${days === 1 ? '' : 's'}`
}