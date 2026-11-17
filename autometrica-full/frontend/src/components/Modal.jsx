// src/components/Modal.jsx
// Modal reutilizable para formularios de creación y edición
import React, { useEffect } from 'react';
import './Modal.css';

/**
 * Modal — Diálogo modal genérico
 * Props:
 *   - abierto: boolean (por defecto true)
 *   - onClose / onCerrar: función que se llama al cerrar
 *   - titulo: texto en la cabecera del modal
 *   - children: formulario o contenido del modal
 *   - footer: opcional, JSX con botones para el pie del modal
 */
export default function Modal({ abierto = true, onCerrar, onClose, titulo, children, footer }) {
  const cerrar = onClose || onCerrar || (() => {});

  // Cerrar con la tecla Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') cerrar();
    }
    if (abierto) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [abierto, cerrar]);

  if (abierto === false) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // Cerrar al hacer clic fuera del modal
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__titulo">{titulo}</h2>
          <button
            type="button"
            className="modal__cerrar"
            onClick={cerrar}
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
