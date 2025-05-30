#!/bin/bash

# Parando o ambiente Wine, Fluxbox, Xvfb e x11vnc

echo "🔴 Parando ambiente Wine com Xvfb + Fluxbox + x11vnc..."

# Verifica se o Xvfb está rodando e para
if pgrep Xvfb > /dev/null; then
  echo "🖥️ Parando Xvfb..."
  pkill Xvfb
fi

# Verifica se o Fluxbox está rodando e para
if pgrep fluxbox > /dev/null; then
  echo "🪟 Parando Fluxbox..."
  pkill fluxbox
fi

# Verifica se o x11vnc está rodando e para
if pgrep x11vnc > /dev/null; then
  echo "📡 Parando x11vnc..."
  pkill x11vnc
fi

# Verifica se o Wine Explorer está rodando e para
if pgrep wine > /dev/null; then
  echo "💻 Parando Wine..."
  pkill wine
fi

# Opcional: Limpar o DISPLAY se não precisar mais dele
unset DISPLAY
unset WINEPREFIX

echo "✅ Ambiente Wine, Fluxbox, Xvfb e x11vnc parados com sucesso."
