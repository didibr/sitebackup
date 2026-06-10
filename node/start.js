
const path = require('path');
process.env.NODE_PATH = path.resolve(__dirname, 'node_modules');
require('module').Module._initPaths(); // recarrega paths do NODE_PATH
//export NODE_PATH=/www/node/node_modules

const server = require('./server');
global.page1 = require('../pages/1/page1'); //send focus to anothet js
global.page4 = require('../pages/4/page4'); //send focus to anothet js
global.page5 = require('../pages/5/page5'); //send focus to anothet js
global.page10 = require('../pages/10/page10'); //send focus to anothet js
//global.page12 = require('../pages/12/page12'); //send focus to anothet js {com erro interferindo no res de quem vem depois}
global.page15 = require('../pages/15/page15'); //send focus to anothet js
//global.page19 = require('../pages/19/page19'); //send focus to anothet js //DISABLED
global.historico = require('../pages/historico/historico'); //send focus to anothet js
const serverSocket = require('./server_socket');
const fs = require('fs');
const historico = require('../pages/historico/historico');





const WebPort = 80; // ou 443
const _SV_DIR = "/www/pages";
const _CERT_DIR = "/etc/letsencrypt/live/didisoftwares.ddns.net";

let isServerRunning = false;

function watchAndReload(varName, relativeModulePath, displayName) {
    const fullPath = path.resolve(__dirname, relativeModulePath + '.js');
    let reloadTimeout = null;try {
        fs.watch(fullPath, (eventType, filename) => {
            if (eventType === 'change') {
                if (reloadTimeout) return;  // Já está agendado, ignora
                reloadTimeout = setTimeout(() => {
                    reloadTimeout = null;  // Libera para permitir próximos reloads
                    console.log(`🔄 Alteração detectada em ${displayName}, recarregando...`);
                    try {
                        delete require.cache[require.resolve(relativeModulePath)];
                        global[varName] = require(relativeModulePath);
                        console.log(`✅ ${displayName} recarregado com sucesso.`);
                    } catch (err) {
                        console.error(`❌ Erro ao recarregar ${displayName}:`, err);
                    }
                }, 1000);  // Aguarda 300ms antes de recarregar
            }
        });
        console.log(`👀 Monitorando alterações em: ${displayName}`);
    } catch (err) {
        console.error(`❌ Erro ao monitorar ${displayName}:`, err);
    }
}



//AUTO RELOAD
//watchAndReload('page12', '../pages/12/page12', 'page12s.js');
//watchAndReload('historico', '../pages/historico/historico', 'historico.js');

//############ - html request treatment
function OnHttpRequest(req, res) {    
    try {
        const url = server.safeDecodeURI(req.url);
        console.log("Url Request on ST:", url);        
        /*ALREADY TREAT in SERVER
        if (url === "/" || url.startsWith("/?")) {
            res.writeHead(302, { Location: "/index.html" });
            res.end();
            server.WaiToCLOSE(false);
            return true;
        }        
        */
    
        if (url.startsWith("/23")) { //voice comand           
            server.HEADERS["Cross-Origin-Embedder-Policy"]="require-corp";
            server.HEADERS["Cross-Origin-Opener-Policy"]="same-origin";            
            return false;
        }
        if (url === "/error") {
            server.show404(res);
            return true;
        }

        /* DISABLED
        if (url === "/relatorio") {            
            server.showRelatory("/relatorio",res);
            return true;
        }*/
                

        if (page1.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        if (page4.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        if (page10.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        /* COM ERRO interferindo no res de quem vem depois
        if (page12.OnHttpRequest(server, req, res) === true) {
            return true;
        }*/

        if (page15.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        /*if (page19.OnHttpRequest(server, req, res) === true) {
            return true;
        }*/
       

        if (historico.OnHttpRequest(server, req, res) === true) {
            return true;
        }

        

        //no function to this URL        
        //server.WaiToCLOSE(false);
        //server.show404(res, "You shall not pass", 204);
        return false; //false = no threat on start.js let server job
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
    //PROJ12 SOCK
    if (msg.KEY && msg.KEY.startsWith("PROJ12#SOCKET")) {
        page12.onSocketRequest(msg, conn);
    }
}

//allow CORS from - not used
//server.addAllowedOPTIONS("https://codepen.io");
//server.addAllowedOPTIONS("https://cdpn.io");

//acessos permitidos
server.addAcess("/draco/");
server.addAcess("/google151c9e4ea39f1432.html");
server.addAcess("/player/");
server.addAcess("/codepen/");
server.addAcess("/icon.jpg");
server.addAcess("/robots.txt");
server.addAcess("/sitemap.xml");
server.addAcess("/translation.js");
server.addAcess("/bootstrap/");
server.addAcess("/main.js");
server.addAcess("/main.css");
server.addAcess("/favicon.ico");
//server.addAcess("/relatorio"); DISABLED
server.addAcess("/page5speech");//PAGE4 POST
server.addAcess("/page4savecfg");//PAGE4 POST
server.addAcess("/gerar-imagem");//PAGE1 POST
server.addAcess("/gerar-mp3youtube");//PAGE15
//server.addAcess("/gerar-noticia");//PAGE19 DISABLED
server.addAcess("/15/downloads/"); //special acess on server.js
server.addBlock("/15/page15.js"); //block
server.addAcess("/historico/"); //special acess on server.js
server.addAcess("/historico"); //POST REQUEST
server.addBlock("/historico/historico.js"); //block
server.addBlock("/historico/dados");
//server.addAcess("/google151c9e4ea39f1432.html");
for(var i=1;i<50;i++){ //PAGES
server.addAcess(`/${i}/`);
}

// Tipos de arquivos permitidos
server.AllowTransfer.add(".html", null, "text/html");
server.AllowTransfer.add(".jpg", null, "image/jpeg");
server.AllowTransfer.add(".png", null, "image/png");
server.AllowTransfer.add(".ico", null, "image/ico");
server.AllowTransfer.add(".webp", null, "image/webp");
server.AllowTransfer.add(".js", null, "text/javascript");
server.AllowTransfer.add(".css", null, "text/css");
server.AllowTransfer.add(".7z", null, "application/x-7z-compressed");
server.AllowTransfer.add(".exe", null, "application/x-msdownload");
server.AllowTransfer.add(".json", null, "application/json");
server.AllowTransfer.add(".mp4", null, "video/mp4");
server.AllowTransfer.add(".wav", null, "audio/wav");
server.AllowTransfer.add(".mp3", null, "audio/mpeg");
server.AllowTransfer.add(".glb", null, "application/octet-stream");
server.AllowTransfer.add(".mtl", null, "application/octet-stream");
server.AllowTransfer.add(".obj", null, "application/octet-stream");
server.AllowTransfer.add(".fbx", null, "application/octet-stream");
server.AllowTransfer.add(".bin", null, "application/octet-stream");
server.AllowTransfer.add(".hdr", null, "application/octet-stream");
server.AllowTransfer.add(".pmx", null, "application/octet-stream");
server.AllowTransfer.add(".vmd", null, "application/octet-stream");
server.AllowTransfer.add(".error", null, "text/html");
server.AllowTransfer.add(".svg", null, "image/svg+xml");
server.AllowTransfer.add(".zip", null, "application/zip");
server.AllowTransfer.add(".wasm", null, "application/wasm");
server.AllowTransfer.add(".woff2", null, "application/font-woff");
server.AllowTransfer.add(".ttf", null, "font/truetype");
server.AllowTransfer.add(".xml", null, "text/xml");
server.AllowTransfer.add(".txt", null, "text/plain");
server.AllowTransfer.add(".pdf", null, "application/pdf");




server.ServerDIR(_SV_DIR);
server.CertDIR(_CERT_DIR);
//server.useRelatory("/relatorio"); //DISABLED


function startServer() {
    if (isServerRunning) {
        console.log("Servidor já está rodando. Ignorando tentativa de reinício.");
        return;
    }

    try {
        const webserver = server.START(OnHttpRequest, WebPort);
        serverSocket.protocolName = "didisoftwares.ddns.net";
        serverSocket.START(webserver, onSocketRequest); //ordem corrigida
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

