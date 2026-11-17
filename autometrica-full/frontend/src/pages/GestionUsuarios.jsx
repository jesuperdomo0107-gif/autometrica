import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import PasswordRequirements from '../components/PasswordRequirements';
import { getUsuarios, actualizarUsuario, eliminarUsuario } from '../services/usuariosService';
import { registrarUsuario } from '../services/authService';
import './GestionUsuarios.css';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEdicion, setUsuarioEdicion] = useState(null);

  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    contrasena_hash: 'usr123',
    rol: 'mecanico',
    telefono: '',
    activo: true,
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      const data = await getUsuarios();
      setUsuarios(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function abrirModalCrear() {
    setUsuarioEdicion(null);
    setForm({
      nombre_completo: '',
      correo: '',
      contrasena_hash: 'usr123',
      rol: 'mecanico',
      telefono: '',
      activo: true,
    });
    setModalAbierto(true);
  }

  function abrirModalEditar(usr) {
    setUsuarioEdicion(usr);
    setForm({
      nombre_completo: usr.nombre_completo || '',
      correo: usr.correo || '',
      contrasena_hash: '',
      rol: usr.rol || 'mecanico',
      telefono: usr.telefono || '',
      activo: usr.activo ?? true,
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (usuarioEdicion) {
        const datosActualizar = {
          nombre_completo: form.nombre_completo,
          correo: form.correo,
          rol: form.rol,
          telefono: form.telefono,
          activo: form.activo,
        };
        if (form.contrasena_hash && form.contrasena_hash.trim() !== '') {
          datosActualizar.contrasena_hash = form.contrasena_hash;
        }
        await actualizarUsuario(usuarioEdicion.id, datosActualizar);
        alert('Usuario actualizado con éxito.');
      } else {
        await registrarUsuario(form);
        alert('Nuevo usuario registrado con éxito.');
      }
      setModalAbierto(false);
      cargarUsuarios();
    } catch (err) {
      alert('Error al procesar el usuario: ' + (err.message || 'Verifica los datos'));
    }
  }

  async function handleToggleActivo(usr) {
    try {
      await actualizarUsuario(usr.id, { activo: !usr.activo });
      cargarUsuarios();
    } catch (err) {
      alert('Error al cambiar estado del usuario');
    }
  }

  async function handleEliminarUsuario(id) {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario del sistema?')) {
      try {
        await eliminarUsuario(id);
        alert('Usuario eliminado correctamente.');
        cargarUsuarios();
      } catch (err) {
        alert('Error al eliminar usuario: ' + (err.message || 'Error del servidor'));
      }
    }
  }

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.rol?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <PanelLayout titulo="Gestión de Usuarios, Roles y Permisos">
      <div className="usuarios-page">
        <div className="inventario-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="busqueda-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="btn-primario" onClick={abrirModalCrear}>
            <i className="fa-solid fa-user-plus"></i> Crear Nuevo Usuario
          </button>
        </div>

        {cargando ? (
          <p>Cargando usuarios...</p>
        ) : (
          <table className="tabla-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Rol Asignado</th>
                <th>Estado Cuenta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td><code>#{u.id}</code></td>
                  <td><strong>{u.nombre_completo}</strong></td>
                  <td>{u.correo}</td>
                  <td>{u.telefono || '—'}</td>
                  <td>
                    <span className={`badge-rol ${u.rol}`}>
                      {u.rol === 'admin' ? 'Administrador' : u.rol === 'mecanico' ? 'Mecánico' : 'Cliente'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn-secundario-sm" onClick={() => handleToggleActivo(u)} title="Cambiar estado">
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn-accion" onClick={() => abrirModalEditar(u)} title="Editar usuario">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button className="btn-accion danger" onClick={() => handleEliminarUsuario(u.id)} title="Eliminar usuario">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal titulo={usuarioEdicion ? `Editar Usuario #${usuarioEdicion.id}` : 'Crear Nuevo Usuario del Sistema'} onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>
                Nombre Completo <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="text"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Correo Electrónico <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                {usuarioEdicion ? 'Nueva Contraseña (dejar vacío para conservar)' : 'Contraseña Inicial'} {!usuarioEdicion && <span className="campo-obligatorio-asterisco">*</span>}
              </label>
              <input
                type="password"
                placeholder={usuarioEdicion ? 'Opcional (8+ chars, mayús, minús, especial)' : 'Mínimo 8 caracteres, mayús, minús y especial'}
                value={form.contrasena_hash}
                onChange={(e) => setForm({ ...form, contrasena_hash: e.target.value })}
                required={!usuarioEdicion}
              />
              {(!usuarioEdicion || form.contrasena_hash) && (
                <PasswordRequirements password={form.contrasena_hash} />
              )}
            </div>
            <div className="form-group">
              <label>
                Rol de Usuario <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="mecanico">Mecánico / Técnico</option>
                <option value="admin">Administrador General</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div className="form-group">
              <label>Teléfono (opcional)</label>
              <input
                type="text"
                placeholder="300 000 0000"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn-primario">{usuarioEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
