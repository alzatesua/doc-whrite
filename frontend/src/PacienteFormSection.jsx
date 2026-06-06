import React from 'react'
import { Edit, Save, UserPlus, UserX } from 'lucide-react'
import { Panel, SearchableSelect } from './components'
import { emptyPaciente } from './constants'

export default function PacienteFormSection({ show, onClose, paciente, setPaciente, savePaciente }) {
  if (!show || !paciente) return null;

  const labels = {
    tipo_documento: 'Tipo de documento',
    numero_documento: 'Número de documento',
    nombre: 'Nombres',
    apellido: 'Apellidos',
    fecha_nacimiento: 'Fecha de nacimiento',
    sexo: 'Sexo',
    telefono: 'Teléfono',
    email: 'Correo electrónico',
    direccion: 'Dirección',
    eps: 'EPS'
  }

  return (
    <div 
      className="modal-overlay" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10500, padding: '1rem' }}
      onClick={onClose}
    >
      <div 
        className="modal-content" 
        style={{ background: 'var(--surface)', width: '100%', maxWidth: '700px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
            {paciente.id ? <><Edit size={24} /> Actualizar Paciente</> : <><UserPlus size={24} /> Registrar Paciente</>}
          </h2>
          <button className="icon-btn" onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%' }}><UserX size={20} /></button>
        </div>
        <form className="grid-form" style={{ padding: '2rem', maxHeight: '75vh', overflowY: 'auto' }} onSubmit={savePaciente}>
          {Object.keys(emptyPaciente).map((field) => {
            if (field === 'sexo') {
              return (
                <SearchableSelect
                  key={field} label={labels[field]} value={paciente[field]} required
                  onChange={(val) => setPaciente({ ...paciente, [field]: val })}
                  options={[
                    { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }
                  ]}
                />
              )
            }
            if (field === 'tipo_documento') {
              return (
                <SearchableSelect
                  key={field} label={labels[field]} value={paciente[field]} required
                  onChange={(val) => setPaciente({ ...paciente, [field]: val })}
                  options={[
                    { value: 'CC', label: 'Cédula de Ciudadanía' }, { value: 'TI', label: 'Tarjeta de Identidad' }, { value: 'CE', label: 'Cédula de Extranjería' }, { value: 'PA', label: 'Pasaporte' }
                  ]}
                />
              )
            }
            if (field === 'eps') {
              return (
                <SearchableSelect
                  key={field} label={labels[field]} value={paciente[field]}
                  onChange={(val) => setPaciente({ ...paciente, [field]: val })}
                  options={['Sura', 'Sanitas', 'Salud Total', 'Nueva EPS', 'Compensar', 'Coosalud', 'Mutual Ser'].map(e => ({ value: e, label: e }))}
                />
              )
            }
            return (
              <label key={field}>{labels[field] || field}
                <input required={['numero_documento', 'nombre', 'apellido', 'fecha_nacimiento'].includes(field)} type={field === 'fecha_nacimiento' ? 'date' : 'text'} value={paciente[field] || ''} onChange={(e) => setPaciente({ ...paciente, [field]: e.target.value })} />
              </label>
            )
          })}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }} className="wide">
            <button type="button" className="ghost wide" onClick={onClose}>Cancelar</button>
            <button className="wide">{paciente.id ? <><Save size={16} /> Guardar cambios</> : <><UserPlus size={16} /> Crear paciente</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}