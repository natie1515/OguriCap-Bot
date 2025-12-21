#!/bin/bash

# Script para instalar servicios systemd

set -e

echo "🚀 Instalando servicios systemd para OguriCap Bot..."

# Verificar que estamos en el directorio correcto
if [ ! -f "index.js" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio del bot"
    exit 1
fi

# Instalar dependencias del bot
echo "📦 Instalando dependencias del bot..."
npm install

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend-next
npm install
npm run build
cd ..

# Crear directorios necesarios
mkdir -p logs Sessions storage/media tmp

# Copiar archivos de servicio
echo "📋 Instalando servicios systemd..."
sudo cp oguri-bot.service /etc/systemd/system/
sudo cp oguri-panel.service /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar servicios
sudo systemctl enable oguri-bot.service
sudo systemctl enable oguri-panel.service

# Configurar nginx
echo "🌐 Configurando Nginx..."
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh

echo "✅ Instalación completada!"
echo ""
echo "📋 Comandos útiles:"
echo "  Iniciar bot:        sudo systemctl start oguri-bot"
echo "  Iniciar panel:      sudo systemctl start oguri-panel"
echo "  Iniciar todo:       sudo systemctl start oguri-bot oguri-panel"
echo ""
echo "  Ver logs bot:       sudo journalctl -f -u oguri-bot"
echo "  Ver logs panel:     sudo journalctl -f -u oguri-panel"
echo "  Ver logs ambos:     sudo journalctl -f -u oguri-bot -u oguri-panel"
echo ""
echo "  Estado servicios:   sudo systemctl status oguri-bot oguri-panel"
echo "  Reiniciar:          sudo systemctl restart oguri-bot oguri-panel"
echo "  Parar:              sudo systemctl stop oguri-bot oguri-panel"
echo ""
echo "🌐 Acceso: http://178.156.179.129"