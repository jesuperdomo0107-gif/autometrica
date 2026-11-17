// src/pages/RecuperarPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacionPassword } from '../services/authService';
import './RecuperarPassword.css';

export default function RecuperarPassword() {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await solicitarRecuperacionPassword(correo.trim());
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se encontró una cuenta con ese correo electrónico.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      {/* Panel decorativo corporativo izquierdo (Formato PC / Desktop) */}
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
          Recuperación Segura de Acceso
        </h2>
        <p className="login-page__left-desc">
          Restablece tu contraseña de forma protegida. Te enviaremos un enlace con token temporal de verificación a tu bandeja de correo.
        </p>
      </div>

      {/* Panel de contenido y formulario derecho */}
      <div className="login-page__right">
        <div className="login-form-container">
          <Link to="/" className="btn-volver-inicio">
            <i className="fa-solid fa-arrow-left"></i> Volver a la página principal
          </Link>

          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
              <i className="fa-solid fa-key"></i>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-texto-oscuro)', margin: '0 0 6px' }}>
              Recuperar Contraseña
            </h2>
            <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.9rem', margin: 0 }}>
              Ingresa tu correo electrónico registrado para enviarte las instrucciones y el enlace de restablecimiento.
            </p>
          </div>

          {error && (
            <div className="alerta alerta--error" style={{ marginBottom: '16px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          {enviado ? (
            <div className="alerta-simulacion-correo">
              <i className="fa-solid fa-paper-plane alerta-simulacion-correo__icono"></i>
              <h3 className="alerta-simulacion-correo__titulo">¡Correo de Recuperación Enviado!</h3>
              <p className="alerta-simulacion-correo__texto">
                Hemos enviado las instrucciones y el enlace seguro a <strong>{correo}</strong>.
              </p>

              <div className="alerta-simulacion-correo__info-box">
                <i className="fa-solid fa-circle-info"></i>
                <div>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>Instrucciones de acceso:</strong>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569' }}>
                    Revisa tu bandeja de entrada o la carpeta de <strong>spam / correo no deseado</strong>. El enlace enviado tiene una validez de <strong>30 minutos</strong>.
                  </p>
                </div>
              </div>

              <p className="alerta-simulacion-correo__nota">
                Por motivos de seguridad, el restablecimiento únicamente puede realizarse abriendo el enlace enviado a tu correo.
              </p>

              <Link to="/login" className="btn btn--primario w-full" style={{ justifyContent: 'center' }}>
                ← Volver al Inicio de Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="correo">Correo electrónico registrado</label>
                <input
                  id="correo"
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@autometrica.co"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primario w-full"
                disabled={cargando}
                style={{ justifyContent: 'center', marginTop: '10px' }}
              >
                {cargando ? (
                  <><span className="spinner"></span> Enviando correo...</>
                ) : (
                  <><i className="fa-solid fa-paper-plane"></i> Enviar Enlace de Restablecimiento</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ color: 'var(--color-primario)', fontWeight: 600, fontSize: '0.9rem' }}>
                  ← Regresar al Inicio de Sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

