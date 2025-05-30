const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


const { webcrypto } = require('crypto');
const crypto = webcrypto;
const frameMax = 20; //qtd de imagens de amostra == no face.cpp == no js
const maxFrameTimeCode = 20; //20 segundos para receber do js (sendImageBurst)
const sidesrangeDef = 5; //left right angle diference
const topsrangeDef = 5; //top bottom angle diference
const totalChallenges = 4;//2; //number of challenges to client pass (entry.save.challenge)
const totalChallengesRetry = 5;//3; //number of retry challenges on fail (entry.save.retry)
const challenge2angleMaxAttempts = 10;//4; //max attempt to wait client on start position in CHALLENGESTART (entry.save.attempt)
const maxScriptSize=200;
const currentPath="/www/pages/4/";

class Page4 {
    constructor() {
        this.dataID = {};//dados do ID
        this.chave = "didisoftwares";
    }

    OnHttpRequest(server, req, res) {
        try {
            // POST para geração de imagem - PROJECT 1            
            if (req.method === "POST" && req.url.startsWith("/page4savecfg")) {
                server.WaiToCLOSE(true);
                let body = "";
                req.on('data', chunk => {
                  body += chunk.toString();
                });
              
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
              
                    // Campos esperados
                    let {
                      post,
                      email,
                      password,
                      scriptSuccess,
                      scriptFail,
                      challenge,
                      retry,
                      attempt
                    } = data;                                  

                    // Validações    
                    const ispost =typeof post === 'string' && post.length <= maxScriptSize;
                    const isEmailValid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    const isPasswordValid = typeof password === 'string' && password.length > 4;
                    const isScriptSuccessValid = typeof scriptSuccess === 'string' && scriptSuccess.length <= maxScriptSize;
                    const isScriptFailValid = typeof scriptFail === 'string' && scriptFail.length <= maxScriptSize;
                    const isChallengeValid = Number.isInteger(challenge = parseInt(challenge)) && challenge >= 1 && challenge <= totalChallenges;
                    const isRetryValid = Number.isInteger(retry = parseInt(retry)) && retry >= 0 && retry <= totalChallengesRetry;
                    const isAttemptValid = Number.isInteger(attempt = parseInt(attempt)) && attempt >= 1 && attempt <= challenge2angleMaxAttempts;
              
                    if (!isEmailValid) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end("Invalid Email");
                        return;
                      }
                      if (!isPasswordValid ) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end("Password too short");
                        return;
                      }
                      if (!isScriptSuccessValid || !isScriptFailValid || !ispost) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end("Script or URL too Big");
                        return;
                      }
                    if (!isChallengeValid || !isRetryValid || !isAttemptValid) {
                      res.writeHead(400, { 'Content-Type': 'text/plain' });
                      res.end("Invalid input data");
                      return;
                    }
              
                    // Dados limpos
                    const novoDado = {
                      post,
                      email,
                      password,
                      scriptSuccess,
                      scriptFail,
                      challenge,
                      retry,
                      attempt
                    };
              
                    const savePath = currentPath + '/configuracoes.json';
                    let dadosExistentes = [];
              
                    if (fs.existsSync(savePath)) {
                      const rawData = fs.readFileSync(savePath, 'utf8');
                      dadosExistentes = JSON.parse(rawData);
                    }
              
                    const index = dadosExistentes.findIndex(d => d.email === email);
                    if (index !== -1) {
                       if(dadosExistentes[index].password!==novoDado.password){
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end("Wrong Password");
                        return; 
                       }
                      dadosExistentes[index] = novoDado;
                    } else {
                      dadosExistentes.push(novoDado);
                    }
              
                    fs.writeFile(savePath, JSON.stringify(dadosExistentes, null, 2), (err) => {
                      if (err) {
                        console.error("Erro ao salvar arquivo:", err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end("Save Fail.");
                        return;
                      }
              
                      console.log("Dados atualizados com sucesso.");
                      res.writeHead(200, { 'Content-Type': 'text/plain' });
                      res.end("SUCESS");
                    });
              
                  } catch (err) {
                    console.error("Erro ao processar JSON:", err);
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end("Error Data Format.");
                  }
                });
              
                return true;
              }
              
        } catch (error) {
            console.error('Erro processando a requisição em page4:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Error');
            return true;
        }
    }


    readScripts(email){
        const savePath = currentPath+'/configuracoes.json';
        let dadosExistentes = [];

        // Lê os dados existentes, se o arquivo existir
        if (fs.existsSync(savePath)) {
            const rawData = fs.readFileSync(savePath, 'utf8');
            dadosExistentes = JSON.parse(rawData);
        }

        // Verifica se o email já existe e atualiza ou adiciona
        const index = dadosExistentes.findIndex(d => d.email === email);
        if (index !== -1) {
            return dadosExistentes[index];
        } else {
            return null;
        }
    }

    executarComando(command) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: '/www/pages/4/facesdk/' }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro: ${error.message}`);
                    return reject(`Erro: ${error.message}`);
                }
                const lines = stdout.trim();//.split('\n');
                resolve(lines);
            });
        });
    }


    async gerarChave(chaveTexto) {
        const encoder = new TextEncoder();
        const chaveBuffer = encoder.encode(chaveTexto.padEnd(32)); // AES-256 requer 32 bytes
        return await crypto.subtle.importKey(
            "raw",
            chaveBuffer,
            "AES-GCM",
            false,
            ["encrypt", "decrypt"]
        );
    }

    async criptografar(texto, chaveTexto) {
        const chave = await this.gerarChave(chaveTexto);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // vetor de inicialização
        const dados = new TextEncoder().encode(texto);

        const cifrado = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            chave,
            dados
        );

        // Junta IV + dados cifrados
        const resultado = new Uint8Array(iv.length + cifrado.byteLength);
        resultado.set(iv);
        resultado.set(new Uint8Array(cifrado), iv.length);

        return btoa(String.fromCharCode(...resultado));
    }

    async descriptografar(base64, chaveTexto) {
        const dados = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const iv = dados.slice(0, 12);
        const cifrado = dados.slice(12);
        const chave = await this.gerarChave(chaveTexto);

        const decifrado = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            chave,
            cifrado
        );

        return new TextDecoder().decode(decifrado);
    }

    async cryptoStr() {
        const timestampSegundos = Math.floor(Date.now() / 1000);
        const criptostr = await this.criptografar(timestampSegundos, this.chave);
        return criptostr;
    }

    random1to4(different = []) {
        const opcoes = [1, 2, 3, 4].filter(n => !different.includes(n));
        if (opcoes.length === 0) {
            throw new Error("Não há números disponíveis para sortear.");
        }
        const indice = Math.floor(Math.random() * opcoes.length);
        return opcoes[indice];
    }




    forçarDesconexao(id) {
        var conn = this.dataID[id].conn;
        if (conn && conn.close) {
            console.log(`❌ [ID ${id}] forçando a desconectando...`);
            conn.close(); // Fecha a conexão WebSocket
            this.deleteAllFrames(id);
            if (this.dataID[id]) {
                delete this.dataID[id]; // Apaga os dados do ID                
            }
        } else {
            console.log(`⚠️ [ID ${id}] Falha ao tentar desconectar, conexão inválida.`);
        }
    }


    async onSocketRequest(msg, conn) {
        const id = msg.ID;
        if (!id) return;



        // Desconexão: limpa dados
        if (msg.KEY === "DISCONNECTED") {
            if (this.dataID[id]) {
                delete this.dataID[id];
                console.log(`❌ [ID ${id}] desconectado. Dados removidos.`);
            }
            return;
        }

        // Inicializa estrutura se necessário
        if (!this.dataID[id]) {
            this.dataID[id] = {
                frames: 0,
                liveness: 0,
                pass: 0,
                pitch: 0.0,
                yaw: 0.0,
                challenge: [],
                retry: 0,
                retryActive: 0,
                retryCS: 0,
                mail:"",
                token:null,
                save:null,
                conn: conn
            };
            this.deleteAllFrames(id);
        }
        const entry = this.dataID[id];

        //console.log('msg', msg.KEY, entry.pass);

        // Conexão: envia comando para capturar frame
        if (msg.KEY === "PROJ04#CONNECTED" && msg.DATA) {
            if (entry.pass != 0) {//secury code must be 0
                console.log('Wrong Pass 0');
                this.forçarDesconexao(id); return;
            } else {
                if(!msg.DATA.EMAIL){
                    console.log('No EMAIL');
                    this.forçarDesconexao(id); return;
                }  
                entry.save=this.readScripts(msg.DATA.EMAIL);  
                entry.token=msg.DATA.TOKEN;                        
                if(entry.save==null){
                    console.log('Email invalid',msg.DATA.EMAIL);
                    this.forçarDesconexao(id); return;
                }
                console.log("connected",msg.DATA.EMAIL);
                conn.send(JSON.stringify({
                    CMD: "SCRIPTFAIL",
                    CODE: entry.save.scriptFail.replaceAll('#TOKEN#',entry.token)
                }));
                /* CHALLENGE
                entry.pass = 2;
                const challengeN = entry.challenge;
                challengeN.push(this.random1to4());
                entry.conn.send(JSON.stringify({
                    CMD: "CHALLENGE",
                    CODE: await this.cryptoStr(),
                    NUMBER: challengeN[challengeN.length - 1]
                }));
                CHALLENGE */
                entry.mail = msg.DATA.EMAIL;
                entry.pass = 1; //First PASS Liveness
                conn.send(JSON.stringify({
                    CMD: "GETFRAME",
                    CODE: await this.cryptoStr()
                }));
            }
        }



        //PASS 2 to up - CHALLENGE
        if (msg.KEY === "PROJ04#CHALLENGE" && msg.DATA) {
            //console.log(entry.pass);        
            if (entry.pass < 2) { //CHALLENGE PASS 2 = first challenge
                console.warn(`❌ [ID ${id}] Tentantiva de challenge sem passar por Livness`);
                this.forçarDesconexao(id);
                return;
            } else {
                const challengeN = entry.challenge;
                if (challengeN.length == entry.save.challenge) {
                    //########### END ALL CHALLENGE ###########
                    this.finishAll(id);
                    return;
                }
                if (entry.retryActive == 0) {
                    challengeN.push(this.random1to4(challengeN));
                }
                //challengeN.push(2);
                //1- Left
                //2- Right
                //3- Top
                //4- Bottom
                entry.conn.send(JSON.stringify({
                    CMD: "CHALLENGE",
                    CODE: await this.cryptoStr(),
                    NUMBER: challengeN[challengeN.length - 1]
                }));
                return;
            }
        }

        //recebimento de imagem para challenge
        if (msg.KEY === "PROJ04#CHALLENGESTART" && msg.DATA) {
            const { IMG, FRAME, CODE } = msg.DATA;
            if (!IMG || !FRAME) return;
            const Cnhumber = FRAME;
            const challengeN = entry.challenge[entry.challenge.length - 1];
            if (Cnhumber != challengeN) {
                console.warn(`❌ [ID ${id}] Tentantiva de challengestart invalido`);
                this.forçarDesconexao(id);
                return;
            }
            entry.retryCS = entry.retryCS + 1;
            if (entry.retryCS > entry.save.attempt) {
                console.warn(`❌ [ID ${id}] Tentantiva ultrapassou entry.save.attempt em challengestart`);
                entry.conn.send(JSON.stringify({ CMD: "LIVNESS", RESULT: "Liveness check failed" }));
                entry.pass = 99;
                return;
            }
            this.saveFrame(id, '0', IMG);
            const comando = `./exec 2CHALLENGE${challengeN} ${id}`;
            console.log('cmd', comando);
            var challengeResult = await this.executarComando(comando);
            //console.log(challengeResult, entry.yaw, entry.pitch);
            if (challengeResult == "Numero do desafio invalido") {
                console.log('Desafio Invalido[CHALLENGESTART]');
                this.forçarDesconexao(id);
                return;
            } else {
                var sidesrange = sidesrangeDef;
                var topsrange = topsrangeDef;
                var passChallenge = false;
                if (challengeN == 1 || challengeN == 2) { //SIDES
                    if (challengeN == 1) {
                        //console.log(challengeResult - entry.yaw);
                        if ((challengeResult - entry.yaw) < (sidesrange * -1)) { //esq
                            passChallenge = true;
                        }
                    }
                    if (challengeN == 2) {
                        if ((challengeResult - entry.yaw) > sidesrange) { //dir
                            passChallenge = true;
                        }
                    }
                } else if (challengeN == 3 || challengeN == 4) { //UPDOWN
                    if (challengeN == 3) {
                        //console.log(challengeResult - entry.pitch);
                        if ((challengeResult - entry.pitch) < (topsrange * -1)) { //up
                            passChallenge = true;
                        }
                    }
                    if (challengeN == 4) {
                        if ((challengeResult - entry.pitch) > topsrange) { //down
                            passChallenge = true;
                        }
                    }
                } else {
                    console.log('Error Challenge[CHALLENGESTART]');
                    this.forçarDesconexao(id);
                    return;
                }
                if (passChallenge == false) { //no get correct angle try again                   
                    entry.conn.send(JSON.stringify({ CMD: "CHALLENGESTART", NUMBER: Cnhumber }));
                } else { //corret angle
                    entry.retryCS = 0;
                    entry.conn.send(JSON.stringify({ CMD: "CHALLENGESTARTSEND", CODE: await this.cryptoStr() }));
                }
            }
        }

        // Recebimento de imagem
        if (msg.KEY === "PROJ04#IMAGE" && msg.DATA) {
            const { IMG, FRAME, CODE } = msg.DATA;
            if (!IMG || !FRAME || !CODE) return;


            // Descriptografa e valida o código
            let timestampStr;
            try {
                timestampStr = await this.descriptografar(CODE, this.chave);
            } catch (err) {
                console.warn(`❌ [ID ${id}] CODE inválido ou falha na descriptografia.`);
                this.forçarDesconexao(id);
                return;
            }

            const timestamp = parseInt(timestampStr);
            const now = Math.floor(Date.now() / 1000);
            if (isNaN(timestamp) || Math.abs(now - timestamp) > maxFrameTimeCode) {
                console.warn(`⚠️ [ID ${id}] CODE fora do tempo válido (${now - timestamp}s). Ignorando frame.`);
                return;
            }



            //PASS 1
            if (entry.pass == 1) {//LIVENES CHECK FRAMES                
                await this.checkLivenes(id, FRAME, IMG);
                return;
            }

            //PASS 2            
            if (entry.pass >= 2 && (entry.pass - 2) < entry.save.challenge) {//FIRST CHALLENGE                
                await this.checkChallenge(id, FRAME, IMG);
                return;
            }

        }
    }

    async finishAll(id) {
        const entry = this.dataID[id];
        let urlPost = entry.save?.post;                
                    
        try {
            urlPost = urlPost.trim();
            const url = new URL(urlPost);
            url.searchParams.set("TOKEN", entry.token);
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            const res = await fetch(url.toString(), {
                method: "GET"
            });
    
            if (!res.ok) {
                console.error(`Erro no GET (${res.status}):`, await res.text());
            } else {
                console.log("GET enviado com sucesso.");
            }
        } catch (err) {
            console.error("Erro na URL ou no fetch:", urlPost);            
        }
    
        console.log("ALL CHALLENGE ENDED");
        this.dataID[id].conn.send(JSON.stringify({ 
            CMD: "FINISHED", 
            CODE: entry.save.scriptSuccess.replaceAll('#TOKEN#', entry.token)
        }));
    }
    
    

    async saveFrame(id, FRAME, IMG) {
        // Salva imagem        
        const dirPath = path.join(currentPath, 'capturas', id);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, `${FRAME}.jpg`);
        const buffer = Buffer.from(IMG, 'base64');
        fs.writeFile(filePath, buffer, (err) => {
            if (err) return;
        });
    }

    async deleteAllFrames(id) {
        const dirPath = path.join(currentPath, 'capturas', id);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Erro ao deletar arquivo ${filePath}:`, err);
                }
            }
        }
    }

    async checkLivenes(id, FRAME, IMG) {
        const entry = this.dataID[id];
        // Já atingiu o máximo de frames
        if (entry.frames >= frameMax) return;
        entry.frames++;
        this.saveFrame(id, FRAME, IMG);

        // Se atingiu o limite, executa o comando
        if (entry.frames >= frameMax) {
            //const comando = `./exec TESMPLATECHECK ${id}`; -> 0.0 ate 1.0
            var comando = `./exec LIVNESS ${id}`;
            console.log('cmd', comando);
            entry.liveness = await this.executarComando(comando);
            console.log(entry.liveness);
            if (entry.liveness == "Liveness check passed") {
                comando = `./exec GETPITCH ${id}`;
                var comandoResult = await this.executarComando(comando);
                comandoResult = comandoResult.split(':');
                if (comandoResult[0] == "99") {
                    entry.liveness = "Nao foi possivel determinar liveness";
                } else {
                    entry.pass = 2;
                    entry.yaw = comandoResult[0];
                    entry.pitch = comandoResult[1];
                }
            }
            entry.frames = 0;
            entry.conn.send(JSON.stringify({ CMD: "LIVNESS", RESULT: entry.liveness }));
        }
    }

    async checkChallenge(id, FRAME, IMG) {
        const entry = this.dataID[id];
        // Já atingiu o máximo de frames
        if (entry.frames >= frameMax) return;
        entry.frames++;
        this.saveFrame(id, FRAME, IMG);

        const challengeN = entry.challenge[entry.challenge.length - 1];

        //this.dataID[id].pass+= 1;
        //entry.conn.send(JSON.stringify({ CMD: "NEXTCHALLENGE", RESULT: "Challenge passed" })); 
        //return;
        //1- Left
        //2- Right
        //3- Top
        //4- Bottom        

        // Se atingiu o limite, executa o comando
        if (entry.frames >= frameMax) {
            //const comando = `./exec TESMPLATECHECK ${id}`; -> 0.0 ate 1.0
            const comando = `./exec CHALLENGE${challengeN} ${id}`;
            console.log('cmd', comando);
            var challengeResult = await this.executarComando(comando);
            //console.log(challengeResult, entry.yaw, entry.pitch);
            if (challengeResult == "Numero do desafio invalido") {
                console.log('Desafio Invalido');
                this.forçarDesconexao(id);
                return;
            } else {
                var sidesrange = sidesrangeDef;
                var topsrange = topsrangeDef;
                var passChallenge = false;
                if (challengeN == 1 || challengeN == 2) { //SIDES
                    if (challengeN == 1) {
                        //console.log(challengeResult - entry.yaw);
                        if ((challengeResult - entry.yaw) < (sidesrange * -1)) { //esq
                            passChallenge = true;
                        }
                    }
                    if (challengeN == 2) {
                        if ((challengeResult - entry.yaw) > sidesrange) { //dir
                            passChallenge = true;
                        }
                    }
                } else if (challengeN == 3 || challengeN == 4) { //UPDOWN
                    if (challengeN == 3) {
                        //console.log(challengeResult - entry.pitch);
                        if ((challengeResult - entry.pitch) < (topsrange * -1)) { //up
                            passChallenge = true;
                        }
                    }
                    if (challengeN == 4) {
                        if ((challengeResult - entry.pitch) > topsrange) { //down
                            passChallenge = true;
                        }
                    }
                } else {
                    console.log('Error Challenge');
                    this.forçarDesconexao(id);
                    return;
                }
                entry.frames = 0;
                if (passChallenge == false) {
                    if (entry.retry >= entry.save.retry) {
                        entry.frames = 0;
                        entry.conn.send(JSON.stringify({ CMD: "CHALLENGEFAIL", RESULT: challengeResult, N: challengeN }));
                        this.forçarDesconexao(id);
                    } else {
                        this.deleteAllFrames(id);
                        entry.retry = entry.retry + 1;
                        entry.retryActive = 1;
                        entry.frames = 0;
                        entry.conn.send(JSON.stringify({ CMD: "CHALLENGERETRY", RESULT: challengeResult, N: challengeN }));
                    }
                } else {
                    entry.retryActive = 0;
                    entry.pass = entry.pass + 1;
                    this.deleteAllFrames(id);
                    entry.frames = 0;
                    entry.conn.send(JSON.stringify({ CMD: "NEXTCHALLENGE", RESULT: challengeResult }));
                }
            }
            //if (challengeResult == "Challenge passed") {
            //    entry.pass = entry.pass + 1;
            //}
            //if(entry.pass==2)            
        }
    }

}

module.exports = new Page4();
