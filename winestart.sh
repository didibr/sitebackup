#!/bin/bash

export DISPLAY=:1
export WINEARCH=win32
export WINEPREFIX=/www/wine
LOG_FILE="/tmp/x11vnc.log"

echo "✅ Iniciando ambiente Wine com Xvfb + Fluxbox + x11vnc (senha direta)..."
winetricks -q speechsdk

# Inicia Xvfb
if ! pgrep Xvfb > /dev/null; then
  echo "🖥️ Iniciando Xvfb..."
  Xvfb :1 -screen 0 800x600x16 &
  sleep 2
else
  echo "🖥️ Xvfb já está rodando."
fi

# Inicia o gerenciador de janelas
if ! pgrep fluxbox > /dev/null; then
  echo "🪟 Iniciando Fluxbox..."
  fluxbox &
  sleep 1
else
  echo "🪟 Fluxbox já está rodando."
fi

# Inicia x11vnc (corrigida senha para di123123)
if ! pgrep x11vnc > /dev/null; then
  echo "📡 Iniciando x11vnc com senha embutida..."
  x11vnc -display :1 \
    -passwd di131379 \
    -forever -bg -noxdamage -rfbport 5900 \
    -o "$LOG_FILE" -verbose
else
  echo "📡 x11vnc já está rodando."
fi

# --- AQUI ADICIONAMOS O WINE --- 
# Aguarda um momento para garantir que o X e o Fluxbox estejam prontos
sleep 2

# Inicia o "desktop" do Wine (Windows) em 1024x768
#wine explorer /desktop=WineDesktop,1024x768 &

# (Opcional) Abre a configuração do Wine
#winecfg &

echo "🌐 Acesse com VNC Viewer no IP do servidor, porta 5900"
echo "🔐 Senha VNC: di123123"
echo "📄 Log do x11vnc: $LOG_FILE"

