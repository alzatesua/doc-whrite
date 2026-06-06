const API_BASE_URL = '/api'

export function saveAuthSession(session) {
  if (session) localStorage.setItem('session', JSON.stringify(session))
  else localStorage.removeItem('session')
}

function token() {
  try {
    return JSON.parse(localStorage.getItem('session') || '{}').token || ''
  } catch {
    localStorage.removeItem('session')
    return ''
  }
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const authToken = token()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: isFormData
      ? { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...options.headers }
      : { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    const text = await response.text()
    try {
      throw new Error(JSON.parse(text).detail || text)
    } catch (error) {
      if (error.message && error.message !== 'Unexpected end of JSON input') throw error
      throw new Error(text || `Error HTTP ${response.status}`)
    }
  }
  if (response.status === 204) return null
  return response.json()
}

export const loginUser = (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) })
export const getMe = () => request('/auth/me/')
export const updateMe = (data) => request('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) })
export const getUsuarios = () => request('/usuarios/')
export const createUsuario = (data) => request('/usuarios/', { method: 'POST', body: JSON.stringify(data) })
export const updateUsuario = (id, data) => request(`/usuarios/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
export const inactivarUsuario = (id) => request(`/usuarios/${id}/`, { method: 'DELETE' })
export const getPacientes = () => request('/pacientes/')
export const createPaciente = (data) => request('/pacientes/', { method: 'POST', body: JSON.stringify(data) })
export const updatePaciente = (id, data) => request(`/pacientes/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
export const getHistoriales = () => request('/historiales/')
export const createHistorial = (data) => request('/historiales/', { method: 'POST', body: JSON.stringify(data) })

export function transcribirAudio(audioBlob, idioma = 'es-CO') {
  const form = new FormData()
  form.append('audio', audioBlob, 'calibracion-voz.webm')
  form.append('idioma', idioma)
  return request('/gemini/transcribir-audio/', { method: 'POST', body: form })
}

export function estructurarHistoria(data) {
  if (data.formatoArchivo) {
    const form = new FormData()
    form.append('transcripcion', data.transcripcion)
    form.append('formato_clinica', data.formatoClinica)
    form.append('instrucciones_clinica', data.instruccionesClinica)
    form.append('formato_base', data.formatoBase)
    form.append('perfil_voz', data.perfilVoz)
    form.append('formato_archivo', data.formatoArchivo)
    return request('/gemini/estructurar-historia/', { method: 'POST', body: form })
  }
  return request('/gemini/estructurar-historia/', {
    method: 'POST',
    body: JSON.stringify({
      transcripcion: data.transcripcion,
      formato_clinica: data.formatoClinica,
      instrucciones_clinica: data.instruccionesClinica,
      formato_base: data.formatoBase,
      perfil_voz: data.perfilVoz,
    }),
  })
}
