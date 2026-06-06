import React, { useState, useRef, useEffect } from 'react'
import { AlertCircle, CheckCircle, Circle, Key, Pause, Play, Trash, UserX, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { relativeTime, roles } from './constants'

export function SearchableSelect({ label, options, value, onChange, placeholder = "Seleccionar..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const filteredOptions = options.filter(opt =>
    String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="searchable-select" ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
      {label && <label style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '0.6rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', 
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: isOpen ? '1px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s',
          minHeight: '42px'
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 99999, 
          background: 'var(--surface)', border: '1px solid var(--surface-2)', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', padding: '0.5rem'
        }}>
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              autoFocus placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid var(--surface-2)', background: 'var(--bg)', fontSize: '0.9rem', color: 'inherit' }}
            />
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', background: String(value) === String(opt.value) ? 'var(--primary)' : 'transparent', color: String(value) === String(opt.value) ? '#fff' : 'inherit', fontSize: '0.9rem' }}
              >
                {opt.label}
              </div>
            )) : <div style={{ padding: '0.75rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>Sin resultados</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function Pagination({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem', padding: '1rem' }}>
      <button className="icon-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        <ChevronLeft size={20} />
      </button>
      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
        Página {currentPage} de {totalPages}
      </span>
      <button className="icon-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function Panel({ title, subtitle, children, action }) {
  return (
    <article className="panel">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div className="panel-action">{action}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </article>
  )
}

export function Card({ title, text, onClick }) {
  return <button className="card" type="button" onClick={onClick}><strong>{title}</strong><span>{text}</span></button>
}

export function UserRow({ user, onUpdate, onDisable }) {
  return (
    <div className={user.is_active ? 'user-row' : 'user-row inactive'}>
      <div className="admin-avatar" style={{ flexShrink: 0 }}>{user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.avatar_initials}</span>}<i className={user.is_online ? 'online' : ''}></i></div>
      <div className="user-info">
        <strong>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</strong>
        <span>{user.username} · {user.email || 'Sin email'}</span>
        <small>
          {user.is_active ? <><CheckCircle size={12} /> Activo</> : <><UserX size={12} /> Inactivo</>} · 
          {user.is_online ? <><Circle size={12} fill="currentColor" /> Online</> : <><Circle size={12} /> Offline</>} · 
          {relativeTime(user.last_seen || user.last_login)}
        </small>
      </div>
      <div className="user-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ width: '150px' }}>
          <SearchableSelect 
            value={user.role} 
            options={roles.map(r => ({ value: r, label: r }))} 
            onChange={(val) => onUpdate(user, { role: val })}
          />
        </div>
        <button className="icon-btn" disabled={user.is_superuser} onClick={() => onUpdate(user, { is_active: !user.is_active })} title={user.is_active ? 'Inactivar' : 'Activar'}>
          {user.is_active ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="icon-btn" onClick={() => { const password = window.prompt(`Nueva contraseña para ${user.username}`); if (password) onUpdate(user, { password }) }} title="Cambiar Clave">
          <Key size={16} />
        </button>
        <button className="icon-btn" disabled={user.is_superuser} onClick={onDisable} title="Eliminar"><Trash size={16} /></button>
      </div>
    </div>
  )
}

export function Notification({ message, error, onClose }) {
  if (!message && !error) return null;
  return (
    <div 
      className={error ? 'notice error' : 'notice'} 
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 10000,
        margin: 0,
        minWidth: '350px',
        maxWidth: '500px',
        padding: '1.25rem 1.75rem',
        fontSize: '1.1rem',
        fontWeight: '500',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      {error ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
      <div style={{ flex: 1 }}>{error || message}</div>
    </div>
  )
}