// src/pages/Index.jsx
// Landing page pública de AutoMétrica
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { enviarContacto } from '../services/contactosWebService';
import './Index.css';

// Características del sistema
const features = [
  {
    icon: 'fa-car',
    titulo: 'Gestión de Vehículos',
    desc: 'Registra y consulta el historial completo de cada vehículo: marca, modelo, kilometraje y reparaciones anteriores.',
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: 'fa-clipboard-list',
    titulo: 'Órdenes de Servicio',
    desc: 'Abre, sigue y cierra órdenes de reparación con estados claros: Recibido, En Diagnóstico, En Reparación y Finalizado.',
    img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: 'fa-users',
    titulo: 'Directorio de Clientes',
    desc: 'Mantén los datos de cada cliente organizados, con opción VIP y notas personalizadas para un servicio diferenciado.',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: 'fa-chart-bar',
    titulo: 'Reportes e Ingresos',
    desc: 'Visualiza estadísticas mensuales de ingresos, tiempo promedio de atención y calificación de satisfacción.',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  },
];

const pasos = [
  {
    num: '01',
    titulo: 'Recibe el Vehículo',
    desc: 'El mecánico registra la entrada del vehículo y abre una orden de servicio con los datos del cliente.',
    icono: 'fa-car-side',
  },
  {
    num: '02',
    titulo: 'Diagnostica y Repara',
    desc: 'El técnico registra el diagnóstico, inicia el cronómetro de mano de obra y documenta las intervenciones.',
    icono: 'fa-screwdriver-wrench',
  },
  {
    num: '03',
    titulo: 'El Cliente Aprueba',
    desc: 'El cliente recibe el presupuesto en su portal, lo aprueba con un clic y califica el servicio recibido.',
    icono: 'fa-user-check',
  },
];

export default function Index() {
  const [contacto, setContacto] = useState({
    nombre: '', telefono: '', correo: '', asunto: '', mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');
  const [errorContacto, setErrorContacto] = useState('');

  function handleChange(e) {
    setContacto({ ...contacto, [e.target.name]: e.target.value });
  }

  async function handleContacto(e) {
    e.preventDefault();
    setEnviando(true);
    setMensajeOk('');
    setErrorContacto('');
    try {
      await enviarContacto(contacto);
      setMensajeOk('¡Mensaje enviado! Nos pondremos en contacto pronto.');
      setContacto({ nombre: '', telefono: '', correo: '', asunto: '', mensaje: '' });
    } catch (err) {
      setErrorContacto(err.message || 'No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="hero">
        <nav className="hero__nav">
          <div className="hero__logo">
            <img
              src="/autometrica_icono.svg"
              alt="AutoMétrica"
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain' }}
            />
            AutoMétrica
          </div>
          <div className="hero__nav-links">
            <a href="#caracteristicas" className="hero__nav-link">Características</a>
            <a href="#como-funciona" className="hero__nav-link">Cómo funciona</a>
            <a href="#acceso" className="hero__nav-link">Acceder</a>
            <a
              href="https://wa.me/573138494523?text=Hola%20AutoM%C3%A9trica,%20deseo%20m%C3%A1s%20informaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__nav-whatsapp"
              title="Escríbenos a WhatsApp (+57 313 8494523)"
            >
              <i className="fa-brands fa-whatsapp"></i> Contáctanos
            </a>
          </div>
        </nav>

        <div className="hero__content">
          <div className="hero__tag">
            <i className="fa-solid fa-shield-check"></i>
            Sistema de Gestión para Talleres Mecánicos
          </div>

          <h1 className="hero__titulo">
            Gestión transparente <span>y eficiente</span> de tu taller
          </h1>

          <p className="hero__descripcion">
            AutoMétrica conecta mecánicos y clientes en una plataforma clara
            y fácil de usar. Controla órdenes, vehículos, repuestos e ingresos
            desde un solo lugar.
          </p>

          <div className="hero__ctas">
            <Link to="/login" className="btn btn--lg" style={{ backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 700 }}>
              <i className="fa-solid fa-right-to-bracket"></i>
              Ingresar al sistema
            </Link>
            <Link to="/registro-taller" className="btn btn--lg" style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700 }}>
              <i className="fa-solid fa-warehouse"></i>
              Registrar Taller
            </Link>
            <Link to="/registro" className="btn btn--lg" style={{ backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              <i className="fa-solid fa-user-plus" style={{ color: '#0284c7' }}></i>
              Registro Cliente
            </Link>
            <Link to="/registro-mecanico" className="btn btn--lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.6)', border: '1.5px solid rgba(56,189,248,0.6)', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              <i className="fa-solid fa-screwdriver-wrench"></i>
              Registro Mecánico
            </Link>
          </div>

          <div className="hero__mockup-container">
            <img
              src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1100&q=80"
              alt="Taller Mecánico Moderno y Diagnóstico Automotriz"
              className="hero__mockup-img"
            />
            <div className="hero__floating-badge hero__floating-badge--left">
              <i className="fa-solid fa-gauge-high"></i>
              <div>
                <strong>+98% Eficiencia</strong>
                <span>Órdenes al día</span>
              </div>
            </div>
            <div className="hero__floating-badge hero__floating-badge--right">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Garantía Total</strong>
                <span>Historial en línea</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Galería fotográfica del taller ─────────────────── */}
      <section className="galeria">
        <div className="galeria__encabezado">
          <h2 className="galeria__titulo">El corazón de un taller moderno</h2>
          <p className="galeria__sub">Cada reparación cuenta. AutoMétrica documenta cada proceso con precisión técnica y transparencia total.</p>
        </div>
        <div className="galeria__grid">
          <div className="galeria__item galeria__item--grande">
            <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85" alt="Diagnóstico de motor a fondo" />
            <div className="galeria__overlay">
              <i className="fa-solid fa-magnifying-glass-chart"></i>
              <span>Diagnóstico OBD2 Computarizado</span>
            </div>
          </div>
          <div className="galeria__item">
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=85" alt="Mecánico experto trabajando" />
            <div className="galeria__overlay">
              <i className="fa-solid fa-wrench"></i>
              <span>Mano de Obra Calificada</span>
            </div>
          </div>
          <div className="galeria__item">
            <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=85" alt="Repuestos y autopartes" />
            <div className="galeria__overlay">
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>Inventario de Repuestos</span>
            </div>
          </div>
          <div className="galeria__item">
            <img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=500&q=85" alt="Vehículo en revisión técnica" />
            <div className="galeria__overlay">
              <i className="fa-solid fa-car-on"></i>
              <span>Revisión Técnico Mecánica</span>
            </div>
          </div>
          <div className="galeria__item">
            <img src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=500&q=85" alt="Motor de automóvil" />
            <div className="galeria__overlay">
              <i className="fa-solid fa-gear"></i>
              <span>Motor y Transmisión</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Características ───────────────────────────────── */}
      <section className="features" id="caracteristicas">
        <h2 className="features__titulo">Todo lo que necesita tu taller</h2>
        <p className="features__sub">
          Un sistema completo, pensado para la realidad de los talleres colombianos.
        </p>
        <div className="features__grid">
          {features.map((f) => (
            <div className="feature-card" key={f.titulo}>
              <div className="feature-card__img-wrap">
                <img src={f.img} alt={f.titulo} className="feature-card__img" />
                <div className="feature-card__img-overlay">
                  <i className={`fa-solid ${f.icon}`}></i>
                </div>
              </div>
              <div className="feature-card__body">
                <h3 className="feature-card__titulo">{f.titulo}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cómo funciona (Sólo texto e iconos) ────────────── */}
      <section className="como-funciona" id="como-funciona">
        <h2 className="como-funciona__titulo">¿Cómo funciona AutoMétrica?</h2>
        <p className="como-funciona__sub">Tres pasos simples para gestionar tu taller de manera profesional.</p>
        <div className="pasos__grid">
          {pasos.map((p, i) => (
            <div className="paso-card paso-card--sin-foto" key={i}>
              <div className="paso-card__header">
                <div className="paso-card__num-badge">{p.num}</div>
                <div className="paso-card__icono">
                  <i className={`fa-solid ${p.icono}`}></i>
                </div>
              </div>
              <div className="paso-card__body">
                <h3 className="paso-card__titulo">{p.titulo}</h3>
                <p className="paso-card__desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Banner fotográfico intermedio ──────────────────── */}
      <section className="banner-medio">
        <div className="banner-medio__overlay"></div>
        <div className="banner-medio__content">
          <i className="fa-solid fa-circle-check banner-medio__icono"></i>
          <h2>Tu taller, digitalizado y bajo control</h2>
          <p>Desde el diagnóstico hasta la entrega final, AutoMétrica centraliza toda la operación de tu taller en una sola plataforma segura y accesible.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn--acento btn--lg">
              <i className="fa-solid fa-right-to-bracket"></i> Comenzar ahora
            </Link>
            <Link to="/registro" className="btn btn--outline btn--lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
              <i className="fa-solid fa-user-plus"></i> Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Acceso por rol ────────────────────────────────── */}
      <section className="acceso" id="acceso">
        <h2 className="acceso__titulo">¿Cómo quieres acceder?</h2>
        <p className="acceso__desc">
          AutoMétrica tiene portales diferentes según tu rol en el taller.
        </p>
        <div className="acceso__cards">
          <div className="acceso-card">
            <div className="acceso-card__img">
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80" alt="Mecánico Admin" />
              <div className="acceso-card__img-overlay">
                <i className="fa-solid fa-screwdriver-wrench"></i>
              </div>
            </div>
            <div className="acceso-card__body">
              <h3 className="acceso-card__titulo">Mecánico / Admin</h3>
              <p className="acceso-card__desc">
                Gestiona órdenes, vehículos, clientes y reportes del taller.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/login" className="btn btn--acento btn--sm" style={{ justifyContent: 'center' }}>
                  Ingresar como mecánico
                </Link>
                <Link to="/registro-mecanico" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', textAlign: 'center' }}>
                  <i className="fa-solid fa-user-plus"></i> Registrarse como mecánico
                </Link>
              </div>
            </div>
          </div>
          <div className="acceso-card">
            <div className="acceso-card__img">
              <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=80" alt="Portal Cliente" />
              <div className="acceso-card__img-overlay">
                <i className="fa-solid fa-user"></i>
              </div>
            </div>
            <div className="acceso-card__body">
              <h3 className="acceso-card__titulo">Cliente</h3>
              <p className="acceso-card__desc">
                Consulta el estado de tu vehículo y el historial de servicios.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/login" className="btn btn--ghost btn--sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center' }}>
                  Ingresar como cliente
                </Link>
                <Link to="/registro" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', textAlign: 'center' }}>
                  <i className="fa-solid fa-user-plus"></i> Registrarse como cliente
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contacto ──────────────────────────────────────── */}
      <section className="contacto" id="contacto">
        <div className="contacto__layout">
          {/* Imagen lateral de contacto */}
          <div className="contacto__img-side">
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=85"
              alt="Taller mecánico — Contáctanos"
              className="contacto__img"
            />
            <div className="contacto__img-overlay">
              <div className="contacto__img-info">
                <i className="fa-solid fa-headset" style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--color-acento)' }}></i>
                <h3>¿Necesitas ayuda?</h3>
                <p>Nuestro equipo responde en menos de 24 horas hábiles.</p>
                <div className="contacto__datos">
                  <div><i className="fa-brands fa-whatsapp" style={{ color: '#25d366', fontSize: '1.1rem' }}></i> +57 313 849 4523 (WhatsApp Directo)</div>
                  <div><i className="fa-solid fa-envelope"></i> soporte@autometrica.co</div>
                  <div><i className="fa-solid fa-location-dot"></i> Bogotá, Colombia</div>
                </div>

                <a
                  href="https://wa.me/573138494523?text=Hola%20AutoM%C3%A9trica,%20deseo%20contactarme%20con%20soporte%20o%20ventas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--whatsapp"
                  style={{ marginTop: '16px', justifyContent: 'center', width: '100%' }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                  Escribir a WhatsApp (+57 313 849 4523)
                </a>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="contacto__form-side">
            <h2 className="contacto__titulo">¿Tienes preguntas?</h2>
            <p className="contacto__sub">
              Déjanos tu mensaje y nos ponemos en contacto contigo.
            </p>

            {mensajeOk && (
              <div className="alerta alerta--exito">
                <i className="fa-solid fa-circle-check"></i> {mensajeOk}
              </div>
            )}
            {errorContacto && (
              <div className="alerta alerta--error">
                <i className="fa-solid fa-triangle-exclamation"></i> {errorContacto}
              </div>
            )}

            <div className="form-aviso-obligatorio" style={{ marginBottom: '12px' }}>
              <span className="campo-obligatorio-asterisco">*</span> Los campos marcados con asterisco son obligatorios.
            </div>

            <form onSubmit={handleContacto}>
              <div className="form-group">
                <label htmlFor="nombre">
                  Nombre completo <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <input id="nombre" name="nombre" className="form-input" required
                  value={contacto.nombre} onChange={handleChange}
                  placeholder="Ej: Carlos Rodríguez" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="correo">
                    Correo electrónico <span className="campo-obligatorio-asterisco">*</span>
                  </label>
                  <input id="correo" name="correo" type="email" className="form-input" required
                    value={contacto.correo} onChange={handleChange}
                    placeholder="correo@ejemplo.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono (opcional)</label>
                  <input id="telefono" name="telefono" className="form-input"
                    value={contacto.telefono} onChange={handleChange}
                    placeholder="300 000 0000" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="asunto">
                  Asunto <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <select id="asunto" name="asunto" className="form-select" required value={contacto.asunto} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="cotizacion">Solicitar cotización</option>
                  <option value="soporte">Soporte técnico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="mensaje">
                  Mensaje <span className="campo-obligatorio-asterisco">*</span>
                </label>
                <textarea id="mensaje" name="mensaje" className="form-textarea" required
                  value={contacto.mensaje} onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..." />
              </div>
              <button type="submit" className="btn btn--primario w-full" disabled={enviando}>
                {enviando ? (
                  <><span className="spinner"></span> Enviando...</>
                ) : (
                  <><i className="fa-solid fa-paper-plane"></i> Enviar mensaje</>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <img
              src="/autometrica_icono.svg"
              alt="AutoMétrica"
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }}
            />
            <span>AutoMétrica</span>
          </div>
          <p>© {new Date().getFullYear()} AutoMétrica — Proyecto Formativo SENA · Todos los derechos reservados</p>
          <div className="footer__links">
            <a href="#caracteristicas">Características</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a
              href="https://wa.me/573138494523?text=Hola%20AutoM%C3%A9trica,%20deseo%20m%C3%A1s%20informaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#25d366', fontWeight: 600 }}
            >
              <i className="fa-brands fa-whatsapp"></i> WhatsApp (+57 313 849 4523)
            </a>
          </div>
        </div>
      </footer>

      {/* Botón Flotante Permanente de WhatsApp */}
      <a
        href="https://wa.me/573138494523?text=Hola%20AutoM%C3%A9trica,%20deseo%20m%C3%A1s%20informaci%C3%B3n"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-btn"
        title="Escríbenos directamente a WhatsApp (+57 313 8494523)"
      >
        <i className="fa-brands fa-whatsapp"></i>
        <span>Contáctanos (+57 313 8494523)</span>
      </a>
    </>
  );
}
