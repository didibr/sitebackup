//const http = require('http');
console.log('Dir atual:', process.cwd());
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const wsocket = require('ws');
const { spawn } = require('child_process');


//const taskQueue = require('./taskQueue');
const CON = [];

TIMES = { DELETE: 80000, PENDING: 300000, COMPLETE: 600000 };
WAITCONFIRM = [];//{file,id,stat {DELETE,PENDING,COMPLETE} time=(timeout)}
UPLOADLOCATION = '/www/pages/12/upload';
UPLOADLOCATION_EL = 'z:\\www\\pages\\12\\upload';


async function convertGLBtoOBJ(inputPath, outputDir) {
    if (!fs.existsSync(inputPath)) {
        throw new Error('Arquivo de entrada não encontrado.');
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, fileName + '.fbx');
    //./www/pages/12/blender/blender-4.4.3-linux-x64/blender/blender -b -P /www/pages/12/blenderconvert.py -- /www/pages/12/upload/zbot.glb /www/pages/12/upload/teste.fbx
    //./blender -b -P /www/pages/12/accutomix.py -- /www/pages/12/upload/base_rigged_noskin.fbx /www/pages/12/upload/human_u.fbx /www/pages/12/upload/mixout.fbx
    //blender -b -P /www/pages/12/rescale.py -- /www/pages/13/wood_rigged.fbx /www/pages/13/base.fbx
    const blenderPath = '/www/pages/12/blender/blender-4.4.3-linux-x64/blender'; // ou caminho completo, ex: /usr/bin/blender
    const scriptPath = '/www/pages/12/blenderconvert.py';
    //./blender -b -P /www/pages/12/blenderconvert.py -- /www/pages/12/upload/zbot.glb /www/pages/12/upload/teste.fbx


    console.log('🔁 Convertendo via Blender...');
    
    return new Promise((resolve, reject) => {
        const proc = spawn(blenderPath, [
            '-b', // modo background (sem interface)
            '-P', scriptPath,
            '--',
            inputPath,
            outputPath
        ]);

        proc.stdout.on('data', data => {
            console.log('[Blender]', data.toString());
        });

        proc.stderr.on('data', data => {
            console.error('[Blender Error]', data.toString());
        });

        proc.on('close', code => {
            if (code === 0) {
                console.log('✅ Conversão finalizada:', outputPath);
                resolve(outputPath);
            } else {
                //reject(new Error('Blender retornou erro com código: ' + code));
                console.log("Error Conversion");
                resolve(null);
            }
        });
    });
}





function deleteFile(savePath) {
    console.log('DeleteFile', savePath);
    const dir = path.dirname(savePath);
    const base = path.basename(savePath, path.extname(savePath)); // nome sem extensão
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error('Erro ao ler o diretório:', err);
            return;
        }
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const nameWithoutExt = path.parse(file).name;

            if (nameWithoutExt === base) {
                fs.stat(fullPath, (err, stat) => {
                    if (err) return;

                    if (stat.isDirectory()) {
                        // Deleta diretório
                        fs.rm(fullPath, { recursive: true, force: true }, (err) => {
                            if (err) {
                                //console.error('Erro ao deletar diretório:', err);
                            } else {
                                console.log('✅ Diretório deletado:', fullPath);
                            }
                        });
                    } else {
                        // Deleta arquivo
                        fs.unlink(fullPath, (err) => {
                            if (err) {
                                //console.error('Erro ao deletar arquivo:', err);
                            } else {
                                console.log('✅ Arquivo deletado:', fullPath);
                            }
                        });
                    }
                });
            }
        });
    });
}


class ElectronClientWS {
    constructor() {
        this.ws = null;
        this.queue = [];
        this.isReady = false;
        this.isConnecting = false;
        //this.connect();
    }

    connect() {
        if (this.isReady || this.isConnecting) {
            console.log('⚠️ Conexão já ativa ou tentativa em andamento.');
            return;
        }
        this.isConnecting = true;

        this.ws = new wsocket('ws://localhost:4000');

        this.ws.on('open', () => {
            this.isConnecting = false;
            console.log('🟢 Conectado ao WebSocket');
        });

        this.ws.on('message', data => {
            try {
                const msg = JSON.parse(data);
                console.log('from electron', msg);


                if (msg.CMD === "PROGRESS" && msg.ID && msg.VALUE) {
                    const currentUSER = CON.find(c => c.id === msg.ID);
                    if (!currentUSER) { return; }
                    currentUSER.conn.send(JSON.stringify({ CMD: "PROGRESS", VALUE: msg.VALUE }));
                }

                if (msg.CMD === "CONVERT_FBX" && msg.ID) {
                    const currentUSER = CON.find(c => c.id === msg.ID);
                    if (!currentUSER) { return; }
                    const fileUser = WAITCONFIRM.find(c => c.id === msg.ID);
                    let savePath = "";
                    if (fileUser) {
                        clearTimeout(fileUser.time);
                        savePath = path.join(UPLOADLOCATION, fileUser.file);
                    }
                    if (msg.STATUS == 0) {
                        if (fileUser) {
                            deleteFile(savePath);
                        }
                    }
                    if (fileUser) {
                        fileUser.file = null;
                    }
                    currentUSER.conn.send(JSON.stringify({ CMD: "CONVERT_FBX", STATUS: msg.STATUS }));
                }


            } catch (err) {
                console.error('❌ Erro no parse da resposta:', err);
            }
        });

        this.ws.on('close', () => {
            this.isReady = false;
            this.isConnecting = false;
            console.warn('🔴 WebSocket desconectado');
            setTimeout(() => {
                this.connect();
            }, 30000);
        });

        this.ws.on('error', err => {
            this.isReady = false;
            this.isConnecting = false;
            console.error('❌ Erro no WebSocket:', err);
        });
    }

    send(data) {
        this.ws.send(data);
    }
}



class Page12 {
    constructor() {
        this.ELECTRON = new ElectronClientWS();
    }


    deleteWaiter(id) {
        //console.log('DeleteFile', id);
        const currentUSER = CON.find(c => c.id === id);
        if (!currentUSER) {
            return;
        }
        const fileUser = WAITCONFIRM.find(c => c.id === id);
        if (!fileUser) return;
        if (fileUser.time) {
            clearTimeout(fileUser.time);
            fileUser.time = null;
        }
        if (!fileUser.file || fileUser.file == null) return;
        const savePath = path.join(UPLOADLOCATION, fileUser.file);
        deleteFile(savePath);
    }

    deleteFiles(id) { //delete all files from user
        const currentUSER = CON.find(c => c.id === id);
        if (!currentUSER) {
            return;
        }
        currentUSER.files.forEach((fname) => {
            deleteFile(path.join(UPLOADLOCATION, fname));
        })
    }


    OnHttpRequest(server, req, res) {
        try {
            const url = req.url;
            const method = req.method;
            const contentType = req.headers['content-type'] || '';

            if (method === 'POST' && url === '/12/PROJ12UPLOAD' && contentType.startsWith('multipart/form-data')) {
                console.log('passou');
                const boundary = '--' + contentType.split('boundary=')[1];
                let body = Buffer.alloc(0);

                req.on('data', chunk => {
                    body = Buffer.concat([body, chunk]);
                });

                req.on('end', () => {
                    const parts = body.toString('binary').split(boundary).filter(part => part.includes('Content-Disposition'));

                    let myID = null;
                    let savedFilePath = null;
                    let randomName = null;

                    // Extrair campo myID (campo de texto simples)
                    parts.forEach(part => {
                        if (part.includes('name="myID"')) {
                            const match = part.match(/\r\n\r\n([\s\S]*?)\r\n$/);
                            if (match) {
                                myID = match[1].trim();
                            }
                        }
                    });

                    if (myID == null) {
                        console.error('❌ No id on upload:');
                        res.writeHead(500);
                        return;
                    }
                    console.log('myID', myID);
                    const currentUSER = CON.find(c => c.id === myID);
                    if (!currentUSER || currentUSER.id != myID) {
                        console.error('❌ No id match or exist:');
                        res.writeHead(500);
                        return;
                    }

                    // Extrair arquivo
                    parts.forEach(part => {
                        if (part.includes('name="uploadedFile"') && part.includes('filename="')) {
                            const filenameMatch = part.match(/filename="(.+?)"/);
                            const fileContentMatch = part.split('\r\n\r\n')[1];

                            if (fileContentMatch) {
                                randomName = crypto.randomBytes(16).toString('hex') + path.extname(filenameMatch ? filenameMatch[1] : '.bin');
                                let fileExists = WAITCONFIRM.find(c => c.file === randomName);
                                while (fileExists) {
                                    randomName = crypto.randomBytes(16).toString('hex') + path.extname(filenameMatch ? filenameMatch[1] : '.bin');
                                    fileExists = WAITCONFIRM.find(c => c.file === randomName);
                                }
                                const savePath = path.join(UPLOADLOCATION, randomName);
                                fs.writeFileSync(savePath, fileContentMatch.replace(/\r\n$/, ''), 'binary');
                                var thisclass = this;
                                WAITCONFIRM.push({
                                    file: randomName,
                                    id: myID,
                                    stat: 'DELETE',
                                    time: setTimeout(() => { thisclass.deleteWaiter(myID) }, TIMES.DELETE)
                                });
                                savedFilePath = savePath;
                            }
                        }
                    });

                    console.log(`✅ Upload recebido! myID=${myID}, arquivo salvo em ${savedFilePath}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end();

                    currentUSER.files.push(randomName);
                    setTimeout(() => {
                        currentUSER.conn.send(JSON.stringify({ CMD: "UPLOADCOMPLETE" }));
                    }, 100);

                });

                req.on('error', (err) => {
                    console.error('❌ Erro no upload:', err);
                    res.writeHead(500);
                    res.end('Erro no upload');
                });

                return true;
            }

            // Se não era upload, 404
            res.writeHead(404);
            res.end('Rota não encontrada');
        } catch (err) {
            console.error('❌ Erro geral:', err);
            res.writeHead(500);
            res.end('Erro interno');
        }
    }


    async onSocketRequest(msg, conn) {
        console.log("12 socket:", msg);
        try {
            if (!msg || msg.KEY !== "PROJ12#SOCKET") return;
            if (!msg.DATA) return;
            const id = msg.ID || null;

            //const { speech, lang, type, rate, pitch, volume } = msg.DATA || {};
            // Validação dos dados
            /*
            if (!speech || !lang || typeof type === "undefined" || typeof rate === "undefined" ||
                typeof pitch === "undefined" || typeof volume === "undefined") {
                conn.send(JSON.stringify({
                    CMD: "ERROR",
                    MSG: "Campos obrigatórios ausentes."
                }));
                return;
            }
            const novoDado = { speech, lang, type, rate, pitch, volume };            
            const audioUrl = await taskQueue.add(novoDado,conn);
    
            */
            if (msg.DATA.CONNECT && id) {
                console.log(`🟢 Cliente conectado: ${id}`);
                const alreadyExists = CON.find(c => c.id === id);
                if (!alreadyExists) {
                    CON.push({ id, conn, files: [] });
                    // Garante remoção automática se o socket fechar
                    conn.on('close', () => {
                        const index = CON.findIndex(c => c.id === id);
                        if (index !== -1) {
                            console.log(`🔴 Cliente desconectado: ${id}`);
                            this.deleteFiles(id);
                            CON.splice(index, 1);
                        }
                    });
                }
                conn.send(JSON.stringify({ CMD: "ACCEPTED", MSG: id }));
                return;
            }

            //ACTIONS
            if (msg.DATA.ACTION && msg.DATA.ACTION) {

                //######### CONVERT TO OBJ ############
                if (msg.DATA.ACTION === 'CONVERTOBJ') {
                    console.log('SEND TO EL from ', id);
                    const currentUSER = CON.find(c => c.id === id);
                    if (!currentUSER) { return; }
                    const fileUser = WAITCONFIRM.find(c => c.id === id);
                    if (!fileUser || fileUser.file == null) {  //invalid file
                        currentUSER.conn.send(JSON.stringify({ CMD: "CONVERT_OBJ", STATUS: 0 }));
                        return;
                    }
                    const fileExt = path.extname(fileUser.file).toLowerCase();
                    const fileName = path.basename(fileUser.file, fileExt);
                    const fullfileName =path.join(UPLOADLOCATION, fileUser.file);
                    //console.log(extension);
                    if(fileExt===".glb" ||  fileExt===".gltf"){
                        console.log('tentando converter:',fullfileName);
                       await convertGLBtoOBJ(fullfileName, UPLOADLOCATION);
                       console.log('glb converted');
                    }else if(extension===".fbx"){

                    }
                }

                //WORKING WITH FBX
                if (msg.DATA.ACTION === 'FBXCONVERT') {//'FBXCONVERT'
                    console.log('SEND TO EL from ', id);
                    const currentUSER = CON.find(c => c.id === id);
                    if (!currentUSER) { return; }
                    const fileUser = WAITCONFIRM.find(c => c.id === id);
                    if (!fileUser || fileUser.file == null) {  //invalid file
                        currentUSER.conn.send(JSON.stringify({ CMD: "CONVERT_FBX", STATUS: 0 }));
                        return;
                    }
                    console.log('SEND TO EL 2');
                    clearTimeout(fileUser.time);
                    const thisclass = this;
                    fileUser.time = setTimeout(() => { thisclass.deleteWaiter(id) }, TIMES.PENDING);
                    this.ELECTRON.send(JSON.stringify({ CMD: "TEST"/*"CONVERT_FBX"*/, ID: id, FILE: fileUser.file, PATH: UPLOADLOCATION_EL }));
                }

            }

            //SEND TO ELECTRON                        


        } catch (err) {
            console.error("Erro catch proj12:", err);
            conn.send(JSON.stringify({
                CMD: "ERROR",
                MSG: "Erro interno"
            }));
        }
    }


}

module.exports = new Page12();
