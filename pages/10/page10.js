const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Page11 {
    constructor() { }

    OnHttpRequest(server, req, res) {
        if (req.url === "/10/newshader") {
            // Headers CORS para TODAS as respostas
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            // 🔥 Responder o preflight (ESSENCIAL)
            if (req.method === "OPTIONS") {
                res.writeHead(200);
                res.end();
                return true;
            }
        }
        if (req.method === "POST" && req.url === "/10/newshader") {
            server.WaiToCLOSE(true);

            let body = '';

            req.on('data', chunk => body += chunk);

            req.on('end', () => {
                try {
                    const data = JSON.parse(body);

                    if (typeof data.action !== "string") {
                        server.WaiToCLOSE(false);
                        console.error('Erro ao processar JSON:', e);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'JSON inválido' }));
                        return true;
                    }

                    if (data.action.trim() == "save" &&
                        typeof data.name === "string" && data.name.trim() !== "" &&
                        typeof data.frag === "string" && data.frag.trim() !== "" &&
                        typeof data.vert === "string" && data.vert.trim() !== ""
                    ) {
                        // 📁 pasta de entrada (ainda não validado)
                        const pendingDir = '/www/pages/10/gls_pending';
                        if (!fs.existsSync(pendingDir)) {
                            fs.mkdirSync(pendingDir, { recursive: true });
                        }

                        // 🆔 ID único (não depende mais de índice)
                        const id = crypto.randomUUID();

                        const shaderDir = path.join(pendingDir, id);
                        fs.mkdirSync(shaderDir);

                        // 💾 arquivos
                        fs.writeFileSync(path.join(shaderDir, 'name.txt'), data.name);
                        fs.writeFileSync(path.join(shaderDir, 'frag.glsl'), data.frag);
                        fs.writeFileSync(path.join(shaderDir, 'vert.glsl'), data.vert);


                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'pendente',
                            id: id
                        }));

                        server.WaiToCLOSE(false);
                        return true;
                    }

                    if (data.action == "load") {
                        const base = '/www/pages/10/gls';
                        const dirs = fs.readdirSync(base);
                        let rndid = 0;
                        let shaders = [];
                        for (let id of dirs) {
                            const dir = path.join(base, id);
                            try {
                                //const metaPath = path.join(dir, "meta.json");
                                const vertPath = path.join(dir, "vert.glsl");
                                const fragPath = path.join(dir, "frag.glsl");
                                const fname = path.join(dir, "name.txt");
                                if (
                                    !fs.existsSync(vertPath) ||
                                    !fs.existsSync(fragPath) ||
                                    !fs.existsSync(fname)
                                ) continue;
                                //const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
                                shaders.push({
                                    id: rndid,
                                    name: fs.readFileSync(fname, "utf8"),
                                    vert: fs.readFileSync(vertPath, "utf8"),
                                    frag: fs.readFileSync(fragPath, "utf8")
                                });
                                rndid++;
                            } catch (e) {
                                console.log("skip shader", id);
                            }
                        }
                        server.WaiToCLOSE(false);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ shaders }));
                        return true;
                    }

                    server.WaiToCLOSE(false);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'Fail' }));
                    return true;

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

module.exports = new Page11();