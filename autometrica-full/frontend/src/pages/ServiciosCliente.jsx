// src/pages/ServiciosCliente.jsx
// Módulo de Estado de Servicios & Calificación del Cliente
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getOrdenes, actualizarOrden } from '../services/ordenesService';

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

export default function ServiciosCliente() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalCalificacion, setModalCalificacion] = useState(false);
  const [ordenCalificar, setOrdenCalificar] = useState(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    cargarOrdenes();
  }, []);

  async function cargarOrdenes() {
    setCargando(true);
    setError('');
    try {
      const data = await getOrdenes();
      setOrdenes(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError('Error al cargar los servicios de tu vehículo.');
    } finally {
      setCargando(false);
    }
  }

  function abrirCalificacion(ord) {
    setOrdenCalificar(ord);
    setEstrellas(5);
    setComentario('');
    setModalCalificacion(true);
  }

  async function handleEnviarCalificacion(e) {
    e.preventDefault();
    if (!ordenCalificar) return;
    try {
      await actualizarOrden(ordenCalificar.id, {
        calificacion: estrellas,
        comentario_cliente: comentario,
      });
      alert(`¡Gracias por tu calificación de ${estrellas} estrellas! Tu feedback ha sido guardado exitosamente en el sistema.`);
      setModalCalificacion(false);
      cargarOrdenes();
    } catch (err) {
      alert('Error al registrar calificación');
    }
  }

  return (
    <PanelLayout titulo="Estado de Servicios & Calificación">
      {error && <div className="alerta alerta--error">{error}</div>}

      {/* Banner visual de Servicios */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%), url("https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
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
            <i className="fa-solid fa-wrench"></i> Bahías de Servicio en Vivo
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Historial Técnico & Seguimiento</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.92, fontSize: '0.9rem', lineHeight: 1.5 }}>
            Consulta el estado de cada orden, visualiza el diagnóstico de los mecánicos y califica tu experiencia.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 18px', textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{ordenes.length}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Servicios Totales</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-wrench" style={{ color: '#F59E0B' }}></i> Estado de mis Servicios & Calificación ({ordenes.length})
            </h3>
            <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Sigue el progreso en tiempo real de tus reparaciones y califica la calidad de la atención de nuestro equipo técnico.
            </p>
          </div>
          <button className="btn btn--outline" onClick={cargarOrdenes} title="Actualizar lista">
            <i className="fa-solid fa-rotate"></i> Actualizar
          </button>
        </div>

        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-clipboard-check"></i>
            <p>No tienes órdenes de servicio activas en este momento.</p>
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>N° ORDEN</th>
                  <th>ESTADO</th>
                  <th>PROBLEMA / DIAGNÓSTICO</th>
                  <th>CALIFICAR SERVICIO</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.numero_orden}</strong></td>
                    <td>
                      <span className={`badge ${badgeEstado(o.estado)}`}>
                        {o.estado}
                      </span>
                    </td>
                    <td>
                      <div><strong>Problema:</strong> {o.descripcion_problema || 'Mantenimiento preventivo'}</div>
                      {o.diagnostico_tecnico && (
                        <div style={{ color: '#0369a1', fontSize: '0.85rem', marginTop: '2px' }}>
                          <strong>Diagnóstico:</strong> {o.diagnostico_tecnico}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn--outline"
                        style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#0284c7', borderColor: '#0284c7' }}
                        onClick={() => abrirCalificacion(o)}
                        title="Calificar la atención recibida"
                      >
                        ⭐ Calificar (1-5 Estrellas)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Calificación */}
      {modalCalificacion && ordenCalificar && (
        <Modal titulo={`Calificar Servicio - ${ordenCalificar.numero_orden}`} onClose={() => setModalCalificacion(false)}>
          <form onSubmit={handleEnviarCalificacion}>
            <div className="form-group">
              <label>Puntuación del Servicio (1 a 5 Estrellas)</label>
              <select value={estrellas} onChange={(e) => setEstrellas(parseInt(e.target.value))} className="form-input">
                <option value="5">⭐⭐⭐⭐⭐ 5 Estrellas (Excelente)</option>
                <option value="4">⭐⭐⭐⭐ 4 Estrellas (Muy Bueno)</option>
                <option value="3">⭐⭐⭐ 3 Estrellas (Aceptable)</option>
                <option value="2">⭐⭐ 2 Estrellas (Regular)</option>
                <option value="1">⭐ 1 Estrella (Deficiente)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Comentarios sobre el trabajo realizado</label>
              <textarea
                rows="3"
                className="form-input"
                placeholder="Escribe tu opinión sobre el tiempo de entrega, atención y calidad..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalCalificacion(false)}>Cancelar</button>
              <button type="submit" className="btn btn--primario">Guardar Calificación</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
