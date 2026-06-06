import React from 'react'
import { Activity, File } from 'lucide-react'
import { Panel } from './components'
import ConsultaSection from './ConsultaSection'

export default function HistorialesSection({ 
  historiales, pacientesById, showConsultaForm, setShowConsultaForm, 
  historial, setHistorial, pacientes, saveHistorial, toggleDictation, 
  listening, aiLoading, runGemini, formato 
}) {
  return (
    <Panel 
      title={<><File size={20} /> Historiales</>} 
      subtitle={`Total: ${historiales.length} consultas registradas`}
      action={
        <button className="primary" onClick={() => setShowConsultaForm(true)}>
          <Activity size={16} /> Nueva consulta
        </button>
      }
    >
      <ConsultaSection 
        show={showConsultaForm} 
        onClose={() => setShowConsultaForm(false)}
        historial={historial} setHistorial={setHistorial} pacientes={pacientes} 
        saveHistorial={saveHistorial} toggleDictation={toggleDictation} 
        listening={listening} aiLoading={aiLoading} runGemini={runGemini} formato={formato}
      />
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
    </Panel>
  )
}