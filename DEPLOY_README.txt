=====================================================================
 AUTOMÉTRICA - GUÍA DE DESPLIEGUE EN RENDER (PLAN GRATUITO)
=====================================================================
Proyecto : AutoMétrica (SENA ADSO)
Stack    : Backend FastAPI (Python) + Frontend React/Vite + PostgreSQL
Probado  : build.sh y arranque verificados contra PostgreSQL 16 con
           Python 3.12 (build repetido 2 veces = idempotente).

---------------------------------------------------------------------
 0. LEER PRIMERO - ACLARACIONES IMPORTANTES
---------------------------------------------------------------------
a) El proyecto NO es Django. Es FastAPI + React. Por eso:
   - No existe "collectstatic": el backend es una API pura. El
     frontend se compila y se publica como "Static Site" aparte.
   - SECRET_KEY y ALLOWED_HOSTS (conceptos de Django) NO aplican.
     El equivalente de ALLOWED_HOSTS aquí es CORS: se controla con
     FRONTEND_URL / CORS_ORIGINS. El proyecto no usa JWT, así que no
     hay SECRET_KEY que configurar.
   - Se mantiene la variable DEBUG (controla si /docs está visible).

b) Arquitectura en Render (3 recursos, los 3 gratuitos):

     [ Static Site ]  --HTTPS-->  [ Web Service ]  -->  [ PostgreSQL ]
      React (dist/)                FastAPI/uvicorn        Render Postgres

c) SEGURIDAD - REVISAR ANTES DE PUBLICAR (ver sección 9):
   - Credenciales reales estaban en el README y en backend/.env.
   - La API no tiene autenticación (cualquiera puede leer/borrar).

d) Supuesto sobre el repositorio: la raíz del repo contiene la carpeta
   "autometrica-full/" (la carpeta "Proyecto_formativo_SENA_..-main" es
   solo el nombre del ZIP de GitHub). Si tu repo tiene una carpeta
   adicional por encima, antepónla a los "Root Directory" de abajo.

---------------------------------------------------------------------
 1. REQUISITOS PREVIOS
---------------------------------------------------------------------
 [ ] Cuenta en https://render.com (puedes entrar con GitHub).
 [ ] Cuenta en GitHub y el proyecto subido a un repositorio.
 [ ] Git instalado en tu equipo.
 [ ] (Recomendado) Cuenta en https://resend.com para enviar correos
     (Render gratuito bloquea SMTP; ver sección 8).
 [ ] Una contraseña segura para el administrador (mín. 8 caracteres,
     con mayúscula, minúscula y carácter especial. Ej: Taller#2026x).

---------------------------------------------------------------------
 2. ARCHIVOS NUEVOS / MODIFICADOS EN ESTE ENTREGABLE
---------------------------------------------------------------------
 NUEVOS
   .gitignore                                  (raíz del repo)
   render.yaml                                 (raíz del repo, Blueprint)
   DEPLOY_README.txt                           (raíz del repo)
   autometrica-full/backend/build.sh
   autometrica-full/backend/.env.example
   autometrica-full/backend/app/db_init.py     (migraciones idempotentes)
   autometrica-full/backend/app/create_admin.py(superusuario por env)
   autometrica-full/frontend/.env.example

 MODIFICADOS
   backend/app/database.py   Config por entorno; PostgreSQL obligatorio
                             en producción (sin fallback a SQLite);
                             driver psycopg2 explícito; pool de
                             conexiones apto para BD gratuita.
   backend/app/main.py       CORS restringido en producción; /docs
                             oculto salvo DEBUG=true; el endpoint
                             /sistema/limpiar-base-datos YA NO existe
                             en producción (borraba toda la BD sin
                             autenticación) y se corrigió su import.
   backend/app/controllers/usuarios_ctrl.py,
   backend/app/services/email_service.py,
   backend/app/services/sms_service.py
                             Enlaces "http://localhost:5173" ahora usan
                             FRONTEND_URL (si no, los correos de
                             recuperación de contraseña apuntarían a
                             localhost).
   backend/requirements.txt  Versiones fijadas (las probadas). Se quitó
                             "mailtrap" (no se usa en el código).
   frontend/src/services/api.js
                             Lee VITE_API_URL; timeout 10s -> 70s (el
                             servidor gratuito tarda ~1 min en despertar).
   README.md                 Se eliminó la contraseña de Gmail en claro.

---------------------------------------------------------------------
 3. VARIABLES DE ENTORNO
---------------------------------------------------------------------
 3.1 WEB SERVICE (backend)

 Variable             Obligatoria  Valor / ejemplo
 -------------------  -----------  ----------------------------------
 ENVIRONMENT          SI           production
 DEBUG                SI           false   (true solo para depurar)
 DATABASE_URL         SI           "Internal Database URL" de tu
                                   PostgreSQL de Render
 FRONTEND_URL         SI           https://autometrica-web.onrender.com
                                   (sin "/" final; URL real del Static
                                   Site). Se usa para CORS y enlaces.
 PYTHON_VERSION       SI           3.12.3
 ADMIN_EMAIL          SI*          admin@tudominio.com
 ADMIN_PASSWORD       SI*          contraseña segura (ver sección 1)
 ADMIN_NAME           no           Administrador
 ADMIN_PHONE          no           3001234567
 ADMIN_RESET_PASSWORD no           true (solo para cambiar la clave de
                                   un admin existente; luego quítala)
 CORS_ORIGINS         no           otros orígenes separados por coma
 RESEND_API_KEY       Recomendada  re_xxxxxxxx  (NUEVA, ver sección 9)
 RESEND_FROM          Recomendada  AutoMétrica <onboarding@resend.dev>
 TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER
                      no           solo si usarás SMS reales

 * Sin ADMIN_EMAIL/ADMIN_PASSWORD el build NO falla, simplemente no
   crea superusuario. Si la contraseña no cumple las reglas, el build
   falla con un mensaje claro.
 NO definas SMTP_* en Render (el puerto está bloqueado; ver sección 8).

 3.2 STATIC SITE (frontend)

 Variable        Obligatoria  Valor
 --------------  -----------  ---------------------------------------
 VITE_API_URL    SI           https://autometrica-api.onrender.com/api/v1
                              (URL del backend + /api/v1)
 NODE_VERSION    recomendada  22   (Node 22 es el probado)

 OJO: VITE_API_URL se incrusta al COMPILAR. Si la cambias, hay que
 redesplegar con "Clear build cache & deploy".

 3.3 DESARROLLO LOCAL
 Copia backend/.env.example -> backend/.env y
       frontend/.env.example -> frontend/.env
 IMPORTANTE: tu frontend/.env actual apunta a un devtunnel
 (VITE_API_URL=https://...devtunnels.ms/...). Antes eso se ignoraba;
 AHORA api.js lo usa. Déjalo VACÍO para trabajar local con el proxy
 de Vite (http://127.0.0.1:8000).

---------------------------------------------------------------------
 4. PREPARAR Y SUBIR EL REPOSITORIO A GITHUB
---------------------------------------------------------------------
 1. Copia los archivos de este entregable sobre tu proyecto, respetando
    las rutas.
 2. Roda las credenciales expuestas (sección 9, punto 1).
 3. Si ya habías subido archivos que ahora están en .gitignore
    (venv, node_modules, .env, __pycache__), quítalos del índice:

      git rm -r --cached autometrica-full/backend/venv
      git rm -r --cached autometrica-full/frontend/node_modules
      git rm -r --cached autometrica-full/frontend/dist
      git rm --cached autometrica-full/backend/.env
      git rm --cached autometrica-full/frontend/.env

    (ignora los errores de rutas que no estuvieran versionadas)
 4. Confirma y sube:

      git add .
      git status            <- verifica que NO aparezca ningún .env
      git commit -m "Preparar despliegue en Render"
      git push origin main

 Nota: las claves que ya estuvieron en commits anteriores siguen en el
 historial de Git; por eso hay que ROTARLAS (no basta con borrarlas).

---------------------------------------------------------------------
 4B. ATAJO: DESPLIEGUE AUTOMÁTICO CON render.yaml (BLUEPRINT)
---------------------------------------------------------------------
 El archivo render.yaml (en la raíz del repo) crea de una vez la base
 de datos, el backend y el frontend, en lugar de hacer las secciones
 5, 6 y 7 a mano.
   1. Sube el repo a GitHub (sección 4) con render.yaml en la raíz.
   2. Render > "New +" > "Blueprint" > elige el repositorio > Apply.
   3. Render te pedirá los valores marcados sync:false:
        ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY,
        FRONTEND_URL y VITE_API_URL.
      Como aún no existen las URLs, escribe provisionales:
        FRONTEND_URL = https://autometrica-web.onrender.com
        VITE_API_URL = https://autometrica-api.onrender.com/api/v1
   4. Cuando termine, mira las URLS REALES en el Dashboard (si el
      nombre estaba tomado, Render añade un sufijo). Corrige
      FRONTEND_URL (backend) y VITE_API_URL (frontend) y haz
      "Clear build cache & deploy" en el frontend.
   5. Sigue con la sección 11 (verificaciones).
 Si el Blueprint da error de región o plan, ajusta "region" en
 render.yaml (ohio, oregon, virginia, frankfurt, singapore) y que
 sea igual en los tres recursos.

---------------------------------------------------------------------
 5. CREAR LA BASE DE DATOS (PostgreSQL)
---------------------------------------------------------------------
 1. Dashboard de Render -> "New +" -> "PostgreSQL".
 2. Name: autometrica-db   |  Database/User: déjalos por defecto.
 3. Region: elige UNA (ej. Ohio) y úsala para TODOS los servicios.
    (La URL interna solo funciona dentro de la misma región.)
 4. Instance Type: Free  ->  "Create Database".
 5. Espera a que el estado sea "Available".
 6. En la pestaña "Connections" copia la "Internal Database URL"
    (empieza por postgresql:// o postgres://). Ambas funcionan: el
    código las normaliza.

 LIMITES DE LA BD GRATUITA: 1 GB, SIN backups y EXPIRA a los 30 días
 de creada (hay 14 días de gracia para pasar a un plan de pago; luego
 se borra con todos los datos). Ver sección 10.

 Las tablas las crea build.sh automáticamente; NO hace falta importar
 autometrica_db.sql.

---------------------------------------------------------------------
 6. CREAR EL WEB SERVICE (BACKEND)
---------------------------------------------------------------------
 1. "New +" -> "Web Service" -> "Build and deploy from a Git
    repository" -> conecta GitHub y elige tu repositorio.
 2. Configura:
      Name ............ autometrica-api
      Region .......... la MISMA de la base de datos
      Branch .......... main
      Root Directory .. autometrica-full/backend
      Runtime ......... Python 3
      Build Command ... bash build.sh
      Start Command ... uvicorn app.main:app --host 0.0.0.0 --port $PORT
      Instance Type ... Free
 3. "Advanced":
      Health Check Path ... /health
 4. Environment Variables: agrega las de la sección 3.1.
    - DATABASE_URL = la Internal Database URL del paso 5.
    - FRONTEND_URL: aún no conoces la URL del frontend; pon un valor
      provisional (https://autometrica-web.onrender.com) y corrígelo
      en el paso 7.5.
 5. "Create Web Service". Sigue el despliegue en la pestaña "Logs".
    Debes ver, en orden:
      ==> [1/4] Instalando dependencias de Python
      ==> [2/4] Verificando variables de entorno obligatorias
      ==> [3/4] Sincronizando el esquema ...
      [Base de Datos] Esquemas y tablas sincronizados correctamente.
      ==> [4/4] Creando superusuario ...
      [create_admin] Superusuario creado: admin@tudominio.com
      ==> Build completado correctamente
    y luego "Application startup complete".
 6. Anota la URL pública (ej. https://autometrica-api.onrender.com).

 Por qué "bash build.sh": evita el error "Permission denied" si Git no
 conservó el permiso de ejecución (típico al subir desde Windows).

---------------------------------------------------------------------
 7. CREAR EL STATIC SITE (FRONTEND)
---------------------------------------------------------------------
 1. "New +" -> "Static Site" -> el mismo repositorio.
 2. Configura:
      Name .................. autometrica-web
      Branch ................ main
      Root Directory ........ autometrica-full/frontend
      Build Command ......... npm install && npm run build
      Publish Directory ..... dist
 3. Environment:
      VITE_API_URL = https://autometrica-api.onrender.com/api/v1
      NODE_VERSION = 22
 4. Pestaña "Redirects/Rewrites" -> "Add Rule" (NECESARIA: la app usa
    React Router; sin esto, recargar /login da "Not Found"):
      Source ....... /*
      Destination .. /index.html
      Action ....... Rewrite
 5. "Create Static Site". Cuando termine, copia su URL real y vuelve
    al Web Service -> Environment -> corrige FRONTEND_URL con esa URL
    EXACTA (https, sin "/" final) -> Save (redespliega solo).
    Si el nombre autometrica-web ya estaba tomado, Render le añade un
    sufijo: usa la URL que realmente te asignó.

---------------------------------------------------------------------
 8. CORREO (IMPORTANTE EN EL PLAN GRATUITO)
---------------------------------------------------------------------
 - Render gratuito bloquea el tráfico saliente por los puertos 25, 465
   y 587. El SMTP de Gmail configurado en el proyecto NO funcionará.
 - Usa Resend (envío por HTTPS, ya integrado en el código):
     1. Crea cuenta en resend.com y genera una API Key.
     2. En Render define RESEND_API_KEY y RESEND_FROM.
 - Con el remitente de pruebas onboarding@resend.dev, Resend solo
   permite enviar a la dirección de correo de tu propia cuenta. Para
   enviar a cualquier cliente debes verificar un dominio propio en
   Resend y usar un remitente de ese dominio.
 - Los correos de recuperación de contraseña y bienvenida llevarán
   enlaces a FRONTEND_URL (ya no a localhost).
 - Los SMS (Twilio) son opcionales; sin credenciales se simulan en log.

---------------------------------------------------------------------
 9. SEGURIDAD - PENDIENTES ANTES DE USAR DATOS REALES
---------------------------------------------------------------------
 1. CREDENCIALES EXPUESTAS (acción inmediata)
    Estos valores estaban en texto plano en el README y/o backend/.env
    del ZIP: contraseña de aplicación de Gmail, RESEND_API_KEY y la
    clave de PostgreSQL local. Considéralas comprometidas:
      - Gmail: revoca la contraseña de aplicación en
        https://myaccount.google.com/apppasswords y crea otra.
      - Resend: borra la API Key y genera una nueva.
    Usa siempre claves nuevas en Render.

 2. LA API NO TIENE AUTENTICACIÓN (hallazgo verificado)
    No hay JWT, sesiones ni dependencias de seguridad en los routers.
    El login devuelve el objeto de usuario y el control de roles
    (ProtectedRoute) existe SOLO en el navegador. En la prueba hecha:
      GET    /api/v1/usuarios/   -> 200 sin credenciales (nombres,
                                    correos, teléfonos, roles)
      DELETE /api/v1/usuarios/{id} -> acepta la petición sin credenciales
    Cualquiera que conozca la URL del backend puede leer, modificar o
    borrar datos. El despliegue funcionará, pero ES UN RIESGO REAL
    para datos personales (el Plan de Pruebas del proyecto exige
    control de acceso y cumplimiento de la Ley 1581/2012).
    Recomendación: antes de cargar datos reales de clientes, implementar
    autenticación por token (JWT) y autorización por rol/taller en el
    backend. Mientras tanto, úsalo solo con datos de prueba/demostración.
    Esto es un cambio de desarrollo, no de despliegue, y no se modificó
    aquí para no alterar el comportamiento del sistema.

 3. Endpoint destructivo: /sistema/limpiar-base-datos queda deshabilitado
    en producción (solo existe con ENVIRONMENT != production).

 4. /docs y /redoc quedan ocultos en producción. Para verlos
    temporalmente: DEBUG=true y redespliega; vuelve a false al terminar.

 5. CORS: en producción solo se acepta el origen FRONTEND_URL
    (+ CORS_ORIGINS). Antes estaba abierto a "*".

---------------------------------------------------------------------
 10. LIMITACIONES DEL PLAN GRATUITO QUE AFECTAN A ESTE PROYECTO
---------------------------------------------------------------------
 - El Web Service se "duerme" tras ~15 min sin tráfico. La primera
   petición después tarda ~1 minuto (por eso el timeout del frontend
   es de 70 s). Los siguientes accesos son rápidos.
 - 750 horas gratuitas por mes entre todos tus Web Services; si se
   agotan, Render los suspende hasta el mes siguiente.
 - Sistema de archivos efímero: lo escrito en disco se pierde en cada
   reinicio. El proyecto no guarda archivos en disco (verificado: no hay
   subida de archivos) y por eso la BD debe ser PostgreSQL externo.
 - No hay shell/SSH ni "one-off jobs": por eso el superusuario se crea
   dentro de build.sh.
 - WebSockets: el código NO los usa (verificado). Sin problema.
 - PostgreSQL gratuito: expira a los 30 días, sin backups, 1 GB. Antes
   del día 30 haz una copia:
      pg_dump "EXTERNAL_DATABASE_URL" -Fc -f respaldo.dump
   (la External URL está en la pestaña Connections; requiere
   ?sslmode=require si la conexión no lo negocia sola). Para restaurar
   en una BD nueva:
      pg_restore -d "NUEVA_EXTERNAL_URL" --no-owner respaldo.dump
   Solo se permite una BD gratuita activa por cuenta/workspace. Para un
   uso permanente, pasa a un plan de pago.

---------------------------------------------------------------------
 11. VERIFICACIONES POST-DESPLIEGUE
---------------------------------------------------------------------
 [ ] Backend vivo (espera ~1 min si estaba dormido):
       https://autometrica-api.onrender.com/health
       -> {"status":"ok"}
       https://autometrica-api.onrender.com/
       -> {"mensaje":"Autometrica API funcionando",...}
 [ ] En Logs del backend: "Conectado exitosamente a PostgreSQL
     (producción)" y "Application startup complete".
 [ ] Frontend: abre la URL del Static Site; carga la página de inicio.
 [ ] Recarga en /login: debe seguir mostrando el login (regla Rewrite).
 [ ] Abre las herramientas del navegador (F12 > Network) e inicia
     sesión: las peticiones deben ir a ...onrender.com/api/v1/...,
     no a localhost ni a devtunnels.
 [ ] Login del superusuario: pestaña "Administrador" con ADMIN_EMAIL y
     ADMIN_PASSWORD.
     Nota: ese superusuario no pertenece a ningún taller. Para operar un
     taller, regístralo en /registro-taller (crea el taller con su
     propio administrador y su código único).
 [ ] Prueba un flujo completo: registrar taller -> registrar cliente ->
     crear vehículo -> recargar la página y confirmar que los datos
     persisten.
 [ ] Recuperación de contraseña: el correo debe traer un enlace a tu
     dominio de Render (requiere Resend configurado, sección 8).
 [ ] /docs devuelve 404 (esperado en producción).

 Crear o cambiar el superusuario más adelante:
   - Define/ajusta ADMIN_EMAIL y ADMIN_PASSWORD en el Web Service.
   - Para cambiar la clave de un admin existente agrega
     ADMIN_RESET_PASSWORD=true.
   - "Manual Deploy" -> "Deploy latest commit".
   - Cuando termine, elimina ADMIN_RESET_PASSWORD (y, si quieres,
     ADMIN_PASSWORD).
   Si el correo ya existe con otro rol, el script NO lo modifica.

---------------------------------------------------------------------
 12. SOLUCIÓN DE PROBLEMAS COMUNES
---------------------------------------------------------------------
 BUILD / ARRANQUE
 * "ERROR: DATABASE_URL no está definida" (build)
     Falta la variable en el Web Service. Usa la Internal URL.
 * "bash: build.sh: Permission denied" / "No such file"
     Usa Build Command "bash build.sh" y verifica Root Directory =
     autometrica-full/backend.
 * "ModuleNotFoundError: No module named 'app'"
     Root Directory incorrecto: el Start Command debe ejecutarse dentro
     de autometrica-full/backend.
 * "ModuleNotFoundError: No module named 'psycopg'" o errores de driver
     Ya resuelto (URL con +psycopg2 y requirements fijados). Si aparece,
     confirma que requirements.txt es el de este entregable.
 * "En producción DATABASE_URL debe ser una URL de PostgreSQL"
     DATABASE_URL vacía o apuntando a SQLite. Usa la de Render.
 * "could not translate host name ..." / timeout a la BD
     (a) Servicio y BD en regiones distintas. (b) Usaste la External URL
     sin sslmode. (c) La BD gratuita expiró o fue eliminada: revisa su
     estado en el Dashboard.
 * "[create_admin] ERROR: ADMIN_PASSWORD no es segura"
     Cumple: 8+ caracteres, mayúscula, minúscula y carácter especial.
 * El deploy no avanza / "Port scan timeout"
     El Start Command debe usar --host 0.0.0.0 --port $PORT.
 * Python incompatible
     Fija PYTHON_VERSION=3.12.3 y usa "Clear build cache & deploy".

 FRONTEND
 * Pantalla en blanco o "Network Error" en el login
     VITE_API_URL ausente/errónea al compilar. Corrígela y haz "Clear
     build cache & deploy" (se incrusta al compilar).
 * Error de CORS en la consola del navegador
     FRONTEND_URL del backend no coincide EXACTAMENTE con la URL del
     frontend (https, sin "/" final, mismo subdominio). Corrige y
     espera el redespliegue.
 * "Not Found" al recargar /login, /panel-mecanico, etc.
     Falta la regla Rewrite /* -> /index.html (sección 7.4).
 * "El servidor tardó demasiado en responder"
     Servidor dormido (cold start). Espera 1 minuto y reintenta.

 FUNCIONALES
 * "Correo o contraseña incorrectos" con el admin
     Revisa en los Logs del build el mensaje [create_admin]. Verifica
     que ADMIN_EMAIL esté en minúsculas y que se haya creado.
 * No llegan correos
     Render bloquea SMTP: configura Resend (sección 8). Con
     onboarding@resend.dev solo se entrega a tu correo de Resend.
 * Los datos desaparecieron
     La BD gratuita expiró (30 días) o se recreó. Ver sección 10.
 * /docs da 404
     Es lo esperado en producción. Usa DEBUG=true temporalmente.
 * Servicio suspendido
     Se agotaron las 750 horas gratuitas del mes o el ancho de banda.

 DÓNDE MIRAR
   Web Service -> pestaña "Logs"   (build y ejecución)
   Web Service -> pestaña "Events" (historial de despliegues)
   Opciones útiles: "Manual Deploy" -> "Clear build cache & deploy".

---------------------------------------------------------------------
 13. DESARROLLO LOCAL (SIN CAMBIOS DE FLUJO)
---------------------------------------------------------------------
   cd autometrica-full/backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload

   cd autometrica-full/frontend
   npm install
   npm run dev

 Con ENVIRONMENT=development (o sin definir): CORS abierto, /docs
 visible y, si PostgreSQL local no responde, se conserva el fallback a
 SQLite original. En producción ese fallback está deshabilitado a
 propósito.
=====================================================================
