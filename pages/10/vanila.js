const entryExample=1;
let container, canvas, gl, program;
let positionAttributeLocation,
    iResolutionLocation,
    iTimeLocation,
    positionBuffer;
let iTimeDeltaLocation, iFrameLocation, iFrameRateLocation;
let iMouseLocation, iDateLocation;
let iChannel0Location, iChannel1Location;
let mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
let lastTime = 0;
let frameCount = 0;
let alreadyInitied = false;
let codefrag = null, codevertex = null;
let sampleCodes = {};
let sucessCodes = null;
let siteurl = "https://didisoftwares.ddns.net/10/";


let bufferA = null, bufferB = null;
let texStatic0 = null, texStatic1 = null;


let animateShader = (t) => { };
function tabButtons() {
    const buttons = document.querySelectorAll('.tab-buttons button');
    const contents = document.querySelectorAll('.tab-content');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-tab');
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            contents.forEach(content => {
                if (content.id === target) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
                if (target == "vertex") {
                    setTimeout(() => codevertex.refresh(), 0);
                    setTimeout(() => { resizeCanvas(); }, 100);
                }
                if (target == "fragment") {
                    setTimeout(() => codefrag.refresh(), 0);
                    setTimeout(() => { resizeCanvas(); }, 100);
                }
            });
        });
    });
}
tabButtons();
function resizeCanvas() {
    if (!canvas || !gl) return;
    canvas.width = container.clientWidth;
    canvas.height = Math.floor(canvas.width / 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
    /*document.querySelectorAll('.CodeMirror').forEach((el) => {
        el.style.height = (el.parentElement.clientHeight - 35) + 'px';
    })*/    
    //.getWrapperElement().style.width = '600px';
}

setInterval(() => {
    if(codevertex){                
        codevertex.getWrapperElement().style.width = (codevertex.getWrapperElement().parentElement.clientWidth - 10)+'px';
        codevertex.getWrapperElement().style.height = (codevertex.getWrapperElement().parentElement.clientHeight - 60)+'px';
    }
    if(codefrag){
        codefrag.getWrapperElement().style.width = (codefrag.getWrapperElement().parentElement.clientWidth - 10)+'px';
        codefrag.getWrapperElement().style.height = (codefrag.getWrapperElement().parentElement.clientHeight - 60)+'px';
    }    
}, 500);

function clearErrors(cm) {
    cm.clearGutter("error-gutter");
    cm.eachLine(line => {
        cm.removeLineClass(line, "background", "error-line");
    });
}
function showError() {
    const errorDiv = document.getElementById('errordiv');
    if (!errorDiv) return;
    errorDiv.classList.add('show');
    clearTimeout(errorDiv._hideTimeout);
    errorDiv._hideTimeout = setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 4000);
}
function markErrorLine(cm, line) {
    const marker = document.createElement("div");
    marker.style.color = "red";
    marker.innerHTML = "●";
    cm.setGutterMarker(line - 1, "error-gutter", marker);
    cm.addLineClass(line - 1, "background", "error-line");
    sucessCodes = null;
    showError();
}

let headerLen = 0;

function compileShader(gl, source, type, lineOffset) {
    const shader = gl.createShader(type);

    let fullSource = source;

    if (type === gl.FRAGMENT_SHADER) {
        const header = `
            precision highp float;
            precision highp int;
            uniform vec3 iResolution;
            uniform float iTime;
            uniform float iTimeDelta;
            uniform float iFrameRate;
            uniform int iFrame;
            uniform vec4 iMouse;
            uniform vec4 iDate;
            uniform sampler2D iChannel0;
            uniform sampler2D iChannel1;
            void mainImage(out vec4 fragColor, in vec2 fragCoord);
        `;

        const wrapper = `
            void main() {
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }
        `;

        headerLen = header.split('\n').length;
        fullSource = header + '\n' + source + '\n' + wrapper;
    }

    gl.shaderSource(shader, fullSource);
    gl.compileShader(shader);

    const errorDiv = document.getElementById('errordiv');
    errorDiv.textContent = '';

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errorMsg = gl.getShaderInfoLog(shader);
        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        const codeEditor = type === gl.VERTEX_SHADER ? codevertex : codefrag;

        const linesMarked = [];
        const processedErrors = errorMsg.replace(/ERROR:\s0:(\d+):/g, (match, lineNum) => {
            const errorLine = parseInt(lineNum);
            let editorLine = errorLine;
            if (type === gl.FRAGMENT_SHADER) {
                editorLine = lineOffset + 1 + (errorLine - headerLen);
            }

            if (!linesMarked.includes(editorLine)) {
                markErrorLine(codeEditor, editorLine);
                linesMarked.push(editorLine);
            }
            
            return `LINE: ${editorLine}:`;
        });

        console.log(processedErrors);
        errorDiv.innerText = `${shaderType} Shader Error:\n${processedErrors}`;
        errorDiv.style.color = 'red';

        gl.deleteShader(shader);
        return null;
    }

    return shader;
}



function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    const errorDiv = document.getElementById('errordiv');
    errorDiv.textContent = '';
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const errorMsg = gl.getProgramInfoLog(program);
        errorDiv.textContent = 'Program link error: ' + errorMsg;
        errorDiv.style.color = 'red';
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
function render(time) {
    time *= 0.001;
    const deltaTime = time - lastTime;
    lastTime = time;
    frameCount++;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!program) {
        requestAnimationFrame(render);
        return;
    }

    function drawToBuffer(buf, tex0 = null, tex1 = null) {
        if (!buf || !buf.program) return;
    
        gl.useProgram(buf.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, buf.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, buf.write, 0);
    
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const loc = gl.getAttribLocation(buf.program, 'position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    
        const uni = (name) => gl.getUniformLocation(buf.program, name);
        gl.uniform3f(uni('iResolution'), canvas.width, canvas.height, 1);
        gl.uniform1f(uni('iTime'), lastTime);
        gl.uniform1f(uni('iTimeDelta'), 0.01);
        gl.uniform1f(uni('iFrameRate'), 60.0);
        gl.uniform4f(uni('iMouse'), mouse.x, mouse.y, mouse.clickX, mouse.clickY);
        const now = new Date();
        const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        gl.uniform4f(uni('iDate'), now.getFullYear(), now.getMonth() + 1, now.getDate(), seconds);
    
        if (tex0) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex0);
            gl.uniform1i(uni('iChannel0'), 0);
        }
        if (tex1) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, tex1);
            gl.uniform1i(uni('iChannel1'), 1);
        }
    
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

   // render bufferA com realimentação de si mesmo
   if (bufferA) {
    drawToBuffer(bufferA, bufferA.read);
    bufferA.swap();
}

    // render bufferB se houver
    if (bufferB) {
        drawToBuffer(bufferB, bufferB.read);
        bufferB.swap();
    }


    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(iResolutionLocation, gl.canvas.width, gl.canvas.height, 1);
    gl.uniform1f(iTimeLocation, time);
    gl.uniform1f(iTimeDeltaLocation, deltaTime);
    gl.uniform1i(iFrameLocation, frameCount);
    const frameRate = deltaTime > 0 ? 1.0 / deltaTime : 0.0;
    gl.uniform1f(iFrameRateLocation, frameRate);
    const mx = mouse.x;
    const my = mouse.y;
    const cx = mouse.isDown ? mouse.clickX : -mouse.clickX;
    const cy = mouse.isDown ? mouse.clickY : -mouse.clickY;
    gl.uniform4f(iMouseLocation, mx, my, cx, cy);
    const now = new Date();
    const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    gl.uniform4f(iDateLocation,
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        seconds);

    if (bufferA) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bufferA.read); // Lê da última escrita
        gl.uniform1i(iChannel0Location, 0);
    } else if (texStatic0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texStatic0);
        gl.uniform1i(iChannel0Location, 0);
    }

    if (bufferB) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bufferB.read); // Lê da última escrita
        gl.uniform1i(iChannel1Location, 0);
    } else if (texStatic1) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texStatic1);
        gl.uniform1i(iChannel1Location, 1);
    }



    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

function parseShaderSections(fragmentSource) {
    const sections = {
        BufferA: { code: "", line: -1 },
        BufferB: { code: "", line: -1 },
        Main: { code: "", line: -1 },
        images: {}
    };

    const lines = fragmentSource.split("\n");
    let currentSection = null;
    let currentCode = [];

    // Mapeamento dos nomes de comentário para nomes internos
    const sectionMap = {
        iChannel0: "BufferA",
        iChannel1: "BufferB",
        Main: "Main"
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detecta início de seção de código (sem '=')
        const sectionMatch = line.match(/^\/\/\s*(iChannel0|iChannel1|Main)\s*$/);
        if (sectionMatch) {
            // Salva a seção anterior
            if (currentSection && sections[currentSection]) {
                sections[currentSection].code = currentCode.join("\n").trim();
            }

            const mappedName = sectionMap[sectionMatch[1]];
            currentSection = mappedName;
            sections[mappedName].line = i;
            currentCode = [];
            continue;
        }

        // Detecta binding de imagem
        const imgMatch = line.match(/^\/\/\s*iChannel(\d)\s*=\s*(\S+)/);
        if (imgMatch) {
            sections.images[`iChannel${imgMatch[1]}`] = imgMatch[2];
            continue;
        }

        // Adiciona código à seção atual
        if (currentSection) {
            currentCode.push(line);
        }
    }

    // Finaliza última seção
    if (currentSection && sections[currentSection]) {
        sections[currentSection].code = currentCode.join("\n").trim();
    }

    return sections;
}




function createFBO(width, height) {
    function createTexture() {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
    }

    const tex0 = createTexture();
    const tex1 = createTexture();

    const framebuffer = gl.createFramebuffer();

    return {
        textures: [tex0, tex1],
        framebuffer: framebuffer,
        index: 0,
        get read() { return this.textures[this.index]; },
        get write() { return this.textures[1 - this.index]; },
        swap() { this.index = 1 - this.index; }
    };
}



function setShader(vertexSource, fragmentSource, onUpdate = (t) => { }) {
    if (!gl) return;
    vertexSource=vertexSource.replaceAll('\\n', '\n');
    fragmentSource=fragmentSource.replaceAll('\\n', '\n');
    const vertArea = document.getElementById('vertext');
    const fragArea = document.getElementById('fragmentt');
    if (codevertex) {
        codevertex.setValue(vertexSource);
    } else {
        vertArea.value = vertexSource;
        codevertex = CodeMirror.fromTextArea(vertArea, {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'x-shader/x-vertex',
            theme: 'material-darker',
            gutters: ["CodeMirror-linenumbers", "error-gutter"]
        });        
    }
    if (codefrag) {
        codefrag.setValue(fragmentSource);
    } else {
        fragArea.value = fragmentSource;
        codefrag = CodeMirror.fromTextArea(fragArea, {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'x-shader/x-fragment',
            theme: 'material-darker',
            gutters: ["CodeMirror-linenumbers", "error-gutter"]
        });
        window.WWW=codefrag;
    }
    clearErrors(codevertex);
    clearErrors(codefrag);

    //const vs = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    //const fs = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    const parsed = parseShaderSections(fragmentSource);

    const resX = canvas.width, resY = canvas.height;

    bufferA = parsed.BufferA.code ? createFBO(resX, resY) : null;
    bufferB = parsed.BufferB.code ? createFBO(resX, resY) : null;

    if (parsed.images["iChannel0"]) {
        texStatic0 = loadTexture(parsed.images["iChannel0"], 0);
    }
    if (parsed.images["iChannel1"]) {
        texStatic1 = loadTexture(parsed.images["iChannel1"], 1);
    }


    headerLen = 0;

    const vs = compileShader(gl, vertexSource, gl.VERTEX_SHADER, 0);
    if (!vs) {
        return;
    }


    let fragNotCompiled = false;
    const compileAndSet = (source, target, line) => {
        const fs = compileShader(gl, source, gl.FRAGMENT_SHADER, line);
        if (fs) {
            const newProgram = createProgram(gl, vs, fs);
            if (newProgram) {
                target.program = newProgram;
            } else {
                console.log('Program Error');
                return;
            }
        } else {
            fragNotCompiled = true;
            return;
        }
    };

    if (bufferA) bufferA.program = {};
    if (bufferB) bufferB.program = {};
    const mainProgram = {};

    if (parsed.BufferA.code) compileAndSet(parsed.BufferA.code, bufferA, parsed.BufferA.line);
    if (fragNotCompiled) return;

    if (parsed.BufferB.code) compileAndSet(parsed.BufferB.code, bufferB, parsed.BufferB.line);
    if (fragNotCompiled) return;

    if (parsed.Main.code) compileAndSet(parsed.Main.code, mainProgram, parsed.Main.line);
    if (fragNotCompiled) return;


    program = mainProgram.program;
    //gl.useProgram(program);
    document.getElementById('errordiv').textContent = 'SUCESS';
    document.getElementById('errordiv').style.color = 'green';
    showError();
    sucessCodes = { vert: vertexSource, frag: fragmentSource };

    positionAttributeLocation = gl.getAttribLocation(program, 'position');
    iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    iTimeLocation = gl.getUniformLocation(program, 'iTime');
    iTimeDeltaLocation = gl.getUniformLocation(program, 'iTimeDelta');
    iFrameLocation = gl.getUniformLocation(program, 'iFrame');
    iFrameRateLocation = gl.getUniformLocation(program, 'iFrameRate');
    iMouseLocation = gl.getUniformLocation(program, 'iMouse');
    iDateLocation = gl.getUniformLocation(program, 'iDate');
    iChannel0Location = gl.getUniformLocation(program, 'iChannel0');
    iChannel1Location = gl.getUniformLocation(program, 'iChannel1');
}
window.applyShader = () => {
    const vertexCode = codevertex.getValue();
    const fragmentCode = codefrag.getValue();
    setShader(vertexCode, fragmentCode);
}
function loadTexture(url, num) {
    const texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE, image
        );
        gl.generateMipmap(gl.TEXTURE_2D);
    };    
    return texture;
}
function init() {
    if (alreadyInitied) {
        sampleExec(entryExample);
        return;
    }
    alreadyInitied = true;
    container = document.getElementById("myContainer");
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 200;
    canvas.style.display = 'block';
    container.appendChild(canvas);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = canvas.height - (e.clientY - rect.top);
    });
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.isDown = true;
        mouse.clickX = e.clientX - rect.left;
        mouse.clickY = canvas.height - (e.clientY - rect.top);
    });
    canvas.addEventListener('mouseup', () => {
        mouse.isDown = false;
    });
    gl = canvas.getContext('webgl');
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    sampleExec(entryExample);
    requestAnimationFrame(render);
}
window.sendForm = () => {
    if (sucessCodes == null) {
        document.getElementById('errordiv').textContent = 'Shader not Compiled';
        document.getElementById('errordiv').style.color = 'red';
        showError();
        return;
    }
    const clean = str => str.replace(/\s+/g, '');
    const userVert = clean(sucessCodes.vert);
    const userFrag = clean(sucessCodes.frag);
    for (let key in sampleCodes) {
        const sampleVert = clean(sampleCodes[key].vert);
        const sampleFrag = clean(sampleCodes[key].frag);
        if (userVert === sampleVert && userFrag === sampleFrag) {
            document.getElementById('errordiv').textContent = 'Plagiarism detected';
            document.getElementById('errordiv').style.color = 'red';
            showError();
            return;
        }
    }
    const name = document.getElementById('name').value.trim() + ' - ' + document.getElementById('email').value.trim()
    const svert = sucessCodes.vert;
    const sfrag = sucessCodes.frag;
    fetch(siteurl + 'newshader', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            vert: svert,
            frag: sfrag
        })
    })
        .then(response => {
            if (response.ok) {
                clearButtons();
                loadAllShaders();
            } else {
                document.getElementById('errordiv').textContent = 'Fail to Send';
                document.getElementById('errordiv').style.color = 'red';
                showError();
            }
        })
        .catch(error => {
            clearButtons();
            loadAllShaders();
        });
};
function sampleExec(sampleNumber) {
    const codesample = sampleCodes["A" + sampleNumber];
    setShader(codesample.vert, codesample.frag);
    setTimeout(() => { resizeCanvas(); }, 100);
}
function clearButtons() {
    const ul = document.querySelector('#samples ul');
    if (ul) {
        ul.innerHTML = '';
    }
}
function addButton(label = 'EXECUTE', sampleNumber = 0) {
    const ul = document.querySelector('#samples ul');
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'bottom-button sample';
    button.textContent = label;
    button.onclick = function () {
        sampleExec(sampleNumber);
    };
    li.appendChild(button);
    ul.prepend(li);
}
async function loadAllShaders() {
    let num = 0;
    while (true) {
        const success = await loadShaderButton(num);
        if (!success) {
            break;
        } else {
            if (num == entryExample) init();
        }
        num++;
    }
}
async function loadShaderButton(num) {
    const urlBase = siteurl + "gls/";
    async function loadShader(url) {
        const response = await fetch(urlBase + url);
        if (!response.ok) {
            return null;
        }
        return await response.text();
    }
    var about = await loadShader(num + '.txt');
    about = num + ' : ' + about;
    const vertexSource = await loadShader(num + '_vert.txt');
    const fragmentSource = await loadShader(num + '_frag.txt');
    if (about && vertexSource && fragmentSource) {
        sampleCodes["A" + num] = {
            vert: vertexSource,
            frag: fragmentSource
        };
        addButton(about, num);
        return true;
    } else {
        return false;
    }
}
loadAllShaders();