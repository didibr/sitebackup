let container, canvas, gl, program;
let positionAttributeLocation,
    iResolutionLocation,
    iTimeLocation,
    positionBuffer;
let codefrag = null, codevertex = null;
let sampleCodes={};
let sucessCodes=null;
let siteurl="https://didisoftwares.ddns.net/10/";

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
                }
                if (target == "fragment") {
                    setTimeout(() => codefrag.refresh(), 0);
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
}

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
    }, 4000); // Tempo visível
}


function markErrorLine(cm, line) {
    const marker = document.createElement("div");
    marker.style.color = "red";
    marker.innerHTML = "●"; // Pode ser um ícone, ⚠️, ❌ ou outro    
    cm.setGutterMarker(line - 1, "error-gutter", marker);
    cm.addLineClass(line - 1, "background", "error-line");
    sucessCodes=null;
    showError();
}


function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const errorDiv = document.getElementById('errordiv');
    errorDiv.textContent = ''; // Limpa mensagens anteriores

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errorMsg = gl.getShaderInfoLog(shader);
        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        const codeEditor = type === gl.VERTEX_SHADER ? codevertex : codefrag;

        //console.error(`${shaderType} Shader compile error:\n${errorMsg}`);

        // Mostra no div
        errorDiv.innerText = `${shaderType} Shader Error:\n${errorMsg}`;
        errorDiv.style.color = 'red';

        // (Opcional) Parse para destacar a linha
        const lineMatch = errorMsg.match(/ERROR:\s0:(\d+):/);
        if (lineMatch) {
            const lineNumber = parseInt(lineMatch[1]);
            //errorDiv.innerText += `\n(Line ${lineNumber})`;
            markErrorLine(codeEditor, lineNumber);
        }

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
    errorDiv.textContent = ''; // Limpa mensagens anteriores

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
    time *= 0.001; // ms -> segundos 
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!program) return;

    gl.useProgram(program);

    // Atributo posição
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        positionAttributeLocation, 2, gl.FLOAT, false, 0, 0
    );

    // Uniforms
    gl.uniform2f(iResolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(iTimeLocation, time);

    // Uniforms adicionais
    animateShader(time);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

function setShader(vertexSource, fragmentSource, onUpdate = (t) => { }) {
    if (!gl) return;

    //animateShader = onUpdate;
    const vertArea = document.getElementById('vertext');
    const fragArea = document.getElementById('fragmentt');


    if (codevertex) {
        codevertex.setValue(vertexSource);
    } else {
        vertArea.value = vertexSource;
        codevertex = CodeMirror.fromTextArea(vertArea, {
            lineNumbers: true,
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
            mode: 'x-shader/x-fragment',
            theme: 'material-darker',
            gutters: ["CodeMirror-linenumbers", "error-gutter"]
        });
    }


    clearErrors(codevertex);
    clearErrors(codefrag);

    const vs = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    if (vs && fs) {
        const newProgram = createProgram(gl, vs, fs);
        if (newProgram) {
            gl.useProgram(newProgram);
            document.getElementById('errordiv').textContent = 'SUCESS';
            document.getElementById('errordiv').style.color = 'green';
            showError();
            sucessCodes={vert:vertexSource,frag:fragmentSource};
            program = newProgram;
        }
    } else {
        //console.error('Erro ao criar programa');
        return;
    }

    //program = newProgram;

    // Atualiza os atributos e uniforms
    positionAttributeLocation = gl.getAttribLocation(program, 'position');
    iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    iTimeLocation = gl.getUniformLocation(program, 'iTime');
}

window.applyShader = () => {
    const vertexCode = codevertex.getValue();
    const fragmentCode = codefrag.getValue();
    setShader(vertexCode, fragmentCode);
}

let alreadyInitied=false;
function init() {
    if(alreadyInitied==true){
        sampleExec(0);
        return;
    }
    alreadyInitied=true;
    container = document.getElementById("myContainer");
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 200;//container.clientHeight;
    canvas.style.display = 'block';
    container.appendChild(canvas);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

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
    
    sampleExec(0);

    requestAnimationFrame(render);
}


window.sendForm = () => {
    if (sucessCodes == null) {
        document.getElementById('errordiv').textContent = 'Shader not Compiled';
        document.getElementById('errordiv').style.color = 'red';
        showError();
        return;
    }

    // Remove espaços, quebras de linha e tabs
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

    // Dados do formulário
    const name = document.getElementById('name').value.trim() + ' - ' + document.getElementById('email').value.trim()
    const svert = sucessCodes.vert;
    const sfrag = sucessCodes.frag;

    fetch(siteurl+'newshader', {
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
            //alert('Enviado com sucesso!');
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


function sampleExec(sampleNumber){
    const codesample=sampleCodes["A"+sampleNumber];
    setShader(codesample.vert,codesample.frag);
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
            //console.log(`Parou no ${num}, nenhum shader encontrado.`);
            break;
        }else{
            if(num==0)init();
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
    about = num+' : '+about;
    const vertexSource = await loadShader(num + '_vert.txt');
    const fragmentSource = await loadShader(num + '_frag.txt');

    if (about && vertexSource && fragmentSource) {
        sampleCodes["A" + num] = {
            vert: vertexSource,
            frag: fragmentSource
        };
        addButton(about, num);
        //console.log(`Shader ${num} carregado.`);
        return true;
    } else {
        //console.log(`Shader ${num} não encontrado.`);
        return false;
    }
}

loadAllShaders();

