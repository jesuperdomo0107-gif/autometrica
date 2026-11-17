// src/components/ModalPoliticaDatos.jsx
// Modal de Política de Tratamiento de Datos Personales (Ley 1581 de 2012 / Habeas Data)
import React from 'react';
import Modal from './Modal';

export default function ModalPoliticaDatos({ onClose, onAceptar }) {
  return (
    <Modal titulo="Política de Tratamiento de Datos Personales — AutoMétrica" onClose={onClose}>
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#1e40af' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.4rem' }}></i>
          <div>
            <strong>Cumplimiento Normativo (Ley 1581 de 2012):</strong>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Tus datos personales y de tus vehículos están protegidos y tratados bajo estrictos estándares de confidencialidad.</p>
          </div>
        </div>

        <h4 style={{ color: 'var(--color-primario)', margin: '14px 0 6px' }}>1. Responsable del Tratamiento</h4>
        <p>
          <strong>AutoMétrica (SIGTM)</strong>, identificada como plataforma de gestión y trazabilidad para talleres automotrices, actúa como responsable del tratamiento de los datos personales suministrados por sus usuarios, clientes y personal técnico.
        </p>

        <h4 style={{ color: 'var(--color-primario)', margin: '14px 0 6px' }}>2. Finalidad de la Recolección de Datos</h4>
        <p>La información recolectada (nombre completo, correo electrónico, teléfono, número de documento y datos de identificación vehicular como placa, marca, modelo y kilometraje) se destina exclusivamente a:</p>
        <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>
          <li>Apertura, seguimiento y cierre de órdenes de servicio y reparación mecánica.</li>
          <li>Programación y confirmación de citas de mantenimiento preventivo.</li>
          <li>Emisión y envío de presupuestos, cotizaciones, garantías y facturas electrónicas.</li>
          <li>Notificación de avance en el estado del vehículo en taller.</li>
          <li>Recuperación segura de acceso a la cuenta mediante credenciales cifradas.</li>
        </ul>

        <h4 style={{ color: 'var(--color-primario)', margin: '14px 0 6px' }}>3. Derechos del Titular (Habeas Data)</h4>
        <p>Como titular de los datos, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tu información personal en cualquier momento a través de los canales de soporte del sistema.</p>

        <h4 style={{ color: 'var(--color-primario)', margin: '14px 0 6px' }}>4. Seguridad y Confidencialidad</h4>
        <p>
          AutoMétrica implementa algoritmos de hashing criptográfico seguro (Bcrypt) para la protección de contraseñas y canales de transmisión autenticados para evitar accesos no autorizados.
        </p>
      </div>

      <div className="modal__footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn--outline" onClick={onClose}>
          Cerrar
        </button>
        {onAceptar && (
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => {
              onAceptar();
              onClose();
            }}
          >
            <i className="fa-solid fa-check"></i> He leído y Acepto los Términos
          </button>
        )}
      </div>
    </Modal>
  );
}
