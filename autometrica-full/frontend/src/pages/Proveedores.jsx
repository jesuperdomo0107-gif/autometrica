// src/pages/Proveedores.jsx
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } from '../services/proveedoresService';
import './Proveedores.css';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEdicion, setProveedorEdicion] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    contacto_nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  async function cargarProveedores() {
    try {
      setCargando(true);
      const data = await getProveedores();
      setProveedores(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function abrirModalCrear() {
    setProveedorEdicion(null);
    setForm({
      nombre: '',
      nit: '',
      contacto_nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
    });
    setModalAbierto(true);
  }

  function abrirModalEditar(p) {
    setProveedorEdicion(p);
    setForm({
      nombre: p.nombre || '',
      nit: p.nit || '',
      contacto_nombre: p.contacto_nombre || '',
      telefono: p.telefono || '',
      correo: p.correo || '',
      direccion: p.direccion || '',
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (proveedorEdicion) {
        await actualizarProveedor(proveedorEdicion.id, form);
        alert('Proveedor actualizado con éxito.');
      } else {
        await crearProveedor(form);
        alert('Proveedor registrado con éxito.');
      }
      setModalAbierto(false);
      cargarProveedores();
    } catch (err) {
      alert('Error al registrar proveedor: ' + (err.message || 'Verifica los datos'));
    }
  }

  async function handleEliminar(id) {
    if (window.confirm('¿Desea desactivar y eliminar este proveedor?')) {
      try {
        await eliminarProveedor(id);
        alert('Proveedor eliminado correctamente.');
        cargarProveedores();
      } catch (err) {
        alert('Error al eliminar proveedor.');
      }
    }
  }

  return (
    <PanelLayout titulo="Gestión de Proveedores & Compras de Repuestos">
      <div className="proveedores-page">
        <div className="inventario-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3>Proveedores Aliados de Insumos y Repuestos</h3>
            <p>Registra contactos de distribuidores y gestiona órdenes de compra de mercancía.</p>
          </div>
          <button className="btn-primario" onClick={abrirModalCrear}>
            <i className="fa-solid fa-truck-field"></i> Registrar Proveedor
          </button>
        </div>

        {cargando ? (
          <p>Cargando proveedores...</p>
        ) : (
          <table className="tabla-custom">
            <thead>
              <tr>
                <th>Proveedor / Razón Social</th>
                <th>NIT</th>
                <th>Contacto Principal</th>
                <th>Teléfono</th>
                <th>Correo Electrónico</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No hay proveedores registrados. ¡Agrega uno nuevo!</td>
                </tr>
              ) : (
                proveedores.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong></td>
                    <td><code>{p.nit || 'N/A'}</code></td>
                    <td>{p.contacto_nombre || 'N/A'}</td>
                    <td>{p.telefono || 'N/A'}</td>
                    <td>{p.correo || 'N/A'}</td>
                    <td>{p.direccion || 'N/A'}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-accion" onClick={() => abrirModalEditar(p)} title="Editar proveedor">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-accion danger" onClick={() => handleEliminar(p.id)} title="Eliminar proveedor">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal titulo={proveedorEdicion ? `Editar Proveedor: ${proveedorEdicion.nombre}` : 'Registrar Proveedor de Repuestos'} onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>
                Nombre / Empresa Proveedora <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                NIT / Identificación Fiscal <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Persona de Contacto <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                value={form.contacto_nombre}
                onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Teléfono de Contacto <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico (opcional)</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Dirección Física (opcional)</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn-primario">{proveedorEdicion ? 'Actualizar' : 'Guardar Proveedor'}</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
