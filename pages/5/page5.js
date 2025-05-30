const taskQueue = require('./taskQueue');
class Page5 {
    constructor() {}

    /*OnHttpRequest(server, req, res) {
        try {
            // POST para geração de imagem - PROJECT 1
            if (req.method === "POST" && req.url === "/page5speech") {
                server.WaiToCLOSE(true);
                let body = "";
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);                        
                        let { speech, lang,type,rate,pitch,volume } = data;

                        if (!speech || !lang || typeof type === "undefined" || 
                                                typeof rate === "undefined" || 
                                                typeof pitch === "undefined" || 
                                                typeof volume === "undefined") {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'Campos obrigatórios.' }));
                            server.WaiToCLOSE(false);
                            return;
                        }
                        
                        const novoDado = { speech, lang,type,rate,pitch,volume };
                        taskQueue.add(novoDado, res)
                            .then((lastLine) => {                                
                                server.WaiToCLOSE(false);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ status: 'SUCESS', audio:lastLine }));
                            })
                            .catch((err) => {
                                server.WaiToCLOSE(false);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ status: `Erro interno: ${err}` }));
                            });
                    } catch (error) {
                        server.WaiToCLOSE(false);
                        console.error('Erro processando a requisição em page5:', error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Erro interno do servidor');
                    }
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Erro processando a requisição em page5:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro interno do servidor');
            return true;
        }
    }*/

    async onSocketRequest(msg, conn) {
        console.log(msg);
        try {
            if (!msg || msg.KEY !== "PROJ05#SPEECH") return;
    
            console.log('a')
            const id = msg.ID || null;
            const { speech, lang, type, rate, pitch, volume } = msg.DATA || {};
    
            // Validação dos dados
            if (!speech || !lang || typeof type === "undefined" || typeof rate === "undefined" ||
                typeof pitch === "undefined" || typeof volume === "undefined") {
                conn.send(JSON.stringify({
                    CMD: "ERROR",
                    MSG: "Campos obrigatórios ausentes."                   
                }));
                return;
            }

            console.log('b')
    
            const novoDado = { speech, lang, type, rate, pitch, volume };
            //const isAlive = () => conn.readyState === 1;
    
            // Usa a fila para processar
            const audioUrl = await taskQueue.add(novoDado,conn);
    
            console.log('c')

            conn.send(JSON.stringify({
                CMD: "AUDIO_READY",
                URL: audioUrl,                
            }));
        } catch (err) {
            console.error("Erro no WebSocket SPEAK:", err);
            conn.send(JSON.stringify({
                CMD: "ERROR",
                MSG: "Erro interno ao gerar áudio."                
            }));
        }
    }
    

}

module.exports = new Page5();
