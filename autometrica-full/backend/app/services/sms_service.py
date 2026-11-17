# backend/app/services/sms_service.py
"""
Servicio de envío de mensajes de texto SMS a teléfonos celulares reales.
Soporta integración con Twilio / HTTP SMS Gateways y simulación en consola como fallback.
"""
import os
import sys
import re
import threading
from typing import Optional


def _safe_print(msg: str):
    """Imprime mensajes en consola de forma segura evitando fallos por encoding en Windows."""
    try:
        print(msg)
        sys.stdout.flush()
    except Exception:
        try:
            limpio = msg.encode("ascii", errors="replace").decode("ascii")
            print(limpio)
            sys.stdout.flush()
        except Exception:
            pass


def _formatear_telefono_colombia(telefono: str) -> str:
    """Limpia y da formato internacional E.164 a un número de celular colombiano."""
    solo_digitos = re.sub(r"\D", "", telefono or "")
    if not solo_digitos:
        return ""

    # Si empieza con 57 y tiene 12 dígitos, ej: 573138494523 -> +573138494523
    if solo_digitos.startswith("57") and len(solo_digitos) == 12:
        return f"+{solo_digitos}"

    # Si tiene 10 dígitos (estándar celular Colombia, ej: 3138494523) -> +573138494523
    if len(solo_digitos) == 10 and solo_digitos.startswith("3"):
        return f"+57{solo_digitos}"

    # Si ya tiene prefijo u otra longitud
    if not telefono.startswith("+"):
        return f"+{solo_digitos}"
    return telefono


def _enviar_sms_proceso(telefono_destinatario: str, mensaje: str) -> bool:
    """Envía el SMS vía Twilio o emite salida detallada en consola si no hay credenciales."""
    tel_formateado = _formatear_telefono_colombia(telefono_destinatario)
    if not tel_formateado:
        return False

    try:
        from app.database import settings
        account_sid = (settings.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID", "")).strip()
        auth_token = (settings.TWILIO_AUTH_TOKEN or os.getenv("TWILIO_AUTH_TOKEN", "")).strip()
        from_number = (settings.TWILIO_PHONE_NUMBER or os.getenv("TWILIO_PHONE_NUMBER", "")).strip()
    except Exception:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        from_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    configurado = bool(account_sid and auth_token and from_number)

    if configurado:
        try:
            from twilio.rest import Client
            cliente = Client(account_sid, auth_token)
            msg = cliente.messages.create(
                body=mensaje,
                from_=from_number,
                to=tel_formateado
            )
            _safe_print(f"\n [SMS REAL ENVIADO VIA TWILIO] Destinatario: {tel_formateado} | SID: {msg.sid}\n")
            return True
        except ImportError:
            _safe_print("\n [AVISO SMS] Librería 'twilio' no instalada. Para enviar SMS reales por Twilio: pip install twilio\n")
        except Exception as e:
            _safe_print(f"\n [ERROR AL ENVIAR SMS TWILIO] Destino: {tel_formateado} | Error: {e}\n")

    # Fallback simulado en consola de desarrollo
    _safe_print("\n" + "=" * 70)
    _safe_print(f" [SMS SIMULADO EN CONSOLA -> {tel_formateado}]")
    _safe_print("-" * 70)
    _safe_print(f" {mensaje}")
    _safe_print("=" * 70 + "\n")
    return True


def _despachar_sms_segundo_plano(telefono: str, mensaje: str):
    """Ejecuta el envío de SMS en un hilo en segundo plano."""
    hilo = threading.Thread(target=_enviar_sms_proceso, args=(telefono, mensaje), daemon=True)
    hilo.start()


def enviar_sms_bienvenida(telefono: str, nombre: str, rol: str):
    """Genera y despacha un mensaje de texto SMS confirmando la creación de la cuenta."""
    if not telefono:
        return

    rol_titulos = {
        "admin": "Administrador de Taller",
        "mecanico": "Mecanico",
        "cliente": "Cliente",
    }
    rol_txt = rol_titulos.get(rol, rol.capitalize())

    primer_nombre = (nombre or "").strip().split()[0] if nombre else "Usuario"

    from app.database import settings as _settings
    texto = (
        f"AutoMetrica: Hola {primer_nombre}, tu cuenta como {rol_txt} fue creada con exito. "
        f"Inicia sesion en: {_settings.frontend_url}/login"
    )

    _despachar_sms_segundo_plano(telefono, texto)
