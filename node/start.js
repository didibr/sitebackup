const server = require('./server');
const page1 = require('../pages/1/page1'); //send focus to anothet js
const page4 = require('../pages/4/page4'); //send focus to anothet js
const page5 = require('../pages/5/page5'); //send focus to anothet js
const page10 = require('../pages/10/page10'); //send focus to anothet js
const serverSocket = require('./server_socket');
const fs = require('fs');
const path = require('path');



const WebPort = 80; // ou 443
const _SV_DIR = "/www/pages";
const _CERT_DIR = "/etc/letsencrypt/live/didisoftwares.ddns.net";

let isServerRunning = false;




//############ - html request treatment
function OnHttpRequest(req, res) {
    try {
        const url = server.safeDecodeURI(req.url);
        console.log("Url Request on ST:", url);


        if (url === "/" || url.startsWith("/?tick")) {
            res.writeHead(301, { Location: "./index.html" });
            res.end();
            server.WaiToCLOSE(false);
            return;
        }        
        if (url === "/error") {
            server.show404(res);
            return true;
        }
        if (url === "/relatorio") {            
            return true;
        }
        

        //server.requestStats[url] = (server.requestStats[url] || 0) + 1; //contador do relatorio

        if (page1.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        if (page4.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        if (page10.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        //no function to this URL        
        //server.WaiToCLOSE(false);
        //server.show404(res, "You shall not pass", 204);
        return false;
    } catch (error) {
        console.error('Erro processando a requisição:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erro interno do servidor');
    }
}


function onSocketRequest(msg, conn) {
    //PROJ4 SOCK
    if (msg.KEY && msg.KEY.startsWith("PROJ04#")) {
        page4.onSocketRequest(msg, conn);
    }
    //PROJ5 SOCK
    if (msg.KEY && msg.KEY.startsWith("PROJ05#")) {
        page5.onSocketRequest(msg, conn);
    }
}

//acessos permitidos
server.addAcess("/codepen/");
server.addAcess("/robots.txt");
server.addAcess("/sitemap.xml");
server.addAcess("/translation.js");
server.addAcess("/bootstrap/");
server.addAcess("/main.js");
server.addAcess("/favicon.ico");
server.addAcess("/relatorio");
server.addAcess("/page5speech");//PAGE4
server.addAcess("/page4savecfg");//PAGE4
server.addAcess("/gerar-imagem");//PAGE1
server.addAcess("/google151c9e4ea39f1432.html");
for(var i=0;i<20;i++){ //PAGES
server.addAcess(`/${i}/`);
}

// Tipos de arquivos permitidos
server.AllowTransfer.add(".html", null, "text/html");
server.AllowTransfer.add(".jpg", null, "image/jpeg");
server.AllowTransfer.add(".ico", null, "image/ico");
server.AllowTransfer.add(".js", null, "text/javascript");
server.AllowTransfer.add(".css", null, "text/css");
server.AllowTransfer.add(".7z", null, "application/x-7z-compressed");
server.AllowTransfer.add(".exe", null, "application/x-msdownload");
server.AllowTransfer.add(".json", null, "application/json");
server.AllowTransfer.add(".mp4", null, "video/mp4");
server.AllowTransfer.add(".wav", null, "audio/wav");
server.AllowTransfer.add(".mp3", null, "audio/mpeg");
server.AllowTransfer.add(".png", null, "image/png");
server.AllowTransfer.add(".glb", null, "application/octet-stream");
server.AllowTransfer.add(".bin", null, "application/octet-stream");
server.AllowTransfer.add(".error", null, "text/html");
server.AllowTransfer.add(".svg", null, "image/svg+xml");
server.AllowTransfer.add(".zip", null, "application/zip");
server.AllowTransfer.add(".wasm", null, "application/wasm");
server.AllowTransfer.add(".woff2", null, "application/font-woff");
server.AllowTransfer.add(".ttf", null, "font/truetype");
server.AllowTransfer.add(".wasm", null, "application/wasm");
server.AllowTransfer.add(".xml", null, "text/xml");
server.AllowTransfer.add(".txt", null, "text/plain");




server.ServerDIR(_SV_DIR);
server.CertDIR(_CERT_DIR);
server.useRelatory("/relatorio");


function startServer() {
    if (isServerRunning) {
        console.log("Servidor já está rodando. Ignorando tentativa de reinício.");
        return;
    }

    try {
        const webserver = server.START(OnHttpRequest, WebPort);
        serverSocket.protocolName = "didisoftwares.ddns.net";
        serverSocket.START(webserver, onSocketRequest); // ✅ ordem corrigida
        isServerRunning = true;
        console.log(`Servidor iniciado na porta ${WebPort}`);
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error);

        if (error.code === 'EADDRINUSE') {
            console.error("Porta já está em uso. Abortando reinício.");
        } else {
            setTimeout(startServer, 30000);
        }
    }
}

startServer();

process.on('uncaughtException', (err) => {
    console.error('Erro não tratado:', err);
    if (!isServerRunning) {
        console.log('Tentando reiniciar o servidor...');
        setTimeout(startServer, 5000);
    } else {
        console.warn("Servidor continua rodando. Ignorando reinício.");
    }
});

process.on('SIGINT', () => {
    console.log("\nEncerrando servidor...");
    process.exit(0);
});

