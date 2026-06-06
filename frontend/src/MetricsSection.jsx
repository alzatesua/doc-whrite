import React, { useMemo } from 'react';
import { BarChart3, ClipboardList } from 'lucide-react';
import { Panel } from './components';

function RoundedAreaChart({ data }) {
  const height = 200;
  const width = 800;
  const paddingX = 50;
  const paddingY = 40;
  const maxVal = Math.max(...data.map(d => d.consultas), 5);
  
  const points = data.map((d, i) => ({
    x: paddingX + (i * (width - paddingX * 2)) / (data.length - 1),
    y: (height - paddingY) - (d.consultas * (height - paddingY * 2)) / maxVal
  }));

  // Algoritmo para crestas y llanos redondeados usando curvas de Bezier
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    pathD += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} V ${height - paddingY / 2} H ${points[0].x} Z`;

  return (
    <div style={{ width: '100%', padding: '1rem 0', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Guías de fondo */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line 
            key={p} 
            x1={paddingX} x2={width - paddingX} 
            y1={paddingY + p * (height - paddingY * 2)} y2={paddingY + p * (height - paddingY * 2)} 
            stroke="var(--surface-2)" strokeWidth="1" strokeDasharray="4 4" 
          />
        ))}

        {/* Área rellena */}
        <path d={areaD} fill="url(#chartGrad)" />

        {/* Línea principal con efecto Glow */}
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        
        {/* Puntos decorativos */}
        {points.map((p, i) => (
          <g key={i} className="chart-point" style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r="8" fill="var(--primary)" fillOpacity="0.2" />
            <circle cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${paddingX}px`, marginTop: '1.5rem', opacity: 0.6, fontSize: '0.8rem', fontWeight: '500' }}>
        {data.map((d, i) => <span key={i}>{d.name}</span>)}
      </div>
    </div>
  );
}

export default function MetricsSection({ historiales, pacientes, pacientesById }) {
  // Procesar datos para la gráfica (últimos 10 días)
  const chartData = useMemo(() => {
    const days = [...Array(10)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return days.map(date => {
      const count = (historiales || []).filter(h => String(h.created_at || '').startsWith(date)).length;
      return {
        name: new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        consultas: count
      };
    });
  }, [historiales]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Gráfica con Crestas Redondeadas */}
      <Panel title={<><BarChart3 size={20} /> Flujo de Consultas</>} subtitle="Atenciones diarias con suavizado de curva.">
        <div style={{ marginTop: '1.5rem' }}>
          <RoundedAreaChart data={chartData} />
        </div>
      </Panel>

      {/* Listado de Consultas Recientes */}
      <Panel title={<><ClipboardList size={20} /> Registro de Atenciones</>} subtitle="Detalle de quién ingresó y el motivo de su consulta.">
        <div className="user-list">
          {(historiales || []).slice(0, 8).map((h, i) => (
            <div key={i} className="user-row" style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-2)' }}>
              <div className="admin-avatar" style={{ background: 'var(--primary)', color: 'white' }}>
                {pacientesById[h.paciente]?.charAt(0) || 'P'}
              </div>
              <div className="user-info">
                <strong>{pacientesById[h.paciente] || 'Paciente Desconocido'}</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Motivo: {h.motivo_consulta || 'No especificado'}</span>
              </div>
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>Dr. {h.doctor.split(' ')[0]}</div>
                <small style={{ opacity: 0.5 }}>{new Date(h.created_at || Date.now()).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}