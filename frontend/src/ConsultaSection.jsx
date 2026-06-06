import React from 'react'
import { Activity, File, Mic, MicOff, Save, Sparkles, Stethoscope, User, UserX } from 'lucide-react'
import { Panel, SearchableSelect, Pagination } from './components'

export default function ConsultaSection({ 
  show, onClose, onOpen, historiales, pacientesById, 
  historial, setHistorial, pacientes, saveHistorial, 
  toggleDictation, listening, aiLoading, runGemini, formato,
  page, setPage, pageSize,
  usuarios
}) {
  const doctoresOptions = React.useMemo(() => {
    return (usuarios || [])
      .filter(u => u.role === 'Medico' || u.role === 'Odontologo')
      .map(u => ({ 
        value: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username, 
        label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username 
      }));
  }, [usuarios]);

  return (
    <Panel 
      title={<><Activity size={20} /> Consultas e Historial</>} 
      subtitle={`Total: ${historiales?.length || 0} registros clínicos`}
      action={
        <button className="primary" onClick={onOpen}>
          <Activity size={16} /> Nueva consulta
        </button>
      }
    >
      {show && (
        <div 
          className="modal-overlay" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10500, padding: '1rem' }}
          onClick={onClose}
        >
          <div 
            className="modal-content" 
            style={{ background: 'var(--surface)', width: '100%', maxWidth: '900px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}><Activity size={24} /> Nueva Consulta Clínica</h2>
              <button className="icon-btn" onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%' }}><UserX size={20} /></button>
            </div>
            <form onSubmit={saveHistorial} className="grid-form" style={{ padding: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <p style={{ gridColumn: '1 / -1', margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Formato activo: <strong>{formato}</strong></p>
              <div className="wide">
                <SearchableSelect 
                  label={<><User size={14} /> Seleccionar Paciente</>}
                  options={pacientes.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.numero_documento})` }))}
                  value={historial.paciente}
                  onChange={(val) => setHistorial({ ...historial, paciente: val })}
                />
              </div>
              <div className="wide">
                <SearchableSelect 
                  label={<><Stethoscope size={14} /> Seleccionar Doctor</>}
                  options={doctoresOptions}
                  value={historial.doctor}
                  onChange={(val) => setHistorial({ ...historial, doctor: val })}
                />
              </div>
              <label className="wide"><Mic size={16} /> Transcripcion<textarea rows="4" value={historial.transcripcion_audio} onChange={(e) => setHistorial({ ...historial, transcripcion_audio: e.target.value })} /></label>
              <div className="actions wide" style={{ marginBottom: '1rem' }}>
                <button type="button" onClick={toggleDictation}>{listening ? <><MicOff size={16} /> Detener</> : <><Mic size={16} /> Dictar por voz</>}</button>
                <button type="button" className="secondary" disabled={aiLoading} onClick={runGemini}>{aiLoading ? <><Activity size={16} /> Procesando...</> : <><Sparkles size={16} /> Auto-completar con IA</>}</button>
              </div>
              {['temperatura', 'presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'peso', 'talla'].map((field) => <label key={field}>{field.replace('_', ' ')}<input value={historial[field] || ''} onChange={(e) => setHistorial({ ...historial, [field]: e.target.value })} /></label>)}
              {['motivo_consulta', 'enfermedad_actual', 'antecedentes', 'examen_fisico', 'diagnostico', 'tratamiento', 'observaciones', 'informe_clinico'].map((field) => <label key={field} className="wide">{field.replace('_', ' ')}<textarea rows={field === 'informe_clinico' ? 8 : 3} value={historial[field] || ''} onChange={(e) => setHistorial({ ...historial, [field]: e.target.value })} /></label>)}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }} className="wide">
                <button type="button" className="ghost wide" onClick={onClose}>Cancelar</button>
                <button className="wide primary"><Save size={16} /> Guardar Consulta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="historial-grid">
        {(historiales || []).map((h) => (
          <div key={h.id} className="historial-card">
            <div className="historial-header">
              <File size={20} />
              <div className="historial-info">
                <h3>{pacientesById[h.paciente] || 'Paciente desconocido'}</h3>
                <p className="historial-date">{new Date(h.created_at || Date.now()).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="historial-body">
              <div className="historial-field"><span className="field-label">Doctor</span><span className="field-value">{h.doctor || 'No registrado'}</span></div>
              <div className="historial-field"><span className="field-label">Motivo</span><span className="field-value">{h.motivo_consulta || 'No registrado'}</span></div>
              <div className="historial-field"><span className="field-label">Diagnóstico</span><span className="field-value">{h.diagnostico || 'Sin diagnóstico'}</span></div>
              {(h.temperatura || h.presion_arterial || h.frecuencia_cardiaca) && (
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

      <Pagination 
        currentPage={page} 
        totalCount={historiales.length} 
        pageSize={pageSize} 
        onPageChange={setPage} 
      />
    </Panel>
  )
}