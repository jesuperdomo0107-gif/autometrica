# backend/app/services/email_service.py
"""
Servicio de envío de correos electrónicos transaccionales para AutoMétrica.
Soporta Gmail SMTP (puerto 587 STARTTLS o 465 SSL) y otros proveedores SMTP.
"""
import os
import sys
import smtplib
import ssl
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
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


def _obtener_config_resend():
    try:
        from app.database import settings
        api_key = (getattr(settings, "RESEND_API_KEY", "") or os.getenv("RESEND_API_KEY", "")).strip()
        from_email = (getattr(settings, "RESEND_FROM", "") or os.getenv("RESEND_FROM", "AutoMétrica <onboarding@resend.dev>")).strip()
    except Exception:
        api_key = os.getenv("RESEND_API_KEY", "").strip()
        from_email = os.getenv("RESEND_FROM", "AutoMétrica <onboarding@resend.dev>").strip()

    return {
        "api_key": api_key,
        "from_email": from_email,
        "configurado": bool(api_key),
    }


def _obtener_config_smtp():
    try:
        from app.database import settings
        host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(settings.SMTP_PORT or os.getenv("SMTP_PORT", "587"))
        user = (settings.SMTP_USER or os.getenv("SMTP_USER", "")).strip()
        password = (settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")).strip()
        from_name = settings.SMTP_FROM_NAME or os.getenv("SMTP_FROM_NAME", "AutoMétrica")
        from_email = (settings.SMTP_FROM_EMAIL or os.getenv("SMTP_FROM_EMAIL", user or "soporte@autometrica.co")).strip()
    except Exception:
        host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER", "").strip()
        password = os.getenv("SMTP_PASSWORD", "").strip()
        from_name = os.getenv("SMTP_FROM_NAME", "AutoMétrica")
        from_email = os.getenv("SMTP_FROM_EMAIL", user or "soporte@autometrica.co").strip()

    is_placeholder = "tu_correo" in user.lower() or "tu_contrasena" in password.lower() or "ejemplo" in user.lower()

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_name": from_name,
        "from_email": from_email,
        "configurado": bool(user and password and not is_placeholder),
    }


def _enviar_email_resend(destinatario: str, asunto: str, cuerpo_html: str, cuerpo_texto: str) -> bool:
    """Envía un correo real usando la API oficial de Resend."""
    config = _obtener_config_resend()
    if not config["configurado"]:
        return False

    try:
        import resend
        resend.api_key = config["api_key"]
        params = {
            "from": config["from_email"],
            "to": [destinatario] if isinstance(destinatario, str) else destinatario,
            "subject": asunto,
            "html": cuerpo_html,
            "text": cuerpo_texto,
        }
        respuesta = resend.Emails.send(params)
        email_id = getattr(respuesta, "id", None) or (respuesta.get("id") if isinstance(respuesta, dict) else "")
        _safe_print(f"\n [RESEND] Correo real enviado exitosamente a: {destinatario} | ID: {email_id} | Asunto: '{asunto}'\n")
        return True
    except Exception as e:
        _safe_print(f"\n [ERROR RESEND] Falló el envío a {destinatario}: {e}. Intentando fallback SMTP...\n")
        return False


def _enviar_email_smtp(destinatario: str, asunto: str, cuerpo_html: str, cuerpo_texto: str) -> bool:
    """Envía un correo mediante SMTP de forma síncrona con manejo de excepciones."""
    config = _obtener_config_smtp()

    if not config["configurado"]:
        return False

    try:
        mensaje = MIMEMultipart("alternative")
        mensaje["Subject"] = Header(asunto, "utf-8")
        mensaje["From"] = f"{Header(config['from_name'], 'utf-8').encode()} <{config['from_email']}>"
        mensaje["To"] = destinatario

        # Parte texto plano
        mensaje.attach(MIMEText(cuerpo_texto, "plain", "utf-8"))
        # Parte HTML con diseño
        mensaje.attach(MIMEText(cuerpo_html, "html", "utf-8"))

        if config["port"] == 465:
            # Conexión SSL directa
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(config["host"], config["port"], context=context, timeout=15) as servidor:
                servidor.login(config["user"], config["password"])
                servidor.sendmail(config["from_email"], [destinatario], mensaje.as_string())
        else:
            # Conexión STARTTLS (puerto 587 por defecto para Gmail)
            with smtplib.SMTP(config["host"], config["port"], timeout=15) as servidor:
                servidor.ehlo()
                servidor.starttls(context=ssl.create_default_context())
                servidor.ehlo()
                servidor.login(config["user"], config["password"])
                servidor.sendmail(config["from_email"], [destinatario], mensaje.as_string())

        _safe_print(f"\n [SMTP] Correo enviado exitosamente a: {destinatario} | Asunto: '{asunto}'\n")
        return True

    except Exception as e:
        _safe_print(f"\n [ERROR SMTP] Falló el envío a {destinatario}: {e}\n")
        return False


def _procesar_envio_email(destinatario: str, asunto: str, cuerpo_html: str, cuerpo_texto: str):
    """Prueba primero Resend API, luego SMTP, y si ninguno está configurado avisa en consola."""
    resend_config = _obtener_config_resend()
    smtp_config = _obtener_config_smtp()

    if smtp_config["configurado"]:
        if _enviar_email_smtp(destinatario, asunto, cuerpo_html, cuerpo_texto):
            return True

    if resend_config["configurado"]:
        if _enviar_email_resend(destinatario, asunto, cuerpo_html, cuerpo_texto):
            return True

    _safe_print("\n" + "=" * 75)
    _safe_print(" [AVISO EMAIL] No se han configurado credenciales reales de correo.")
    _safe_print(f" Destinatario : {destinatario}")
    _safe_print(f" Asunto       : {asunto}")
    _safe_print(" Para enviar correos reales, agrega RESEND_API_KEY=re_... en backend/.env")
    _safe_print("=" * 75 + "\n")
    return False


def _despachar_en_segundo_plano(fn, *args, **kwargs):
    """Ejecuta la función de envío en un hilo separado para no retrasar la respuesta HTTP."""
    hilo = threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True)
    hilo.start()


# ==============================================================================
# 1. PLANTILLA Y ENVÍO: RECUPERACIÓN DE CONTRASEÑA
# ==============================================================================

def enviar_correo_recuperacion(destinatario: str, nombre: str, enlace_restablecimiento: str, token: str):
    """Genera y envía el correo de restablecimiento de contraseña en segundo plano."""
    asunto = "[AutoMétrica] Restablece tu contraseña"

    cuerpo_texto = f"""
Hola {nombre or 'Usuario'},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AutoMétrica.

Para crear una nueva contraseña, haz clic o copia el siguiente enlace en tu navegador:
{enlace_restablecimiento}

Token de seguridad: {token}

IMPORTANTE: Este enlace es válido durante los próximos 30 minutos.
Si tú no realizaste esta solicitud, puedes ignorar este mensaje y tu contraseña permanecerá segura.

Atentamente,
El equipo de AutoMétrica
Plataforma de Gestión Automotriz
"""

    cuerpo_html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - AutoMétrica</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 24px 12px;
      color: #1e293b;
    }}
    .container {{
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }}
    .header-logo {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }}
    .header-logo span {{
      color: #38bdf8;
    }}
    .header-subtitle {{
      font-size: 13px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .content {{
      padding: 32px 28px;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }}
    .text {{
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }}
    .btn-container {{
      text-align: center;
      margin: 30px 0;
    }}
    .btn {{
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }}
    .alert-box {{
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 14px 16px;
      font-size: 13px;
      color: #64748b;
      margin: 24px 0;
    }}
    .footer {{
      background: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">Auto<span>Métrica</span></div>
      <div class="header-subtitle">Gestión Inteligente de Talleres Automotrices</div>
    </div>
    <div class="content">
      <h2 class="greeting">¡Hola {nombre or 'Usuario'}!</h2>
      <p class="text">
        Recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta en <strong>AutoMétrica</strong>.
      </p>
      <div class="btn-container">
        <a href="{enlace_restablecimiento}" class="btn" target="_blank">
          Restablecer mi contraseña
        </a>
      </div>
      <div class="alert-box">
        <strong>Vigencia:</strong> Este enlace expirará automáticamente en <strong>30 minutos</strong>.<br>
        <strong>Seguridad:</strong> Si tú no solicitaste este cambio, puedes ignorar este correo; tu cuenta seguirá protegida.
      </div>
      <p class="text" style="font-size: 13px; color: #94a3b8; word-break: break-all;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="{enlace_restablecimiento}" style="color: #2563eb;">{enlace_restablecimiento}</a>
      </p>
    </div>
    <div class="footer">
      AutoMétrica &bull; Sistema Integral de Gestión de Talleres Automotrices<br>
      © 2026 AutoMétrica. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
"""

    _despachar_en_segundo_plano(_procesar_envio_email, destinatario, asunto, cuerpo_html, cuerpo_texto)


# ==============================================================================
# 2. PLANTILLA Y ENVÍO: BIENVENIDA TRAS REGISTRO
# ==============================================================================

def enviar_correo_bienvenida(
    destinatario: str,
    nombre: str,
    rol: str,
    taller_nombre: Optional[str] = None,
    codigo_unico: Optional[str] = None,
):
    """Envía un correo de bienvenida confirmando la creación de la cuenta en AutoMétrica."""
    rol_titulos = {
        "admin": "Administrador de Taller",
        "mecanico": "Técnico Mecánico",
        "cliente": "Cliente / Propietario de Vehículo",
    }
    rol_formateado = rol_titulos.get(rol, rol.capitalize())
    asunto = f"[AutoMétrica] ¡Bienvenido {nombre}! Tu cuenta está lista"

    from app.database import settings as _settings
    enlace_login = f"{_settings.frontend_url}/login"

    info_taller = ""
    if taller_nombre:
        info_taller = f"\n- Taller Asociado: {taller_nombre}"
    if codigo_unico:
        info_taller += f"\n- Código Único del Taller: {codigo_unico}"

    cuerpo_texto = f"""
¡Hola {nombre}!

Te damos la bienvenida a AutoMétrica, la plataforma para la gestión transparente e inteligente de servicios automotrices.

Tu cuenta ha sido creada exitosamente con los siguientes datos:
- Nombre: {nombre}
- Correo: {destinatario}
- Rol: {rol_formateado}{info_taller}

Puedes iniciar sesión en cualquier momento ingresando a:
{enlace_login}

¡Gracias por unirte a AutoMétrica!

Atentamente,
El equipo de AutoMétrica
"""

    bloque_taller_html = ""
    if taller_nombre or codigo_unico:
        bloque_taller_html = f"""
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 6px; color: #1e40af; font-size: 14px;">Información de tu Taller</h4>
          {f'<p style="margin: 2px 0; font-size: 13px; color: #1e3a8a;"><strong>Nombre:</strong> {taller_nombre}</p>' if taller_nombre else ''}
          {f'<p style="margin: 2px 0; font-size: 13px; color: #1e3a8a;"><strong>Código Único:</strong> <span style="font-family: monospace; font-weight: 800; background: #dbeafe; padding: 2px 6px; border-radius: 4px;">{codigo_unico}</span></p>' if codigo_unico else ''}
        </div>
        """

    cuerpo_html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a AutoMétrica</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 24px 12px;
      color: #1e293b;
    }}
    .container {{
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
    }}
    .header-logo {{
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }}
    .header-logo span {{
      color: #38bdf8;
    }}
    .header-subtitle {{
      font-size: 13px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .content {{
      padding: 32px 28px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }}
    .text {{
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 20px;
    }}
    .badge {{
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
    }}
    .card-info {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }}
    .btn-container {{
      text-align: center;
      margin: 30px 0;
    }}
    .btn {{
      display: inline-block;
      background: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    }}
    .footer {{
      background: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">Auto<span>Métrica</span></div>
      <div class="header-subtitle">Plataforma de Gestión Automotriz</div>
    </div>
    <div class="content">
      <div style="margin-bottom: 12px;">
        <span class="badge">Cuenta Activada &bull; {rol_formateado}</span>
      </div>
      <h2 class="greeting">¡Bienvenido a AutoMétrica, {nombre}!</h2>
      <p class="text">
        Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todas las herramientas de gestión de citas, órdenes de servicio, seguimiento en tiempo real y garaje digital.
      </p>

      <div class="card-info">
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Usuario:</strong> {destinatario}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Rol asignado:</strong> {rol_formateado}</p>
      </div>

      {bloque_taller_html}

      <div class="btn-container">
        <a href="{enlace_login}" class="btn" target="_blank">
          Iniciar Sesión en AutoMétrica
        </a>
      </div>
    </div>
    <div class="footer">
      AutoMétrica &bull; Sistema Integral de Gestión de Talleres Automotrices<br>
      © 2026 AutoMétrica. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
"""

    _despachar_en_segundo_plano(_procesar_envio_email, destinatario, asunto, cuerpo_html, cuerpo_texto)
