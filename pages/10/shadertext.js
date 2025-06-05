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
let codefrag = null, codevertex = null;
let bufferA = null, bufferB = null;
let texStatic0 = null, texStatic1 = null;
let headerLen = 0;
let text = null;
let frameSkip = 5;
let shaderprecision = 0;
function resizeCanvas() {
    if (!canvas || !gl) return;
    const rect = text?.getBoundingClientRect?.() || { width: 100, height: 100, left: 0, top: 0 };
    const dpr = window.devicePixelRatio || 1;
    const scale = 1.0;
    const width = Math.max(1, Math.floor(rect.width * dpr * scale));
    const height = Math.max(1, Math.floor(rect.height * dpr * scale));
    const diffW = Math.abs(canvas.width - width);
    const diffH = Math.abs(canvas.height - height);
    const changed = diffW > 10 || diffH > 10;
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = rect.left + 'px';
    canvas.style.top = rect.top + 'px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.style.opacity = '0';
    gl.viewport(0, 0, width, height);
    if (changed && codevertex != null) {
        setShader(codevertex.trim(), codefrag.trim());
    }
}
function compileShader(gl, source, type, lineOffset) {
    const shader = gl.createShader(type);
    let fullSource = source;
    if (type === gl.FRAGMENT_SHADER) {
        var precision =
            `precision highp float;
            precision highp int;`;
        if (shaderprecision == 1) {
            precision =
                `precision mediump float;
            precision mediump int;`;
        }
        if (shaderprecision == 2) {
            precision =
                `precision lowp float;
            precision lowp int;`;
        }
        const header =
            precision +
            `uniform vec3 iResolution;
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
                linesMarked.push(editorLine);
            }
            return `LINE: ${editorLine}:`;
        });
        console.log(processedErrors);
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const errorMsg = gl.getProgramInfoLog(program);
        console.log(errorMsg);
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
    if (bufferA) {
        drawToBuffer(bufferA, bufferA.read);
        bufferA.swap();
    }
    if (bufferB) {
        drawToBuffer(bufferB, bufferB.read);
        bufferB.swap();
    }
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(iResolutionLocation, canvas.width, canvas.height, 1);
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
        gl.bindTexture(gl.TEXTURE_2D, bufferA.read);
        gl.uniform1i(iChannel0Location, 0);
    } else if (texStatic0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texStatic0);
        gl.uniform1i(iChannel0Location, 0);
    }
    if (bufferB) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bufferB.read);
        gl.uniform1i(iChannel1Location, 0);
    } else if (texStatic1) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texStatic1);
        gl.uniform1i(iChannel1Location, 1);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (frameCount % frameSkip === 0) {
        text.style.backgroundImage = `url(${canvas.toDataURL()})`;
    }
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
    const sectionMap = {
        iChannel0: "BufferA",
        iChannel1: "BufferB",
        Main: "Main"
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const sectionMatch = line.match(/^\/\/\s*(iChannel0|iChannel1|Main)\s*$/);
        if (sectionMatch) {
            if (currentSection && sections[currentSection]) {
                sections[currentSection].code = currentCode.join("\n").trim();
            }
            const mappedName = sectionMap[sectionMatch[1]];
            currentSection = mappedName;
            sections[mappedName].line = i;
            currentCode = [];
            continue;
        }
        const imgMatch = line.match(/^\/\/\s*iChannel(\d)\s*=\s*(\S+)/);
        if (imgMatch) {
            sections.images[`iChannel${imgMatch[1]}`] = imgMatch[2];
            continue;
        }
        if (currentSection) {
            currentCode.push(line);
        }
    }
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
function setShader(vertexSource, fragmentSource) {
    if (!gl) return;
    codevertex = vertexSource;
    codefrag = fragmentSource;
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
function applyShader() {
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
function init(options) {
    if (container) {
        return;
    }
    container = document.getElementById("myContainer");
    canvas = document.createElement('canvas');
    canvas.id = 'ShaderText';
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
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.x = touch.clientX - rect.left;
        mouse.y = canvas.height - (touch.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        mouse.isDown = false;
    }, { passive: false });
    gl = canvas.getContext('webgl', { alpha: !options || !options.alpha ? false : true });
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
    requestAnimationFrame(render);
}
function sampleExec() {
    resizeCanvas();
    setShader(`attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }`, `
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {    
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }`);
    setTimeout(() => { resizeCanvas(); }, 100);
}
export function ShaderText(object, vertexCode, fragmentCode, options = { frameSkip: 5, precision: "highp", alpha: false }) {
    init(options);
    vertexCode = vertexCode.replaceAll('\\n', '\n');
    fragmentCode = fragmentCode.replaceAll('\\n', '\n');
    text = (typeof object === 'string')
        ? document.getElementById(object)
        : object;
    if (!text) {
        console.error('Element not Found', object);
        return;
    }
    if (options && options.frameSkip) frameSkip = options.frameSkip;
    text.style.cssText = '-webkit-text-fill-color: transparent;';
    text.style.setProperty('background-clip', 'text');
    text.style.setProperty('-webkit-background-clip', 'text');
    if (text.style.webkitTextFillColor !== 'transparent') {
        console.error('Element not supported', object);
        return;
    }
    if (options.precision == "highp") shaderprecision = 0;
    if (options.precision == "mediump") shaderprecision = 1;
    if (options.precision == "lowp") shaderprecision = 2;
    resizeCanvas();
    setShader(vertexCode.trim(), fragmentCode.trim());
    setTimeout(() => { resizeCanvas(); }, 500);
    const observer = new MutationObserver(() => {
        resizeCanvas();
    });
    observer.observe(text, {
        childList: true,
        characterData: true,
        subtree: true
    });
}