// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

// Definición completa y organizada de los enlaces del menú lateral del taller
const menuAdmin = [
  { to: '/panel-mecanico', icon: 'fa-gauge', label: 'Panel Principal', section: 'GENERAL' },
  { to: '/agenda-citas', icon: 'fa-calendar-days', label: 'Agenda de Citas', section: 'GENERAL' },

  { to: '/reparaciones', icon: 'fa-wrench', label: 'Reparaciones', section: 'OPERACIÓN' },
  { to: '/inventario', icon: 'fa-boxes-stacked', label: 'Inventario & Stock', section: 'OPERACIÓN' },
  { to: '/facturacion', icon: 'fa-file-invoice-dollar', label: 'Facturación & Pagos', section: 'OPERACIÓN' },
  { to: '/gestion-vehiculos', icon: 'fa-car', label: 'Vehículos', section: 'OPERACIÓN' },
  { to: '/clientes', icon: 'fa-users', label: 'Clientes', section: 'OPERACIÓN' },
  { to: '/proveedores', icon: 'fa-truck-field', label: 'Proveedores', section: 'OPERACIÓN' },

  { to: '/gestion-usuarios', icon: 'fa-user-gear', label: 'Gestión Usuarios', section: 'ADMINISTRACIÓN' },
  { to: '/reportes', icon: 'fa-chart-bar', label: 'Reportes & Estadísticas', section: 'ADMINISTRACIÓN' },
  { to: '/audit-log', icon: 'fa-shield-halved', label: 'Auditoría del Sistema', section: 'ADMINISTRACIÓN' },
];

const menuMecanico = [
  { to: '/panel-mecanico', icon: 'fa-gauge', label: 'Panel Operativo', section: 'GENERAL' },
  { to: '/agenda-citas', icon: 'fa-calendar-days', label: 'Agenda de Citas', section: 'GENERAL' },

  { to: '/reparaciones', icon: 'fa-wrench', label: 'Órdenes de Reparación', section: 'OPERACIÓN' },
  { to: '/inventario', icon: 'fa-boxes-stacked', label: 'Inventario & Repuestos', section: 'OPERACIÓN' },
  { to: '/gestion-vehiculos', icon: 'fa-car', label: 'Vehículos en Taller', section: 'OPERACIÓN' },
  { to: '/clientes', icon: 'fa-users', label: 'Clientes', section: 'OPERACIÓN' },
  { to: '/facturacion', icon: 'fa-file-invoice-dollar', label: 'Presupuestos & Cobros', section: 'OPERACIÓN' },

  { to: '/historial', icon: 'fa-clock-rotate-left', label: 'Historial de Servicios', section: 'CONSULTAS' },
  { to: '/reportes', icon: 'fa-chart-bar', label: 'Reportes de Trabajo', section: 'CONSULTAS' },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const inicial = usuario?.nombre_completo?.charAt(0)?.toUpperCase() || 'U';
  const esAdmin = usuario?.rol === 'admin';
  const items = esAdmin ? menuAdmin : menuMecanico;
  const secciones = [...new Set(items.map((i) => i.section))];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img
          src="/autometrica_icono.svg"
          alt="AutoMétrica"
          style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain' }}
        />
        <span className="sidebar__logo-text">AutoMétrica</span>
      </div>

      {usuario?.taller_nombre && (
        <div style={{
          padding: '10px 14px',
          margin: '0 12px 14px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: '0.78rem',
          color: '#cbd5e1'
        }}>
          <div style={{ fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-warehouse"></i> {usuario.taller_nombre}
          </div>
          {usuario.taller_codigo && (
            <div style={{ marginTop: '3px', opacity: 0.9, fontSize: '0.72rem', color: '#94a3b8' }}>
              Código Único: <strong style={{ color: '#ffffff' }}>{usuario.taller_codigo}</strong>
            </div>
          )}
        </div>
      )}

      <nav className="sidebar__nav">
        {secciones.map((seccion) => (
          <React.Fragment key={seccion}>
            <span className="sidebar__label">{seccion}</span>
            {items
              .filter((item) => item.section === seccion)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? ' active' : ''}`
                  }
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  {item.label}
                </NavLink>
              ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user-info">
          <div className="sidebar__avatar">{inicial}</div>
          <div>
            <div className="sidebar__user-name">
              {usuario?.nombre_completo || 'Usuario'}
            </div>
            <div className="sidebar__user-rol">{usuario?.rol || 'Personal'}</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
