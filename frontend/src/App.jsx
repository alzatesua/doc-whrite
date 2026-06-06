import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertCircle, BarChart3, Camera, CheckCircle, Circle, ClipboardList, Edit, File, FileText, Key, LogOut, Mic, MicOff, Moon, Pause, Play, RefreshCw, Save, Search, Settings, Sparkles, Stethoscope, Sun, Trash, User, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
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
  updatePaciente,
} from './api'
import { roles, formatos, emptyPaciente, emptyHistorial, emptyUsuario, relativeTime } from './constants'
import { Panel, UserRow, Notification } from './components'
import FormatoSection from './FormatoSection'
import ConsultaSection from './ConsultaSection'
import PacienteFormSection from './PacienteFormSection'
import PacientesListSection from './PacientesListSection'
import PerfilSection from './PerfilSection'
import UsuariosSection from './UsuariosSection'
import MetricsSection from './MetricsSection'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [paciente, setPaciente] = useState(emptyPaciente)
  const [historial, setHistorial] = useState(emptyHistorial)
  const [usuario, setUsuario] = useState(emptyUsuario)
  const [showPacienteForm, setShowPacienteForm] = useState(false)
  const [showConsultaForm, setShowConsultaForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [pagePacientes, setPagePacientes] = useState(1)
  const [pageHistoriales, setPageHistoriales] = useState(1)
  const [pageUsuarios, setPageUsuarios] = useState(1)
  const PAGE_SIZE = 12;
  const [profileForm, setProfileForm] = useState({ username: '', first_name: '', last_name: '', email: '', dictation_language: 'es-CO', voice_profile: '', current_password: '', new_password: '', confirm_password: '' })
  const [formato, setFormato] = useState(() => localStorage.getItem('formato') || 'general')
  const [instrucciones, setInstrucciones] = useState(() => localStorage.getItem('instrucciones') || formatos.general)
  const [formatoBase, setFormatoBase] = useState(() => localStorage.getItem('formatoBase') || '')
  const [formatoArchivo, setFormatoArchivo] = useState(null)
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const recognitionRef = useRef(null)

  const isAdmin = session?.role === 'Administrador' || session?.is_superuser
  const pacientesById = useMemo(() => Object.fromEntries(pacientes.map((p) => [p.id, `${p.nombre} ${p.apellido}`])), [pacientes])

  const filteredPacientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return pacientes
    return pacientes.filter(p => 
      `${p.nombre} ${p.apellido} ${p.numero_documento}`.toLowerCase().includes(q)
    )
  }, [pacientes, searchQuery])

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
      dictation_language: session.dictation_language || 'es-CO',
      voice_profile: session.voice_profile || '',
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

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('')
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, error])

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
      if (paciente.id) {
        await updatePaciente(paciente.id, paciente)
        setMessage('Información del paciente actualizada.')
      } else {
        const created = await createPaciente(paciente)
        setHistorial((current) => ({ ...current, paciente: String(created.id) }))
        setMessage('Paciente creado.')
      }
      setShowPacienteForm(false)
      setPaciente(emptyPaciente)
      await loadData()
    } catch (err) {
      setError(`No se pudo procesar la solicitud. ${err.message}`)
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
      setShowConsultaForm(false)
      await loadData()
    } catch (err) {
      setError(`No se pudo guardar consulta. ${err.message}`)
    }
  }

  async function runGemini() {
    setError('')
    setMessage('')
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
        perfilVoz: session?.voice_profile || '',
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
    setError('')
    setMessage('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Este navegador no soporta dictado por voz. Usa Chrome o Edge en localhost/HTTPS.')
      return
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const baseTranscript = historial.transcripcion_audio.trim()
    const finalSegments = {}
    const recognition = new SpeechRecognition()
    recognition.lang = session?.dictation_language || 'es-CO'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const interimSegments = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript.trim()
        if (!transcript) continue
        if (event.results[i].isFinal) finalSegments[i] = transcript
        else interimSegments.push(transcript)
      }
      const nextTranscript = [
        baseTranscript,
        ...Object.values(finalSegments),
        ...interimSegments,
      ].filter(Boolean).join(' ')
      if (nextTranscript) setHistorial((current) => ({ ...current, transcripcion_audio: nextTranscript }))
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onerror = (event) => {
      const reason = event.error === 'not-allowed'
        ? 'Permiso del microfono denegado.'
        : event.error === 'no-speech'
          ? 'No se detecto voz. Intenta hablar mas cerca del microfono.'
          : `No se pudo usar el microfono (${event.error || 'error desconocido'}).`
      setError(reason)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      setError(`No se pudo iniciar el dictado. ${err.message}`)
      recognitionRef.current = null
      setListening(false)
    }
  }

  async function saveUsuario(event) {
    event.preventDefault()
    try {
      await createUsuario(usuario)
      setUsuario(emptyUsuario)
      setMessage('Usuario creado.')
      setShowUserForm(false)
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
      return false
    }
    const payload = {
      username: profileForm.username,
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      email: profileForm.email,
      dictation_language: profileForm.dictation_language || 'es-CO',
      voice_profile: profileForm.voice_profile,
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
      return true
    } catch (err) {
      setError(`No se pudo actualizar el perfil. ${err.message}`)
      return false
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
        <Notification message={message} error={error} onClose={() => { setMessage(''); setError(''); }} />
        <form className="login-panel" onSubmit={doLogin}>
          <p className="eyebrow"><Stethoscope size={14} /> Sistema medico</p>
          <h1>Doc Write</h1>
          <input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} placeholder="Usuario" autoComplete="username" />
          <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} placeholder="Contrasena" autoComplete="current-password" />
          <button>Ingresar</button>
          <button type="button" className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</button>
        </form>
      </main>
    )
  }

  return (
    <main className="app">
      <Notification message={message} error={error} onClose={() => { setMessage(''); setError(''); }} />
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
          ['consulta', <><Activity size={16} /> Consulta ({historiales.length})</>],
          ['pacientes', <><Users size={16} /> Pacientes ({pacientes.length})</>],
          ['metrics', <><BarChart3 size={16} /> Métricas</>],
          ['perfil', <><Settings size={16} /> Perfil</>],
          ...(isAdmin ? [['usuarios', <><UserCheck size={16} /> Usuarios ({usuarios.length})</>]] : []),
        ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      <section className="content">
        {tab === 'formato' && <FormatoSection formato={formato} setFormato={setFormato} instrucciones={instrucciones} setInstrucciones={setInstrucciones} formatoBase={formatoBase} setFormatoBase={setFormatoBase} setFormatoArchivo={setFormatoArchivo} formatoArchivo={formatoArchivo} />}
        {tab === 'consulta' && (
          <ConsultaSection 
            show={showConsultaForm}
            onClose={() => setShowConsultaForm(false)}
            onOpen={() => setShowConsultaForm(true)}
            historiales={historiales}
            pacientesById={pacientesById}
            historial={historial} 
            setHistorial={setHistorial} 
            pacientes={pacientes} 
            saveHistorial={saveHistorial} 
            toggleDictation={toggleDictation} 
            listening={listening} 
            aiLoading={aiLoading} 
            runGemini={runGemini} 
            formato={formato}
            usuarios={usuarios}
            page={pageHistoriales} setPage={setPageHistoriales} pageSize={PAGE_SIZE}
          />
        )}
        {tab === 'pacientes' && <PacientesListSection filteredPacientes={filteredPacientes.slice((pagePacientes-1)*PAGE_SIZE, pagePacientes*PAGE_SIZE)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setHistorial={setHistorial} setTab={setTab} setPaciente={setPaciente} totalCount={filteredPacientes.length} showPacienteForm={showPacienteForm} setShowPacienteForm={setShowPacienteForm} savePaciente={savePaciente} paciente={paciente} page={pagePacientes} setPage={setPagePacientes} pageSize={PAGE_SIZE} />}
        {tab === 'metrics' && <MetricsSection historiales={historiales} pacientes={pacientes} pacientesById={pacientesById} />}
        {tab === 'perfil' && <PerfilSection session={session} profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} uploadAvatar={uploadAvatar} />}
        {tab === 'usuarios' && isAdmin && <UsuariosSection usuarios={usuarios.slice((pageUsuarios-1)*PAGE_SIZE, pageUsuarios*PAGE_SIZE)} showUserForm={showUserForm} setShowUserForm={setShowUserForm} usuario={usuario} setUsuario={setUsuario} saveUsuario={saveUsuario} updateUser={updateUser} inactivarUsuario={inactivarUsuario} loadUsuarios={loadUsuarios} page={pageUsuarios} setPage={setPageUsuarios} pageSize={PAGE_SIZE} />}
      </section>
    </main>
  )
}
