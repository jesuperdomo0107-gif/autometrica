import React from 'react';
import Sidebar from './Sidebar';
import SidebarCliente from './SidebarCliente';
import { useAuth } from '../context/AuthContext';
import './PanelLayout.css';

/**
 * PanelLayout — Envoltorio para las páginas del taller (mecánico, admin y cliente)
 * Props:
 *   - titulo: título que se muestra en la barra superior
 *   - children: contenido de la página
 */
export default function PanelLayout({ titulo, children }) {
  const { usuario } = useAuth();
  const esCliente = usuario?.rol === 'cliente';

  return (
    <div className="panel-layout">
      {esCliente ? <SidebarCliente /> : <Sidebar />}

      <div className="panel-layout__content">
        {/* Barra superior con el título de la sección y el nombre del usuario */}
        <header className="panel-layout__topbar">
          <span className="panel-layout__topbar-title">{titulo}</span>
          <div className="panel-layout__topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {usuario?.taller_nombre && (
              <div style={{
                background: '#eff6ff',
                color: '#1e40af',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <i className="fa-solid fa-warehouse" style={{ color: '#2563eb' }}></i>
                {usuario.taller_nombre} {usuario.taller_codigo ? `(${usuario.taller_codigo})` : ''}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-circle-user"></i>
              <span>{usuario?.nombre_completo || 'Usuario'}</span>
            </div>
          </div>
        </header>

        {/* Contenido dinámico de cada página */}
        <main className="panel-layout__main">
          {children}
        </main>
      </div>
    </div>
  );
}
