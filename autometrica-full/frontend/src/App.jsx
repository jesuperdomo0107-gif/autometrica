// src/App.jsx
// Configuración completa de rutas de la aplicación AutoMétrica con React Router DOM
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./global.css";

// Páginas públicas
import Index from "./pages/Index";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RegistroMecanico from "./pages/RegistroMecanico";
import RegistroTaller from "./pages/RegistroTaller";
import RecuperarPassword from "./pages/RecuperarPassword";
import RestablecerPassword from "./pages/RestablecerPassword";

// Portal del cliente
import PortalCliente from "./pages/PortalCliente";
import CitasCliente from "./pages/CitasCliente";
import PresupuestosCliente from "./pages/PresupuestosCliente";
import ServiciosCliente from "./pages/ServiciosCliente";

// Panel del taller — mecánico y admin
import PanelMecanico from "./pages/PanelMecanico";
import AgendaCitas from "./pages/AgendaCitas";
import GestionVehiculos from "./pages/GestionVehiculos";
import Clientes from "./pages/Clientes";
import Reparaciones from "./pages/Reparaciones";
import Inventario from "./pages/Inventario";
import Facturacion from "./pages/Facturacion";
import Proveedores from "./pages/Proveedores";
import GestionUsuarios from "./pages/GestionUsuarios";
import Historial from "./pages/Historial";
import Reportes from "./pages/Reportes";
import AuditLog from "./pages/AuditLog";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rutas públicas ─────────────────────────────── */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro-mecanico" element={<RegistroMecanico />} />
          <Route path="/registro-taller" element={<RegistroTaller />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />

          {/* ── Portal del cliente (cliente y admin) ──────── */}
          <Route
            path="/portal-cliente"
            element={
              <ProtectedRoute roles={["cliente", "admin"]}>
                <PortalCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citas-cliente"
            element={
              <ProtectedRoute roles={["cliente", "admin"]}>
                <CitasCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presupuestos-cliente"
            element={
              <ProtectedRoute roles={["cliente", "admin"]}>
                <PresupuestosCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicios-cliente"
            element={
              <ProtectedRoute roles={["cliente", "admin"]}>
                <ServiciosCliente />
              </ProtectedRoute>
            }
          />

          {/* ── Panel del taller (mecánico y admin) ────────── */}
          <Route
            path="/panel-mecanico"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <PanelMecanico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda-citas"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <AgendaCitas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-vehiculos"
            element={
              <ProtectedRoute roles={["mecanico", "admin", "cliente"]}>
                <GestionVehiculos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reparaciones"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Reparaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Facturacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Proveedores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-usuarios"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <GestionUsuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute roles={["mecanico", "admin", "cliente"]}>
                <Historial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <Reportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute roles={["mecanico", "admin"]}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}