// src/pages/RestablecerPassword.jsx
// Página de restablecimiento de contraseña segura mediante token
import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { restablecerPassword } from '../services/authService';
import PasswordRequirements from '../components/PasswordRequirements';
import { validarPassword, esCampoValido } from '../utils/validaciones';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const correoParam = searchParams.get('correo') || '';

  const [correo, setCorreo] = useState(correoParam);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [tocado, setTocado] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!esCampoValido(correo) || !esCampoValido(nuevaPassword) || !esCampoValido(confirmarPassword)) {
      setError('Por favor completa todos los campos obligatorios.');
      setTocado({ correo: true, nuevaPassword: true, confirmarPassword: true });
      return;
    }

    const { esValido } = validarPassword(nuevaPassword);
    if (!esValido) {
      setError('La nueva contraseña debe cumplir con los 4 requisitos de seguridad.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await restablecerPassword({
        correo: correo.trim(),
        token: tokenParam,
        nueva_password: nuevaPassword,
      });

      setExito(true);
      setTimeout(() => {
        navigate('/login', { state: { passwordRestablecida: true } });
      }, 2500);
    } catch (err) {
      setError(err.message || 'El enlace de recuperación es inválido o ha expirado (más de 30 minutos).');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      {/* Panel decorativo izquierdo (Formato PC / Desktop) */}
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
          Protección y Seguridad de tu Cuenta
        </h2>
        <p className="login-page__left-desc">
          Crea una nueva contraseña segura para continuar gestionando órdenes, cotizaciones y servicios sin interrupciones.
        </p>
      </div>

      {/* Panel del formulario derecho */}
      <div className="login-page__right">
        <div className="login-form-container">
          <Link to="/" className="btn-volver-inicio">
            <i className="fa-solid fa-arrow-left"></i> Volver a la página principal
          </Link>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: '#eff6ff',
            color: 'var(--color-primario)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 12px'
          }}>
            <i className="fa-solid fa-lock-open"></i>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-texto-oscuro)', margin: '0 0 6px' }}>Restablecer Contraseña</h2>
          <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.9rem', margin: 0 }}>
            Crea una nueva contraseña segura para tu cuenta en AutoMétrica.
          </p>
        </div>

        <div className="form-aviso-obligatorio">
          <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
        </div>

        {error && (
          <div className="alerta alerta--error" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> {error}
          </div>
        )}

        {exito ? (
          <div className="alerta-simulacion-correo" style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
            <h4 style={{ color: '#15803d', margin: '0 0 8px' }}>¡Contraseña Actualizada con Éxito!</h4>
            <p style={{ color: '#166534', fontSize: '0.9rem', margin: '0 0 16px' }}>
              Tu contraseña ha sido restablecida correctamente. Redirigiéndote al inicio de sesión...
            </p>
            <Link to="/login" className="btn btn--primario w-full" style={{ justifyContent: 'center' }}>
              Ir a Iniciar Sesión Ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="correo">
                Correo Electrónico <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                id="correo"
                type="email"
                className="form-input"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@autometrica.co"
                readOnly={!!correoParam}
                style={correoParam ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nuevaPassword">
                Nueva Contraseña <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="nuevaPassword"
                  type={mostrarPassword ? "text" : "password"}
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  required
                  placeholder="Mínimo 8 caracteres, mayús, minús y especial"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  onBlur={() => setTocado({ ...tocado, nuevaPassword: true })}
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
              {tocado.nuevaPassword && !esCampoValido(nuevaPassword) && (
                <span className="campo-obligatorio-mensaje">
                  <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                </span>
              )}
              {/* Checklist en tiempo real */}
              <PasswordRequirements password={nuevaPassword} />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarPassword">
                Confirmar Nueva Contraseña <span className="campo-obligatorio-asterisco">*</span>
              </label>
              <input
                id="confirmarPassword"
                type={mostrarPassword ? "text" : "password"}
                className="form-input"
                required
                placeholder="Repite la nueva contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                onBlur={() => setTocado({ ...tocado, confirmarPassword: true })}
              />
              {tocado.confirmarPassword && !esCampoValido(confirmarPassword) && (
                <span className="campo-obligatorio-mensaje">
                  <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                </span>
              )}
              {tocado.confirmarPassword && esCampoValido(confirmarPassword) && confirmarPassword !== nuevaPassword && (
                <span className="campo-obligatorio-mensaje">
                  <i className="fa-solid fa-circle-exclamation"></i> Las contraseñas no coinciden
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn--primario w-full"
              disabled={cargando}
              style={{ justifyContent: 'center', marginTop: '10px' }}
            >
              {cargando ? (
                <><span className="spinner"></span> Actualizando contraseña...</>
              ) : (
                <><i className="fa-solid fa-key"></i> Guardar Nueva Contraseña</>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <Link to="/login" style={{ color: 'var(--color-primario)', fontWeight: 600, fontSize: '0.9rem' }}>
                ← Cancelar y Volver al Login
              </Link>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
