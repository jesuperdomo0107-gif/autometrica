// src/pages/RegistroTaller.jsx
// Registro de nuevo Taller con código único irrepetible y cuenta administradora
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { crearTaller } from '../services/talleresService';
import { registrarUsuario } from '../services/authService';
import PasswordRequirements from '../components/PasswordRequirements';
import ModalPoliticaDatos from '../components/ModalPoliticaDatos';
import { validarPassword, esCampoValido } from '../utils/validaciones';
import './Registro.css';

function generarCodigoAleatorio() {
  return `TLR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function RegistroTaller() {
  const navigate = useNavigate();

  const [formTaller, setFormTaller] = useState({
    nombre: '',
    codigo_unico: generarCodigoAleatorio(),
    telefono: '',
    direccion: '',
    ciudad: 'Bogotá',
  });

  const [formAdmin, setFormAdmin] = useState({
    nombre_completo: '',
    correo: '',
    contrasena_hash: '',
    telefono: '',
  });

  const [confirmar, setConfirmar] = useState('');
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [tocado, setTocado] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  function handleTallerChange(e) {
    setFormTaller({ ...formTaller, [e.target.name]: e.target.value });
  }

  function handleAdminChange(e) {
    setFormAdmin({ ...formAdmin, [e.target.name]: e.target.value });
  }

  function handleBlur(campo) {
    setTocado({ ...tocado, [campo]: true });
  }

  function regenerarCodigo() {
    setFormTaller({ ...formTaller, codigo_unico: generarCodigoAleatorio() });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // 1. Validar campos obligatorios del taller
    if (!esCampoValido(formTaller.nombre) || !esCampoValido(formTaller.codigo_unico)) {
      setError('Por favor ingresa el nombre del taller y su código único.');
      setTocado({
        nombre: true,
        codigo_unico: true,
        admin_nombre: true,
        admin_correo: true,
        contrasena_hash: true,
        confirmar: true,
      });
      return;
    }

    // 2. Validar campos obligatorios del administrador
    if (!esCampoValido(formAdmin.nombre_completo) || !esCampoValido(formAdmin.correo) || !esCampoValido(formAdmin.contrasena_hash)) {
      setError('Por favor completa los datos de la cuenta de administrador.');
      return;
    }

    // 3. Validar complejidad de contraseña
    const { esValido } = validarPassword(formAdmin.contrasena_hash);
    if (!esValido) {
      setError('La contraseña del administrador debe tener mínimo 8 caracteres, mayúscula, minúscula y carácter especial.');
      return;
    }

    // 4. Validar coincidencia de contraseñas
    if (formAdmin.contrasena_hash !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // 5. Validar tratamiento de datos
    if (!aceptaDatos) {
      setError('Debes autorizar el Tratamiento de Datos Personales para registrar el taller.');
      return;
    }

    setCargando(true);
    try {
      // Paso 1: Crear el Taller con su Código Único Sencillo
      const resTaller = await crearTaller({
        nombre: formTaller.nombre.trim(),
        codigo_unico: formTaller.codigo_unico.trim().toUpperCase(),
        telefono: formTaller.telefono ? formTaller.telefono.trim() : null,
        direccion: formTaller.direccion ? formTaller.direccion.trim() : null,
        ciudad: formTaller.ciudad ? formTaller.ciudad.trim() : 'Bogotá',
      });
      const tallerCreado = resTaller.data || resTaller;

      // Paso 2: Crear el Usuario Administrador vinculado a ese Taller
      await registrarUsuario({
        nombre_completo: formAdmin.nombre_completo.trim(),
        correo: formAdmin.correo.trim().toLowerCase(),
        contrasena_hash: formAdmin.contrasena_hash,
        telefono: formAdmin.telefono ? formAdmin.telefono.trim() : null,
        taller_id: tallerCreado.id,
        rol: 'admin',
        activo: true,
      });

      navigate('/login', {
        state: {
          registroExitoso: true,
          mensaje: `¡Taller "${tallerCreado.nombre}" registrado exitosamente! Su Código Único es: ${tallerCreado.codigo_unico}. Tus mecánicos podrán usar este código para vincularse al registrarse. Inicia sesión con tu cuenta administradora.`,
        },
      });
    } catch (err) {
      setError(err.message || 'No se pudo registrar el taller. Verifica que el código único o el correo del administrador no estén ya registrados.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="registro-page">
      {/* Panel izquierdo decorativo */}
      <div className="registro-page__left registro-page__left--admin">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#2563eb',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            color: '#ffffff'
          }}>
            <i className="fa-solid fa-warehouse"></i>
          </div>
          <span>Auto<span style={{ color: '#60a5fa' }}>Métrica</span></span>
        </div>

        <div className="registro-page__feature" style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontWeight: 800, lineHeight: 1.2 }}>
            Registra tu Taller Mecánico en Pocos Segundos
          </h2>
          <p style={{ opacity: 0.9, marginTop: '10px', fontSize: '0.95rem' }}>
            Obtén un <strong>Código Único</strong> para tu taller. Con este identificador tus mecánicos y técnicos podrán afiliarse a tu sede de inmediato.
          </p>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
              <i className="fa-solid fa-fingerprint" style={{ color: '#60a5fa', fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '0.85rem' }}>Código Único de Taller generado automáticamente.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
              <i className="fa-solid fa-user-gear" style={{ color: '#60a5fa', fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '0.85rem' }}>Vincula a tu equipo de mecánicos especialistas a tu sede.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
              <i className="fa-solid fa-calculator" style={{ color: '#60a5fa', fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '0.85rem' }}>Cotizaciones detalladas por partes y cobros automáticos.</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>
          AutoMétrica Cloud &bull; Sistema de Gestión de Talleres
        </p>
      </div>

      {/* Panel derecho con formulario */}
      <div className="registro-page__right">
        <div className="registro-container">
          <div className="registro-card">
            <Link to="/" className="btn-volver-inicio">
              <i className="fa-solid fa-arrow-left"></i> Volver a la página principal
            </Link>

            {/* Pestañas de navegación de registro */}
            <div className="registro-roles-tabs">
              <Link to="/registro-taller" className="registro-role-tab active registro-role-tab--taller">
                <i className="fa-solid fa-warehouse"></i> Registrar Taller
              </Link>
              <Link to="/registro-mecanico" className="registro-role-tab">
                <i className="fa-solid fa-screwdriver-wrench"></i> Soy Mecánico
              </Link>
              <Link to="/registro" className="registro-role-tab">
                <i className="fa-solid fa-user"></i> Soy Cliente
              </Link>
            </div>

            <h1>Registro de Taller Automotriz</h1>
            <p className="registro-card__sub">Completa los datos de tu taller y crea tu cuenta de administrador.</p>

            <div className="form-aviso-obligatorio">
              <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
            </div>

            {error && (
              <div className="alerta alerta--error" style={{ marginBottom: '16px' }}>
                <i className="fa-solid fa-triangle-exclamation"></i> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* SECCIÓN 1: DATOS DEL TALLER */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e40af', fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-warehouse"></i> Datos Principales del Taller
                </div>

                <div className="form-group">
                  <label htmlFor="nombre">
                    Nombre del Taller <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className={`form-input ${tocado.nombre && !esCampoValido(formTaller.nombre) ? 'form-input--invalido' : ''}`}
                    placeholder="Ej: Taller Mecánico Central, AutoSport, Motos del Valle..."
                    value={formTaller.nombre}
                    onChange={handleTallerChange}
                    onBlur={() => handleBlur('nombre')}
                    required
                  />
                </div>

                {/* Código Único Sencillo del Taller */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label htmlFor="codigo_unico" style={{ margin: 0 }}>
                      Código Único del Taller <span className="campo-obligatorio-asterisco">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={regenerarCodigo}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <i className="fa-solid fa-rotate"></i> Generar otro código
                    </button>
                  </div>
                  <input
                    id="codigo_unico"
                    name="codigo_unico"
                    type="text"
                    className="form-input"
                    style={{ fontWeight: 800, letterSpacing: '1px', color: '#1e40af', textTransform: 'uppercase' }}
                    placeholder="Ej: TLR-5421 o MORA-AUTO"
                    value={formTaller.codigo_unico}
                    onChange={(e) => setFormTaller({ ...formTaller, codigo_unico: e.target.value.toUpperCase() })}
                    required
                  />
                  <span className="form-hint" style={{ marginTop: '4px', display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                    <i className="fa-solid fa-circle-info"></i> Este código identifica a tu taller. Los mecánicos lo ingresarán al registrarse para afiliarse.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="ciudad">Ciudad / Municipio</label>
                    <input
                      id="ciudad"
                      name="ciudad"
                      type="text"
                      className="form-input"
                      placeholder="Ej: Bogotá, Medellín..."
                      value={formTaller.ciudad}
                      onChange={handleTallerChange}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="telefono_taller">Teléfono de Contacto</label>
                    <input
                      id="telefono_taller"
                      name="telefono"
                      type="tel"
                      className="form-input"
                      placeholder="Ej: 300 123 4567"
                      value={formTaller.telefono}
                      onChange={handleTallerChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CUENTA DEL ADMINISTRADOR / ENCARGADO */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e40af', fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-user-shield"></i> Cuenta de Administrador del Taller
                </div>

                <div className="form-group">
                  <label htmlFor="admin_nombre">
                    Nombre Completo del Encargado / Dueño <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <input
                    id="admin_nombre"
                    name="nombre_completo"
                    type="text"
                    className={`form-input ${tocado.admin_nombre && !esCampoValido(formAdmin.nombre_completo) ? 'form-input--invalido' : ''}`}
                    placeholder="Ej: Carlos Andrés Gómez"
                    value={formAdmin.nombre_completo}
                    onChange={handleAdminChange}
                    onBlur={() => handleBlur('admin_nombre')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin_correo">
                    Correo Electrónico (Para iniciar sesión) <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <input
                    id="admin_correo"
                    name="correo"
                    type="email"
                    className={`form-input ${tocado.admin_correo && !esCampoValido(formAdmin.correo) ? 'form-input--invalido' : ''}`}
                    placeholder="ejemplo@autometrica.com"
                    value={formAdmin.correo}
                    onChange={handleAdminChange}
                    onBlur={() => handleBlur('admin_correo')}
                    required
                  />
                </div>

                {/* Contraseña */}
                <div className="form-group">
                  <label htmlFor="contrasena_hash">
                    Contraseña <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <div className="input-password-wrapper">
                    <input
                      id="contrasena_hash"
                      name="contrasena_hash"
                      type={mostrarPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                      value={formAdmin.contrasena_hash}
                      onChange={handleAdminChange}
                      onBlur={() => handleBlur('contrasena_hash')}
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      tabIndex="-1"
                    >
                      <i className={`fa-solid ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <PasswordRequirements password={formAdmin.contrasena_hash} />
                </div>

                {/* Confirmar Contraseña */}
                <div className="form-group">
                  <label htmlFor="confirmar">
                    Confirmar Contraseña <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <div className="input-password-wrapper">
                    <input
                      id="confirmar"
                      type={mostrarConfirmar ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repite la contraseña"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      onBlur={() => handleBlur('confirmar')}
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                      tabIndex="-1"
                    >
                      <i className={`fa-solid ${mostrarConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tratamiento de Datos */}
              <div className="form-check" style={{ marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="aceptaDatos"
                  checked={aceptaDatos}
                  onChange={(e) => setAceptaDatos(e.target.checked)}
                />
                <label htmlFor="aceptaDatos" style={{ fontSize: '0.85rem' }}>
                  Acepto los términos del servicio y el{' '}
                  <button
                    type="button"
                    onClick={() => setModalDatosAbierto(true)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                  >
                    Tratamiento de Datos Personales
                  </button>.
                </label>
              </div>

              <button
                type="submit"
                className="btn btn--primario btn--full"
                style={{ padding: '12px', fontSize: '1rem', backgroundColor: '#2563eb' }}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="spinner"></span> Registrando Taller...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-warehouse"></i> Registrar Taller y Crear Administrador
                  </>
                )}
              </button>
            </form>

            <p className="registro-link" style={{ marginTop: '16px' }}>
              ¿Ya tienes una cuenta de taller o mecánico? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Inicia Sesión</Link>
            </p>
          </div>
        </div>
      </div>

      {modalDatosAbierto && (
        <ModalPoliticaDatos onClose={() => setModalDatosAbierto(false)} />
      )}
    </div>
  );
}
