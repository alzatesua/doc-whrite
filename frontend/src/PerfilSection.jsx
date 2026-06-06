import React from 'react'
import { Camera, CheckCircle, Circle, Save, Settings } from 'lucide-react'
import { Panel } from './components'
import { relativeTime } from './constants'

export default function PerfilSection({ session, profileForm, setProfileForm, saveProfile, uploadAvatar }) {
  return (
    <Panel title={<><Settings size={20} /> Mi perfil</>} subtitle={`${session.role} · ${relativeTime(session.last_seen || session.last_login)}`}>
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
  )
}