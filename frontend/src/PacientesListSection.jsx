import React from 'react'
import { Activity, Edit, Search, User, UserPlus, Users } from 'lucide-react'
import { Panel, Pagination } from './components'
import PacienteFormSection from './PacienteFormSection'
import { emptyPaciente } from './constants'

export default function PacientesListSection({ filteredPacientes, searchQuery, setSearchQuery, setHistorial, setTab, setPaciente, totalCount, showPacienteForm, setShowPacienteForm, savePaciente, paciente, page, setPage, pageSize }) {
  return (
    <Panel 
      title={<><Users size={20} /> Pacientes</>} 
      subtitle={`Total: ${totalCount} pacientes registrados`}
      action={
        <button className="primary" onClick={() => { setPaciente(emptyPaciente); setShowPacienteForm(true); }}>
          <UserPlus size={16} /> Nuevo paciente
        </button>
      }
    >
      <PacienteFormSection 
        show={showPacienteForm} 
        onClose={() => setShowPacienteForm(false)} 
        paciente={paciente} 
        setPaciente={setPaciente} 
        savePaciente={savePaciente} 
      />
      <div className="search-bar" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
        <Search size={18} style={{ opacity: 0.5 }} />
        <input type="text" placeholder="Buscar por nombre, apellido o documento..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }} />
      </div>
      <div className="patient-grid">
        {filteredPacientes.map((p) => (
          <div key={p.id} className="patient-card" onClick={() => { setHistorial(curr => ({ ...curr, paciente: String(p.id) })); setTab('consulta') }}>
            <div className="patient-header">
              <div className="patient-avatar"><User size={24} /></div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={14} /><span>Crear consulta</span>
              </div>
              <button className="icon-btn" title="Editar paciente" onClick={(e) => { e.stopPropagation(); setPaciente({ ...p }); setShowPacienteForm(true); }}><Edit size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Pagination 
        currentPage={page} 
        totalCount={totalCount} 
        pageSize={pageSize} 
        onPageChange={setPage} 
      />
    </Panel>
  )
}