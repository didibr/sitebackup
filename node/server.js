var http = require('http');
var https = require('https');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const { createReadStream } = require('fs');

let server = null;
let Port = 8080;
let waitClose = false;
let realDir = '/';
let certDir = '/';
let useRelatory = "";
let privKeyName = "/privkey.pem";
let certName = "/cert.pem";
let mainREQUEST = () => { };
let tempHEAD = {};

const allowtransfer = {};
const allowupload = {};
const allowedOPTIONS = [];


function setHTTPSHeader() {
  Object.assign(tempHEAD, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
    //"Access-Control-Allow-Credentials": false,
    "Access-Control-Allow-Headers": "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    //"Cross-Origin-Embedder-Policy": "require-corp",
    //"Cross-Origin-Opener-Policy": "same-origin",
    "Pragma": "no-cache",
    "Expires": "0"
  });
}

const statsFile = path.join(__dirname, 'requests.json');
let requestStats = {};
let whitelist = ["/error"];
let blacklist = [];

function show404(res, extraHtml, extraCode = 200) {
  if (res.writableEnded) { console.log('ja finalizado 1'); return; }
  setHTTPSHeader();
  tempHEAD["Content-Type"] = "text/html";
  res.writeHead(extraCode, tempHEAD);
  if (!extraHtml) extraHtml = "404 - Caminho não permitido";
  res.end(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Error `+ extraCode + `</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(90deg, #dc3545, #6c0f24);
      color: white;
      font-family: sans-serif;
      flex-direction: column;
    }
    h1 {
      font-size: 3em;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Error `+ extraCode + `</h1>` + extraHtml + `
</body>
</html>
`);
}

const suspiciousIPs = {};
const blockDuration = 5 * 60 * 1000; // 5 minutos
const requestLimit = 20;
const timeWindow = 60 * 1000; // 1 minuto

function isWhitelisted(url, req, res) {
  const ip = req.connection.remoteAddress;
  // Bloqueio temporário
  if (suspiciousIPs[ip] && suspiciousIPs[ip].blockedUntil > Date.now()) {
    console.warn(`IP bloqueado temporariamente: ${ip}`);
    show404(res, 'Access denied.', 403);
    //res.writeHead(403, { 'Content-Type': 'text/plain' });
    //res.end('Access denied.');
    return false;
  }

  //SPECIAL ACESS
  if (url.startsWith('/15/downloads/')) return true;

  // Verificação básica de URL maliciosa
  const suspiciousPatterns = [
    /\.\./g,        // tentativa de subir diretórios
    /%2e/i,         // encoded .
    /%2f/i,         // encoded /
    /\\/,           // barra invertida
    /\/\//g,        // barra dupla
    /[\s<>\"']/g    // caracteres suspeitos
  ];
  if (suspiciousPatterns.some(rx => rx.test(url))) {
    console.warn(`Tentativa suspeita detectada de ${ip}: ${url}`);
    recordSuspicious(ip);
    //res.writeHead(400, { 'Content-Type': 'text/plain' });
    //res.end('Bad Request');
    show404(res, 'Bad Request', 400);
    return false;
  }
  // Permite a raiz
  if (url === "/" || url === "/index.html" || url.startsWith("/?")) return true;
  // Verifica se está na whitelist
  const proibido = blacklist.some(prefix => url.startsWith(prefix));
  const permitido = whitelist.some(prefix => url.startsWith(prefix));
  if (proibido || !permitido) {
    recordSuspicious(ip);
    return false;
  }
  return true;
}

function recordSuspicious(ip) {
  const now = Date.now();
  if (!suspiciousIPs[ip]) {
    suspiciousIPs[ip] = { count: 1, firstSeen: now };
  } else {
    suspiciousIPs[ip].count++;
  }
  // Se passar o tempo limite, reseta o contador
  if (now - suspiciousIPs[ip].firstSeen > timeWindow) {
    suspiciousIPs[ip] = { count: 1, firstSeen: now };
  }
  // Se passar do limite, bloqueia
  if (suspiciousIPs[ip].count > requestLimit) {
    suspiciousIPs[ip].blockedUntil = now + blockDuration;
    console.warn(`IP ${ip} bloqueado por excesso de requisições.`);
  }
}


function safeDecodeURI(uri) {
  try {
    return decodeURI(uri);
  } catch (err) {
    console.warn("URL malformada detectada:", uri);
    return "/error";
  }
}

function startRelatory() {
  try {
    if (fs.existsSync(statsFile)) {
      const data = fs.readFileSync(statsFile);
      requestStats = JSON.parse(data);
      console.log("Estatísticas carregadas.");
    }
  } catch (err) {
    console.error("Erro ao carregar estatísticas:", err);
  }
}

function saveStats() {
  try {
    fs.writeFileSync(statsFile, JSON.stringify(requestStats, null, 2));
  } catch (err) {
    console.error("Erro ao salvar estatísticas:", err);
  }
}

function showRelatory(url, res) {
  if (url === useRelatory) {
    if (res.writableEnded) { console.log('ja finalizado 2'); return; }
    setHTTPSHeader();
    tempHEAD["Content-Type"] = "text/html";
    extraCode = "200";
    res.writeHead(extraCode, tempHEAD);
    //res.writeHead(200, { 'Content-Type': 'text/html' });
    const sortedStats = Object.entries(requestStats)
      .sort((a, b) => b[1] - a[1])
      .map(([url, count]) => `<tr><td>${url}</td><td>${count}</td></tr>`)
      .join('');
    res.end(`
                  <html><head><title>Relatorio de Acessos</title></head>
                  <body>
                      <h1>Relatorio de Paginas Mais Acessadas</h1>
                      <table border="1" cellpadding="5">
                          <tr><th>URL</th><th>Contagem</th></tr>
                          ${sortedStats}
                      </table>
                  </body></html>
              `);
    return true;
  }
  return waitClose;
}

function clientdir() {
  return realDir;
}

function movefile(oldPath, newPath) {
  fs.rename(oldPath, newPath, err => err && console.log(`Error moving file from "${oldPath}" to "${newPath}"`));
}

function uploadfile(req, res, uploadDir) {
  const form = new formidable.IncomingForm();
  form.uploadDir = uploadDir;

  form.on("field", (field, value) => {
    // Add field data processing if needed
  });

  form.on("file", (field, file) => {
    const extension = path.extname(file.filepath + file.originalFilename);
    const filename = file.originalFilename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log(`Uploading file: ${file.originalFilename} (${file.size} bytes)`);

    try {
      if (allowupload[extension] && file.mimetype === allowupload[extension].type) {
        if (file.size < allowupload["CONFIG"].size) {
          const local = allowupload[extension].location;
          movefile(file.filepath, local + filename);
          const callback = allowupload[extension].call;
          if (callback) callback(file.filepath, local, filename, res);
        } else {
          console.log("File is too large.");
          fs.unlinkSync(file.filepath);
          show404(res, 'File is Too Large', 500);
          //res.end(); // Invalid
          return;
        }
      } else {
        console.log("Upload not allowed.");
        fs.unlinkSync(file.filepath);
        show404(res, "Not Allowed", 500);
        //res.end(); // Invalid
        return;
      }
    } catch (e) {
      console.log(`Error during upload: ${e}`);
    }
  });

  form.parse(req, err => {
    if (err) console.log("Form parsing error", err);
  });
}

async function fileLoad_old(url, res, req, content, isServer) {
  var newdir = clientdir();
  //setHeader();
  //if (isServer == true) newdir = serverdir;
  var file = path.join(newdir, decodeURIComponent(url));
  var filename = path.basename(file);
  var extension = path.extname(file);
  try {
    //locate on upload location for files missed
    if (!fs.existsSync(file) && typeof (allowupload[extension]) != "undefined") {
      if (fs.existsSync(allowupload[extension].location + '/' + filename)) {
        file = allowupload[extension].location + '/' + filename;
      }
    }



    if (extension == '.mp4' || extension == '.mp3') {
      fs.stat(file, async function (err, stats) {
        tempHEAD["Access-Control-Allow-Origin"] = "*";
        tempHEAD["Access-Control-Allow-Headers"] = "Range";
        tempHEAD["Access-Control-Expose-Headers"] = "Content-Length, Content-Range";
        if (err) {
          console.log(err);
          show404(res, 'File not found<br>' + file);
          //res.writeHead(404, { 'Content-Type': 'text/html' });
          //res.end('File not found<br>' + file);
        } else {
          var size = new Object();
          size = stats.size;
          const range = req.headers.range;
          
          if (range) {
            var [start, end] = range.replace(/bytes=/, "").split("-");
            start = parseInt(start, 10);
            end = end ? parseInt(end, 10) : size - 1;
            if (!isNaN(start) && isNaN(end)) {
              start = start;
              end = size - 1;
            }
            if (isNaN(start) && !isNaN(end)) {
              start = size - end;
              end = size - 1;
            }
            if (start >= size || end >= size) {//invalid range   
              tempHEAD["Content-Range"] = `bytes */${size}`;
              show404(res, "Invalid Range", 416);
              return;
              //res.writeHead(416, tempHEAD);
              //return res.end();
            }
            tempHEAD["Access-Control-Expose-Headers"] = "origin, range";
            tempHEAD["Content-Range"] = `bytes ${start}-${end}/${size}`;
            tempHEAD["Accept-Ranges"] = "bytes";
            tempHEAD["Content-Length"] = end - start + 1;
            tempHEAD["Content-Type"] = content;
            res.writeHead(206, tempHEAD);
            var readable = await createReadStream(file, { start: start, end: end });
            readable.pipe(res);
            return;
          } else {
            tempHEAD["Access-Control-Expose-Headers"] = "origin, range";
            tempHEAD["Accept-Ranges"] = "bytes";
            tempHEAD["Content-Length"] = size;
            tempHEAD["Content-Type"] = content;
            //var fileToLoad = fs.readFileSync(file);
            res.writeHead(200, tempHEAD);
            const readable = fs.createReadStream(file);
            req.on("close", () => {
              readable.destroy();
            });
            res.on("close", () => {
              readable.destroy();
            });
            readable.on("error", err => {
              console.log("STREAM ERROR", err);
            });
            readable.pipe(res);
            return;
          }
        }
      })
    } else {
      //console.log(tempHEAD);
      const stat = fs.statSync(file);
      tempHEAD["Content-Type"] = content;
      tempHEAD["Content-Length"] = stat.size;
      //var fileToLoad = fs.readFileSync(file);
      res.writeHead(200, tempHEAD);
      fs.createReadStream(file).pipe(res);
      return;
    }



  } catch (e) {
    console.log('\x1b[31m', 'File not found - ' + file);//red
    show404(res, 'File not found<br>' + file);
    return;
    //res.writeHead(404, { 'Content-Type': 'text/html' });
    //res.end('File not found - ' + file);
  }
}

async function fileLoad(url, res, req, content, isServer) {
  var newdir = clientdir();
  //setHeader();
  //if (isServer == true) newdir = serverdir;
  var file = path.join(newdir, decodeURIComponent(url));
  var filename = path.basename(file);
  var extension = path.extname(file);
  try {
    //locate on upload location for files missed
    if (!fs.existsSync(file) && typeof (allowupload[extension]) != "undefined") {
      if (fs.existsSync(allowupload[extension].location + '/' + filename)) {
        file = allowupload[extension].location + '/' + filename;
      }
    }



    if (extension == '.mp4' || extension == '.mp3') {
      fs.stat(file, async function (err, stats) {
        tempHEAD["Access-Control-Allow-Origin"] = "*";
        tempHEAD["Access-Control-Allow-Headers"] = "Range";
        tempHEAD["Access-Control-Expose-Headers"] = "Content-Length, Content-Range";
        if (err) {
          console.log(err);
          show404(res, 'File not found<br>' + file);
          //res.writeHead(404, { 'Content-Type': 'text/html' });
          //res.end('File not found<br>' + file);
        } else {
          var size = new Object();
          size = stats.size;
          const range = req.headers.range;
          if (range) {
            var [start, end] = range.replace(/bytes=/, "").split("-");
            start = parseInt(start, 10);
            end = end ? parseInt(end, 10) : size - 1;
            if (!isNaN(start) && isNaN(end)) {
              start = start;
              end = size - 1;
            }
            if (isNaN(start) && !isNaN(end)) {
              start = size - end;
              end = size - 1;
            }
            if (start >= size || end >= size) {//invalid range   
              tempHEAD["Content-Range"] = `bytes */${size}`;
              show404(res, "Invalid Range", 416);
              return;
              //res.writeHead(416, tempHEAD);
              //return res.end();
            }
            tempHEAD["Access-Control-Expose-Headers"] = "origin, range";
            tempHEAD["Content-Range"] = `bytes ${start}-${end}/${size}`;
            tempHEAD["Accept-Ranges"] = "bytes";
            tempHEAD["Content-Length"] = end - start + 1;
            tempHEAD["Content-Type"] = content;
            res.writeHead(206, tempHEAD);
            const readable = fs.createReadStream(file, {
              start,
              end
            });

            req.on("close", () => {
              readable.destroy();
            });

            res.on("close", () => {
              readable.destroy();
            });

            readable.on("error", err => {
              console.log("STREAM ERROR", err);
            });

            readable.pipe(res);
            return;
          } else {
            tempHEAD["Access-Control-Expose-Headers"] = "origin, range";
            tempHEAD["Accept-Ranges"] = "bytes";
            tempHEAD["Content-Length"] = size;
            tempHEAD["Content-Type"] = content;
            //var fileToLoad = fs.readFileSync(file);
            res.writeHead(200, tempHEAD);
            fs.createReadStream(file).pipe(res);
            return;
          }
        }
      })
    } else {
      //console.log(tempHEAD);
      const stat = fs.statSync(file);
      tempHEAD["Content-Type"] = content;
      tempHEAD["Content-Length"] = stat.size;
      //var fileToLoad = fs.readFileSync(file);
      res.writeHead(200, tempHEAD);
      fs.createReadStream(file).pipe(res);
      return;
    }



  } catch (e) {
    console.log('\x1b[31m', 'File not found - ' + file);//red
    show404(res, 'File not found<br>' + file);
    return;
    //res.writeHead(404, { 'Content-Type': 'text/html' });
    //res.end('File not found - ' + file);
  }
}

function threatPost(req, res) {
  return;//DISABLED UPLOAD 
  if (allowupload["CONFIG"] && req.method === "POST" && req.url.startsWith(allowupload["CONFIG"].urlpost)) {
    try {
      const login = HELPER.getUrlVariable(req, "login");
      const pass = HELPER.getUrlVariable(req, "pass");

      if (allowupload["PASSP"] && allowupload["PASSP"].login === login && allowupload["PASSP"].pass === pass) {
        waitClose = true;
        uploadfile(req, res, allowupload["CONFIG"].temp);
        return true;
      } else {
        res.end();
        return;
      }
    } catch (e) {
      console.log("Error during upload authentication:", e);
    }
  }
}

function httpsRequests(req, res) {
  //res.writeHead(200, tempHEAD);
  //setHeader();
  setHTTPSHeader();
  var url = safeDecodeURI(req.url);

  //show404(res,"Temporary Down");return;
  //res.end();            
  //console.log("Url Request on SV:", url);

  /*OLD METOD 301 REDIRECT
  if (url.endsWith('/')) {
    const newUrl = path.join(url, 'index.html');
    const indexPath = path.join(clientdir(), newUrl);
    if (fs.existsSync(indexPath)) {
      // Redireciona permanentemente (status 301)
      tempHEAD["Location"]=newUrl;
      res.writeHead(301, tempHEAD);
      res.end();
      return;
    }
  }
  */
  //NEW METOD CHANGE INTERNAL TO CORRECT FILE
  if (url.endsWith('/')) {
    const newUrl = path.join(url, 'index.html');
    const indexPath = path.join(clientdir(), newUrl);
    if (fs.existsSync(indexPath)) {
      url = newUrl; // 👈 SERVE DIRETO em vez de redirecionar
    }
  }
  if (url === '/') url = '/index.html';


  // Verificação da whitelist
  if (!isWhitelisted(url, req, res)) {
    console.log('BlockList', url);
    show404(res);
    return;
  }

  const paa = path.extname(url);

  // OPTIONS
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    //if (allowedOPTIONS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200);
    res.end();
    //}
    return;
  }

  // Uploads
  //if (threatPost(req, res)) return;

  // Handler externo (start.js, etc)
  if (typeof mainREQUEST !== "undefined") {
    const handled = mainREQUEST(req, res);

    if (handled == true) return;
    console.log('not handled', url);

    if (res.writableEnded) {
      console.log('res Ended');
      waitClose = false;
      show404(res, "You shall not pass", 204);
      return;
    }
  }

  // Arquivos permitidos por extensão
  if (allowtransfer[paa] !== undefined && allowtransfer[paa] !== null) {
    let deffile = allowtransfer[paa].location;
    if (deffile == null) deffile = url;
    fileLoad(deffile, res, req, allowtransfer[paa].type);
    return;
  }



  // Estatísticas e relatory
  if (useRelatory !== "") {
    if (url !== useRelatory && url !== "/") {
      requestStats[url] = (requestStats[url] || 0) + 1;
    }
    //waitClose = showRelatory(url, res);
  }

  if (res.writableEnded) { console.log('ja finalizado 2'); return; }
  if (!waitClose) res.end();
}


function httpRequests(req, res) {
  //console.log('server',req.url);
  setHTTPSHeader();
  const host = req.headers.host;
  //const targetUrl = 'https://' + host + '/index.html'; //OLD METOD
  const targetUrl = 'https://' + host + req.url; // ✅ mantém /16/
  //res.writeHead(301, { Location: targetUrl });
  if (res.writableEnded) { console.log('ja finalizado 2'); return; }
  tempHEAD["Location"] = targetUrl;
  res.writeHead(301, tempHEAD);
  res.end();
}

module.exports = {
  ServerDIR: (cli) => realDir = cli,
  CertDIR: (cli) => certDir = cli,
  AllowTransfer: {
    add: (extension, location, minetype, callback) => allowtransfer[extension] = { location, type: minetype, call: callback },
    remove: (extension) => delete allowtransfer[extension],
    clear: () => Object.keys(allowtransfer).forEach(key => delete allowtransfer[key]),
  },
  AllowUpload: {
    config: (tempDir, urlPost, size) => allowupload["CONFIG"] = { temp: tempDir, urlpost: urlPost, size },
    passwordprotect: (login, pass) => allowupload["PASSP"] = { login, pass },
    add: (extension, location, minetype, callback) => allowupload[extension] = { location, type: minetype, call: callback },
    remove: (extension) => delete allowupload[extension],
    onData: (data, callback, administrator, password) => {
      allowupload["ONDATA"] = allowupload["ONDATA"] || [];
      allowupload["ONDATA"].push({ name: data, callback, login: administrator, pass: password });
    },
    clear: () => Object.keys(allowupload).forEach(key => delete allowupload[key]),
  },
  WaiToCLOSE: (wait) => waitClose = wait,
  START: function (REQUEST, port) {
    //setHeader();
    mainREQUEST = REQUEST;
    if (typeof port != "undefined") {
      Port = port;
    }
    var ht = "HTTP ";
    var cKey = certDir + privKeyName;
    var cCert = certDir + certName;
    // Auto Certificate check
    var cert = {};
    if (useRelatory !== "") startRelatory();
    if (
      fs.existsSync(cKey) &&
      fs.existsSync(cCert)
    ) {
      console.log("Found Certificate"); //found Certificate

      http.createServer(httpRequests).listen(Port, function () { });
      // HTTPS configuration
      http = https;
      cert = {
        key: fs.readFileSync(cKey),
        cert: fs.readFileSync(cCert),
      };
      Port = 443;
      ht = "HTTPS ";
    } else {
      // HTTP configuration (when no certificate is found)
      console.log("No certificate found. Using HTTP.");
    }

    // Create the server (either HTTP or HTTPS)
    server = http
      .createServer(cert, httpsRequests)
      .listen(Port, function () {
        if (useRelatory !== "") { // relatory
          setInterval(saveStats, 60000); // salva a cada 60 segundos
        }
        console.log(ht + "Created on Port: " + Port + " in " + realDir);
      });

    server.keepAliveTimeout = 9000000; // 60 segundos
    server.headersTimeout = 6500000;   // Evita desconexão prematura
    return server;
  }
  ,
  showRelatory,
  LOADFILE: (FILE, res, Type) => fileLoad(FILE, res, req, Type),
  UPLOADFILE: (req, res, uploadDir) => uploadfile(req, res, uploadDir),
  HEADERS: tempHEAD,
  requestStats: requestStats,
  useRelatory: (relname) => { useRelatory = relname; },
  addAcess: (url) => { whitelist.push(url); },
  addBlock: (url) => { blacklist.push(url); },
  addAllowedOPTIONS: (url) => {
    allowedOPTIONS.push(url);
  },
  safeDecodeURI: safeDecodeURI,
  show404: show404,
};
