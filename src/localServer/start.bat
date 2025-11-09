@echo off
REM Script de inicio para Windows
REM Uso: start.bat [dev|prod]

set MODE=%1
if "%MODE%"=="" set MODE=dev

echo 🚀 Iniciando peiApp Database Service en modo: %MODE%

REM Crear directorio de logs si no existe
if not exist logs mkdir logs

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist node_modules (
    echo 📦 Instalando dependencias...
    npm install
)

REM Verificar archivo .env
if not exist .env (
    echo ⚠️  Archivo .env no encontrado
    if exist .env.example (
        echo Copiando desde .env.example
        copy .env.example .env
    ) else (
        echo ❌ No se encontró .env.example
        pause
        exit /b 1
    )
)

if "%MODE%"=="dev" (
    echo 🔧 Modo desarrollo - reinicio automático habilitado
    npm run dev
) else if "%MODE%"=="prod" (
    echo ⚡ Modo producción
    npm start
) else (
    echo ❌ Modo inválido. Usar: dev o prod
    pause
    exit /b 1
)

pause