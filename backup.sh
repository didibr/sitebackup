#!/bin/bash
cd /www/backup || exit 1

# Limite de tamanho em bytes (50MB)
LIMIT=$((50 * 1024 * 1024))

# Função para comprimir e dividir se necessário
compress_and_split() {
    local srcfile=$1
    local destdir=$2
    local filename=$(basename "$srcfile")
    local destfile="$destdir/$filename"

    # Comprime o arquivo (usando 7z com melhor compressão)
    7z a -t7z -mx=9 "$destfile.7z" "$srcfile" > /dev/null

    # Verifica o tamanho do arquivo comprimido
    local size=$(stat -c%s "$destfile.7z")

    if [ "$size" -gt "$LIMIT" ]; then
        echo "Arquivo $filename comprimido com $size bytes, maior que $LIMIT, dividindo..."

        # Remove arquivo grande comprimido
        rm "$destfile.7z"

        # Divide em volumes de 50MB usando 7z volumes
        7z a -t7z -mx=9 -v50m "$destfile.7z" "$srcfile" > /dev/null

        echo "Divisão em partes de 50MB concluída."
    else
        echo "Arquivo $filename comprimido com $size bytes, dentro do limite."
    fi
}

# Limpa e recria backup/pages
rm -rf ./pages
mkdir -p ./pages

# Copiar e processar arquivos da pasta /www/pages (ignora '1/fastcpu')
find /www/pages -type f ! -path "/www/pages/1/fastcpu/*" | while read -r file; do
    # Cria subpastas correspondentes
    relpath="${file#/www/pages/}"
    destdir="./pages/$(dirname "$relpath")"
    mkdir -p "$destdir"

    filesize=$(stat -c%s "$file")

    if [ "$filesize" -gt "$LIMIT" ]; then
        # Comprime e divide se maior que 50MB
        compress_and_split "$file" "$destdir"
    else
        # Copia direto arquivos pequenos
        cp "$file" "$destdir/"
    fi
done

# Copiar os scripts e arquivos menores para backup
mkdir -p node
cp /www/node/server.js node/
cp /www/node/server_socket.js node/
cp /www/node/start.js node/
cp /www/start.sh .
cp /www/winestart.sh .
cp /www/winestop.sh .

# Continua com o git add, commit, push etc.
git add .

if ! git diff --cached --quiet; then
    git commit -m "Backup automático em $(date '+%Y-%m-%d %H:%M:%S')"
    git push https://github_pat_...token...@github.com/didibr/sitebackup.git main
else
    echo "Nenhuma alteração para commitar."
fi

