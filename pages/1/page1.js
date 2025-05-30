const taskQueue = require('./taskQueue');
class Page1 {
    constructor() {        
    }

    OnHttpRequest(server,req, res) {
        try {
            // POST para geração de imagem - PROJECT 1
            if (req.method === "POST" && req.url === "/gerar-imagem") {
                //console.log('a')
                server.WaiToCLOSE(true);
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        if (typeof data.prompt === "string" && data.prompt.trim() !== "") {
                            taskQueue.add(data.prompt, res)
                                .then((lastLine) => {
                                    server.WaiToCLOSE(false);
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ status: lastLine }));
                                })
                                .catch((err) => {
                                    server.WaiToCLOSE(false);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ status: `Erro interno: ${err}` }));
                                });
                        } else {
                            server.WaiToCLOSE(false);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'Prompt inválido ou vazio' }));
                        }
                    } catch (e) {
                        server.WaiToCLOSE(false);
                        console.error('Erro ao processar JSON:', e);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'JSON inválido' }));
                    }
                });
                return true;
            }



        } catch (error) {
            console.error('Erro processando a requisição em page1:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro interno do servidor');
            return true;
        }
    }

}

module.exports = new Page1();