// src/pages/Registro.jsx
// Registro de nuevo usuario cliente con validación estricta y tratamiento de datos
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarUsuario } from '../services/authService';
import PasswordRequirements from '../components/PasswordRequirements';
import ModalPoliticaDatos from '../components/ModalPoliticaDatos';
import { validarPassword, esCampoValido } from '../utils/validaciones';
import './Registro.css';

export default function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    contrasena_hash: '',
    telefono: '',
    rol: 'cliente',
    activo: true,
  });

  const [confirmar, setConfirmar] = useState('');
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [tocado, setTocado] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBlur(campo) {
    setTocado({ ...tocado, [campo]: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // 1. Validar campos obligatorios
    if (!esCampoValido(form.nombre_completo) || !esCampoValido(form.correo) || !esCampoValido(form.contrasena_hash) || !esCampoValido(confirmar)) {
      setError('Por favor completa todos los campos obligatorios.');
      setTocado({
        nombre_completo: true,
        correo: true,
        contrasena_hash: true,
        confirmar: true,
      });
      return;
    }

    // 2. Validar complejidad de contraseña (8+ chars, mayúscula, minúscula, especial)
    const { esValido } = validarPassword(form.contrasena_hash);
    if (!esValido) {
      setError('La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un carácter especial.');
      return;
    }

    // 3. Validar coincidencia de contraseñas
    if (form.contrasena_hash !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // 4. Validar aceptación de Tratamiento de Datos Personales
    if (!aceptaDatos) {
      setError('Debes autorizar el Tratamiento de Datos Personales para continuar.');
      return;
    }

    setCargando(true);
    try {
      await registrarUsuario(form);
      navigate('/login', { state: { registroExitoso: true } });
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta. Verifica que el correo no esté registrado.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="registro-page">
      {/* Panel izquierdo decorativo con imagen */}
      <div className="registro-page__left registro-page__left--cliente">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>
          <img
            src="/autometrica_icono.svg"
            alt="AutoMétrica"
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain' }}
          />
          AutoMétrica
        </div>
        <h2 style={{ fontSize: '1.6rem', maxWidth: '340px', lineHeight: 1.3, margin: '10px 0 0' }}>
          Tu Garaje Digital y Seguimiento en Vivo
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.6 }}>
          Agenda citas de mantenimiento, aprueba presupuestos con 1 clic y consulta el historial clínico de tus vehículos.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '12px 18px',
          fontSize: '0.82rem',
          maxWidth: '300px',
          textAlign: 'left'
        }}>
          <i className="fa-solid fa-shield-check" style={{ color: '#22c55e', marginRight: '6px' }}></i>
          Tus datos y vehículos protegidos bajo la Ley 1581 de 2012.
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="registro-page__right">
        <div className="registro-container">
          <div className="registro-card">
            <Link to="/" className="btn-volver-inicio">
              <i className="fa-solid fa-arrow-left"></i> Volver a la página principal
            </Link>

            {/* Selector de Rol */}
            <div className="registro-roles-tabs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <Link to="/registro-taller" className="registro-role-tab">
                <i className="fa-solid fa-warehouse"></i> Registrar Taller
              </Link>
              <Link to="/registro-mecanico" className="registro-role-tab">
                <i className="fa-solid fa-screwdriver-wrench"></i> Soy Mecánico
              </Link>
              <Link to="/registro" className="registro-role-tab active">
                <i className="fa-solid fa-user"></i> Soy Cliente
              </Link>
            </div>

            <h1>Crear Cuenta de Cliente</h1>
            <p className="registro-card__sub">Regístrate para gestionar tus vehículos y servicios en el taller</p>

            <div className="form-aviso-obligatorio">
              <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
            </div>

            {error && (
              <div className="alerta alerta--error">
                <i className="fa-solid fa-triangle-exclamation"></i> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="nombre_completo">
                  Nombre completo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  className={`form-input ${tocado.nombre_completo && !esCampoValido(form.nombre_completo) ? 'form-input--error' : ''}`}
                  required
                  placeholder="Ej: Carlos Rodríguez"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  onBlur={() => handleBlur('nombre_completo')}
                />
                {tocado.nombre_completo && !esCampoValido(form.nombre_completo) && (
                  <span className="campo-obligatorio-mensaje">
                    <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="correo">
                  Correo electrónico <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  className={`form-input ${tocado.correo && !esCampoValido(form.correo) ? 'form-input--error' : ''}`}
                  required
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={handleChange}
                  onBlur={() => handleBlur('correo')}
                />
                {tocado.correo && !esCampoValido(form.correo) && (
                  <span className="campo-obligatorio-mensaje">
                    <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono (opcional)</label>
                <input
                  id="telefono"
                  name="telefono"
                  className="form-input"
                  placeholder="300 000 0000"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contrasena_hash">
                  Contraseña <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="contrasena_hash"
                    name="contrasena_hash"
                    type={mostrarPassword ? "text" : "password"}
                    className={`form-input ${tocado.contrasena_hash && !validarPassword(form.contrasena_hash).esValido ? 'form-input--error' : ''}`}
                    style={{ paddingRight: '42px' }}
                    required
                    placeholder="Mínimo 8 caracteres, mayús, minús y especial"
                    value={form.contrasena_hash}
                    onChange={handleChange}
                    onBlur={() => handleBlur('contrasena_hash')}
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
                {tocado.contrasena_hash && !esCampoValido(form.contrasena_hash) && (
                  <span className="campo-obligatorio-mensaje">
                    <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                  </span>
                )}
                {/* Checklist reactivo en tiempo real */}
                <PasswordRequirements password={form.contrasena_hash} />
              </div>

              <div className="form-group">
                <label htmlFor="confirmar">
                  Confirmar contraseña <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="confirmar"
                    type={mostrarConfirmar ? "text" : "password"}
                    className={`form-input ${tocado.confirmar && (!esCampoValido(confirmar) || confirmar !== form.contrasena_hash) ? 'form-input--error' : ''}`}
                    style={{ paddingRight: '42px' }}
                    required
                    placeholder="Repite tu contraseña"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    onBlur={() => handleBlur('confirmar')}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
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
                    title={mostrarConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    <i className={`fa-solid ${mostrarConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {tocado.confirmar && !esCampoValido(confirmar) && (
                  <span className="campo-obligatorio-mensaje">
                    <i className="fa-solid fa-circle-exclamation"></i> Este campo es obligatorio
                  </span>
                )}
                {tocado.confirmar && esCampoValido(confirmar) && confirmar !== form.contrasena_hash && (
                  <span className="campo-obligatorio-mensaje">
                    <i className="fa-solid fa-circle-exclamation"></i> Las contraseñas no coinciden
                  </span>
                )}
              </div>

              {/* Casilla de Tratamiento de Datos Personales (Ley 1581 de 2012) */}
              <div className="form-group" style={{ margin: '18px 0 10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    checked={aceptaDatos}
                    onChange={(e) => setAceptaDatos(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                    required
                  />
                  <span>
                    Autorizo el <button type="button" onClick={() => setModalDatosAbierto(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primario)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}>tratamiento de mis datos personales</button> de acuerdo con la Política de Privacidad de AutoMétrica (Ley 1581 de 2012). <span className="campo-obligatorio-asterisco">*</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn--primario w-full mt-sm"
                disabled={cargando}
                style={{ justifyContent: 'center' }}
              >
                {cargando ? (
                  <><span className="spinner"></span> Creando cuenta...</>
                ) : (
                  <><i className="fa-solid fa-user-plus"></i> Crear cuenta</>
                )}
              </button>
            </form>

            <p className="registro-link">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: 'var(--color-primario)', fontWeight: 600 }}>
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Tratamiento de Datos */}
      {modalDatosAbierto && (
        <ModalPoliticaDatos
          onClose={() => setModalDatosAbierto(false)}
          onAceptar={() => setAceptaDatos(true)}
        />
      )}
    </div>
  );
}
