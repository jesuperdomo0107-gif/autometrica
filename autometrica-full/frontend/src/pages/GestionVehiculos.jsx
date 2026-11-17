// src/pages/GestionVehiculos.jsx
// Módulo de Gestión de Vehículos del Taller
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getVehiculos, crearVehiculo } from '../services/vehiculosService';
import { getClientes } from '../services/clientesService';
import './GestionVehiculos.css';

const currentYear = new Date().getFullYear();

export default function GestionVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    placa: '',
    tipo: 'carro',
    marca: '',
    modelo: '',
    anio: currentYear,
    color: 'Gris',
    kilometraje_actual: 0,
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const [resVehs, resClis] = await Promise.all([
        getVehiculos(),
        getClientes(),
      ]);
      const listaVehs = Array.isArray(resVehs) ? resVehs : (resVehs?.data || []);
      const listaClis = Array.isArray(resClis) ? resClis : (resClis?.data || []);

      setVehiculos(listaVehs);
      setClientes(listaClis);

      if (listaClis.length > 0) {
        setForm(f => ({ ...f, cliente_id: listaClis[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los vehículos.');
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.placa.trim() || !form.marca.trim() || !form.modelo.trim() || !form.anio) {
      alert('Por favor completa todos los campos obligatorios: Placa, Marca, Modelo y Año.');
      return;
    }

    if (!form.cliente_id && clientes.length > 0) {
      form.cliente_id = clientes[0].id;
    }

    setGuardando(true);
    try {
      const res = await crearVehiculo({
        ...form,
        placa: form.placa.trim().toUpperCase(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: parseInt(form.anio),
        cliente_id: form.cliente_id ? parseInt(form.cliente_id) : 1,
        kilometraje_actual: parseInt(form.kilometraje_actual) || 0,
      });

      const nuevo = res?.data || res;
      setVehiculos([nuevo, ...vehiculos]);
      setModalAbierto(false);
      setForm({
        cliente_id: clientes.length > 0 ? clientes[0].id : '',
        placa: '',
        tipo: 'carro',
        marca: '',
        modelo: '',
        anio: currentYear,
        color: 'Gris',
        kilometraje_actual: 0,
        activo: true,
      });
      alert('¡Vehículo registrado exitosamente con Marca, Modelo y Año!');
      cargarDatos();
    } catch (err) {
      alert('Error al registrar vehículo: ' + (err.response?.data?.detail || err.message || 'Verifica los datos'));
    } finally {
      setGuardando(false);
    }
  }

  const vehiculosFiltrados = vehiculos.filter((v) =>
    v.placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <PanelLayout titulo="Gestión de Vehículos">
      {error && <div className="alerta alerta--error">{error}</div>}

      {/* Banner visual de flota vehicular */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.85) 100%), url("https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1100&q=80") center/cover no-repeat',
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
            <i className="fa-solid fa-car-rear"></i> Flota y Parque Automotor
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Control y Registro de Vehículos</h2>
          <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Administra el inventario de carros y motos, marca, modelo, año, kilometrajes e historial de revisiones.
          </p>
        </div>
        <button className="btn btn--primario" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} onClick={() => setModalAbierto(true)}>
          <i className="fa-solid fa-plus"></i> Registrar Nuevo Vehículo
        </button>
      </div>

      <div className="card">
        {/* Barra superior de herramientas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por placa, marca o modelo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="btn btn--outline" onClick={cargarDatos} title="Recargar lista">
            <i className="fa-solid fa-rotate"></i> Actualizar
          </button>
        </div>

        {/* Tabla de Vehículos */}
        {cargando ? (
          <div className="flex-center" style={{ padding: '40px' }}>
            <span className="spinner spinner--dark"></span>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-car-side"></i>
            <p>No se encontraron vehículos registrados.</p>
            <button className="btn btn--primario" style={{ marginTop: '10px' }} onClick={() => setModalAbierto(true)}>
              Registrar el primer vehículo
            </button>
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Tipo</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Color</th>
                  <th>Kilometraje</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.placa}</strong></td>
                    <td>
                      <i className={v.tipo === 'moto' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-car'} style={{ marginRight: '6px' }}></i>
                      {v.tipo === 'moto' ? 'Moto' : 'Carro'}
                    </td>
                    <td><strong>{v.marca || '—'}</strong></td>
                    <td><strong>{v.modelo || '—'}</strong></td>
                    <td><span className="badge badge--recibido">{v.anio || '—'}</span></td>
                    <td>{v.color || '—'}</td>
                    <td>{v.kilometraje_actual ? `${v.kilometraje_actual.toLocaleString()} KM` : '0 KM'}</td>
                    <td>
                      <span className={`badge ${v.activo ? 'badge--finalizado' : 'badge--cancelado'}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Vehículo */}
      {modalAbierto && (
        <Modal titulo="Registrar Nuevo Vehículo" onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                Propietario / Cliente <span className="campo-obligatorio-asterisco">*</span>
              </label>
              {clientes.length === 0 ? (
                <div style={{ color: '#d97706', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> No hay clientes registrados aún. Se asignará por defecto.
                </div>
              ) : (
                <select
                  className="form-input"
                  required
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo || c.usuario?.nombre_completo || `Cliente #${c.id}`} ({c.documento_identidad || c.telefono || 'Sin documento'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Placa <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: ABC-123"
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label>
                  Tipo de Vehículo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <select className="form-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="carro">Carro / Automóvil</option>
                  <option value="moto">Motocicleta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Marca <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Toyota, Mazda, Chevrolet..."
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Modelo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Corolla, CX-30, Onix..."
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>
                  Año <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1950"
                  max={currentYear + 2}
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: parseInt(e.target.value) || currentYear })}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Rojo, Gris, Negro..."
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Kilometraje (KM)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={form.kilometraje_actual}
                  onChange={(e) => setForm({ ...form, kilometraje_actual: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--outline" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Vehículo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
