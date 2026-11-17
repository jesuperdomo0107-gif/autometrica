#!/usr/bin/env bash
# build.sh — Build del backend FastAPI de AutoMétrica en Render.
# Se ejecuta como "Build Command" del Web Service:   ./build.sh
# (Root Directory del servicio: autometrica-full/backend)
set -o errexit   # detener el build ante cualquier error
set -o nounset   # error si se usa una variable no definida
set -o pipefail

echo "==> [1/4] Instalando dependencias de Python"
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "==> [2/4] Verificando variables de entorno obligatorias"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL no está definida. Usa la 'Internal Database URL' de tu PostgreSQL en Render." >&2
  exit 1
fi

echo "==> [3/4] Sincronizando el esquema de la base de datos (migraciones)"
python -m app.db_init

# FastAPI no tiene 'collectstatic': el backend es una API pura y no sirve archivos
# estáticos. El frontend (React) se compila y se publica como Static Site aparte.

echo "==> [4/4] Creando superusuario (si ADMIN_EMAIL y ADMIN_PASSWORD están definidas)"
python -m app.create_admin

echo "==> Build completado correctamente"
