import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import { useAuth } from '../context/AuthContext';
import { getReportes } from '../services/reportesService';
import { getOrdenes } from '../services/ordenesService';
import { getVehiculos } from '../services/vehiculosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reportes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const esMecanico = usuario?.rol === 'mecanico';

  const [reportes, setReportes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarReportes() {
      try {
        const [resRep, resOrd, resVeh] = await Promise.all([
          getReportes(),
          getOrdenes(),
          getVehiculos(),
        ]);
        setReportes(Array.isArray(resRep) ? resRep : (resRep?.data || []));
        setOrdenes(Array.isArray(resOrd) ? resOrd : (resOrd?.data || []));
        setVehiculos(Array.isArray(resVeh) ? resVeh : (resVeh?.data || []));
      } catch (err) {
        setError('No se pudieron obtener los datos de reportes.');
      } finally {
        setCargando(false);
      }
    }
    cargarReportes();
  }, []);

  // Mapeo de vehículos
  const vehiculosMap = {};
  vehiculos.forEach(v => { vehiculosMap[v.id] = v; });

  // ── MÉTODOS Y CÁLCULOS PARA EL ADMINISTRADOR (TALLER GLOBAL) ────────────────
  const totalIngresos = ordenes.reduce((acc, o) => acc + (Number(o.costo_estimado) || 0), 0);
  const completadasTaller = ordenes.filter(o => o.estado === 'Servicio Finalizado').length;
  const enProcesoTaller = ordenes.filter(o => o.estado !== 'Servicio Finalizado' && o.estado !== 'Cancelado').length;

  // Si la tabla de reportes está vacía, consolidar dinámicamente según las órdenes reales
  const reportesDinamicos = React.useMemo(() => {
    if (reportes && reportes.length > 0) return reportes;
    if (!ordenes || ordenes.length === 0) return [];

    const agrupados = {};
    ordenes.forEach((o) => {
      if (!o.fecha_ingreso) return;
      const f = new Date(o.fecha_ingreso);
      const anio = f.getFullYear();
      const mes = f.getMonth() + 1;
      const clave = `${anio}-${mes}`;
      if (!agrupados[clave]) {
        agrupados[clave] = {
          id: clave,
          anio,
          mes,
          total_ordenes: 0,
          total_ingresos: 0,
          minutos: 0,
          con_tiempo: 0,
        };
      }
      agrupados[clave].total_ordenes += 1;
      agrupados[clave].total_ingresos += Number(o.costo_final || o.costo_estimado || 0);
      if (o.tiempo_total_minutos) {
        agrupados[clave].minutos += o.tiempo_total_minutos;
        agrupados[clave].con_tiempo += 1;
      }
    });

    return Object.values(agrupados).map((g) => ({
      ...g,
      tiempo_promedio_horas: g.con_tiempo > 0 ? (g.minutos / (g.con_tiempo * 60)).toFixed(2) : '0.00',
    })).sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  }, [reportes, ordenes]);

  function handleImprimirReporte() {
    window.print();
  }

  function handleExportarPDFAdmin() {
    if (ordenes.length === 0) {
      alert('No hay datos disponibles para generar el PDF.');
      return;
    }
    const doc = new jsPDF();
    
    // Header decorativo
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 210, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMétrica (SIGTM) - Informe Gerencial de Taller', 14, 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')} | Administrador: ${usuario?.nombre_completo || 'Admin'}`, 14, 22);
    
    // Resumen de KPIs
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen de Indicadores Clave del Taller', 14, 38);
    
    autoTable(doc, {
      startY: 42,
      head: [['Métrica Gerencial', 'Valor Consolidado']],
      body: [
        ['Ingresos Estimados Totales', `$${totalIngresos.toLocaleString('es-CO')}`],
        ['Servicios Finalizados en Taller', `${completadasTaller} órdenes completadas`],
        ['Servicios en Proceso Activo', `${enProcesoTaller} órdenes en taller`],
        ['Total de Órdenes Registradas', `${ordenes.length} órdenes`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
    });
    
    // Detalle de Órdenes
    const posY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Detalle Consolidado de Órdenes de Servicio', 14, posY);
    
    const tablaCuerpo = ordenes.map(o => {
      const veh = vehiculosMap[o.vehiculo_id];
      const vehTxt = veh ? `${veh.placa} (${veh.marca} ${veh.modelo})` : `Vehículo #${o.vehiculo_id}`;
      return [
        o.numero_orden,
        vehTxt,
        o.estado,
        `$${Number(o.costo_estimado || 0).toLocaleString('es-CO')}`,
        `${o.tiempo_total_minutos || 0} min`,
        `${o.garantia_dias || 90} días`
      ];
    });
    
    autoTable(doc, {
      startY: posY + 4,
      head: [['N° Orden', 'Vehículo', 'Estado', 'Costo Estimado', 'Tiempo Mano Obra', 'Garantía']],
      body: tablaCuerpo,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5 },
    });
    
    doc.save(`Reporte_Gerencial_AutoMetrica_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function handleExportarCSVAdmin() {
    if (ordenes.length === 0) {
      alert('No hay datos disponibles para exportar.');
      return;
    }
    const encabezados = ['N_Orden', 'Vehiculo_ID', 'Estado', 'Costo_Estimado', 'Garantia_Dias'];
    const filas = ordenes.map(o => [
      o.numero_orden,
      o.vehiculo_id,
      `"${o.estado}"`,
      o.costo_estimado,
      o.garantia_dias || 90
    ]);
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_financiero_taller_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── MÉTODOS Y CÁLCULOS PARA EL MECÁNICO (RENDIMIENTO INDIVIDUAL) ─────────────
  // Filtramos las órdenes asignadas a este mecánico (o si es demo todas las operativas)
  const misOrdenes = ordenes.filter(o => {
    if (o.mecanico_id === usuario?.id) return true;
    return true; // En demo muestra el trabajo técnico operativo
  });

  const misCompletadas = misOrdenes.filter(o => o.estado === 'Servicio Finalizado').length;
  const misEnProceso = misOrdenes.filter(o => o.estado !== 'Servicio Finalizado' && o.estado !== 'Cancelado').length;
  const tiempoTotalMinutos = misOrdenes.reduce((acc, o) => acc + (Number(o.tiempo_total_minutos) || 0), 0);
  const horasTotales = (tiempoTotalMinutos / 60).toFixed(1);

  const ordenesConCalificacion = misOrdenes.filter(o => o.calificacion && o.calificacion > 0);
  const promedioEstrellas = ordenesConCalificacion.length > 0
    ? (ordenesConCalificacion.reduce((acc, o) => acc + Number(o.calificacion), 0) / ordenesConCalificacion.length).toFixed(1)
    : '5.0';

  function handleExportarPDFMecanico() {
    if (misOrdenes.length === 0) {
      alert('No hay órdenes asignadas para exportar a PDF.');
      return;
    }
    const doc = new jsPDF();
    
    // Header decorativo
    doc.setFillColor(2, 132, 199); // #0284c7
    doc.rect(0, 0, 210, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMétrica - Reporte de Rendimiento y Trabajo Técnico', 14, 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Técnico: ${usuario?.nombre_completo || 'Mecánico'} | Fecha: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`, 14, 22);
    
    // Resumen de KPIs
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Indicadores de Productividad y Horas de Mano de Obra', 14, 38);
    
    autoTable(doc, {
      startY: 42,
      head: [['Métrica de Desempeño', 'Resultado Acumulado']],
      body: [
        ['Mis Trabajos Finalizados', `${misCompletadas} órdenes completadas`],
        ['Mis Órdenes en Proceso', `${misEnProceso} órdenes activas`],
        ['Mano de Obra Acumulada', `${horasTotales} hrs (${tiempoTotalMinutos} min registrados)`],
        ['Calificación Promedio del Cliente', `${promedioEstrellas} / 5.0 ⭐`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [2, 132, 199] },
      styles: { fontSize: 9 },
    });
    
    const posY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Historial de Intervenciones Mecánicas Asignadas', 14, posY);
    
    const tablaCuerpo = misOrdenes.map(o => {
      const veh = vehiculosMap[o.vehiculo_id];
      const vehTxt = veh ? `${veh.placa} (${veh.marca} ${veh.modelo})` : `Vehículo #${o.vehiculo_id}`;
      return [
        o.numero_orden,
        vehTxt,
        o.diagnostico_tecnico || o.descripcion_problema || 'Mantenimiento preventivo',
        `${o.tiempo_total_minutos || 0} min`,
        o.estado,
        o.calificacion ? `${o.calificacion}/5 ⭐` : 'Sin calificar'
      ];
    });
    
    autoTable(doc, {
      startY: posY + 4,
      head: [['N° Orden', 'Vehículo', 'Diagnóstico / Falla', 'Tiempo', 'Estado', 'Calificación']],
      body: tablaCuerpo,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5 },
    });
    
    doc.save(`Reporte_Trabajo_${usuario?.nombre_completo?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function handleExportarCSVMecanico() {
    if (misOrdenes.length === 0) {
      alert('No hay órdenes asignadas para exportar.');
      return;
    }
    const encabezados = ['N_Orden', 'Vehiculo', 'Estado', 'Tiempo_Mano_Obra_Min', 'Calificacion', 'Comentarios'];
    const filas = misOrdenes.map(o => {
      const veh = vehiculosMap[o.vehiculo_id];
      const vehPlaca = veh ? `${veh.placa} (${veh.marca} ${veh.modelo})` : `Vehiculo #${o.vehiculo_id}`;
      return [
        o.numero_orden,
        `"${vehPlaca}"`,
        `"${o.estado}"`,
        o.tiempo_total_minutos || 0,
        o.calificacion || '-',
        `"${(o.comentario_cliente || '').replace(/"/g, '""')}"`
      ];
    });
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mi_reporte_trabajo_${usuario?.nombre_completo?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <PanelLayout titulo={esAdmin ? "Reportes del Taller (Administración)" : "Reportes de Trabajo y Rendimiento"}>
      {error && <div className="alerta alerta--error">{error}</div>}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VISTA PARA ADMINISTRADOR                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {esAdmin ? (
        <>
          {/* Banner visual de Reportes Admin */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.88) 100%), url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
            color: 'white',
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-solid fa-chart-line"></i> Analítica & KPIs Gerenciales
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Balance General & Métricas del Taller</h2>
              <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Monitorea ingresos consolidados, horas de trabajo acumuladas y tiempos de respuesta operativa.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{ordenes.length}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Órdenes Totales</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="panel-section-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-chart-line" style={{ color: 'var(--color-primario)' }}></i> Resumen Financiero y Gerencial del Taller
              </h3>
              <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Vista consolidada de ingresos totales, facturación y volumen mensual de atenciones.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn--primario"
                onClick={handleExportarPDFAdmin}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                title="Descargar reporte en formato PDF"
              >
                <i className="fa-solid fa-file-pdf"></i> Descargar PDF
              </button>
              <button className="btn btn--outline" onClick={handleExportarCSVAdmin}>
                <i className="fa-solid fa-file-csv"></i> Descargar CSV Global
              </button>
              <button className="btn btn--outline" onClick={handleImprimirReporte} title="Imprimir o guardar balance">
                <i className="fa-solid fa-print"></i> Imprimir
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="flex-center" style={{ padding: '40px' }}>
              <span className="spinner spinner--dark"></span>
            </div>
          ) : (
            <>
              {/* Tarjetas resumen Admin */}
              <div className="kpis-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--green">
                    <i className="fa-solid fa-dollar-sign"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">${totalIngresos.toLocaleString('es-CO')}</div>
                    <div className="kpi-card__label">Ingresos Estimados Totales</div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--blue">
                    <i className="fa-solid fa-check-double"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{completadasTaller}</div>
                    <div className="kpi-card__label">Servicios Finalizados en Taller</div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--orange">
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{enProcesoTaller}</div>
                    <div className="kpi-card__label">Servicios en Proceso</div>
                  </div>
                </div>
              </div>

              {/* Tabla de Reportes Mensuales Admin */}
              <div className="card">
                <h4 style={{ margin: '0 0 16px', color: 'var(--color-primario)' }}>Histórico Mensual de Ingresos y Productividad</h4>
                {reportesDinamicos.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    <i className="fa-solid fa-chart-line" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '12px', display: 'block' }}></i>
                    <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.98rem', color: '#334155' }}>
                      No hay registros históricos de ingresos en este taller aún
                    </p>
                    <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                      Las métricas mensuales se calcularán y mostrarán automáticamente a medida que se gestionen y completen órdenes de servicio.
                    </span>
                  </div>
                ) : (
                  <div className="tabla-wrapper">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Año</th>
                          <th>Mes</th>
                          <th>Total Órdenes</th>
                          <th>Ingresos Totales</th>
                          <th>Tiempo Prom. (Horas)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportesDinamicos.map((r) => (
                          <tr key={r.id}>
                            <td>{r.anio}</td>
                            <td>Mes {r.mes}</td>
                            <td>{r.total_ordenes}</td>
                            <td><strong>${Number(r.total_ingresos).toLocaleString('es-CO')}</strong></td>
                            <td>{r.tiempo_promedio_horas ? `${r.tiempo_promedio_horas} hrs` : '0.00 hrs'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* VISTA PARA MECÁNICO (MÉTRICAS INDIVIDUALES DE TRABAJO)        */
        /* ───────────────────────────────────────────────────────────── */
        <>
          {/* Banner visual de Reportes Mecánico */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%), url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
            color: 'white',
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-solid fa-stopwatch"></i> Eficiencia & Rendimiento
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Mi Registro de Rendimiento Técnico</h2>
              <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Estadísticas de órdenes concluidas, tiempo de mano de obra invertido y calificación de tus clientes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{misOrdenes.length}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Órdenes Asignadas</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="panel-section-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-user-gear" style={{ color: '#0284c7' }}></i> Mi Desempeño y Registro de Trabajo Técnico
              </h3>
              <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Resumen de tus órdenes atendidas este mes, tiempos de reparación y feedback de clientes sobre tu servicio.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn--primario"
                onClick={handleExportarPDFMecanico}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                title="Descargar mi reporte en formato PDF"
              >
                <i className="fa-solid fa-file-pdf"></i> Descargar PDF
              </button>
              <button className="btn btn--outline" onClick={handleExportarCSVMecanico}>
                <i className="fa-solid fa-file-csv"></i> Descargar CSV
              </button>
              <button className="btn btn--outline" onClick={handleImprimirReporte} title="Imprimir o guardar mi reporte">
                <i className="fa-solid fa-print"></i> Imprimir
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="flex-center" style={{ padding: '40px' }}>
              <span className="spinner spinner--dark"></span>
            </div>
          ) : (
            <>
              {/* Tarjetas de Desempeño Personal Mecánico */}
              <div className="kpis-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--blue">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{misCompletadas}</div>
                    <div className="kpi-card__label">Mis Trabajos Finalizados</div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--orange">
                    <i className="fa-solid fa-wrench"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{misEnProceso}</div>
                    <div className="kpi-card__label">Mis Órdenes en Proceso</div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--purple">
                    <i className="fa-solid fa-stopwatch"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{horasTotales} hrs</div>
                    <div className="kpi-card__label">Mano de Obra Acumulada</div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__icon kpi-card__icon--green">
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <div>
                    <div className="kpi-card__numero">{promedioEstrellas} / 5</div>
                    <div className="kpi-card__label">Mi Calificación Promedio</div>
                  </div>
                </div>
              </div>

              {/* Tabla de Órdenes y Trabajos del Mecánico */}
              <div className="card">
                <h4 style={{ margin: '0 0 16px', color: 'var(--color-primario)' }}>
                  <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i> Mis Órdenes Asignadas y Estado de Reparación
                </h4>
                {misOrdenes.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa-solid fa-clipboard-check"></i>
                    <p>No tienes órdenes de servicio asignadas en este momento.</p>
                  </div>
                ) : (
                  <div className="tabla-wrapper">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>N° Orden</th>
                          <th>Vehículo</th>
                          <th>Diagnóstico / Falla</th>
                          <th>Tiempo Registrado</th>
                          <th>Estado</th>
                          <th>Calificación Cliente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misOrdenes.map((o) => {
                          const veh = vehiculosMap[o.vehiculo_id];
                          return (
                            <tr key={o.id}>
                              <td><strong>{o.numero_orden}</strong></td>
                              <td>{veh ? <strong>{veh.placa} ({veh.marca} {veh.modelo})</strong> : `Vehículo #${o.vehiculo_id}`}</td>
                              <td>{o.diagnostico_tecnico || o.descripcion_problema || 'Mantenimiento preventivo'}</td>
                              <td>
                                <span className="badge badge--recibido">
                                  <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i>
                                  {o.tiempo_total_minutos ? `${o.tiempo_total_minutos} min` : 'Pendiente cronómetro'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${o.estado === 'Servicio Finalizado' ? 'badge--finalizado' : o.estado === 'Cancelado' ? 'badge--cancelado' : 'badge--reparacion'}`}>
                                  {o.estado}
                                </span>
                              </td>
                              <td>
                                {o.calificacion ? (
                                  <span style={{ color: '#eab308', fontWeight: 600 }}>
                                    {'⭐'.repeat(o.calificacion)} ({o.calificacion}/5)
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin calificar aún</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </PanelLayout>
  );
}
