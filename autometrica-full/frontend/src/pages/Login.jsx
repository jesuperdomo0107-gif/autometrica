// src/pages/Login.jsx
// Página de inicio de sesión segmentada por rol con selección de taller
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTalleres } from '../services/talleresService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, cargando } = useAuth();

  const [rolSeleccionado, setRolSeleccionado] = useState('mecanico'); // 'mecanico' | 'cliente' | 'admin'
  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');

  const mensajeExito = location.state?.mensaje || (location.state?.registroExitoso ? 'Cuenta creada exitosamente. Inicia sesión con tus credenciales.' : '');

  useEffect(() => {
    async function cargarTalleres() {
      try {
        const res = await getTalleres();
        const lista = Array.isArray(res) ? res : (res?.data || []);
        setTalleres(lista);
        if (lista.length > 0) {
          setTallerId(lista[0].id);
        }
      } catch (e) {
        console.warn('Error al cargar lista de talleres:', e);
      }
    }
    cargarTalleres();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!correo.trim() || !password) {
      setError('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    try {
      const selectedTallerNum = tallerId ? parseInt(tallerId) : null;
      const user = await login(correo.trim(), password, selectedTallerNum, rolSeleccionado);

      // Redirección según el rol autenticado
      if (user.rol === 'cliente') {
        navigate('/portal-cliente');
      } else {
        navigate('/panel-mecanico');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Correo o contraseña incorrectos.');
    }
  }

  return (
    <div className="login-page">
      {/* Panel decorativo izquierdo */}
      <div className="login-page__left">
        <div className="login-page__left-logo">
          <img
            src="/autometrica_icono.svg"
            alt="AutoMétrica"
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain' }}
          />
          AutoMétrica
        </div>
        <h2 className="login-page__left-titulo">
          Gestión Inteligente y Transparente de tu Taller
        </h2>
        <p className="login-page__left-desc">
          Controla órdenes de servicio, cotizaciones detalladas por partes, catálogo de mecánicos y seguimiento de vehículos en tiempo real.
        </p>
      </div>

      {/* Panel del formulario */}
      <div className="login-page__right">
        <div className="login-form-container">
          <Link to="/" className="btn-volver-inicio">
            <i className="fa-solid fa-arrow-left"></i> Volver a la página principal
          </Link>

          {/* Pestañas de Selección de Rol */}
          <div className="login-roles-tabs">
            <button
              type="button"
              className={`login-role-tab login-role-tab--mecanico ${rolSeleccionado === 'mecanico' ? 'active' : ''}`}
              onClick={() => { setRolSeleccionado('mecanico'); setError(''); }}
            >
              <i className="fa-solid fa-wrench"></i> Soy Mecánico
            </button>
            <button
              type="button"
              className={`login-role-tab login-role-tab--cliente ${rolSeleccionado === 'cliente' ? 'active' : ''}`}
              onClick={() => { setRolSeleccionado('cliente'); setError(''); }}
            >
              <i className="fa-solid fa-user"></i> Soy Cliente
            </button>
            <button
              type="button"
              className={`login-role-tab login-role-tab--admin ${rolSeleccionado === 'admin' ? 'active' : ''}`}
              onClick={() => { setRolSeleccionado('admin'); setError(''); }}
            >
              <i className="fa-solid fa-user-shield"></i> Administrador
            </button>
          </div>

          <h1 className="login-form-container__titulo">
            {rolSeleccionado === 'mecanico' && 'Acceso para Mecánicos'}
            {rolSeleccionado === 'cliente' && 'Acceso para Clientes'}
            {rolSeleccionado === 'admin' && 'Acceso Administrativo'}
          </h1>
          <p className="login-form-container__sub">
            {rolSeleccionado === 'mecanico' && 'Ingresa con tu cuenta técnica y selecciona la sede donde laboras'}
            {rolSeleccionado === 'cliente' && 'Ingresa a tu garaje digital y selecciona tu taller preferido'}
            {rolSeleccionado === 'admin' && 'Ingresa para administrar los servicios y finanzas de tu taller'}
          </p>

          {mensajeExito && (
            <div className="alerta alerta--exito" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.88rem' }}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> {mensajeExito}
            </div>
          )}

          {error && (
            <div className="alerta alerta--error" style={{ marginBottom: '16px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Selector dinámico de Taller para Mecánico y Cliente */}
            {rolSeleccionado !== 'admin' && (
              <div className="login-taller-box">
                <div className="login-taller-box__header">
                  <i className="fa-solid fa-warehouse"></i>
                  {rolSeleccionado === 'mecanico' ? 'Taller donde trabajas:' : 'Taller de tu preferencia:'}
                </div>
                {talleres.length === 0 ? (
                  <div style={{ color: '#d97706', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-circle-exclamation"></i> No hay talleres registrados aún.
                  </div>
                ) : (
                  <select
                    className="form-input"
                    style={{ fontWeight: 600, color: '#1e40af' }}
                    value={tallerId}
                    onChange={(e) => setTallerId(e.target.value)}
                  >
                    {talleres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} — Código: {t.codigo_unico || `TLR-${1000 + t.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="correo">
                Correo electrónico <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                id="correo"
                type="email"
                className="form-input"
                placeholder="tu_correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  <i className={`fa-solid ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <Link to="/recuperar-password" style={{ fontSize: '0.82rem', color: '#2563eb' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn--primario w-full"
              disabled={cargando}
              style={{
                justifyContent: 'center',
                padding: '12px',
                fontSize: '1rem',
                backgroundColor: rolSeleccionado === 'mecanico' ? '#0284c7' : rolSeleccionado === 'cliente' ? '#2563eb' : '#059669',
              }}
            >
              {cargando ? (
                <><span className="spinner"></span> Ingresando...</>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  {rolSeleccionado === 'mecanico' && ' Iniciar como Mecánico'}
                  {rolSeleccionado === 'cliente' && ' Iniciar como Cliente'}
                  {rolSeleccionado === 'admin' && ' Iniciar como Administrador'}
                </>
              )}
            </button>
          </form>

          {/* Enlaces a registros */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#64748b' }}>
              ¿Aún no tienes una cuenta registrada?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/registro-taller" className="btn btn--sm btn--outline" style={{ fontSize: '0.78rem' }}>
                <i className="fa-solid fa-warehouse"></i> Registrar Taller
              </Link>
              <Link to="/registro-mecanico" className="btn btn--sm btn--outline" style={{ fontSize: '0.78rem' }}>
                <i className="fa-solid fa-wrench"></i> Soy Mecánico
              </Link>
              <Link to="/registro" className="btn btn--sm btn--outline" style={{ fontSize: '0.78rem' }}>
                <i className="fa-solid fa-user"></i> Soy Cliente
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
