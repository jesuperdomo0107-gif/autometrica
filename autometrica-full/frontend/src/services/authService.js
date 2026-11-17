// src/services/authService.js
// Servicio de autenticación: login y registro de nuevos usuarios
import api from "./api";

// Iniciar sesión: envía correo + password (y taller_id/rol opcional) al backend y devuelve el usuario
export function loginUsuario(correo, password, taller_id = null, rol = null) {
  return api.post("/usuarios/login", { correo, password, taller_id, rol });
}

// Registrar un nuevo usuario (rol: 'cliente' por defecto desde el formulario)
export function registrarUsuario(datos) {
  return api.post("/usuarios/", datos);
}

// Solicitar enlace de recuperación de contraseña
export function solicitarRecuperacionPassword(correo) {
  return api.post("/usuarios/solicitar-recuperacion", { correo });
}

// Restablecer contraseña con el token generado
export function restablecerPassword(datos) {
  return api.post("/usuarios/restablecer-password", datos);
}
