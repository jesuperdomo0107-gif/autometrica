// src/pages/PanelMecanico.jsx
// Dashboard principal del mecánico y administrador del taller
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getOrdenes } from '../services/ordenesService';
import { getVehiculos } from '../services/vehiculosService';
import { getClientes } from '../services/clientesService';
import { getTiposReparacion, crearTipoReparacion, eliminarTipoReparacion } from '../services/tiposReparacionService';
import { getMecanicos } from '../services/mecanicosService';
import './PanelMecanico.css';

// Devuelve la clase CSS del badge según el estado de la orden
function badgeEstado(estado) {
  const mapa = {
    'Recibido': 'badge--recibido',
    'En Diagnóstico': 'badge--diagnostico',
    'En Reparación': 'badge--reparacion',
    'Servicio Finalizado': 'badge--finalizado',
    'Cancelado': 'badge--cancelado',
  };
  return mapa[estado] || 'badge--recibido';
}

export default function PanelMecanico() {
  const { usuario } = useAuth();

  // Estado para los datos de cada recurso
  const [ordenes, setOrdenes] = useState([]);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [serviciosTaller, setServiciosTaller] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal para agregar servicio
  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);
  const [guardandoServicio, setGuardandoServicio] = useState(false);
  const [formServicio, setFormServicio] = useState({
    nombre: '',
    descripcion: '',
    precio_base: 150000,
    tiempo_estimado_min: 60,
    mecanico_id: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const [resOrdenes, resVehiculos, resClientes, resServicios, resMecs] = await Promise.all([
        getOrdenes(),
        getVehiculos(),
        getClientes(),
        getTiposReparacion(),
        getMecanicos(),
      ]);

      const listaOrd = Array.isArray(resOrdenes) ? resOrdenes : (resOrdenes?.data || []);
      const listaVeh = Array.isArray(resVehiculos) ? resVehiculos : (resVehiculos?.data || []);
      const listaCli = Array.isArray(resClientes) ? resClientes : (resClientes?.data || []);
      const listaServ = Array.isArray(resServicios) ? resServicios : (resServicios?.data || []);
      const listaMecs = Array.isArray(resMecs) ? resMecs : (resMecs?.data || []);

      setOrdenes(listaOrd);
      setTotalVehiculos(listaVeh.length);
      setTotalClientes(listaCli.length);
      setServiciosTaller(listaServ);
      setMecanicos(listaMecs);

      if (listaMecs.length > 0) {
        setFormServicio(f => ({ ...f, mecanico_id: listaMecs[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos del panel.');
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardarServicio(e) {
    e.preventDefault();
    if (!formServicio.nombre.trim()) {
      alert('Por favor ingresa el nombre del servicio.');
      return;
    }
    setGuardandoServicio(true);
    try {
      const datosAEnviar = {
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim(),
        precio_base: parseFloat(formServicio.precio_base) || 0,
        tiempo_estimado_min: parseInt(formServicio.tiempo_estimado_min) || 60,
        mecanico_id: formServicio.mecanico_id ? parseInt(formServicio.mecanico_id) : null,
        taller_id: usuario?.taller_id || null,
      };

      await crearTipoReparacion(datosAEnviar);
      alert('Servicio registrado exitosamente en el catálogo del taller.');
      setModalServicioAbierto(false);
      setFormServicio({
        nombre: '',
        descripcion: '',
        precio_base: 150000,
        tiempo_estimado_min: 60,
        mecanico_id: mecanicos.length > 0 ? mecanicos[0].id : '',
      });
      cargarDatos();
    } catch (err) {
      alert('Error al guardar el servicio: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGuardandoServicio(false);
    }
  }

  async function handleEliminarServicio(id) {
    if (!window.confirm('¿Estás seguro de eliminar este servicio del catálogo del taller?')) return;
    try {
      await eliminarTipoReparacion(id);
      setServiciosTaller(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Error al eliminar servicio.');
    }
  }

  // Calcular KPIs desde las órdenes cargadas
  const estadosActivos = ['Recibido', 'En Diagnóstico', 'En Reparación'];
  const ordenesActivas = ordenes.filter((o) => estadosActivos.includes(o.estado));
  const enReparacion = ordenes.filter((o) => o.estado === 'En Reparación');
  const ordenesUrgentes = ordenesActivas.filter((o) => o.es_urgente);

  const tallerNombre = usuario?.taller_nombre || 'Taller AutoMétrica';
  const tallerCodigo = usuario?.taller_codigo || 'TLR-001';

  return (
    <PanelLayout titulo="Panel Principal">
      {/* Mensaje de error general */}
      {error && (
        <div className="alerta alerta--error">
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
        </div>
      )}

      {/* ── Spinner de carga ─── */}
      {cargando ? (
        <div className="flex-center" style={{ padding: '60px' }}>
          <span className="spinner spinner--dark"></span>
        </div>
      ) : (
        <>
          {/* Banner visual del taller */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.85) 100%), url("https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
            color: 'white',
            marginBottom: '24px',
            borderRadius: '14px',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
                <i className="fa-solid fa-warehouse"></i> {tallerNombre} &bull; Código: <strong>{tallerCodigo}</strong>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>
                Centro de Operaciones &bull; {usuario?.nombre_completo || 'Mecánico'}
              </h2>
              <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Supervisa el catálogo de servicios ofrecidos, mecánicos a cargo, diagnósticos en curso y vehículos en taller.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to="/reparaciones" className="btn btn--primario" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                <i className="fa-solid fa-screwdriver-wrench"></i> Ir a Reparaciones
              </Link>
              <button className="btn btn--outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setModalServicioAbierto(true)}>
                <i className="fa-solid fa-plus"></i> Publicar Servicio
              </button>
            </div>
          </div>

          {/* ── Tarjetas KPI ────────────────────────────────── */}
          <div className="kpis-grid">
            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--blue">
                <i className="fa-solid fa-clipboard-list"></i>
              </div>
              <div>
                <div className="kpi-card__numero">{ordenesActivas.length}</div>
                <div className="kpi-card__label">Órdenes Activas</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--orange">
                <i className="fa-solid fa-wrench"></i>
              </div>
              <div>
                <div className="kpi-card__numero">{enReparacion.length}</div>
                <div className="kpi-card__label">En Reparación</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--green">
                <i className="fa-solid fa-car"></i>
              </div>
              <div>
                <div className="kpi-card__numero">{totalVehiculos}</div>
                <div className="kpi-card__label">Vehículos Registrados</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--purple">
                <i className="fa-solid fa-users"></i>
              </div>
              <div>
                <div className="kpi-card__numero">{totalClientes}</div>
                <div className="kpi-card__label">Clientes</div>
              </div>
            </div>
          </div>

          {/* ── Catálogo de Servicios del Taller y Mecánico Responsable ─────────────────── */}
          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <p className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--color-primario)' }}></i>
                  Catálogo de Servicios y Mecánicos Especialistas
                </p>
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  Servicios y mantenimientos que ejecuta este taller junto al mecánico responsable de cada especialidad.
                </p>
              </div>
              <button className="btn btn--primario" style={{ fontSize: '0.85rem', padding: '6px 14px' }} onClick={() => setModalServicioAbierto(true)}>
                <i className="fa-solid fa-plus"></i> Agregar Nuevo Servicio
              </button>
            </div>

            {serviciosTaller.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <i className="fa-solid fa-tools" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '8px' }}></i>
                <p>No hay servicios registrados en el catálogo del taller aún.</p>
                <button className="btn btn--outline" style={{ marginTop: '10px' }} onClick={() => setModalServicioAbierto(true)}>
                  Crear el primer servicio
                </button>
              </div>
            ) : (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Servicio / Reparación</th>
                      <th>Descripción de Trabajo</th>
                      <th>Precio Base Estimado</th>
                      <th>Tiempo Estimado</th>
                      <th>Mecánico Especialista a Cargo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosTaller.map((serv) => (
                      <tr key={serv.id}>
                        <td>
                          <strong>{serv.nombre}</strong>
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.88rem', color: '#475569' }}>
                          {serv.descripcion || 'Servicio técnico especializado para vehículos y motocicletas.'}
                        </td>
                        <td>
                          <strong>${Number(serv.precio_base || 0).toLocaleString()}</strong>
                        </td>
                        <td>
                          <span className="badge badge--recibido">
                            <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i>
                            {serv.tiempo_estimado_min || 60} min
                          </span>
                        </td>
                        <td>
                          {serv.mecanico_nombre ? (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-primario)' }}>
                                <i className="fa-solid fa-user-gear" style={{ marginRight: '6px' }}></i>
                                {serv.mecanico_nombre}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {serv.mecanico_especialidad || 'Mecánica General'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin asignar</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn--outline btn--sm"
                            style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '4px 8px' }}
                            onClick={() => handleEliminarServicio(serv.id)}
                            title="Eliminar servicio"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Bahías Técnicas de Trabajo ─────────────────── */}
          <div className="card" style={{ marginTop: '24px' }}>
            <p className="panel-section-title" style={{ marginBottom: '16px' }}>
              <i className="fa-solid fa-car-tunnel" style={{ color: 'var(--color-primario)' }}></i>
              Bahías Operativas y Estaciones de Diagnóstico
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                height: '140px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 100%), url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=500&q=80") center/cover no-repeat',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '14px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div>
                  <span style={{ background: '#22c55e', color: '#0f172a', fontWeight: 800, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '4px' }}>BAHÍA 1</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Escáner Computarizado OBD2</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Diagnóstico de Sensores e Inyección</div>
                </div>
              </div>

              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                height: '140px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 100%), url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80") center/cover no-repeat',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '14px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div>
                  <span style={{ background: '#0284c7', color: '#fff', fontWeight: 800, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '4px' }}>BAHÍA 2</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Elevador Hidráulico de Chasis</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Frenos, Suspensión y Tren Delantero</div>
                </div>
              </div>

              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                height: '140px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 100%), url("https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=500&q=80") center/cover no-repeat',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '14px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div>
                  <span style={{ background: '#f59e0b', color: '#0f172a', fontWeight: 800, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '4px' }}>BAHÍA 3</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Bancada y Banco de Pruebas</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Sincronización y Mantenimiento Motor</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Órdenes Urgentes ──────────────────────────── */}
          <div className="card" style={{ marginTop: '24px' }}>
            <p className="panel-section-title">
              <i className="fa-solid fa-circle-exclamation" style={{ color: '#EF4444' }}></i>
              Órdenes Urgentes ({ordenesUrgentes.length})
            </p>

            {ordenesUrgentes.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-check-circle" style={{ color: '#22C55E' }}></i>
                <p>No hay órdenes urgentes pendientes en este momento.</p>
              </div>
            ) : (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Estado</th>
                      <th>Vehículo</th>
                      <th>Mecánico</th>
                      <th>Fecha Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesUrgentes.map((orden) => (
                      <tr key={orden.id}>
                        <td>
                          <strong>{orden.numero_orden}</strong>
                        </td>
                        <td>
                          <span className={`badge ${badgeEstado(orden.estado)}`}>
                            {orden.estado}
                          </span>
                        </td>
                        <td>#{orden.vehiculo_id}</td>
                        <td>{orden.mecanico_id ? `#${orden.mecanico_id}` : '—'}</td>
                        <td>
                          {orden.fecha_ingreso
                            ? new Date(orden.fecha_ingreso).toLocaleDateString('es-CO')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Acciones rápidas ──────────────────────────── */}
          <div className="acciones-rapidas" style={{ marginTop: '24px' }}>
            <Link to="/gestion-vehiculos" className="btn btn--outline">
              <i className="fa-solid fa-car"></i> Ver Vehículos
            </Link>
            <Link to="/clientes" className="btn btn--outline">
              <i className="fa-solid fa-users"></i> Ver Clientes
            </Link>
            <Link to="/reparaciones" className="btn btn--outline">
              <i className="fa-solid fa-wrench"></i> Ver Reparaciones
            </Link>
            <Link to="/facturacion" className="btn btn--outline">
              <i className="fa-solid fa-file-invoice-dollar"></i> Cotizaciones & Facturas
            </Link>
          </div>
        </>
      )}

      {/* Modal Registrar Nuevo Servicio del Taller */}
      {modalServicioAbierto && (
        <Modal titulo="Registrar Servicio y Asignar Mecánico" onClose={() => setModalServicioAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos con asterisco son obligatorios.
          </div>
          <form onSubmit={handleGuardarServicio}>
            <div className="form-group">
              <label>
                Nombre del Servicio o Reparación <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej: Cambio de Kit de Distribución, Afinación Electrónica, Frenos..."
                value={formServicio.nombre}
                onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Descripción de lo que Realiza el Taller</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Detalle técnico de las tareas incluidas en este servicio..."
                value={formServicio.descripcion}
                onChange={(e) => setFormServicio({ ...formServicio, descripcion: e.target.value })}
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Precio Base Estimado ($) <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0"
                  step="1000"
                  value={formServicio.precio_base}
                  onChange={(e) => setFormServicio({ ...formServicio, precio_base: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Tiempo Estimado (Minutos) <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="5"
                  value={formServicio.tiempo_estimado_min}
                  onChange={(e) => setFormServicio({ ...formServicio, tiempo_estimado_min: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mecánico Especialista Responsable del Servicio</label>
              <select
                className="form-input"
                value={formServicio.mecanico_id}
                onChange={(e) => setFormServicio({ ...formServicio, mecanico_id: e.target.value })}
              >
                <option value="">-- Sin asignar / General del Taller --</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.usuario_nombre || `Mecánico #${m.id}`} ({m.especialidad || 'Mecánica General'})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalServicioAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={guardandoServicio}>
                {guardandoServicio ? 'Guardando...' : 'Publicar Servicio en Catálogo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
