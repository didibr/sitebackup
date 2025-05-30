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
let mainREQUEST=()=>{};

const allowtransfer = {};
const allowupload = {};
let headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
  //"Access-Control-Allow-Credentials": false,
  "Access-Control-Allow-Headers": "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};
function setHTTPSHeader() {
  headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
    //"Access-Control-Allow-Credentials": false,
    "Access-Control-Allow-Headers": "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    //"Cross-Origin-Embedder-Policy": "require-corp",
    //"Cross-Origin-Opener-Policy": "same-origin",
    "Pragma": "no-cache",
    "Expires": "0"
  };
}

const statsFile = path.join(__dirname, 'requests.json');
let requestStats = {};
let whitelist = ["/error"];

function show404(res, extraHtml, extraCode = 404) {
  if (res.writableEnded) return; // já foi finalizado, não faz nada
  res.writeHead(extraCode, { "Content-Type": "text/html" });
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
  if (url === "/" || url === "/index.html") return true;
  // Verifica se está na whitelist
  const permitido = whitelist.some(prefix => url.startsWith(prefix));
  if (!permitido) {
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
    res.writeHead(200, { 'Content-Type': 'text/html' });
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
          res.end(); // Invalid
        }
      } else {
        console.log("Upload not allowed.");
        fs.unlinkSync(file.filepath);
        res.end(); // Invalid
      }
    } catch (e) {
      console.log(`Error during upload: ${e}`);
    }
  });

  form.parse(req, err => {
    if (err) console.log("Form parsing error", err);
  });
}

async function fileLoad(url, res, req, content, isServer) {
  var newdir = clientdir();
  //if (isServer == true) newdir = serverdir;
  var file = path.join(newdir, url);
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
      var headers2 = JSON.parse(JSON.stringify(headers));
      fs.stat(file, async function (err, stats) {
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
              headers2["Content-Range"] = `bytes */${size}`;
              res.writeHead(416, headers2);
              return res.end();
            }
            headers2["Access-Control-Expose-Headers"] = "origin, range";
            headers2["Content-Range"] = `bytes ${start}-${end}/${size}`;
            headers2["Accept-Ranges"] = "bytes";
            headers2["Content-Lenght"] = end - start + 1;
            headers2["Content-Type"] = content;
            res.writeHead(206, headers2);
            var readable = await createReadStream(file, { start: start, end: end });
            readable.pipe(res);
          } else {
            headers2["Access-Control-Expose-Headers"] = "origin, range";
            headers2["Accept-Ranges"] = "bytes";
            headers2["Content-Lenght"] = size + 1;
            headers2["Content-Type"] = content;
            var fileToLoad = fs.readFileSync(file);
            res.writeHead(200, headers2);
            res.end(fileToLoad);
          }
        }
      })
    } else {
      headers["Content-Type"] = content;
      var fileToLoad = fs.readFileSync(file);
      res.writeHead(200, headers);
      res.end(fileToLoad);
    }



  } catch (e) {
    console.log('\x1b[31m', 'File not found - ' + file);//red
    show404(res, 'File not found<br>' + file);
    //res.writeHead(404, { 'Content-Type': 'text/html' });
    //res.end('File not found - ' + file);
  }
}

function threatPost(req, res) {
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
  res.writeHead(200, headers);
  var url = safeDecodeURI(req.url);

  //console.log("Url Request on SV:", url);

  if (url.endsWith('/')) {
    const newUrl = path.join(url, 'index.html');
    const indexPath = path.join(clientdir(), newUrl);
    if (fs.existsSync(indexPath)) {
      // Redireciona permanentemente (status 301)
      res.writeHead(301, { Location: newUrl });
      res.end();
      return;
    }
  }
  if (url === '/') url = '/index.html';
  

  // Verificação da whitelist
  if (!isWhitelisted(url, req, res)) {
    show404(res);
    return;
  }

  const paa = path.extname(url);

  // OPTIONS
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  // Uploads
  if (threatPost(req, res)) return;

  // Arquivos permitidos por extensão
  if (allowtransfer[paa] !== undefined && allowtransfer[paa] !== null) {
    let deffile = allowtransfer[paa].location;
    if (deffile == null) deffile = url;
    fileLoad(deffile, res, req, allowtransfer[paa].type);
    return;
  }

  // Handler externo (start.js, etc)
  if (typeof mainREQUEST !== "undefined") {
    const handled = mainREQUEST(req, res);
    if (!handled && !res.writableEnded) {
      waitClose = false;
      show404(res, "You shall not pass", 204);
    }
  }

  // Estatísticas e relatory
  if (useRelatory !== "") {
    if (url !== useRelatory && url !== "/") {
      requestStats[url] = (requestStats[url] || 0) + 1;
    }
    waitClose = showRelatory(url, res);
  }

  if (!waitClose) res.end();
}


function httpRequests(req, res) {
  const host = req.headers.host;
  const targetUrl = 'https://' + host + '/index.html';
  res.writeHead(301, { Location: targetUrl });
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
    mainREQUEST=REQUEST;
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

      setHTTPSHeader();
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
  LOADFILE: (FILE, res, Type) => fileLoad(FILE, res, req, Type),
  UPLOADFILE: (req, res, uploadDir) => uploadfile(req, res, uploadDir),
  HEADERS: headers,
  requestStats: requestStats,
  useRelatory: (relname) => { useRelatory = relname; },
  addAcess: (url) => { whitelist.push(url); },
  safeDecodeURI: safeDecodeURI,
  show404: show404,
};
