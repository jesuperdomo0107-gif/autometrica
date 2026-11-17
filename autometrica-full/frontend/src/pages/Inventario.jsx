// src/pages/Inventario.jsx
import React, { useState, useEffect } from 'react';
import PanelLayout from '../components/PanelLayout';
import Modal from '../components/Modal';
import { getInventario, crearInventarioItem, actualizarInventarioItem, eliminarInventarioItem } from '../services/inventarioService';
import './Inventario.css';

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStock, setFiltroStock] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEdicion, setItemEdicion] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Frenos',
    cantidad_stock: 10,
    stock_minimo: 5,
    precio_compra: 0,
    precio_venta: 0,
  });

  useEffect(() => {
    cargarInventario();
  }, []);

  async function cargarInventario() {
    try {
      setCargando(true);
      setError('');
      const data = await getInventario();
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError('Error al cargar el inventario de repuestos.');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(item = null) {
    if (item) {
      setItemEdicion(item);
      setForm({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        categoria: item.categoria || 'Frenos',
        cantidad_stock: item.cantidad_stock ?? 0,
        stock_minimo: item.stock_minimo ?? 0,
        precio_compra: item.precio_compra ?? 0,
        precio_venta: item.precio_venta ?? 0,
      });
    } else {
      setItemEdicion(null);
      setForm({
        codigo: `REP-${Math.floor(100 + Math.random() * 900)}`,
        nombre: '',
        categoria: 'Frenos',
        cantidad_stock: 10,
        stock_minimo: 5,
        precio_compra: 25000,
        precio_venta: 40000,
      });
    }
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (itemEdicion) {
        await actualizarInventarioItem(itemEdicion.id, form);
        alert('Repuesto actualizado con éxito.');
      } else {
        await crearInventarioItem(form);
        alert('Nuevo repuesto registrado con éxito en el inventario.');
      }
      setModalAbierto(false);
      cargarInventario();
    } catch (err) {
      alert('Error al guardar el ítem de inventario: ' + (err.message || 'Verifica los datos'));
    }
  }

  async function handleEliminar(id) {
    if (window.confirm('¿Estás seguro de que deseas eliminar este repuesto del inventario?')) {
      try {
        await eliminarInventarioItem(id);
        cargarInventario();
      } catch (err) {
        alert('Error al eliminar repuesto.');
      }
    }
  }

  // Obtener categorías únicas dinámicas para el selector
  const categoriasDisponibles = ['Todas', ...new Set(items.map(i => i.categoria).filter(Boolean))];

  // Filtros aplicados de forma combinada e independiente
  const itemsFiltrados = items.filter((i) => {
    const coincideTexto =
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (i.codigo && i.codigo.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideCategoria =
      filtroCategoria === 'Todas' || i.categoria === filtroCategoria;

    const esBajo = i.cantidad_stock <= i.stock_minimo;
    const coincideStock =
      filtroStock === 'Todos' ||
      (filtroStock === 'Bajo' && esBajo) ||
      (filtroStock === 'Normal' && !esBajo);

    return coincideTexto && coincideCategoria && coincideStock;
  });

  const repuestosBajoStock = items.filter((i) => i.cantidad_stock <= i.stock_minimo);

  return (
    <PanelLayout titulo="Gestión de Inventario & Repuestos">
      <div className="inventario-page">
        {/* Banner visual de inventario */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.85) 100%), url("https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1100&q=80") center/cover no-repeat',
          color: 'white',
          marginBottom: '20px',
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
              <i className="fa-solid fa-boxes-stacked"></i> Almacén y Repuestos Automotrices
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>Control de Inventario y Stock</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Administra piezas de recambio, aceites, filtros, alertas de umbral mínimo y costos de reposición.
            </p>
          </div>
          <button className="btn btn--primario" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} onClick={() => handleAbrirModal()}>
            <i className="fa-solid fa-plus"></i> Registrar Nuevo Repuesto
          </button>
        </div>

        {/* Banner de alerta de stock mínimo */}
        {repuestosBajoStock.length > 0 && (
          <div className="alerta-stock">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>¡Alerta de Stock Mínimo!</strong>
              <p>Hay {repuestosBajoStock.length} repuesto(s) por debajo del umbral mínimo de existencias.</p>
            </div>
          </div>
        )}

        {/* Barra de Filtros Separados */}
        <div className="inventario-header" style={{ flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Buscador de texto */}
            <div className="busqueda-box" style={{ flex: '1 1 240px' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* Filtro por Categoría */}
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '160px' }}
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              {categoriasDisponibles.map(cat => (
                <option key={cat} value={cat}>Categoría: {cat}</option>
              ))}
            </select>

            {/* Filtro por Estado de Stock */}
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={filtroStock}
              onChange={(e) => setFiltroStock(e.target.value)}
            >
              <option value="Todos">Stock: Todos</option>
              <option value="Normal">Stock: Normal</option>
              <option value="Bajo">Stock: Bajo / Alerta</option>
            </select>
          </div>

          <button className="btn-primario" onClick={() => abrirModal()}>
            <i className="fa-solid fa-plus"></i> Nuevo Repuesto
          </button>
        </div>

        {cargando ? (
          <p>Cargando inventario...</p>
        ) : itemsFiltrados.length === 0 ? (
          <div className="empty-state" style={{ background: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
            <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '10px' }}></i>
            <p style={{ color: '#64748b' }}>No se encontraron repuestos con los filtros seleccionados.</p>
          </div>
        ) : (
          <table className="tabla-custom">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>P. Venta</th>
                <th>Estado Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item) => {
                const esBajo = item.cantidad_stock <= item.stock_minimo;
                return (
                  <tr key={item.id} className={esBajo ? 'fila-alerta' : ''}>
                    <td><code>{item.codigo || 'N/A'}</code></td>
                    <td><strong>{item.nombre}</strong></td>
                    <td>{item.categoria}</td>
                    <td>{item.cantidad_stock} unds</td>
                    <td>{item.stock_minimo} unds</td>
                    <td>${Number(item.precio_venta).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${esBajo ? 'badge-danger' : 'badge-success'}`}>
                        {esBajo ? 'Stock Bajo' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-accion" onClick={() => abrirModal(item)} title="Editar repuesto">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-accion danger" onClick={() => handleEliminar(item.id)} title="Eliminar repuesto">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal titulo={itemEdicion ? 'Editar Repuesto' : 'Registrar Nuevo Repuesto'} onClose={() => setModalAbierto(false)}>
          <div className="form-aviso-obligatorio">
            <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>
                Código Repuesto <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>
                Nombre Repuesto <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>
                Categoría <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                <option value="Frenos">Frenos</option>
                <option value="Motor">Motor</option>
                <option value="Suspensión">Suspensión</option>
                <option value="Lubricantes">Lubricantes</option>
                <option value="Filtros">Filtros</option>
                <option value="Fluidos">Fluidos</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Cantidad en Stock <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="number" value={form.cantidad_stock} onChange={(e) => setForm({ ...form, cantidad_stock: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="form-group">
              <label>
                Stock Mínimo (Alerta) <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="form-group">
              <label>
                Precio Compra ($) <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="number" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="form-group">
              <label>
                Precio Venta ($) <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn-primario">Guardar Repuesto</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelLayout>
  );
}
