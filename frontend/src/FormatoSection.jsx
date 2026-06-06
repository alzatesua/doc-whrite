import React, { useState } from 'react'
import { FileText, Upload, Info, CheckCircle } from 'lucide-react'
import { Panel } from './components'
import { formatos } from './constants'

export default function FormatoSection({ formato, setFormato, instrucciones, setInstrucciones, formatoBase, setFormatoBase, setFormatoArchivo, formatoArchivo }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileName = formatoArchivo?.name || ''

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setFormatoArchivo(file)
  }

  return (
    <Panel 
      title={<><FileText size={20} /> Configuración de Formato</>} 
      subtitle="Personaliza la estructura y el comportamiento de la IA para tus informes clínicos."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Paso 1: Selección de Plantilla */}
        <section>
          <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '10px', color: 'var(--primary)' }}><CheckCircle size={18} /></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>1. Selecciona el tipo de atención</h3>
          </header>
          <div className="format-grid">
            {Object.entries(formatos).map(([key, text]) => (
              <button 
                key={key} 
                className={formato === key ? 'format-card active' : 'format-card'} 
                onClick={() => { setFormato(key); setInstrucciones(text) }}
              >
                <strong>{key.toUpperCase()}</strong>
                <span>{text}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Paso 2: Carga de Documento - Estilo Moderno */}
        <section>
          <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '10px', color: 'var(--primary)' }}><Upload size={18} /></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>2. Documento de referencia institucional</h3>
          </header>
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) setFormatoArchivo(file); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
              padding: '2.5rem', border: '2px dashed var(--surface-2)', borderRadius: '20px',
              background: isDragging || fileName ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.3s ease', borderStyle: fileName ? 'solid' : 'dashed',
              borderColor: isDragging || fileName ? 'var(--primary)' : 'var(--surface-2)'
            }}
          >
            <input type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" onChange={handleFileChange} />
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fileName ? 'var(--primary)' : 'inherit' }}>
              <FileText size={28} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', fontSize: '1rem' }}>
                {fileName ? fileName : 'Sube o arrastra el formato de tu clínica'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.5 }}>PDF, Word o Excel hasta 10MB</p>
            </div>
          </label>
        </section>

        {/* Paso 3: Instrucciones y Texto Base */}
        <section>
          <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '10px', color: 'var(--primary)' }}><Info size={18} /></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>3. Refinamiento y personalización</h3>
          </header>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>Instrucciones para la IA</label>
              <textarea rows="6" value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} placeholder="Indica cómo quieres que se redacte el informe..." style={{ width: '100%', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>Texto/Estructura base adicional</label>
              <textarea rows="6" value={formatoBase} onChange={(e) => setFormatoBase(e.target.value)} placeholder="Encabezados, logos de texto o estructura fija..." style={{ width: '100%', resize: 'none' }} />
            </div>
          </div>
        </section>
      </div>
    </Panel>
  )
}