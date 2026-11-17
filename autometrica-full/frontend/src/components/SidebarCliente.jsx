// src/components/SidebarCliente.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuCliente = [
  { to: '/portal-cliente', icon: 'fa-house', label: 'Inicio & Resumen' },
  { to: '/gestion-vehiculos', icon: 'fa-car', label: 'Mis Vehículos' },
  { to: '/servicios-cliente', icon: 'fa-wrench', label: 'Estado de Servicios & Calificación' },
  { to: '/presupuestos-cliente', icon: 'fa-file-invoice-dollar', label: 'Presupuestos & Cotizaciones' },
  { to: '/citas-cliente', icon: 'fa-calendar-plus', label: 'Programar Citas' },
  { to: '/historial', icon: 'fa-clock-rotate-left', label: 'Historial Mantenimientos' },
];

export default function SidebarCliente() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const inicial = usuario?.nombre_completo?.charAt(0)?.toUpperCase() || 'C';

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

      <nav className="sidebar__nav">
        <span className="sidebar__label">MI PORTAL</span>
        {menuCliente.map((item) => (
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
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user-info">
          <div className="sidebar__avatar">{inicial}</div>
          <div>
            <div className="sidebar__user-name">
              {usuario?.nombre_completo || 'Cliente'}
            </div>
            <div className="sidebar__user-rol">Cliente</div>
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
