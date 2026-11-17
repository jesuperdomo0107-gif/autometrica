// src/services/contactosWebService.js
import api from "./api";

// Enviar el formulario de contacto de la landing page
export const enviarContacto = (datos) => api.post("/contactos-web/", datos);
export const getContactos = () => api.get("/contactos-web/");
