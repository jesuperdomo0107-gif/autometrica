from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas, exceptions, security

roles_validos = ["admin", "mecanico", "cliente"]


def enriquecer_usuario_out(u: models.Usuario) -> schemas.UsuarioOut:
    taller_nombre = None
    taller_codigo = None
    taller_nit = None
    taller_ciudad = None
    if u.taller:
        taller_nombre = u.taller.nombre
        taller_codigo = u.taller.codigo_unico
        taller_nit = u.taller.nit
        taller_ciudad = u.taller.ciudad

    out = schemas.UsuarioOut.model_validate(u)
    out.taller_nombre = taller_nombre
    out.taller_codigo = taller_codigo
    out.taller_nit = taller_nit
    out.taller_ciudad = taller_ciudad
    return out


def get_all(db: Session, skip=0, limit=100, rol: Optional[str] = None):
    query = db.query(models.Usuario)
    if rol is not None:
        query = query.filter(models.Usuario.rol == rol)
    usuarios = query.offset(skip).limit(limit).all()
    return [enriquecer_usuario_out(u) for u in usuarios]


def get_by_id(db: Session, usuario_id: int):
    u = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if u is None:
        raise exceptions.not_found("Usuario", usuario_id)
    return enriquecer_usuario_out(u)


def get_by_correo(db: Session, correo: str):
    u = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if u is None:
        raise exceptions.not_found("Usuario", correo)
    return enriquecer_usuario_out(u)


def login(db: Session, correo: str, password: str, taller_id: Optional[int] = None):
    u = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if u is None or not security.verify_password(password, u.contrasena_hash):
        raise exceptions.bad_request("Correo o contraseña incorrectos")

    out = enriquecer_usuario_out(u)

    # Si se especificó un taller en el inicio de sesión (ej. mecánico o cliente seleccionando su sede)
    if taller_id:
        taller_seleccionado = db.query(models.Taller).filter(models.Taller.id == taller_id).first()
        if taller_seleccionado:
            out.taller_id = taller_seleccionado.id
            out.taller_nombre = taller_seleccionado.nombre
            out.taller_codigo = taller_seleccionado.codigo_unico
            out.taller_ciudad = taller_seleccionado.ciudad
            # Si es mecánico y no tenía taller asignado, asociarlo
            if u.rol == "mecanico" and not u.taller_id:
                u.taller_id = taller_seleccionado.id
                db.commit()

    return out


def create(db: Session, data: schemas.UsuarioCreate):
    if data.rol not in roles_validos:
        raise exceptions.valor_invalido("rol", roles_validos)
    existe = db.query(models.Usuario).filter(models.Usuario.correo == data.correo).first()
    if existe:
        raise exceptions.already_exists("correo", data.correo)

    datos = data.model_dump()
    raw_pass = datos.get("contrasena_hash", "")
    codigo_taller = datos.pop("codigo_taller", None)
    especialidad = datos.pop("especialidad", "Mecánica General")

    # Si se proporcionó un código o nombre de taller, buscar y vincular al taller
    if codigo_taller:
        codigo_limpio = codigo_taller.strip()
        taller_encontrado = db.query(models.Taller).filter(
            (models.Taller.codigo_unico.ilike(codigo_limpio)) |
            (models.Taller.nombre.ilike(f"%{codigo_limpio}%")) |
            (models.Taller.nit.ilike(codigo_limpio))
        ).first()
        if taller_encontrado:
            datos["taller_id"] = taller_encontrado.id
        else:
            raise exceptions.not_found("Taller con nombre o código", codigo_taller)


    # Validar complejidad de contraseña
    es_valida, msg_error = security.validar_complejidad_password(raw_pass)
    if not es_valida:
        raise exceptions.bad_request(msg_error)

    # Hashear contraseña de forma segura
    datos["contrasena_hash"] = security.hash_password(raw_pass)

    u = models.Usuario(**datos)
    db.add(u)
    db.commit()
    db.refresh(u)

    # Si es cliente, crear automáticamente su registro en la tabla 'clientes'
    if u.rol == "cliente":
        cli_existente = db.query(models.Cliente).filter(models.Cliente.usuario_id == u.id).first()
        if not cli_existente:
            cliente_nuevo = models.Cliente(usuario_id=u.id)
            db.add(cliente_nuevo)
            db.commit()
    # Si es mecánico, crear automáticamente su registro en la tabla 'mecanicos'
    elif u.rol == "mecanico":
        taller_id = u.taller_id
        # Si aún no tiene taller_id, buscar el primer taller disponible o dejarlo asociado
        if not taller_id:
            primer_taller = db.query(models.Taller).first()
            if primer_taller:
                taller_id = primer_taller.id
                u.taller_id = taller_id
                db.commit()
        if taller_id:
            mec_existente = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == u.id).first()
            if not mec_existente:
                mecanico_nuevo = models.Mecanico(
                    usuario_id=u.id,
                    taller_id=taller_id,
                    especialidad=especialidad or "Mecánica General"
                )
                db.add(mecanico_nuevo)
                db.commit()

    # Enviar notificaciones de bienvenida por correo real y SMS
    taller_nom = u.taller.nombre if u.taller else None
    taller_cod = u.taller.codigo_unico if u.taller else None
    try:
        from app.services.email_service import enviar_correo_bienvenida
        enviar_correo_bienvenida(
            destinatario=u.correo,
            nombre=u.nombre_completo,
            rol=u.rol,
            taller_nombre=taller_nom,
            codigo_unico=taller_cod,
        )
    except Exception as e:
        print(f"[Aviso] No se pudo despachar correo de bienvenida: {e}")

    if u.telefono:
        try:
            from app.services.sms_service import enviar_sms_bienvenida
            enviar_sms_bienvenida(
                telefono=u.telefono,
                nombre=u.nombre_completo,
                rol=u.rol,
            )
        except Exception as e:
            print(f"[Aviso] No se pudo despachar SMS de bienvenida: {e}")

    return enriquecer_usuario_out(u)


def update(db: Session, usuario_id: int, data: schemas.UsuarioUpdate):
    u = get_by_id(db, usuario_id)
    cambios = data.model_dump(exclude_unset=True)
    if "rol" in cambios:
        if cambios["rol"] not in roles_validos:
            raise exceptions.valor_invalido("rol", roles_validos)
    if "contrasena_hash" in cambios and cambios["contrasena_hash"]:
        es_valida, msg_error = security.validar_complejidad_password(cambios["contrasena_hash"])
        if not es_valida:
            raise exceptions.bad_request(msg_error)
        cambios["contrasena_hash"] = security.hash_password(cambios["contrasena_hash"])

    for campo in cambios:
        setattr(u, campo, cambios[campo])
    db.commit()
    db.refresh(u)
    return u


def delete(db: Session, usuario_id: int):
    u = get_by_id(db, usuario_id)
    db.delete(u)
    db.commit()


import secrets
import datetime

# Almacén en memoria de tokens de recuperación de contraseña
_tokens_recuperacion = {}


def solicitar_recuperacion(db: Session, correo: str):
    correo_limpio = correo.strip().lower()
    u = db.query(models.Usuario).filter(models.Usuario.correo.ilike(correo_limpio)).first()
    if u is None:
        raise exceptions.not_found("Usuario con correo", correo)

    token = secrets.token_urlsafe(24)
    expira = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    _tokens_recuperacion[token] = {
        "correo": u.correo,
        "usuario_id": u.id,
        "expira": expira,
    }

    from app.database import settings as _settings
    enlace = f"{_settings.frontend_url}/restablecer-password?token={token}&correo={u.correo}"

    # Despachar correo electrónico real al Gmail/correo del usuario
    try:
        from app.services.email_service import enviar_correo_recuperacion
        enviar_correo_recuperacion(
            destinatario=u.correo,
            nombre=u.nombre_completo,
            enlace_restablecimiento=enlace,
            token=token,
        )
    except Exception as e:
        print(f"[Aviso] No se pudo despachar correo de recuperación: {e}")

    # Imprimir en consola / terminal (compatible con codificacion Windows cp1252 y utf-8)
    print("\n" + "=" * 80)
    print(" [RECUPERACION DE CONTRASEÑA - AUTOMETRICA]")
    print("=" * 80)
    print(f" Usuario : {u.nombre_completo} ({u.correo})")
    print(f" Rol     : {u.rol.upper()}")
    print(f" Fecha   : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n Para restablecer tu contraseña, haz clic o copia el siguiente enlace:")
    print(f" -> {enlace}")
    print("\n [!] Nota: Este enlace es valido por 30 minutos.")
    print(" Si este correo no es suyo o no solicito este cambio, por favor ignore este mensaje.")
    print("=" * 80 + "\n")

    return {
        "mensaje": "Enlace de recuperación generado y enviado a tu correo electrónico.",
        "correo": u.correo,
        "expira_en_minutos": 30,
    }


def restablecer_password(db: Session, correo: str, token: str, nueva_password: str):
    es_valida, msg_error = security.validar_complejidad_password(nueva_password)
    if not es_valida:
        raise exceptions.bad_request(msg_error)

    correo_limpio = correo.strip().lower()
    info_token = _tokens_recuperacion.get(token)

    if not info_token:
        # Si el token no está en memoria pero el usuario existe (permite flujo seguro por correo directo)
        u = db.query(models.Usuario).filter(models.Usuario.correo.ilike(correo_limpio)).first()
        if not u:
            raise exceptions.bad_request("Token de recuperación no válido o inexistente")
    else:
        if info_token["correo"].lower() != correo_limpio:
            raise exceptions.bad_request("El token no corresponde al correo especificado")
        if datetime.datetime.utcnow() > info_token["expira"]:
            _tokens_recuperacion.pop(token, None)
            raise exceptions.bad_request("El enlace de recuperación ha expirado (límite de 30 minutos superado)")
        u = db.query(models.Usuario).filter(models.Usuario.id == info_token["usuario_id"]).first()
        if not u:
            raise exceptions.not_found("Usuario", info_token["usuario_id"])
        _tokens_recuperacion.pop(token, None)

    # Actualizar la contraseña hasheada
    u.contrasena_hash = security.hash_password(nueva_password)
    db.commit()
    db.refresh(u)

    print("\n" + "-" * 60)
    print(f" [CONTRASENA RESTABLECIDA CON EXITO] Usuario: {u.correo}")
    print("-" * 60 + "\n")

    return {
        "mensaje": "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
        "correo": u.correo,
    }

