import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Camera, CheckCircle, Circle, File, FileText, Key, LogOut, Mic, MicOff, Moon, Pause, Play, RefreshCw, Save, Settings, Sparkles, Stethoscope, Sun, Trash, User, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import {
  createHistorial,
  createPaciente,
  createUsuario,
  estructurarHistoria,
  getHistoriales,
  getMe,
  getPacientes,
  getUsuarios,
  inactivarUsuario,
  loginUser,
  saveAuthSession,
  updateMe,
  updateUsuario,
} from './api'

const roles = ['Administrador', 'Medico', 'Odontologo', 'Administrativo']
const formatos = {
  general: 'Informe narrativo claro con motivo, antecedentes, hallazgos, diagnostico, conducta y plan.',
  soap: 'Organizar con encabezados: Subjetivo, Objetivo, Analisis y Plan.',
  urgencias: 'Priorizar motivo, signos vitales, impresion diagnostica, conducta inmediata y criterios de alarma.',
  control: 'Enfocar en evolucion, adherencia, respuesta al tratamiento, ajustes y seguimiento.',
  odontologia: 'Cita dental: motivo odontologico, hallazgos, dientes/superficies, procedimiento, diagnostico, plan y control.',
}

const emptyPaciente = {
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

const emptyHistorial = {
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

const emptyUsuario = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'Medico',
  is_active: true,
}

function relativeTime(value) {
  if (!value) return 'Sin registro'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Conectado ahora'
  if (minutes < 60) return `Conectado hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Conectado hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Conectado hace ${days} dia${days === 1 ? '' : 's'}`
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('session')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed.token ? parsed : null
  })
  const [tab, setTab] = useState('formato')
  const [login, setLogin] = useState({ username: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pacientes, setPacientes] = useState([])
  const [historiales, setHistoriales] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [paciente, setPaciente] = useState(emptyPaciente)
  const [historial, setHistorial] = useState(emptyHistorial)
  const [usuario, setUsuario] = useState(emptyUsuario)
  const [profileForm, setProfileForm] = useState({ username: '', first_name: '', last_name: '', email: '', current_password: '', new_password: '', confirm_password: '' })
  const [formato, setFormato] = useState(() => localStorage.getItem('formato') || 'general')
  const [instrucciones, setInstrucciones] = useState(() => localStorage.getItem('instrucciones') || formatos.general)
  const [formatoBase, setFormatoBase] = useState(() => localStorage.getItem('formatoBase') || '')
  const [formatoArchivo, setFormatoArchivo] = useState(null)
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const recognitionRef = useRef(null)

  const isAdmin = session?.role === 'Administrador' || session?.is_superuser
  const pacientesById = useMemo(() => Object.fromEntries(pacientes.map((p) => [p.id, `${p.nombre} ${p.apellido}`])), [pacientes])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('formato', formato)
    localStorage.setItem('instrucciones', instrucciones)
    localStorage.setItem('formatoBase', formatoBase)
  }, [formato, instrucciones, formatoBase])

  async function loadData() {
    try {
      const [p, h] = await Promise.all([getPacientes(), getHistoriales()])
      setPacientes(p)
      setHistoriales(h)
      if (!historial.paciente && p.length) setHistorial((current) => ({ ...current, paciente: String(p[0].id) }))
    } catch (err) {
      setError(`No se pudieron cargar datos clinicos. ${err.message}`)
    }
  }

  async function loadUsuarios() {
    if (!isAdmin) return
    try {
      setUsuarios(await getUsuarios())
    } catch (err) {
      setError(`No se pudo cargar usuarios. ${err.message}`)
    }
  }

  useEffect(() => {
    if (session) loadData()
  }, [session?.token])

  useEffect(() => {
    if (!session) return
    setProfileForm((current) => ({
      ...current,
      username: session.username || '',
      first_name: session.first_name || '',
      last_name: session.last_name || '',
      email: session.email || '',
    }))
  }, [session?.id])

  useEffect(() => {
    if (isAdmin) loadUsuarios()
    else setUsuarios([])
  }, [session?.role])

  useEffect(() => {
    if (!session?.token) return
    let mounted = true
    async function heartbeat() {
      try {
        const me = await getMe()
        if (!mounted) return
        saveAuthSession(me)
        setSession(me)
        if (isAdmin) loadUsuarios()
      } catch {
        saveAuthSession(null)
        setSession(null)
      }
    }
    heartbeat()
    const id = window.setInterval(heartbeat, 60000)
    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [session?.token])

  async function doLogin(event) {
    event.preventDefault()
    setError('')
    try {
      const user = await loginUser(login.username, login.password)
      saveAuthSession(user)
      setSession(user)
      setLogin({ username: '', password: '' })
      setTab(user.role === 'Administrador' || user.is_superuser ? 'usuarios' : 'formato')
    } catch {
      setError('Usuario o contrasena invalidos.')
    }
  }

  function logout() {
    saveAuthSession(null)
    setSession(null)
    setTab('formato')
  }

  async function savePaciente(event) {
    event.preventDefault()
    try {
      const created = await createPaciente(paciente)
      setPaciente(emptyPaciente)
      setHistorial((current) => ({ ...current, paciente: String(created.id) }))
      setMessage('Paciente creado.')
      await loadData()
    } catch (err) {
      setError(`No se pudo crear paciente. ${err.message}`)
    }
  }

  async function saveHistorial(event) {
    event.preventDefault()
    const payload = {
      ...historial,
      paciente: Number(historial.paciente),
      temperatura: historial.temperatura || null,
      frecuencia_cardiaca: historial.frecuencia_cardiaca || null,
      frecuencia_respiratoria: historial.frecuencia_respiratoria || null,
      peso: historial.peso || null,
      talla: historial.talla || null,
      medicamentos: [],
    }
    try {
      await createHistorial(payload)
      setHistorial((current) => ({ ...emptyHistorial, paciente: current.paciente }))
      setMessage('Consulta guardada.')
      await loadData()
    } catch (err) {
      setError(`No se pudo guardar consulta. ${err.message}`)
    }
  }

  async function runGemini() {
    if (!historial.transcripcion_audio.trim()) {
      setError('Primero dicta o escribe la transcripcion.')
      return
    }
    setAiLoading(true)
    try {
      const fields = await estructurarHistoria({
        transcripcion: historial.transcripcion_audio,
        formatoClinica: formato,
        instruccionesClinica: instrucciones,
        formatoBase,
        formatoArchivo,
      })
      setHistorial((current) => ({ ...current, ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== '')) }))
      setMessage('Historia completada por IA.')
    } catch (err) {
      setError(`Gemini no pudo completar. ${err.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  function toggleDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Este navegador no soporta dictado por voz.')
      return
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CO'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) text += `${event.results[i][0].transcript} `
      }
      if (text) setHistorial((current) => ({ ...current, transcripcion_audio: `${current.transcripcion_audio} ${text}`.trim() }))
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setError('No se pudo usar el microfono.')
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  async function saveUsuario(event) {
    event.preventDefault()
    try {
      await createUsuario(usuario)
      setUsuario(emptyUsuario)
      setMessage('Usuario creado.')
      await loadUsuarios()
    } catch (err) {
      setError(`No se pudo crear usuario. ${err.message}`)
    }
  }

  async function updateUser(user, data) {
    try {
      await updateUsuario(user.id, data)
      setMessage('Usuario actualizado.')
      await loadUsuarios()
    } catch (err) {
      setError(`No se pudo actualizar usuario. ${err.message}`)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      setError('La confirmacion de contrasena no coincide.')
      return
    }
    const payload = {
      username: profileForm.username,
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      email: profileForm.email,
    }
    if (profileForm.new_password) {
      payload.current_password = profileForm.current_password
      payload.new_password = profileForm.new_password
    }
    try {
      const me = await updateMe(payload)
      saveAuthSession(me)
      setSession(me)
      setProfileForm((current) => ({ ...current, current_password: '', new_password: '', confirm_password: '' }))
      setMessage('Perfil actualizado.')
      if (isAdmin) await loadUsuarios()
    } catch (err) {
      setError(`No se pudo actualizar el perfil. ${err.message}`)
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const avatar = loadEvent.target.result
      const me = await updateMe({ avatar_url: avatar })
      saveAuthSession(me)
      setSession(me)
      if (isAdmin) await loadUsuarios()
    }
    reader.readAsDataURL(file)
  }

  if (!session) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={doLogin}>
          <p className="eyebrow"><Stethoscope size={14} /> Sistema medico</p>
          <h1>Doc Write</h1>
          <input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} placeholder="Usuario" autoComplete="username" />
          <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} placeholder="Contrasena" autoComplete="current-password" />
          {error && <div className="notice error">{error}</div>}
          <button>Ingresar</button>
          <button type="button" className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</button>
        </form>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>Doc Write</h1>
          <p>{session.role} · {session.username}</p>
        </div>
        <div className="top-actions">
          <button className="avatar-btn" onClick={() => setTab('perfil')}>
            {session.avatar_url ? <img src={session.avatar_url} alt="" /> : <span>{session.avatar_initials}</span>}
          </button>
          <button onClick={loadData} title="Actualizar"><RefreshCw size={16} /></button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button onClick={logout}><LogOut size={16} /></button>
        </div>
      </header>

      <nav className="tabs">
        {[
          ['formato', <><FileText size={16} /> Formato</>],
          ['consulta', <><Activity size={16} /> Consulta</>],
          ['paciente', <><UserPlus size={16} /> Paciente</>],
          ['pacientes', <><Users size={16} /> Pacientes ({pacientes.length})</>],
          ['historiales', <><File size={16} /> Historiales ({historiales.length})</>],
          ['perfil', <><Settings size={16} /> Perfil</>],
          ...(isAdmin ? [['usuarios', <><UserCheck size={16} /> Usuarios ({usuarios.length})</>]] : []),
        ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {(message || error) && <div className={error ? 'notice error' : 'notice'}>{error || message}</div>}

      <section className="content">
        {tab === 'formato' && (
          <Panel title={<><FileText size={20} /> Formato de informe</>} subtitle="Carga el documento real de la clinica o escribe instrucciones.">
            <div className="format-grid">
              {Object.entries(formatos).map(([key, text]) => <button key={key} className={formato === key ? 'format-card active' : 'format-card'} onClick={() => { setFormato(key); setInstrucciones(text) }}><strong>{key}</strong><span>{text}</span></button>)}
            </div>
            <label><FileText size={16} /> Documento base PDF/Word/Excel<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" onChange={(e) => setFormatoArchivo(e.target.files?.[0] || null)} /></label>
            <textarea rows="5" value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} />
            <textarea rows="10" value={formatoBase} onChange={(e) => setFormatoBase(e.target.value)} placeholder="Texto adicional del formato..." />
          </Panel>
        )}

        {tab === 'consulta' && (
          <Panel title={<><Activity size={20} /> Nueva consulta</>} subtitle={`Formato activo: ${formato}`}>
            <form onSubmit={saveHistorial} className="grid-form">
              <label><User size={16} /> Paciente<select value={historial.paciente} onChange={(e) => setHistorial({ ...historial, paciente: e.target.value })}>{pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select></label>
              <label><Stethoscope size={16} /> Doctor<input required value={historial.doctor} onChange={(e) => setHistorial({ ...historial, doctor: e.target.value })} /></label>
              <label className="wide"><Mic size={16} /> Transcripcion<textarea rows="5" value={historial.transcripcion_audio} onChange={(e) => setHistorial({ ...historial, transcripcion_audio: e.target.value })} /></label>
              <div className="actions wide"><button type="button" onClick={toggleDictation}>{listening ? <><MicOff size={16} /> Detener</> : <><Mic size={16} /> Dictar</>}</button><button type="button" disabled={aiLoading} onClick={runGemini}>{aiLoading ? <><Activity size={16} /> Procesando...</> : <><Sparkles size={16} /> Auto-completar</>}</button></div>
              {['temperatura', 'presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'peso', 'talla'].map((field) => <label key={field}>{field}<input value={historial[field]} onChange={(e) => setHistorial({ ...historial, [field]: e.target.value })} /></label>)}
              {['motivo_consulta', 'enfermedad_actual', 'antecedentes', 'examen_fisico', 'diagnostico', 'tratamiento', 'observaciones', 'informe_clinico'].map((field) => <label key={field} className="wide">{field}<textarea rows={field === 'informe_clinico' ? 8 : 3} value={historial[field]} onChange={(e) => setHistorial({ ...historial, [field]: e.target.value })} /></label>)}
              <button className="wide"><Save size={16} /> Guardar</button>
            </form>
          </Panel>
        )}

        {tab === 'paciente' && (
          <Panel title={<><UserPlus size={20} /> Registrar paciente</>} subtitle="Datos basicos del paciente.">
            <form className="grid-form" onSubmit={savePaciente}>
              {Object.keys(emptyPaciente).map((field) => field === 'sexo' ? <label key={field}>{field}<select value={paciente[field]} onChange={(e) => setPaciente({ ...paciente, [field]: e.target.value })}><option value="M">Masculino</option><option value="F">Femenino</option><option value="O">Otro</option></select></label> : <label key={field}>{field}<input required={['numero_documento', 'nombre', 'apellido', 'fecha_nacimiento'].includes(field)} type={field === 'fecha_nacimiento' ? 'date' : 'text'} value={paciente[field]} onChange={(e) => setPaciente({ ...paciente, [field]: e.target.value })} /></label>)}
              <button className="wide"><UserPlus size={16} /> Crear</button>
            </form>
          </Panel>
        )}

        {tab === 'pacientes' && (
          <Panel title={<><Users size={20} /> Pacientes</>} subtitle={`Total: ${pacientes.length} pacientes registrados`}>
            <div className="patient-grid">
              {pacientes.map((p) => (
                <div key={p.id} className="patient-card" onClick={() => { setHistorial({ ...historial, paciente: String(p.id) }); setTab('consulta') }}>
                  <div className="patient-header">
                    <div className="patient-avatar">
                      <User size={24} />
                    </div>
                    <div className="patient-info">
                      <h3>{p.nombre} {p.apellido}</h3>
                      <p className="patient-id">{p.tipo_documento} {p.numero_documento}</p>
                    </div>
                  </div>
                  <div className="patient-details">
                    <div className="patient-detail">
                      <span className="detail-label">Edad</span>
                      <span className="detail-value">{p.fecha_nacimiento ? new Date().getFullYear() - new Date(p.fecha_nacimiento).getFullYear() : 'N/A'} años</span>
                    </div>
                    <div className="patient-detail">
                      <span className="detail-label">Sexo</span>
                      <span className="detail-value">{p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : 'Otro'}</span>
                    </div>
                    <div className="patient-detail">
                      <span className="detail-label">EPS</span>
                      <span className="detail-value">{p.eps || 'No registrada'}</span>
                    </div>
                    <div className="patient-detail">
                      <span className="detail-label">Teléfono</span>
                      <span className="detail-value">{p.telefono || 'No registrado'}</span>
                    </div>
                  </div>
                  <div className="patient-footer">
                    <Activity size={14} />
                    <span>Crear consulta</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
        {tab === 'historiales' && (
          <Panel title={<><File size={20} /> Historiales</>} subtitle={`Total: ${historiales.length} consultas registradas`}>
            <div className="historial-grid">
              {historiales.map((h) => (
                <div key={h.id} className="historial-card">
                  <div className="historial-header">
                    <File size={20} />
                    <div className="historial-info">
                      <h3>{pacientesById[h.paciente] || 'Paciente desconocido'}</h3>
                      <p className="historial-date">{new Date(h.created_at || Date.now()).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="historial-body">
                    <div className="historial-field">
                      <span className="field-label">Doctor</span>
                      <span className="field-value">{h.doctor || 'No registrado'}</span>
                    </div>
                    <div className="historial-field">
                      <span className="field-label">Motivo</span>
                      <span className="field-value">{h.motivo_consulta || 'No registrado'}</span>
                    </div>
                    <div className="historial-field">
                      <span className="field-label">Diagnóstico</span>
                      <span className="field-value">{h.diagnostico || 'Sin diagnóstico'}</span>
                    </div>
                    {h.temperatura && (
                      <div className="historial-field">
                        <span className="field-label">Signos vitales</span>
                        <span className="field-value">
                          {h.temperatura && `T: ${h.temperatura}°C`}
                          {h.presion_arterial && ` · PA: ${h.presion_arterial}`}
                          {h.frecuencia_cardiaca && ` · FC: ${h.frecuencia_cardiaca}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === 'perfil' && (
          <Panel title={<><Settings size={20} /> Mi perfil</>} subtitle={`${session.role} · ${relativeTime(session.last_seen || session.last_login)}`}>
            <div className="profile">
              <div className="big-avatar">{session.avatar_url ? <img src={session.avatar_url} alt="" /> : <span>{session.avatar_initials}</span>}<label><Camera size={18} /><input type="file" accept="image/*" onChange={uploadAvatar} /></label></div>
              <div><h2>{`${session.first_name || ''} ${session.last_name || ''}`.trim() || session.username}</h2><p>{session.email || 'Sin email'}</p><p>{session.is_online ? <><CheckCircle size={14} /> Conectado</> : <><Circle size={14} /> Desconectado</>}</p></div>
            </div>
            <form className="grid-form profile-form" onSubmit={saveProfile}>
              <label>Usuario<input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} required autoComplete="username" /></label>
              <label>Nombres<input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} autoComplete="given-name" /></label>
              <label>Apellidos<input value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} autoComplete="family-name" /></label>
              <label>Correo<input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} autoComplete="email" /></label>
              <label>Contrasena actual<input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} autoComplete="current-password" /></label>
              <label>Nueva contrasena<input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} autoComplete="new-password" /></label>
              <label className="wide">Confirmar nueva contrasena<input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })} autoComplete="new-password" /></label>
              <button className="wide"><Save size={16} /> Guardar perfil</button>
            </form>
          </Panel>
        )}

        {tab === 'usuarios' && isAdmin && (
          <Panel title={<><UserCheck size={20} /> Usuarios</>} subtitle="Administra roles, estado, avatar y presencia.">
            <form className="grid-form" onSubmit={saveUsuario}>
              {['username', 'password', 'first_name', 'last_name', 'email'].map((field) => <label key={field}>{field}<input type={field === 'password' ? 'password' : 'text'} value={usuario[field]} onChange={(e) => setUsuario({ ...usuario, [field]: e.target.value })} required={['username', 'password'].includes(field)} /></label>)}
              <label>role<select value={usuario.role} onChange={(e) => setUsuario({ ...usuario, role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
              <button className="wide"><UserPlus size={16} /> Crear</button>
            </form>
            <div className="user-list">
              {usuarios.map((user) => <UserRow key={user.id} user={user} onUpdate={updateUser} onDisable={async () => { await inactivarUsuario(user.id); await loadUsuarios() }} />)}
            </div>
          </Panel>
        )}
      </section>
    </main>
  )
}

function Panel({ title, subtitle, children }) {
  return <article className="panel"><header><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</header><div className="panel-body">{children}</div></article>
}

function Card({ title, text, onClick }) {
  return <button className="card" type="button" onClick={onClick}><strong>{title}</strong><span>{text}</span></button>
}

function UserRow({ user, onUpdate, onDisable }) {
  return (
    <div className={user.is_active ? 'user-row' : 'user-row inactive'}>
      <div className="admin-avatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.avatar_initials}</span>}<i className={user.is_online ? 'online' : ''}></i></div>
      <div className="user-info"><strong>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</strong><span>{user.username} · {user.email || 'Sin email'}</span><small>{user.is_active ? <><CheckCircle size={12} /> Activo</> : <><UserX size={12} /> Inactivo</>} · {user.is_online ? <><Circle size={12} fill="currentColor" /> Online</> : <><Circle size={12} /> Offline</>} · {relativeTime(user.last_seen || user.last_login)}</small></div>
      <select value={user.role} disabled={user.is_superuser} onChange={(e) => onUpdate(user, { role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
      <button disabled={user.is_superuser} onClick={() => onUpdate(user, { is_active: !user.is_active })}>{user.is_active ? <><Pause size={14} /> Inactivar</> : <><Play size={14} /> Activar</>}</button>
      <button onClick={() => { const password = window.prompt(`Nueva contrasena para ${user.username}`); if (password) onUpdate(user, { password }) }}><Key size={14} /> Clave</button>
      <button disabled={user.is_superuser} onClick={onDisable}><Trash size={14} /> Baja</button>
    </div>
  )
}
