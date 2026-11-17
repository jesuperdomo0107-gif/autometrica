// src/components/PasswordRequirements.jsx
// Checklist reactivo que muestra el cumplimiento de requisitos de contraseña en tiempo real
import React from 'react';
import { validarPassword } from '../utils/validaciones';

export default function PasswordRequirements({ password = '', showOnlyOnFocus = false, isFocused = true }) {
  if (showOnlyOnFocus && !isFocused && !password) {
    return null;
  }

  const { tieneMinimo8, tieneMayuscula, tieneMinuscula, tieneEspecial } = validarPassword(password);

  const requisitos = [
    { label: 'Mínimo 8 caracteres', cumplido: tieneMinimo8 },
    { label: 'Al menos una letra mayúscula (A-Z)', cumplido: tieneMayuscula },
    { label: 'Al menos una letra minúscula (a-z)', cumplido: tieneMinuscula },
    { label: 'Al menos un carácter especial (!@#$%&*...)', cumplido: tieneEspecial },
  ];

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 14px',
      marginTop: '8px',
      fontSize: '0.8rem',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
        Requisitos de seguridad de la contraseña:
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
        {requisitos.map((req, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: req.cumplido ? '#15803d' : '#94a3b8',
              transition: 'color 0.2s ease',
            }}
          >
            <i
              className={`fa-solid ${req.cumplido ? 'fa-circle-check' : 'fa-circle-dot'}`}
              style={{
                color: req.cumplido ? '#16a34a' : '#cbd5e1',
                fontSize: '0.85rem'
              }}
            ></i>
            <span style={{ textDecoration: req.cumplido ? 'none' : 'none', fontWeight: req.cumplido ? 500 : 400 }}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
