#!/bin/bash
#ver vencimento
#sudo certbot certificates
#renovar certificado
#sudo certbot renew

#& runuser -u games -- /www/games/pjz/start-server.sh &
node /www/node/start.js &

#while ! getent hosts api.steampowered.com > /dev/null 2>&1; do
#    sleep 2
#done

#cd /www/games/pjz
#./start-server.sh &

wait
