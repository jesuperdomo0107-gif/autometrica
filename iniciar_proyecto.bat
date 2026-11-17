@echo off
chcp 65001 > NUL
title AutoMétrica - Servidores Operativos (Backend + Frontend)

echo ========================================================
echo        AutoMétrica - Sistema de Información Automotriz
echo              Proyecto Formativo SENA ADSO
echo ========================================================
echo.
echo [1/2] Iniciando Servidor Backend (FastAPI en http://127.0.0.1:8000)...
start "AutoMétrica Backend (FastAPI)" cmd /k "cd /d %~dp0autometrica-full\backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [2/2] Iniciando Servidor Frontend (React + Vite en http://localhost:5173)...
start "AutoMétrica Frontend (React)" cmd /k "cd /d %~dp0autometrica-full\frontend && npm run dev"

echo.
echo ========================================================
echo ¡Servidores iniciados correctamente!
echo.
echo  - Aplicación Web: http://localhost:5173
echo  - API Swagger:    http://127.0.0.1:8000/docs
echo.
echo Presiona cualquier tecla para abrir el navegador...
echo ========================================================
pause > NUL
start http://localhost:5173

