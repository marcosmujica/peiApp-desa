#!/bin/bash

# Script de inicio para el servicio peiApp Database Service
# Uso: ./start.sh [dev|prod]

MODE=${1:-dev}

echo "🚀 Iniciando peiApp Database Service en modo: $MODE"

# Crear directorio de logs si no existe
mkdir -p logs

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado, copiando desde .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "❌ No se encontró .env.example"
        exit 1
    fi
fi

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servicio..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Capturar señales de salida
trap cleanup SIGINT SIGTERM

case $MODE in
    "dev")
        echo "🔧 Modo desarrollo - reinicio automático habilitado"
        npm run dev &
        SERVER_PID=$!
        ;;
    "prod")
        echo "⚡ Modo producción"
        npm start &
        SERVER_PID=$!
        ;;
    *)
        echo "❌ Modo inválido. Usar: dev o prod"
        exit 1
        ;;
esac

# Esperar que el proceso termine
wait $SERVER_PID