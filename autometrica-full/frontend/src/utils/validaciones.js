// src/utils/validaciones.js
// Utilidades de validación de seguridad de contraseñas y campos obligatorios

/**
 * Valida la complejidad de una contraseña:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula [A-Z]
 * - Al menos 1 letra minúscula [a-z]
 * - Al menos 1 carácter especial
 */
export function validarPassword(password = '') {
  const pass = String(password);
  const tieneMinimo8 = pass.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(pass);
  const tieneMinuscula = /[a-z]/.test(pass);
  const tieneEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(pass);

  const esValido = tieneMinimo8 && tieneMayuscula && tieneMinuscula && tieneEspecial;

  return {
    esValido,
    tieneMinimo8,
    tieneMayuscula,
    tieneMinuscula,
    tieneEspecial,
  };
}

/**
 * Valida si un valor requerido está presente y no es solo espacios
 */
export function esCampoValido(valor) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim().length > 0;
  if (typeof valor === 'number') return !isNaN(valor);
  if (typeof valor === 'boolean') return true;
  return true;
}
