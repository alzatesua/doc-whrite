import React, { useRef, useState } from 'react'
import { Camera, CheckCircle, Circle, Edit, Mic, MicOff, Save, Settings, UserX } from 'lucide-react'
import { Panel } from './components'
import { relativeTime } from './constants'
import { transcribirAudio } from './api'

const dictationLanguages = [
  { value: 'es-CO', label: 'Español Colombia' },
  { value: 'es-ES', label: 'Español España' },
  { value: 'es-MX', label: 'Español México' },
  { value: 'es-US', label: 'Español Estados Unidos' },
]

export default function PerfilSection({ session, profileForm, setProfileForm, saveProfile, uploadAvatar }) {
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrationStatus, setCalibrationStatus] = useState('')
  const [calibrationTranscript, setCalibrationTranscript] = useState('')
  const [voiceLevel, setVoiceLevel] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const calibrationTimerRef = useRef(null)
  const voiceMeterRef = useRef({ context: null, frame: null })

  function appendVoiceSample(text) {
    const sample = text.trim()
    if (!sample) {
      setCalibrationStatus('No se pudo transcribir una muestra clara. Intenta grabar de nuevo hablando un poco mas fuerte.')
      return
    }
    const wordCount = sample.split(/\s+/).filter(Boolean).length
    const sampleText = `Muestra de voz del doctor: ${sample}`
    setProfileForm((currentForm) => {
      const current = currentForm.voice_profile.trim()
      return {
        ...currentForm,
        voice_profile: current ? `${current}\n${sampleText}` : sampleText,
      }
    })
    setCalibrationStatus(`Muestra capturada: ${wordCount} palabras. Guarda el perfil para dejarla registrada.`)
  }

  function clearCalibrationTimer() {
    if (calibrationTimerRef.current) window.clearTimeout(calibrationTimerRef.current)
    calibrationTimerRef.current = null
  }

  function stopVoiceMeter() {
    const meter = voiceMeterRef.current
    if (meter.frame) cancelAnimationFrame(meter.frame)
    if (meter.context) meter.context.close()
    voiceMeterRef.current = { context: null, frame: null }
    setVoiceLevel(0)
  }

  function startVoiceMeter(stream) {
    stopVoiceMeter()
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(stream).connect(analyser)
    const values = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteTimeDomainData(values)
      let sum = 0
      for (let i = 0; i < values.length; i += 1) {
        const centered = (values[i] - 128) / 128
        sum += centered * centered
      }
      const rms = Math.sqrt(sum / values.length)
      setVoiceLevel(Math.min(100, Math.round(rms * 260)))
      voiceMeterRef.current.frame = requestAnimationFrame(tick)
    }
    voiceMeterRef.current = { context, frame: requestAnimationFrame(tick) }
  }

  function stopVoiceCalibration() {
    clearCalibrationTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setCalibrationStatus('Procesando audio de calibracion...')
      mediaRecorderRef.current.stop()
    }
  }

  async function toggleVoiceCalibration() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setCalibrationStatus('Este navegador no soporta grabacion de audio. Usa Chrome o Edge en localhost/HTTPS.')
      return
    }
    if (calibrating) {
      stopVoiceCalibration()
      return
    }

    setCalibrationTranscript('')
    setVoiceLevel(0)
    audioChunksRef.current = []
    clearCalibrationTimer()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startVoiceMeter(stream)
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stopVoiceMeter()
        stream.getTracks().forEach((track) => track.stop())
        setCalibrating(false)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          if (!audioBlob.size) {
            setCalibrationStatus('No se grabo audio. Revisa el microfono e intenta de nuevo.')
            return
          }
          const result = await transcribirAudio(audioBlob, profileForm.dictation_language || 'es-CO')
          const transcript = result.transcripcion || ''
          setCalibrationTranscript(transcript)
          appendVoiceSample(transcript)
        } catch (error) {
          setCalibrationStatus(`No se pudo transcribir el audio. ${error.message}`)
        } finally {
          mediaRecorderRef.current = null
          audioChunksRef.current = []
        }
      }

      recorder.start()
      setCalibrating(true)
      setCalibrationStatus('Grabando muestra de voz... habla natural durante 15 segundos.')
      calibrationTimerRef.current = window.setTimeout(stopVoiceCalibration, 15000)
    } catch {
      stopVoiceMeter()
      setCalibrationStatus('No se pudo acceder al microfono. Revisa permisos e intenta de nuevo.')
      setCalibrating(false)
      mediaRecorderRef.current = null
    }
  }

  async function handleSaveProfile(event) {
    const saved = await saveProfile(event)
    if (saved) {
      setCalibrationStatus('')
      setShowProfileForm(false)
    }
  }

  return (
    <Panel
      title={<><Settings size={20} /> Mi perfil</>}
      subtitle={`${session.role} · ${relativeTime(session.last_seen || session.last_login)}`}
    >
      <div className="profile-action">
        <button type="button" onClick={() => setShowProfileForm(true)}><Edit size={16} /> Editar perfil</button>
      </div>
      <div className="profile">
        <div className="big-avatar">
          {session.avatar_url ? <img src={session.avatar_url} alt="" /> : <span>{session.avatar_initials}</span>}
          <label><Camera size={18} /><input type="file" accept="image/*" onChange={uploadAvatar} /></label>
        </div>
        <div>
          <h2>{`${session.first_name || ''} ${session.last_name || ''}`.trim() || session.username}</h2>
          <p>{session.email || 'Sin email'}</p>
          <p>{session.is_online ? <><CheckCircle size={14} /> Conectado</> : <><Circle size={14} /> Desconectado</>}</p>
        </div>
      </div>
      {showProfileForm && (
        <div
          className="modal-overlay"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10500, padding: '1rem' }}
          onClick={() => setShowProfileForm(false)}
        >
          <div
            className="modal-content profile-modal"
            style={{ background: 'var(--surface)', width: '100%', maxWidth: '760px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}><Settings size={22} /> Editar perfil</h2>
              <button type="button" className="icon-btn" onClick={() => setShowProfileForm(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}><UserX size={20} /></button>
            </div>
            <form className="grid-form profile-form" onSubmit={handleSaveProfile}>
              <label>Usuario<input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} required autoComplete="username" /></label>
              <label>Nombres<input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} autoComplete="given-name" /></label>
              <label>Apellidos<input value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} autoComplete="family-name" /></label>
              <label>Correo<input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} autoComplete="email" /></label>
              <label>
                <Mic size={16} /> Idioma del dictado
                <select value={profileForm.dictation_language} onChange={(e) => setProfileForm({ ...profileForm, dictation_language: e.target.value })}>
                  {dictationLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
                </select>
              </label>
              <label className="wide">
                Perfil de voz para IA
                <textarea
                  rows="4"
                  value={profileForm.voice_profile}
                  onChange={(e) => setProfileForm({ ...profileForm, voice_profile: e.target.value })}
                  placeholder="Ej: Hablo rapido, acento colombiano, uso siglas como HTA y DM2, cuando digo presion 120 80 significa 120/80."
                />
              </label>
              <button className="ghost wide" type="button" onClick={toggleVoiceCalibration}>
                {calibrating ? <><MicOff size={16} /> Detener calibracion</> : <><Mic size={16} /> Calibrar voz</>}
              </button>
              {(calibrating || voiceLevel > 0) && (
                <div className="voice-meter wide" aria-label={`Nivel de voz ${voiceLevel}%`}>
                  <span>Nivel de voz</span>
                  <div><i style={{ width: `${voiceLevel}%` }} /></div>
                  <strong>{voiceLevel}%</strong>
                </div>
              )}
              {calibrationStatus && <p className="calibration-status wide">{calibrationStatus}</p>}
              {calibrationTranscript && <p className="calibration-transcript wide">{calibrationTranscript}</p>}
              <label>Contrasena actual<input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} autoComplete="current-password" /></label>
              <label>Nueva contrasena<input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} autoComplete="new-password" /></label>
              <label className="wide">Confirmar nueva contrasena<input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })} autoComplete="new-password" /></label>
              <div className="wide profile-modal-actions">
                <button type="button" className="ghost" onClick={() => setShowProfileForm(false)}>Cancelar</button>
                <button><Save size={16} /> Guardar perfil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  )
}
