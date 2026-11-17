import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarUsuario } from '../services/authService';
import { getTalleres } from '../services/talleresService';
import PasswordRequirements from '../components/PasswordRequirements';
import ModalPoliticaDatos from '../components/ModalPoliticaDatos';
import { validarPassword, esCampoValido } from '../utils/validaciones';
import './Registro.css';

export default function RegistroMecanico() {
  const navigate = useNavigate();

  const [talleres, setTalleres] = useState([]);
  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    contrasena_hash: '',
    telefono: '',
    especialidad: 'Mantenimiento General',
    codigo_taller: '',
    rol: 'mecanico',
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

  useEffect(() => {
    async function cargarTalleres() {
      try {
        const res = await getTalleres();
        const lista = Array.isArray(res) ? res : (res?.data || []);
        setTalleres(lista);
        if (lista.length > 0) {
          setForm(f => ({ ...f, codigo_taller: lista[0].codigo_unico || lista[0].nombre || '' }));
        }
      } catch (e) {
        console.warn('Error al cargar talleres:', e);
      }
    }
    cargarTalleres();
  }, []);

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
        codigo_taller: true,
      });
      return;
    }

    // 2. Validar que se haya indicado el taller
    if (!esCampoValido(form.codigo_taller)) {
      setError('Por favor selecciona o ingresa el Código Único del Taller al que perteneces.');
      setTocado({ ...tocado, codigo_taller: true });
      return;
    }

    // 3. Validar complejidad de contraseña
    const { esValido } = validarPassword(form.contrasena_hash);
    if (!esValido) {
      setError('La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un carácter especial.');
      return;
    }

    // 4. Validar coincidencia de contraseñas
    if (form.contrasena_hash !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // 5. Validar aceptación de Tratamiento de Datos
    if (!aceptaDatos) {
      setError('Debes autorizar el Tratamiento de Datos Personales para continuar.');
      return;
    }

    setCargando(true);
    try {
      await registrarUsuario(form);
      navigate('/login', { state: { registroExitoso: true, mensaje: 'Cuenta de Mecánico creada con éxito y vinculada a tu taller. Inicia sesión para acceder.' } });
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta de mecánico. Verifica el código del taller y que el correo no esté registrado.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="registro-page">
      {/* Panel izquierdo decorativo con imagen técnica */}
      <div className="registro-page__left registro-page__left--mecanico">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#0284c7',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem'
          }}>
            <i className="fa-solid fa-screwdriver-wrench"></i>
          </div>
          AutoMétrica
        </div>
        <h2 style={{ fontSize: '1.6rem', maxWidth: '340px', lineHeight: 1.3, margin: '10px 0 0' }}>
          Portal de Técnicos & Especialistas Mecánicos
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.6 }}>
          Controla tus órdenes asignadas, registra tiempos de mano de obra con cronómetro en tiempo real y documenta tus intervenciones técnicas.
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
          <i className="fa-solid fa-laptop-code" style={{ color: '#38bdf8', marginRight: '6px' }}></i>
          Vinculación directa a tu taller mediante <strong>Código Único</strong> y registro transparente de intervenciones.
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
              <Link to="/registro-mecanico" className="registro-role-tab registro-role-tab--mecanico active">
                <i className="fa-solid fa-screwdriver-wrench"></i> Soy Mecánico
              </Link>
              <Link to="/registro" className="registro-role-tab">
                <i className="fa-solid fa-user"></i> Soy Cliente
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '4px 10px', fontSize: '0.75rem' }}>
                <i className="fa-solid fa-wrench"></i> PERFIL TÉCNICO
              </span>
            </div>
            <h1>Registro de Técnico Mecánico</h1>
            <p className="registro-card__sub">Crea tu cuenta técnica y vincúlate al taller automotriz donde laboras</p>

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
                  Nombre completo del mecánico <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  className={`form-input ${tocado.nombre_completo && !esCampoValido(form.nombre_completo) ? 'form-input--error' : ''}`}
                  placeholder="Ej: Juan Camilo Restrepo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  onBlur={() => handleBlur('nombre_completo')}
                  required
                />
                {tocado.nombre_completo && !esCampoValido(form.nombre_completo) && (
                  <span className="form-error-msg">Ingresa tu nombre completo.</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="correo">
                    Correo electrónico <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    className={`form-input ${tocado.correo && !esCampoValido(form.correo) ? 'form-input--error' : ''}`}
                    placeholder="mecanico@autometrica.co"
                    value={form.correo}
                    onChange={handleChange}
                    onBlur={() => handleBlur('correo')}
                    required
                  />
                  {tocado.correo && !esCampoValido(form.correo) && (
                    <span className="form-error-msg">Ingresa un correo válido.</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono celular</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    className="form-input"
                    placeholder="310 000 0000"
                    value={form.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="especialidad">
                    Especialidad técnica principal <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <select
                    id="especialidad"
                    name="especialidad"
                    className="form-select"
                    value={form.especialidad}
                    onChange={handleChange}
                  >
                    <option value="Mantenimiento General">Mantenimiento General / Preventivo</option>
                    <option value="Diagnóstico OBD2 / Electromecánica">Diagnóstico OBD2 / Electromecánica</option>
                    <option value="Motores & Transmisión">Motores & Transmisión</option>
                    <option value="Frenos, Suspensión & Dirección">Frenos, Suspensión & Dirección</option>
                    <option value="Aire Acondicionado & Climatización">Aire Acondicionado & Climatización</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="codigo_taller" title="Nombre o Código provisto por el taller para asociar la cuenta técnica">
                    Nombre o Código Único del Taller <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  {talleres.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <select
                        className="form-select"
                        value={form.codigo_taller}
                        onChange={(e) => setForm({ ...form, codigo_taller: e.target.value })}
                      >
                        {talleres.map(t => (
                          <option key={t.id} value={t.codigo_unico || t.nombre}>
                            {t.nombre} — Código: {t.codigo_unico || `TLR-${1000 + t.id}`}
                          </option>
                        ))}
                        <option value="__manual__">Otro / Ingresar Nombre o Código manualmente...</option>
                      </select>
                      {form.codigo_taller === '__manual__' && (
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: AutoTecnik Bogotá o TLR-1001"
                          onChange={(e) => setForm({ ...form, codigo_taller: e.target.value })}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      id="codigo_taller"
                      name="codigo_taller"
                      type="text"
                      className="form-input"
                      value={form.codigo_taller}
                      onChange={(e) => setForm({ ...form, codigo_taller: e.target.value })}
                      placeholder="Ej: AutoTecnik Bogotá o TLR-1001"
                      required
                    />
                  )}
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Selecciona o escribe el Nombre o Código Único del taller automotriz donde laboras
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contrasena_hash">
                  Contraseña de acceso <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="contrasena_hash"
                    name="contrasena_hash"
                    type={mostrarPassword ? "text" : "password"}
                    className={`form-input ${tocado.contrasena_hash && !validarPassword(form.contrasena_hash).esValido ? 'form-input--error' : ''}`}
                    placeholder="••••••••"
                    value={form.contrasena_hash}
                    onChange={handleChange}
                    onBlur={() => handleBlur('contrasena_hash')}
                    style={{ paddingRight: '40px' }}
                    required
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
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    <i className={`fa-solid ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
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
                    className={`form-input ${tocado.confirmar && form.contrasena_hash !== confirmar ? 'form-input--error' : ''}`}
                    placeholder="••••••••"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    onBlur={() => handleBlur('confirmar')}
                    style={{ paddingRight: '40px' }}
                    required
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
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title={mostrarConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    <i className={`fa-solid ${mostrarConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {tocado.confirmar && form.contrasena_hash !== confirmar && (
                  <span className="form-error-msg">Las contraseñas no coinciden.</span>
                )}
              </div>

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
                    Autorizo el <button type="button" onClick={() => setModalDatosAbierto(true)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}>tratamiento de datos personales y registro técnico</button> conforme a la Ley 1581 de 2012. <span className="campo-obligatorio-asterisco">*</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn--primario w-full mt-sm"
                disabled={cargando}
                style={{ justifyContent: 'center', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                {cargando ? (
                  <><span className="spinner"></span> Registrando mecánico...</>
                ) : (
                  <><i className="fa-solid fa-wrench"></i> Crear cuenta de Mecánico</>
                )}
              </button>
            </form>

            <p className="registro-link">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#0284c7', fontWeight: 600 }}>
                Inicia sesión aquí
              </Link>
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
