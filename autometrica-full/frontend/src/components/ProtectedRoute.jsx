// src/components/ProtectedRoute.jsx
// Componente que protege rutas según autenticación y rol del usuario
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Guardián de rutas privadas
 * Props:
 *   - roles: array de roles permitidos, ej: ['admin','mecanico']
 *   - Si no se pasan roles, solo verifica que el usuario esté autenticado
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, usuario } = useAuth();

  // Si no hay sesión activa, redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no tiene uno permitido, redirige a su portal
  if (roles && !roles.includes(usuario?.rol)) {
    // Redirigir al portal correcto según el rol del usuario logueado
    if (usuario?.rol === 'cliente') return <Navigate to="/portal-cliente" replace />;
    return <Navigate to="/panel-mecanico" replace />;
  }

  return children;
}
