// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUsuario } from '../services/authService';

export const AuthContext = createContext();

// Hook personalizado para usar el contexto más fácil en cualquier componente
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Cargar el usuario desde localStorage (persiste al recargar la página)
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('autometrica_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const [cargando, setCargando] = useState(false);
  const [errorAuth, setErrorAuth] = useState(null);

  // Función de inicio de sesión: llama al backend y guarda en estado + localStorage
  async function login(correo, password, taller_id = null, rol = null) {
    setCargando(true);
    setErrorAuth(null);
    try {
      const res = await loginUsuario(correo, password, taller_id, rol);
      const user = res.data;
      setUsuario(user);
      localStorage.setItem('autometrica_usuario', JSON.stringify(user));
      return user;
    } catch (err) {
      setErrorAuth(err.message || 'Credenciales incorrectas');
      throw err;
    } finally {
      setCargando(false);
    }
  }

  // Función de cierre de sesión
  function logout() {
    setUsuario(null);
    localStorage.removeItem('autometrica_usuario');
  }

  // Helpers de rol para simplificar verificaciones en los componentes
  const isAdmin = usuario?.rol === 'admin';
  const isMecanico = usuario?.rol === 'mecanico' || usuario?.rol === 'admin';
  const isCliente = usuario?.rol === 'cliente';
  const isAuthenticated = usuario !== null;

  const valor = {
    usuario,
    login,
    logout,
    isAdmin,
    isMecanico,
    isCliente,
    isAuthenticated,
    cargando,
    errorAuth,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}