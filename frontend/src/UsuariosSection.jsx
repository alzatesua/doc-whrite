import React from 'react'
import { UserCheck, UserPlus, UserX } from 'lucide-react'
import { Panel, UserRow, SearchableSelect, Pagination } from './components'
import { roles } from './constants'

export default function UsuariosSection({ usuarios, showUserForm, setShowUserForm, usuario, setUsuario, saveUsuario, updateUser, inactivarUsuario, loadUsuarios, page, setPage, pageSize }) {
  return (
    <Panel
      title={<><UserCheck size={20} /> Usuarios</>}
      subtitle="Administra roles, estado, avatar y presencia."
      action={
        <button className="primary" onClick={() => setShowUserForm(true)}>
          <UserPlus size={16} /> Nuevo usuario
        </button>
      }
    >
      {showUserForm && (
        <div 
          className="modal-overlay" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10500, padding: '1rem' }}
          onClick={() => setShowUserForm(false)}
        >
          <div 
            className="modal-content" 
            style={{ background: 'var(--surface)', width: '100%', maxWidth: '550px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}><UserPlus size={24} /> Crear Nuevo Usuario</h2>
              <button className="icon-btn" onClick={() => setShowUserForm(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}><UserX size={20} /></button>
            </div>
            <form className="grid-form" style={{ padding: '2rem' }} onSubmit={saveUsuario}>
              {['username', 'password', 'first_name', 'last_name', 'email'].map((field) => <label key={field}>{field}<input type={field === 'password' ? 'password' : 'text'} value={usuario[field]} onChange={(e) => setUsuario({ ...usuario, [field]: e.target.value })} required={['username', 'password'].includes(field)} /></label>)}
              <div className="wide">
                <SearchableSelect 
                  label="Rol de usuario"
                  value={usuario.role}
                  options={roles.map(r => ({ value: r, label: r }))}
                  onChange={(val) => setUsuario({ ...usuario, role: val })}
                />
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }} className="wide">
                <button type="button" className="ghost wide" onClick={() => setShowUserForm(false)}>Cancelar</button>
                <button className="wide"><UserPlus size={16} /> Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="user-list">
        {usuarios.map((user) => <UserRow key={user.id} user={user} onUpdate={updateUser} onDisable={async () => { await inactivarUsuario(user.id); await loadUsuarios() }} />)}
      </div>

      <Pagination 
        currentPage={page} 
        totalCount={usuarios.length} 
        pageSize={pageSize} 
        onPageChange={setPage} 
      />
    </Panel>
  )
}