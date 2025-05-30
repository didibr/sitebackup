const fs = require('fs');
const path = require('path');

class Page10 {
    constructor() {        
    }

    OnHttpRequest(server,req, res) {
       

if (req.method === "POST" && req.url === "/10/newshader") {
    server.WaiToCLOSE(true);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            if (typeof data.name === "string" && data.name.trim() !== "" &&
                typeof data.frag === "string" && data.frag.trim() !== "" &&
                typeof data.vert === "string" && data.vert.trim() !== "") {
                
                const saveDir = '/www/pages/10/gls'; // Pasta onde salvar
                if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

                const files = fs.readdirSync(saveDir);
                const numbers = files
                    .map(file => parseInt(file.match(/^(\d+)/)?.[1]))
                    .filter(n => !isNaN(n));
                const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 0;

                const baseName = path.join(saveDir, nextNumber.toString());

                fs.writeFileSync(baseName + '.txt', data.name);
                fs.writeFileSync(baseName + '_frag.txt', data.frag);
                fs.writeFileSync(baseName + '_vert.txt', data.vert);

                console.log('Arquivos salvos:', baseName);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'sucesso', id: nextNumber }));

                server.WaiToCLOSE(false);
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

    }

}

module.exports = new Page10();