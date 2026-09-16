
export const ShaderPlay = (() => {
  function create(isEditor = false) {

    //################## STATE (VARIABLES)
    var state = {
      // Sistema / config externa
      siteurl: "https://didisoftwares.ddns.net/10/",
      namejs: "shaderplay.js",
      vv: 0, //editor set to 1
      root: null, //current
      entryExample: 0,
      canvas: null,
      gl: null,
      program: null,
      positionBuffer: null,
      buffers: [],
      texStatic: [],
      mouse: { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false },
      config: {
        frameSkip: 0,
        precision: "highp",
        alpha: false,
        glyph: false,
        //bufferFilter: "Linear", // or Linear
        //bufferTexture: "UNSIGNED_BYTE", // or UNSIGNED_BYTE
        //bufferFormat: "RGBA32F", // RGBA8 or RGBA16F or RGBA32F
        //pixelPerfect: false, //vec2 fragCoord is pixel or -1 # 1
        texture: {
          target: "TEXTURE_2D",
          level: 0,
          internalFormat: "RGBA32F", //RGBA
          border: 0,
          format: "RGBA",
          type: "FLOAT", //UNSIGNED_BYTE
          data: null,
          minFilter: "NEAREST", //LINEAR
          magFilter: "NEAREST", //LINEAR
          wrapS: "CLAMP_TO_EDGE",
          wrapT: "CLAMP_TO_EDGE"
        }
      },
      globalEvents: [],
      rafId: null,
      destroyed: false,
      customUniforms: {},
      lastUniforms: {},
      frameCount: 0,
      lastTime: 0,
      skipCounter: 0,
      //TEXT / SVG
      text: null,
      svg: null,
      glyphs: null,
      finalpath: [],
      // editor
      codevertex: null,
      codefrag: null,
      // misc
      MAX_CHANNELS: 10,
      iResolutionLocation: null,
      iTimeLocation: null,
      iTimeDeltaLocation: null,
      iFrameLocation: null,
      iFrameRateLocation: null,
      iMouseLocation: null,
      iDateLocation: null,
      iChannelLocations: [],
      MAX_AUDIOS: 4,
      audioFFT: null,
      audioTextures: null,
      audioChannelsUsed: null,
      MAX_VIDEOS: 4,
      videoTextures: null,
      videoElements: null,
      pendingVideos: [],
      videosProcessed: false,
      usedChannels: [],

      // DOM
      container: null,
      textNode: null,
      errorDiv: null,

      // WebGL extra
      positionAttributeLocation: null,

      // Flags
      alreadyInitied: false,

      // Shader / código
      sampleCodes: {},
      sucessCodes: null,

      // Buffers específicos
      bufferA: null,
      bufferB: null,

      // Texturas específicas
      texStatic0: null,
      texStatic1: null,

      // Função runtime
      animateShader: (t) => { },

      // Grafo de execução (importante)
      selfFeedback: [],
      bufferDeps: [],
      executionOrder: [],
      linearOrder: [],
      loopNodes: new Set(),

      // Texto / layout
      resizeTimeout: null,
      lastTextContent: "",
      lastRect: null,

      // Editor
      isEditorMode: false,
      fixedResolution: { width: null, height: null },

      //better RAM      
      programPromise: null,
      programResolver: null,
      resizeTimer: null,
      isPaused: false,

      //debug
      debug: false,
      debugEl: null,
      fps: 0,
      fpsCounter: 0,
      fpsLastTime: 0,

      //GLS3
      webGlversion: 1,

      observerCanvas: null,
      observerElement: null,
      _uniformVersionCounter: 0,
      _uniformCache: null,
      _lastProgram: null,
    };

    state.audioFFT = new Array(state.MAX_AUDIOS).fill(null);
    state.audioTextures = new Array(state.MAX_AUDIOS).fill(null);
    state.audioChannelsUsed = new Array(state.MAX_AUDIOS).fill(false);
    state.videoTextures = new Array(state.MAX_AUDIOS).fill(null);
    state.videoElements = new Array(state.MAX_AUDIOS).fill(null);

    let clickHandler = null;
    let lastClickKey = null;
    //################## CORE ############   

    function deepMerge(target, source) {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }

    function deepClone(value) {
      // primitivos
      if (value === null || typeof value !== "object") {
        return value;
      }
      // Array
      if (Array.isArray(value)) {
        return value.map(deepClone);
      }
      // TypedArray (importante pra WebGL)
      if (ArrayBuffer.isView(value)) {
        return new value.constructor(value);
      }
      // Date
      if (value instanceof Date) {
        return new Date(value);
      }
      // Map
      if (value instanceof Map) {
        const result = new Map();
        for (const [k, v] of value.entries()) {
          result.set(deepClone(k), deepClone(v));
        }
        return result;
      }
      // Set
      if (value instanceof Set) {
        const result = new Set();
        for (const v of value.values()) {
          result.add(deepClone(v));
        }
        return result;
      }
      // Objeto comum
      const result = {};
      for (const key in value) {
        if (Object.hasOwn(value, key)) {
          result[key] = deepClone(value[key]);
        }
      }
      return result;
    }

    function setDebug(enabled = true) {
      state.debug = enabled;
      if (!enabled) {
        if (state.debugEl) {
          state.debugEl.remove();
          state.debugEl = null;
        }
        return;
      }
      //Cria se não existir
      if (!state.debugEl && state.canvas) {
        const el = state.root.createElement("div");
        const parent = state.canvas.parentElement;
        //garante referência
        if (getComputedStyle(parent).position === "static") {
          parent.style.position = "relative";
        }
        //POSICIONAMENTO SIMPLES (sem render loop)
        el.style.position = "absolute";
        el.style.left = state.canvas.offsetLeft + "px";
        el.style.top = (state.canvas.offsetTop) + "px"; // 🔥 sobe acima do canvas
        //visual
        el.style.background = "rgba(0,0,0,0.7)";
        el.style.color = "#0f0";
        el.style.font = "12px monospace";
        el.style.padding = "4px 6px";
        el.style.zIndex = "10";
        el.style.pointerEvents = "none";
        el.style.whiteSpace = "pre";
        parent.appendChild(el);
        state.debugEl = el;
      }
    }


    function addGlobalEvent(target, event, handler) {
      const exists = state.globalEvents.some(e => e.target === target && e.event === event && e.handler === handler);
      if (exists) return; // 🚫 já existe → não adiciona
      target.addEventListener(event, handler);
      state.globalEvents.push({ target, event, handler });
    }

    function removeGlobalEvent(target, event, handler) {
      for (let i = state.globalEvents.length - 1; i >= 0; i--) {
        const e = state.globalEvents[i];
        if (e.target === target && e.event === event && e.handler === handler) {
          e.target.removeEventListener(e.event, e.handler);
          state.globalEvents.splice(i, 1);
        }
      }
    }

    function removeAllGlobalEvents() {
      for (const e of state.globalEvents) {
        e.target.removeEventListener(e.event, e.handler);
      }
      state.globalEvents.length = 0;
    }

    function measuretCanvas() {
      if (state.fixedResolution.width) {
        return state.fixedResolution;
      } else {
        return {
          width: state.canvas ? state.canvas.width : 300,
          height: state.canvas ? state.canvas.height : 150
        };
      }
    }

    function getTextBounds(el) {
      const range = state.root.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      if (!rects.length) {
        return el.getBoundingClientRect();
      }
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const r of rects) {
        if (r.width === 0 || r.height === 0) continue; //ignore empty
        if (r.left < left) left = r.left;
        if (r.top < top) top = r.top;
        if (r.right > right) right = r.right;
        if (r.bottom > bottom) bottom = r.bottom;
      }
      // fallback
      if (left === Infinity) {
        return el.getBoundingClientRect();
      }
      return {
        left,
        top,
        width: right - left,
        height: bottom - top
      };
    }

    function createFakeEditor(initialValue = "") {
      let value = initialValue;
      const canvas = state.canvas;
      return {
        getValue() {
          return value;
        },
        setValue(v) {
          value = v;
        },
        refresh() {
        },
        getWrapperElement() {
          return {
            style: {},
            parentElement: {
              clientWidth: measuretCanvas().width,
              clientHeight: measuretCanvas().height
            }
          };
        },
        clearGutter() { },
        eachLine() { },
        removeLineClass() { },
        setGutterMarker() { },
        addLineClass() { },
        toTextArea() { }
      };
    }

  

    function resizeBuffersToMatchCanvas() {
      const width = measuretCanvas().width;
      const height = measuretCanvas().height;

      for (let i = 0; i < state.buffers.length; i++) {
        const buf = state.buffers[i];
        if (!buf) continue;
        if (buf.width === width && buf.height === height) continue; //sai se ja esta no tamanho
        if (buf.fixedwidth && buf.fixedheight) continue; //sai se buffer tem tamanho especifico
        //cria novo buffer completo
        const newBuf = createFBO(width, height, buf.localconfig);
        //substitui objeto inteiro (NÃO mexe em getters)
        state.buffers[i] = newBuf;
      }
    }

    function stripCommentsPreserveLines(code) {
      return code
        // remove // comentários (preserva linha)
        .replace(/\/\/.*$/gm, match => " ".repeat(match.length))
        // remove /* */ comentários (preserva linhas)
        .replace(/\/\*[\s\S]*?\*\//g, match =>
          match.replace(/[^\n]/g, " ")
        );
    }

    function validateChannels(parsed) {
      let hasError = false;
      function checkCode(code, lineOffset, cm) {
        const cleanCode = stripCommentsPreserveLines(code); // 🔥 AQUI
        const regex = /\biChannel(\d+)\b/g;
        let match;
        while ((match = regex.exec(cleanCode)) !== null) {
          const ch = parseInt(match[1]);
          if (!state.usedChannels.includes(ch)) {
            state.usedChannels.push(ch);
          }
          let valid = false;
          if (state.buffers[ch]) valid = true;
          if (state.texStatic[ch]) valid = true;
          /*if (!valid) {
            hasError = true;
            const before = cleanCode.substring(0, match.index);
            const line = before.split('\n').length;
            const editorLine = lineOffset + line + 1;
            if (state.errorDiv) {
              markErrorLine(cm, editorLine);
              state.errorDiv.textContent = "Invalid iChannel" + ch + " (not initialized)";
              state.errorDiv.style.color = 'red';
            }
            showError();
          }*/
        }
      }
      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        const key = "Buffer" + i;
        if (parsed[key] && parsed[key].code) {
          checkCode(parsed[key].code, parsed[key].line, state.codefrag);
        }
      }
      if (parsed.Main.code) {
        checkCode(parsed.Main.code, parsed.Main.line, state.codefrag);
      }
      return !hasError;
    }

    function detectDependencies(parsed) {
      state.bufferDeps = [];
      state.selfFeedback = [];
      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        state.bufferDeps[i] = [];
        state.selfFeedback[i] = false;
        const key = "Buffer" + i;
        if (parsed[key] && parsed[key].code) {
          const code = parsed[key].code;
          for (let j = 0; j < state.MAX_CHANNELS; j++) {
            const regex =
              new RegExp(
                "(texture2D|texture|texelFetch)\\s*\\(\\s*iChannel" + j,
                "g"
              );
            if (regex.test(code)) {
              if (j === i) {
                state.selfFeedback[i] = true;
              } else {
                state.bufferDeps[i].push(j);
              }
            }
          }
        }
      }
    }

    function detectLoops() {
      const visited = new Array(state.MAX_CHANNELS).fill(0);
      const stack = new Array(state.MAX_CHANNELS).fill(false);
      state.loopNodes.clear();
      function dfs(node) {
        if (!state.buffers[node]) return;
        visited[node] = 1;
        stack[node] = true;
        for (let dep of state.bufferDeps[node]) {
          if (dep === node) continue;
          if (!state.buffers[dep]) continue;
          if (!visited[dep]) {
            dfs(dep);
          } else if (stack[dep]) {
            state.loopNodes.add(dep);
            state.loopNodes.add(node);
          }
        }
        stack[node] = false;
        visited[node] = 2;
      }
      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        if (state.buffers[i] && !visited[i]) {
          dfs(i);
        }
      }
    }

    function buildExecutionOrder() {
      detectLoops();
      const visited = new Array(state.MAX_CHANNELS).fill(false);
      state.linearOrder = [];
      function dfs(node) {
        if (visited[node]) return;
        visited[node] = true;
        for (let dep of state.bufferDeps[node]) {
          if (!state.loopNodes.has(dep)) {
            dfs(dep);
          }
        }
        if (!state.loopNodes.has(node)) {
          state.linearOrder.push(node);
        }
      }
      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        if (state.buffers[i]) {
          dfs(i);
        }
      }
      state.executionOrder = [...state.linearOrder, ...state.loopNodes];
    }

    function syncText() {
      if (!state.text) return;
      const r = state.text.getBoundingClientRect();
      const lastRect = state.lastRect;
      if (!lastRect ||
        r.left !== lastRect.left ||
        r.top !== lastRect.top ||
        r.width !== lastRect.width ||
        r.height !== lastRect.height) {
        state.lastRect = r;
        updateMaskPath();
      }
      requestAnimationFrame(syncText);
    }

    function rebuildGlyphs() {
      if (!state.text || !state.svg) return;
      const cs = getComputedStyle(state.text);
      let txt = (state.text.textContent || "")
        .replace(/\u200B/g, "")
        .replace(/\r|\n|\t/g, "")
        .trim();
      if (txt === state.lastTextContent) return;
      state.lastTextContent = txt;
      const clip = state.svg.querySelector("clipPath");
      if (!clip) return;
      const old = Array.from(clip.children);
      const newGlyphs = [];
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i];
        if (!ch) continue;
        let t = old[i];
        // 🔥 reutiliza se existir
        if (!t || t.tagName !== "text") {
          t = state.root.createElementNS("http://www.w3.org/2000/svg", "text");
          clip.appendChild(t);
        }
        // 🔥 atualiza conteúdo/estilo
        t.textContent = ch;
        t.setAttribute("font-family", cs.fontFamily);
        t.setAttribute("font-size", cs.fontSize);
        t.setAttribute("font-weight", cs.fontWeight);
        t.setAttribute("dominant-baseline", "alphabetic");
        // mantém posição (será ajustado depois)
        t.setAttribute("x", 0);
        t.setAttribute("y", 0);
        newGlyphs.push(t);
      }
      // 🔥 remove sobras (se texto diminuiu)
      for (let i = txt.length; i < old.length; i++) {
        old[i].remove();
      }
      state.glyphs = newGlyphs;
    }

    function updateMaskPath() {
      if (state.fixedResolution.width) return;
      if (!state.text || !state.glyphs) return;
      rebuildGlyphs();
      const bounds = getTextBounds(state.text);
      const rect = state.text.getBoundingClientRect();
      const style = getComputedStyle(state.text);
      const canvas = state.canvas;
      const svg = state.svg;
      canvas.width = Math.round(bounds.width);
      canvas.height = Math.round(bounds.height);
      canvas.style.left = bounds.left + "px";
      canvas.style.width = bounds.width + "px";
      canvas.style.height = bounds.height + "px";
      svg.style.left = bounds.left + "px";
      svg.style.width = bounds.width + "px";
      svg.style.height = bounds.height + "px";
      svg.setAttribute("width", bounds.width);
      svg.setAttribute("height", bounds.height);
      const ctx = state.root.createElement("canvas").getContext("2d");
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = ctx.measureText(state.text.textContent || "");
      let ascent = metrics.actualBoundingBoxAscent;
      let descent = metrics.actualBoundingBoxDescent;
      if (!ascent) {
        const fs = parseFloat(style.fontSize);
        ascent = fs * 0.8; descent = fs * 0.2;
      }
      const textHeight = ascent + descent;
      const offsetY = bounds.top - rect.top;
      let y = offsetY + (bounds.height - textHeight) / 2 + ascent;
      if (y < ascent) y = ascent;
      //const manualincrease=1;
      //canvas.style.top=(bounds.top+(ascent*manualincrease))+"px";
      //svg.style.top=(bounds.top+(ascent*manualincrease))+"px";
      canvas.style.top = bounds.top + "px";
      svg.style.top = bounds.top + "px";
      let x = 0;
      for (let i = 0; i < state.glyphs.length; i++) {
        const g = state.glyphs[i];
        g.setAttribute("font-size", style.fontSize);
        g.setAttribute("font-family", style.fontFamily);
        g.setAttribute("font-weight", style.fontWeight);
        g.setAttribute("x", x);
        g.setAttribute("y", y);
        let w = g.getComputedTextLength();
        if (!w || isNaN(w) || w === 0) {
          try { w = g.getBBox().width; } catch { w = parseFloat(style.fontSize) * 0.5; }
        }
        if (g.textContent === " ") w = parseFloat(style.fontSize) * 0.25;
        x += w + (state.config.letterSpacing || 0);
      }
    }

    function updateMask() {
      if (state.fixedResolution.width) return;
      if (!state.text) return;
      if (state.config.glyph) {
        return updateMaskPath();
      }
      const canvas = state.canvas;
      const svg = state.svg;
      const text = state.text;
      const textNode = state.textNode;
      const bounds = getTextBounds(text);
      const rect = text.getBoundingClientRect();
      const style = getComputedStyle(text);
      canvas.width = Math.round(bounds.width);
      canvas.height = Math.round(bounds.height);
      canvas.style.left = bounds.left + "px";
      canvas.style.top = bounds.top + "px";
      canvas.style.width = bounds.width + "px";
      canvas.style.height = bounds.height + "px";
      svg.style.left = bounds.left + "px";
      svg.style.top = bounds.top + "px";
      svg.style.width = bounds.width + "px";
      svg.style.height = bounds.height + "px";
      //SVG EM CSS PIXELS (NÃO usar DPR aqui)
      svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      //medir fonte
      const ctx = state.root.createElement("canvas").getContext("2d");
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = ctx.measureText(text.textContent);
      let ascent = metrics.actualBoundingBoxAscent;
      let descent = metrics.actualBoundingBoxDescent;
      if (!ascent) {
        const fontSize = parseFloat(style.fontSize);
        ascent = fontSize * 0.8;
        descent = fontSize * 0.2;
      }
      const textHeight = ascent + descent;
      const offsetY = bounds.top - rect.top;
      //correção CRÍTICA: clamp pra evitar cortar topo
      let y = offsetY + (bounds.height - textHeight) / 2 + ascent;
      //evita cortar em tamanhos pequenos
      if (y < ascent) y = ascent;
      textNode.setAttribute("x", "0");
      textNode.setAttribute("y", y);
      textNode.setAttribute("dominant-baseline", "alphabetic");
      textNode.setAttribute("font-size", style.fontSize);
      textNode.setAttribute("font-family", style.fontFamily);
      textNode.setAttribute("font-weight", style.fontWeight);
      textNode.setAttribute("letter-spacing", style.letterSpacing);
      textNode.textContent = text.textContent;
    }

    function acceptClicks() {
      if (clickHandler) {
        removeGlobalEvent(window, "mousedown", clickHandler);
      }
      const svg = state.svg;
      clickHandler = (e) => {
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        //1. precise path
        const paths = svg.querySelectorAll("path");
        for (const p of paths) {
          if (p.isPointInFill(svgP)) {
            triggerClick(p, e);
            return;
          }
        }
        //2. TEXT (fallback via bounding box)
        const texts = svg.querySelectorAll("text");
        for (const t of texts) {
          try {
            const box = t.getBBox();
            if (
              svgP.x >= box.x &&
              svgP.x <= box.x + box.width &&
              svgP.y >= box.y &&
              svgP.y <= box.y + box.height
            ) {
              triggerClick(t, e);
              return;
            }
          } catch (err) {
            // browser fail
          }
        }
      };
      addGlobalEvent(state.root, "mousedown", clickHandler);//original window
    }

    function getOnClick(el) {
      if (typeof el.onclick === "function") return el.onclick;
      if (typeof el.onClick === "function") return el.onClick;
      if (typeof el.OnClick === "function") return el.OnClick;
      return null;
    }


    function triggerClick(el, e) {
      if (!el) return;
      function getClickKey(e) {
        return `${e.clientX},${e.clientY},${e.timeStamp}`;
      }
      const key = getClickKey(e);
      if (lastClickKey === key) return;
      lastClickKey = key;
      const handler = getOnClick(el);
      if (handler) {
        handler(e);
      }
    }

    function resizeCanvas() {
      if (!state.canvas || !state.gl) return;
      const canvas = state.canvas;
      const text = state.text;
      const codevertex = state.codevertex;
      const codefrag = state.codefrag;
      const gl = state.gl;
      let rect;
      //MODO ShaderText (segue o texto)
      if (text) {
        updateMask();
      } else if (state.container) { //MODO Editor normal
        if (!state.fixedResolution.width) {
          canvas.width = state.container.clientWidth;
          canvas.height = Math.floor(canvas.width / 2);
        } else {
          canvas.width = measuretCanvas().width;
          canvas.height = measuretCanvas().height;
        }
        canvas.style.position = "relative";
        canvas.style.left = "0px";
        canvas.style.top = "0px";
      }

      gl.viewport(0, 0, measuretCanvas().width, measuretCanvas().height);
      // ajuste editor
      if (codevertex) {
        codevertex.getWrapperElement().style.width =
          (codevertex.getWrapperElement().parentElement.clientWidth - 10) + 'px';
        codevertex.getWrapperElement().style.height =
          (codevertex.getWrapperElement().parentElement.clientHeight - 60) + 'px';
      }
      if (codefrag) {
        codefrag.getWrapperElement().style.width =
          (codefrag.getWrapperElement().parentElement.clientWidth - 10) + 'px';
        codefrag.getWrapperElement().style.height =
          (codefrag.getWrapperElement().parentElement.clientHeight - 60) + 'px';
      }
      resizeBuffersToMatchCanvas();
      //}, 50);
    }



    function resizeCanvasBounce() {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(() => {
        resizeCanvas();
      }, 100);
    }

    function scrolPage() {
      requestAnimationFrame(resizeCanvas);
    }





    function compileShader(gl, source, type, lineOffset) {
      const shader = gl.createShader(type);


      let fullSource = source;
      let header = "";
      let localHeaderLen = 0;




      if (type === gl.FRAGMENT_SHADER) {
        if (state.webGlversion == 1) {
          //GLS1
          let channels = "";
          for (let i = 0; i < state.MAX_CHANNELS; i++) {
            channels += `uniform sampler2D iChannel${i};`;
          }
          let audioUniforms = "";
          for (let i = 0; i < state.MAX_AUDIOS; i++) {
            audioUniforms += `uniform sampler2D iAudio${i};`;
          }
          let videoUniforms = "";
          for (let i = 0; i < state.MAX_VIDEOS; i++) {
            videoUniforms += `uniform sampler2D iVideo${i};`;
          }
          header = `precision ${state.config.precision} float;uniform vec3 iResolution;uniform float iTime;uniform float iTimeDelta;uniform float iFrameRate;uniform int iFrame;uniform vec4 iMouse;uniform vec4 iDate;
          uniform float iBeat;
          ${channels}
          ${audioUniforms}
          ${videoUniforms}
          void mainImage(out vec4 fragColor,in vec2 fragCoord);
          float getfrequency(float x, sampler2D iAudio) {          
            float uvx = x;
            float f = texture2D(iAudio, vec2(uvx, 0.0)).x;
            return mix(0.1, 1.0, f);
          }
          `;
          const wrapper = `void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;
          localHeaderLen = header.split('\n').length;
          fullSource = header + '\n' + source + '\n' + wrapper;
        } else if (state.webGlversion == 3) {
          //GLS3
          let channels = "";
          for (let i = 0; i < state.MAX_CHANNELS; i++) {
            channels += `uniform sampler2D iChannel${i};\n`;
          }

          let audioUniforms = "";
          for (let i = 0; i < state.MAX_AUDIOS; i++) {
            audioUniforms += `uniform sampler2D iAudio${i};\n`;
          }

          let videoUniforms = "";
          for (let i = 0; i < state.MAX_VIDEOS; i++) {
            videoUniforms += `uniform sampler2D iVideo${i};\n`;
          }

          header = `precision ${state.config.precision} float; out vec4 fragColor; uniform vec3 iResolution; uniform float iTime; uniform float iTimeDelta; uniform float iFrameRate; uniform int iFrame; uniform vec4 iMouse; uniform vec4 iDate; uniform float iBeat;
        ${channels}
        ${audioUniforms}
        ${videoUniforms}
        void mainImage(out vec4 fragColor, in vec2 fragCoord);        
        float getfrequency(float x, sampler2D iAudio) {          
            float uvx = x;
            float f = texture(iAudio, vec2(uvx, 0.0)).x;
            return mix(0.1, 1.0, f);
        }
        `;
          const wrapper = `void main() { mainImage(fragColor, gl_FragCoord.xy);} `;

          // adapta funções antigas automaticamente
          let adaptedSource = source
            .replace(/^\s*#version.*$/gm, '')
            .replace(/\battribute\b/g, "in")
            .replace(/\bvarying\b/g, "out")
            .replace(/\btexture2D\b/g, "texture")
            .replace(/\bgl_FragColor\b/g, "fragColor");
          localHeaderLen = header.split('\n').length;
          fullSource = `#version 300 es
          ${header}
          ${adaptedSource}
          ${wrapper}`;

        }
      }

      if (type === gl.VERTEX_SHADER && state.webGlversion == 3) {
        let adapted = source
          .replace(/^\s*#version.*$/gm, '') // ✅ REMOVE SEMPRE
          .replace(/\battribute\b/g, "in")
          .replace(/\bvarying\b/g, "out");

        fullSource = `#version 300 es
        ${adapted}`;
      }

      //console.log(fullSource);

      gl.shaderSource(shader, fullSource);
      gl.compileShader(shader);

      if (state.errorDiv) state.errorDiv.textContent = '';

      //console.log(state.vv);
      //console.log("lost?", gl.isContextLost && gl.isContextLost());

      const glstatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!glstatus) {
        const errorMsg = gl.getShaderInfoLog(shader);

        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        const codeEditor = type === gl.VERTEX_SHADER ? state.codevertex : state.codefrag;
        const linesMarked = [];
        //const processedErrors = errorMsg.replace(/ERROR:\s0:(\d+):/g, (match, lineNum) => {
        const processedErrors = errorMsg.replace(/ERROR:\s(\d+):(\d+):/g, (match, fileId, lineNum) => {
          const errorLine = parseInt(lineNum);
          let editorLine = errorLine;
          if (type === gl.FRAGMENT_SHADER) {
            //editorLine = lineOffset + 0 + (errorLine - localHeaderLen);            
            editorLine = errorLine;
            if (fileId == 0) { editorLine += 1; } else { editorLine += 2; }
          }
          if (!linesMarked.includes(editorLine)) {
            markErrorLine(codeEditor, editorLine);
            linesMarked.push(editorLine);
          }
          return `LINE: ${editorLine}:`;
        });
        if (state.errorDiv) {
          state.errorDiv.innerText = `${shaderType} Shader Error:\n${processedErrors}`;
          state.errorDiv.style.color = 'red';
        } else {
          console.warn(`${shaderType} Shader Error:\n${processedErrors}`)
        }
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(gl, vs, fs) {
      //console.log(state.isEditorMode, state.vv, state.errorDiv);      
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (state.errorDiv) state.errorDiv.textContent = '';
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const errorMsg = gl.getProgramInfoLog(program);
        if (state.errorDiv) {
          state.errorDiv.textContent = 'Program link error: ' + errorMsg;
          state.errorDiv.style.color = 'red';
        } else {
          console.warn('Program link error: ' + errorMsg);
        }
        gl.deleteProgram(program);
        return null
      }
      program._uniforms = {};
      program._attribs = {};
      return program
    }

    function cacheAttrib(program, name) { if (!program._attribs[name]) program._attribs[name] = state.gl.getAttribLocation(program, name); return program._attribs[name] }

    function cacheUniform(program, name) {
      if (program._uniforms === undefined) program._uniforms = {};
      if (program._uniforms[name] === undefined) {
        program._uniforms[name] = state.gl.getUniformLocation(program, name);
      }
      return program._uniforms[name];
    }

    function applyUniform(program, name, entry) {

      if (!entry) return;

      const { value, type = "float" } = entry;
      const gl = state.gl;

      let loc = cacheUniform(program, name);

      // ⚠️ WebGL pode retornar null (uniform não usado)
      if (loc === null) return;

      // =========================================
      // ✅ BOOLEAN (sempre como int)
      // =========================================
      if (typeof value === "boolean") {
        gl.uniform1i(loc, value ? 1 : 0);
        return;
      }

      // =========================================
      // ✅ NUMBER (respeita type)
      // =========================================
      if (typeof value === "number") {

        if (type && type.startsWith("int")) {
          gl.uniform1i(loc, value | 0);
        } else {
          gl.uniform1f(loc, value);
        }

        return;
      }

      // =========================================
      // ✅ FLOAT32ARRAY
      // =========================================
      if (value instanceof Float32Array) {

        const len = value.length;

        loc = cacheUniform(program, name + "[0]");
        if (loc === null) return;

        if (len % 4 === 0) gl.uniform4fv(loc, value);
        else if (len % 3 === 0) gl.uniform3fv(loc, value);
        else if (len % 2 === 0) gl.uniform2fv(loc, value);
        else gl.uniform1fv(loc, value);

        return;
      }

      // =========================================
      // ✅ INT32ARRAY
      // =========================================
      if (value instanceof Int32Array) {

        loc = cacheUniform(program, name + "[0]");
        if (loc === null) return;

        const len = value.length;
        if (len % 4 === 0) gl.uniform4iv(loc, value);
        else if (len % 3 === 0) gl.uniform3iv(loc, value);
        else if (len % 2 === 0) gl.uniform2iv(loc, value);
        else gl.uniform1iv(loc, value);
        return;
      }

      // =========================================
      // ✅ ARRAY NORMAL (JS ARRAY)
      // =========================================
      if (Array.isArray(value)) {

        const len = value.length;

        // ================= ARRAY GRANDE =================
        if (len > 4) {

          loc = cacheUniform(program, name + "[0]");
          if (loc === null) return;

          if (type && type.startsWith("int")) {

            gl.uniform1iv(loc, new Int32Array(value));

          } else {

            const arr = new Float32Array(value);

            if (len % 4 === 0) gl.uniform4fv(loc, arr);
            else if (len % 3 === 0) gl.uniform3fv(loc, arr);
            else if (len % 2 === 0) gl.uniform2fv(loc, arr);
            else gl.uniform1fv(loc, arr);
          }

          return;
        }

        // ================= VETORES PEQUENOS =================

        if (type && type.startsWith("int")) {

          if (len === 1) gl.uniform1i(loc, value[0] | 0);
          else if (len === 2) gl.uniform2i(loc, value[0] | 0, value[1] | 0);
          else if (len === 3) gl.uniform3i(loc, value[0] | 0, value[1] | 0, value[2] | 0);
          else if (len === 4) gl.uniform4i(loc, value[0] | 0, value[1] | 0, value[2] | 0, value[3] | 0);

        } else {

          if (len === 1) gl.uniform1f(loc, value[0]);
          else if (len === 2) gl.uniform2f(loc, value[0], value[1]);
          else if (len === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
          else if (len === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);

        }

        return;
      }

    }


    function bindEvents() {
      function updateMousePosition(e) {
        if (!state.canvas) return;
        const rect = state.canvas.getBoundingClientRect();
        state.mouse.x =
          ((e.clientX - rect.left) / rect.width) *
          measuretCanvas().width;
        state.mouse.y =
          (1.0 - ((e.clientY - rect.top) / rect.height)) *
          measuretCanvas().height;
      }
      let lastTapTime = 0;
      const doubleTapDelay = 300;
      // ===== MOUSE =====
      const mm = (e) => {
        updateMousePosition(e);
      };

      const md = (e) => {
        updateMousePosition(e);
        state.mouse.isDown = true;
        state.mouse.clickX = state.mouse.x;
        state.mouse.clickY = state.mouse.y;
      };

      const mu = () => {
        state.mouse.isDown = false;
      };

      // ===== TOUCH =====
      const touchstart = (e) => {
        if (!e.touches.length) return;
        const t = e.touches[0];
        const fakeEvent = {
          clientX: t.clientX,
          clientY: t.clientY
        };

        updateMousePosition(fakeEvent);

        state.mouse.isDown = true;
        state.mouse.clickX = state.mouse.x;
        state.mouse.clickY = state.mouse.y;

        // 🔥 DOUBLE TAP = CLICK
        const now = Date.now();
        if (now - lastTapTime < doubleTapDelay) {
          // simula click chamando handler
          triggerClick(state.canvas, fakeEvent);
        }
        lastTapTime = now;
      };

      const touchmove = (e) => {
        if (!e.touches.length) return;

        const t = e.touches[0];

        updateMousePosition({
          clientX: t.clientX,
          clientY: t.clientY
        });
      };

      const touchend = () => {
        state.mouse.isDown = false;
      };

      addGlobalEvent(document, "visibilitychange", () => {
        state.isPaused = document.hidden;
        if (!state.isPaused && !state.rafId) {
          render();
        }
      });

      // ===== BIND =====
      if (state.svg) {
        addGlobalEvent(window, "mousemove", mm);
        addGlobalEvent(window, "mousedown", md);
        addGlobalEvent(window, "touchstart", touchstart);
        addGlobalEvent(window, "touchmove", touchmove);
      } else {
        addGlobalEvent(state.canvas, "mousemove", mm);
        addGlobalEvent(state.canvas, "mousedown", md);
        addGlobalEvent(state.canvas, "touchstart", touchstart);
        addGlobalEvent(state.canvas, "touchmove", touchmove);
      }

      addGlobalEvent(window, "mouseup", mu);

      addGlobalEvent(window, "touchend", touchend);
    }

    function destroy() {
      state.destroyed = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
      removeAllGlobalEvents();
      if (state.resizeTimeout) clearTimeout(state.resizeTimeout);

      const gl = state.gl;
      const program = state.program;
      try {
        if (gl) {
          gl.useProgram(null);
          if (program) gl.deleteProgram(program);

          if (state.positionBuffer) gl.deleteBuffer(state.positionBuffer);

          if (state.buffers) {
            for (let i = 0; i < state.buffers.length; i++) {
              state.buffers[i]?.destroy?.();
            }
          }

          if (state.texStatic) {
            for (let t of state.texStatic) {
              if (t) gl.deleteTexture(t);
            }
          }


          state._uniformCache = null;

          const ext = gl.getExtension("WEBGL_lose_context");
          if (ext) ext.loseContext();
        }
      } catch { }


      try {
        state.canvas?.remove?.();
        state.svg?.remove?.();
      } catch { }

      state.canvas = null;
      state.svg = null;
      state.text = null;
      state.textNode = null;


      try {
        state.codevertex?.toTextArea?.();
        state.codefrag?.toTextArea?.();
      } catch { }

      state.codevertex = null;
      state.codefrag = null;


      state.program = null;
      state.gl = null;
      state.positionBuffer = null;

      state.buffers = [];
      state.texStatic = [];
      state.texStatic0 = null;
      state.texStatic1 = null;

      state.customUniforms = {};
      state.lastUniforms = {};

      state.rafId = null;
      state.frameCount = 0;
      state.lastTime = 0;
      state.skipCounter = 0;

      state.executionOrder = [];
      state.linearOrder = [];
      state.loopNodes.clear?.();

      state.glyphs = null;
      state.svg = null;

      state.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };


      state.alreadyInitied = false;
      state.destroyed = false;

      try {
        if (state.container && state.container.contains(state.canvas)) {
          state.container.innerHTML = "";
        }
      } catch { }
    }



    function applyCustomUniforms(prog) {
      // 🔥 garante existência do cache global
      if (!state._uniformCache) {
        state._uniformCache = new WeakMap();
      }
      // 🔥 pega cache específico desse programa
      let progCache = state._uniformCache.get(prog);
      if (!progCache) {
        progCache = {};
        state._uniformCache.set(prog, progCache);
      }
      // 🔥 percorre todos uniforms custom
      for (let key in state.customUniforms) {
        const entry = state.customUniforms[key];
        if (!entry) continue;
        const currentVersion = entry.version;
        const lastVersion = progCache[key];
        // ✅ SKIP TOTAL → já está atualizado nesse programa
        if (lastVersion === currentVersion) continue;
        // ✅ aplica no GPU
        applyUniform(prog, key, entry);
        // ✅ atualiza cache do programa
        progCache[key] = currentVersion;
      }
    }

    function render(time) {
      if (state.isPaused) {
        state.rafId = null;
        return;
      }
      state.rafId = requestAnimationFrame(render);
      if (state.destroyed) return;
      if (!state.gl) return;
      if (!state.sucessCodes) return;


      const gl = state.gl;
      const config = state.config;
      const program = state.program;
      const canvas = state.canvas;
      const buffers = state.buffers;
      const texStatic = state.texStatic;
      const mouse = state.mouse;
      const fs = config.frameSkip || 0;

      const now = new Date();
      const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const size = measuretCanvas();

      //debug
      const nowp = performance.now();
      state.fpsCounter++;
      if (nowp - state.fpsLastTime >= 1000) {
        state.fps = state.fpsCounter;
        state.fpsCounter = 0;
        state.fpsLastTime = nowp;
      }
      if (state.debug && state.debugEl) {
        const w = size.width;
        const h = size.height;
        state.debugEl.innerText =
          "FPS: " + state.fps + "\n" +
          "RES: " + w + " x " + h;
      }

      // 🔥 controle de skip
      if (state.skipCounter < fs) {
        state.skipCounter++;
        return;
      }
      state.skipCounter = 0;

      if (!program) {
        // só limpa, mas continua rodando
        gl.viewport(0, 0, size.width, size.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      time *= 0.001;
      const deltaTime = time - state.lastTime;
      state.lastTime = time;
      state.frameCount++;

      gl.viewport(0, 0, size.width, size.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      //audio updater
      for (let i = 0; i < state.MAX_AUDIOS; i++) {
        const a = state.audioFFT[i];
        if (!a) continue;
        a.analyser.getByteFrequencyData(a.data);
        gl.bindTexture(gl.TEXTURE_2D, state.audioTextures[i]);
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          a.data.length,
          1,
          state.webGlversion == 3 ? gl.RED : gl.LUMINANCE,   // ✅ AQUI É A DIFERENÇA
          gl.UNSIGNED_BYTE,
          a.data
        );
        const loc = cacheUniform(program, 'iBeat' + i);
        if (loc) gl.uniform1f(loc, state.audioFFT[i]?.beat || 0);
      }

      //video updater
      for (let i = 0; i < state.MAX_VIDEOS; i++) {
        const video = state.videoElements[i];
        const tex = state.videoTextures[i];
        if (!video || !tex) continue;
        if (video.readyState >= 2) {
          const unit =
            state.MAX_CHANNELS +
            state.MAX_AUDIOS +
            i;
          gl.activeTexture(gl.TEXTURE0 + unit);
          if (!tex._initialized && video.videoWidth > 0) {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          }
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
          const loc = cacheUniform(program, 'iVideo' + i);
          if (loc) {
            gl.uniform1i(loc, unit);
          }
        }
      }





      function drawToBuffer(buf) {
        if (!buf || !buf.program) return;
        gl.useProgram(buf.program);
        applyCustomUniforms(buf.program);
        // framebuffer FIXO
        gl.bindFramebuffer(
          gl.FRAMEBUFFER,
          buf.writeFBO
        );
        gl.viewport(
          0,
          0,
          buf.width, buf.height
        );

        gl.bindBuffer(
          gl.ARRAY_BUFFER,
          state.positionBuffer
        );

        const loc = cacheAttrib(
          buf.program,
          'position'
        );

        gl.enableVertexAttribArray(loc);

        gl.vertexAttribPointer(
          loc,
          2,
          gl.FLOAT,
          false,
          0,
          0
        );

        gl.uniform3f(
          cacheUniform(buf.program, 'iResolution'),
          buf.width, buf.height,
          1
        );

        gl.uniform1f(
          cacheUniform(buf.program, 'iTime'),
          time
        );

        gl.uniform1f(
          cacheUniform(buf.program, 'iTimeDelta'),
          deltaTime
        );

        gl.uniform1f(
          cacheUniform(buf.program, 'iFrameRate'),
          deltaTime > 0 ? 1.0 / deltaTime : 0.0
        );

        gl.uniform1i(
          cacheUniform(buf.program, 'iFrame'),
          state.frameCount - 1
        );

        gl.uniform4f(
          cacheUniform(buf.program, 'iMouse'),
          state.mouse.x,
          state.mouse.y,
          state.mouse.clickX,
          state.mouse.clickY
        );


        gl.uniform4f(
          cacheUniform(buf.program, 'iDate'),
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          seconds
        );

        // CHANNELS        

        for (let i = 0; i < state.MAX_CHANNELS; i++) {

          let tex = null;

          if (buffers[i] && i !== buf.id) {
            tex = buffers[i].read;
          } else if (texStatic[i]) {
            tex = texStatic[i];
          }
          else if (state.usedChannels && state.usedChannels.includes(i)) {
            if (!state._emptyTexture) {
              const gl = state.gl;
              const empty = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, empty);

              gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 255]) // preto
              );

              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

              state._emptyTexture = empty;
            }
            tex = state._emptyTexture;
          }


          if (tex) {

            gl.activeTexture(gl.TEXTURE0 + i);

            gl.bindTexture(
              gl.TEXTURE_2D,
              tex
            );

            const loc = cacheUniform(
              buf.program,
              'iChannel' + i
            );

            if (loc !== null) {

              gl.uniform1i(loc, i);
            }
          }
        }

        // AUDIOS

        for (let i = 0; i < state.MAX_AUDIOS; i++) {

          const tex = state.audioTextures[i];

          if (!tex) continue;

          const unit =
            state.MAX_CHANNELS + i;

          gl.activeTexture(
            gl.TEXTURE0 + unit
          );

          gl.bindTexture(
            gl.TEXTURE_2D,
            tex
          );

          const loc = cacheUniform(
            buf.program,
            'iAudio' + i
          );

          if (loc !== null) {

            gl.uniform1i(loc, unit);
          }
        }

        // VIDEOS

        for (let i = 0; i < state.MAX_VIDEOS; i++) {

          const tex = state.videoTextures[i];

          if (!tex) continue;

          const unit =
            state.MAX_CHANNELS +
            state.MAX_AUDIOS +
            i;

          gl.activeTexture(
            gl.TEXTURE0 + unit
          );

          gl.bindTexture(
            gl.TEXTURE_2D,
            tex
          );

          const loc = cacheUniform(
            buf.program,
            'iVideo' + i
          );

          if (loc !== null) {

            gl.uniform1i(loc, unit);
          }
        }

        gl.drawArrays(
          gl.TRIANGLES,
          0,
          6
        );

        gl.bindFramebuffer(
          gl.FRAMEBUFFER,
          null
        );
      }

      //apply videos
      for (let i = 0; i < state.MAX_VIDEOS; i++) {

        const tex = state.videoTextures[i];

        if (!tex) continue;

        const unit =
          state.MAX_CHANNELS +
          state.MAX_AUDIOS +
          i;

        gl.activeTexture(gl.TEXTURE0 + unit);

        gl.bindTexture(gl.TEXTURE_2D, tex);

        const loc =
          cacheUniform(
            program,
            'iVideo' + i
          );

        if (loc !== null) {

          gl.uniform1i(loc, unit);

        }
      }


      // buffers
      // render ALL first
      gl.disable(gl.BLEND);

      for (let id of state.executionOrder) {

        if (buffers[id]) {

          drawToBuffer(buffers[id]);

        }
      }

      // THEN swap ALL

      for (let id of state.executionOrder) {

        if (buffers[id]) {

          buffers[id].swap();

        }
      }

      // Render final para a tela
      if (state.config.alpha) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } else {
        gl.disable(gl.BLEND);
      }
      // final

      gl.useProgram(program);

      applyCustomUniforms(program);

      gl.enableVertexAttribArray(state.positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer);
      gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform3f(state.iResolutionLocation, size.width, size.height, 1);
      gl.uniform1f(state.iTimeLocation, time);
      gl.uniform1f(state.iTimeDeltaLocation, deltaTime);
      gl.uniform1i(state.iFrameLocation, state.frameCount - 1);

      const frameRate = deltaTime > 0 ? 1.0 / deltaTime : 0.0;
      gl.uniform1f(state.iFrameRateLocation, frameRate);

      const mx = mouse.x;
      const my = mouse.y;
      const cx = mouse.isDown ? mouse.clickX : -mouse.clickX;
      const cy = mouse.isDown ? mouse.clickY : -mouse.clickY;

      gl.uniform4f(state.iMouseLocation, mx, my, cx, cy);



      gl.uniform4f(state.iDateLocation,
        now.getFullYear(), now.getMonth() + 1, now.getDate(), seconds
      );

      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        let tex = null;
        if (buffers[i]) tex = buffers[i].read;
        else if (texStatic[i]) tex = texStatic[i];

        if (tex) {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform1i(state.iChannelLocations[i], i);
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      //draw background
      //if (text && frameCount % (config.frameSkip || 1) === 0) {
      //text.style.backgroundImage = `url(${canvas.toDataURL()})`;
      //}
    }



    function detectGLSLVersion(vertex, fragment) {
      if (!vertex || !fragment) return 0;

      const src = (vertex + "\n" + fragment)
        .replace(/\uFEFF/g, '')
        .replace(/\r/g, '');

      // versão explícita
      if (/#version\s+300\s+es/i.test(src)) {
        //defaults for GLS3 BUFFER
        state.config.texture.internalFormat = "RGBA32F";
        state.config.texture.type = "FLOAT";
        //state.config.texture.minFilter = "NEAREST";
        //state.config.texture.magFilter = "NEAREST";
        return 3;
      }


      //defaults for GLS1 Buffer
      state.config.texture.internalFormat = "RGBA";
      state.config.texture.type = "UNSIGNED_BYTE";
      //state.config.texture.minFilter = "LINEAR";
      //state.config.texture.magFilter = "LINEAR";
      return 1;
    }


    function parseShaderSections(fragmentSource) {
      const sections = {
        Common: { code: "", line: -1 },
        Main: { code: "", line: -1 },
        images: {}
      };


      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        sections["Buffer" + i] = { code: "", line: -1 };
      }

      const lines = fragmentSource.split("\n");
      let currentSection = null;
      let currentCode = [];

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (!line.startsWith("//")) {
          if (currentSection) currentCode.push(rawLine);
          continue;
        }
        const content = line.slice(2).trim(); // remove "//"


        // ✅ COMMON    
        if (/^Common$/i.test(content)) {
          if (currentSection && sections[currentSection]) {
            sections[currentSection].code = currentCode.join("\n").trim();
          }

          currentSection = "Common";
          sections.Common.line = i;
          currentCode = [];
          continue;
        }


        const channelMatch = content.match(/^iChannel(\d+)(?:\s*=\s*(.+))?$/i);
        if (channelMatch) {
          const id = parseInt(channelMatch[1]);
          const value = channelMatch[2];

          if (value) {
            sections.images[`iChannel${id}`] = value.trim();
          }

          if (currentSection && sections[currentSection]) {
            sections[currentSection].code = currentCode.join("\n").trim();
          }

          currentSection = "Buffer" + id;
          sections[currentSection].line = i;
          currentCode = [];
          continue;
        }

        if (/^Main$/i.test(content)) {
          if (currentSection && sections[currentSection]) {
            sections[currentSection].code = currentCode.join("\n").trim();
          }

          currentSection = "Main";
          sections.Main.line = i;
          currentCode = [];
          continue;
        }

        if (currentSection) {
          currentCode.push(rawLine);
        }
      }

      if (currentSection && sections[currentSection]) {
        sections[currentSection].code = currentCode.join("\n").trim();
      }

      return sections;
    }



    function createFBO(width, height, options = {}) {
      let localconfig = deepClone(state.config);
      deepMerge(localconfig, options);
      function glValue(gl, value) {
        return typeof value === "string" ? gl[value] : value;
      }
      const gl = state.gl;

      const useFloat = localconfig.texture.type === "FLOAT";

      // ✅ ativa extensão se for float
      if (useFloat) {
        gl.getExtension('EXT_color_buffer_float');
      }

      function createTexture(initialData = null) {

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        if (useFloat) {
          // ✅ FLOAT REAL
          gl.texImage2D(
            glValue(gl, localconfig.texture.target),
            glValue(gl, localconfig.texture.level),
            glValue(gl, localconfig.texture.internalFormat),
            width,
            height,
            glValue(gl, localconfig.texture.border),
            glValue(gl, localconfig.texture.format),
            glValue(gl, localconfig.texture.type),
            null
          );
        } else {
          // ✅ modo antigo (byte)
          if (!initialData) {
            initialData = new Uint8Array(width * height * 4);
            for (let i = 0; i < initialData.length; i += 4) {
              initialData[i + 0] = 0;
              initialData[i + 1] = 0;
              initialData[i + 2] = 0;
              initialData[i + 3] = 255;
            }
          }

          gl.texImage2D(
            glValue(gl, localconfig.texture.target),
            glValue(gl, localconfig.texture.level),
            glValue(gl, localconfig.texture.internalFormat),
            width,
            height,
            glValue(gl, localconfig.texture.border),
            glValue(gl, localconfig.texture.format),
            glValue(gl, localconfig.texture.type),
            initialData
          );
        }


        gl.texParameteri(
          glValue(gl, localconfig.texture.target),
          gl.TEXTURE_MIN_FILTER,
          glValue(gl, localconfig.texture.minFilter)
        );

        gl.texParameteri(
          glValue(gl, localconfig.texture.target),
          gl.TEXTURE_MAG_FILTER,
          glValue(gl, localconfig.texture.magFilter)
        );

        gl.texParameteri(
          glValue(gl, localconfig.texture.target),
          gl.TEXTURE_WRAP_S,
          glValue(gl, localconfig.texture.wrapS)
        );

        gl.texParameteri(
          glValue(gl, localconfig.texture.target),
          gl.TEXTURE_WRAP_T,
          glValue(gl, localconfig.texture.wrapT)
        );

        return tex;
      }

      function createFramebuffer(tex) {

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          tex,
          0
        );

        // ✅ limpa só no modo byte (float começa vazio)
        if (!useFloat) {
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return fbo;
      }

      const tex0 = createTexture();
      const tex1 = createTexture();

      const fbo0 = createFramebuffer(tex0);
      const fbo1 = createFramebuffer(tex1);
      let fixedwidth = 0;
      let fixedheight = 0;
      return {
        width,
        height,
        fixedwidth,
        fixedheight,
        localconfig,
        textures: [tex0, tex1],
        framebuffers: [fbo0, fbo1],

        index: 0,
        setSize(w, h, options = {}) {
          let innerOptions = deepClone(state.config);
          deepMerge(innerOptions, options);
          const newFBO = createFBO(w, h, innerOptions);
          this.localconfig = innerOptions;
          this.width = w;
          this.height = h;

          this.textures = newFBO.textures;
          this.framebuffers = newFBO.framebuffers;

          this.fixedwidth = w;
          this.fixedheight = h;
        },
        get read() {
          return this.textures[this.index];
        },

        get write() {
          return this.textures[1 - this.index];
        },

        get readFBO() {
          return this.framebuffers[this.index];
        },

        get writeFBO() {
          return this.framebuffers[1 - this.index];
        },

        swap() {
          this.index = 1 - this.index;
        },

        destroy() {
          this.textures.forEach(t => gl.deleteTexture(t));
          this.framebuffers.forEach(f => gl.deleteFramebuffer(f));
        }
      };
    }

    function loadTextureAsync(url, num) {
      const gl = state.gl;
      return new Promise((resolve, reject) => {
        const texture = gl.createTexture();
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          const isPOT = (v) => (v & (v - 1)) === 0;
          if (isPOT(image.width) && isPOT(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
          } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // melhor que NEAREST
          }
          resolve(texture); // ✅ aqui termina
        };
        image.onerror = reject;
        image.src = url;
      });
    }

    function loadTexture(url, num) { const gl = state.gl; const texture = gl.createTexture(); const image = new Image(); image.crossOrigin = "anonymous"; image.src = url; image.onload = () => { gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); const isPOT = (v) => (v & (v - 1)) === 0; if (isPOT(image.width) && isPOT(image.height)) { gl.generateMipmap(gl.TEXTURE_2D) } else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST) } }; return texture }


    function ensureGLContext(version) {
      if (version == 0) return;
      const canvas = state.canvas;
      const needWebGL2 = version === 3;

      const hasContext = !!state.gl;
      const isWebGL2 = hasContext && (state.gl instanceof WebGL2RenderingContext);

      // ✅ já está correto → não recria
      if (hasContext && (needWebGL2 === isWebGL2)) return;

      // ✅ NÃO use loseContext aqui (bug que causava tudo)
      // ext?.loseContext(); ❌ REMOVIDO

      // ✅ cria novo contexto
      let gl = null;

      if (needWebGL2) {
        gl = canvas.getContext("webgl2", { alpha: state.config.alpha, antialias: true, premultipliedAlpha: false });
      }

      if (!gl) {
        gl =
          canvas.getContext("webgl", { alpha: state.config.alpha, antialias: true, premultipliedAlpha: false }) ||
          canvas.getContext("experimental-webgl", { alpha: state.config.alpha, antialias: true, premultipliedAlpha: false });
      }

      if (!gl) {
        console.error("WebGL não suportado");
        state.gl = null;
        return;
      }

      if (state.gl) {
        state.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        state.gl.useProgram(null);
      }

      // ✅ atualiza state de forma consistente
      state.gl = gl;

      // ✅ sincroniza versão REAL (fundamental!)
      //state.webGlversion = (gl instanceof WebGL2RenderingContext) ? 3 : 1;

      // ✅ limpa estado antigo (evita resíduos do contexto anterior)



      gl.disable(gl.BLEND);


      // ✅ recria buffer padrão SEM resíduos
      state.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer);

      const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
      ]);

      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);


    }

    function continueInit() {
      bindEvents();

      /*const canvas = state.canvas;
      state.gl = canvas.getContext("webgl", { alpha: state.config.alpha }) || canvas.getContext("experimental-webgl", { alpha: state.config.alpha });
      const gl = state.gl;
      if (state.config.alpha) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      state.positionBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer);
      const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]; gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      */
      //removeGlobalEvent(window, "resize", resizeCanvasBounce);
      //addGlobalEvent(window, 'resize', resizeCanvasBounce);
      if (state.alreadyInitied) { resizeCanvasBounce(); sampleExec(state.entryExample) }
      //requestAnimationFrame(render);  
      setTimeout(() => {
        render();
      }, 500);
    }

    function init(options) {
      //console.log('init');


      if (!state.container) state.container = state.root.getElementById("myContainer");
      if (!state.canvas) {
        state.canvas = state.root.createElement('canvas');
        state.container.appendChild(state.canvas);
        if (!state.text) state.canvas.style.display = 'block';
      }

      if (state.observerCanvas) {
        state.observerCanvas.disconnect();
      }
      state.observerCanvas = new MutationObserver(resizeCanvasBounce);
      state.observerCanvas.observe(state.canvas, { attributes: true, attributeFilter: ['style', 'class'] });
      removeGlobalEvent(window, "resize", resizeCanvasBounce);
      removeGlobalEvent(window, "scroll", scrolPage);
      addGlobalEvent(window, "resize", resizeCanvasBounce);
      addGlobalEvent(window, "scroll", scrolPage);


      state.webGlversion = detectGLSLVersion(state.vertexCode, state.fragmentCode);
      deepMerge(state.config, options);
      //console.log('v', state.webGlversion);
      ensureGLContext(state.webGlversion);

      if (state.alreadyInitied) {
        sampleExec(state.entryExample);
        return
      }

      state.alreadyInitied = true;



      //canvas.width=container.clientWidth;
      //canvas.height=200;       
      //requestAnimationFrame(()=>{requestAnimationFrame(()=>{continueInit()})})      
      setTimeout(() => {
        continueInit();
      }, 500);
    }

    function sampleExec(sampleNumber) {
      const codesample = state.sampleCodes["A" + sampleNumber];
      //console.log('spex',codesample);
      setShader(codesample.vert, codesample.frag);
      setTimeout(() => { resizeCanvasBounce() }, 100)
    }

    function arraysEqual(a, b) {
      if (a === b) return true;
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    //################ IMAGE ############



    //################ VIDEO ############

    function createVideoTexture(gl) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE
      );
      gl.pixelStorei(
        gl.UNPACK_FLIP_Y_WEBGL,
        true
      );

      // inicializa textura válida
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255])
      );

      gl.bindTexture(gl.TEXTURE_2D, null);

      return tex;
    }

    function prepareVideoElement(input, id) {
      let video;
      // URL/string
      if (typeof input === "string") {
        var videOwner = state.root.getElementById('_Video' + id);
        if (videOwner) {
          video = videOwner;
        } else {
          video = state.root.createElement("video");
          video.id = '_Video' + id;
        }
        video.src = input;
      }
      // HTMLVideoElement
      else if (input instanceof HTMLVideoElement) {
        video = input;
      }
      else {
        throw new Error("Video Error");
      }
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      Object.assign(video.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "16px",
        height: "16px",
        opacity: "0.05",
        pointerEvents: "none",
        zIndex: "-9999",
        transform: "translateZ(0)",
        willChange: "transform"
      });
      if (!video.parentNode) {
        state.root.body.appendChild(video);
      }
      const p = video.play();
      if (p && p.catch) {
        p.catch(() => { });
      }
      return video;
    }

    function createVideoChannel(video, index) {
      if (!state.gl) {
        state.pendingVideos.push({
          video,
          index
        });
        return;
      }
      video = prepareVideoElement(video, index);
      const tex = createVideoTexture(state.gl);
      state.videoTextures[index] = tex;
      state.videoElements[index] = video;
    }

    function processPendingVideos() {
      if (!state.gl) return;
      state.videosProcessed = true;
      for (const item of state.pendingVideos) {
        item.video = prepareVideoElement(item.video, item.index);
        const tex = createVideoTexture(state.gl);
        state.videoTextures[item.index] = tex;
        state.videoElements[item.index] = item.video;
      }
      state.pendingVideos.length = 0;
    }

    //################ AUDIO ############


    function createFFTTexture(gl, size) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      let internalFormat, format;

      if (state.webGlversion == 3) {
        internalFormat = gl.R8;     // formato interno moderno
        format = gl.RED;            // canal único
      } else {
        internalFormat = gl.LUMINANCE;
        format = gl.LUMINANCE;
      }

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        size,
        1,
        0,
        format,
        gl.UNSIGNED_BYTE,
        null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      return tex;
    }

    function createAudioFFT(input, ctx, index) {
      let src;

      // 📦 mapa global pra não duplicar MediaElementSource
      if (!state.audioSources) state.audioSources = new Map();

      // 🎯 caso 1: AudioNode já pronto
      if (input instanceof AudioNode) {
        if (!ctx) {
          throw new Error("AudioNode requer ctx");
        }

        // valida contexto
        if (input.context !== ctx) {
          throw new Error("AudioNode pertence a outro AudioContext");
        }

        src = input;
      }

      // 🎯 caso 2: HTMLMediaElement
      else if (input instanceof HTMLMediaElement) {
        // se ctx não vier, cria um isolado
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        }

        src = state.audioSources.get(input);

        if (!src) {
          src = ctx.createMediaElementSource(input);
          state.audioSources.set(input, src);

          // conecta ao destino uma única vez
          src.connect(ctx.destination);
        }
      }

      else {
        throw new Error("input inválido");
      }

      // 🎧 analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;

      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      state.audioFFT[index] = {
        ctx,
        analyser,
        data,
        beat: 0,
        lastEnergy: 0,
        history: []
      };

      state.audioTextures[index] = createFFTTexture(state.gl, data.length);
    }

    //################ FUNCTIONS #########    

    function setResolution(width, height) {
      state.fixedResolution.width = width;
      state.fixedResolution.height = height;
    }

    function setShader(vertexSource, fragmentSource, onUpdate = (t) => { }) {
      if (!state.canvas) {
        console.error('state.canvas not found');
        return;
      }

      /*
      const lastState=state.webGlversion;
      const newState = detectGLSLVersion(state.vertexCode, state.fragmentCode);                        
      if(lastState!=newState){
        state.webGlversion=newState;
        ensureGLContext(state.webGlversion);
        init({});        
        return;
      }
        */

      if (!state.gl) return;
      if (!state.videosProcessed) processPendingVideos();
      state.usedChannels = [];

      const gl = state.gl;

      var buffers = state.buffers;
      var texStatic = state.texStatic;

      if (!vertexSource || !fragmentSource) return;
      vertexSource = vertexSource.replaceAll('\\n', '\n');
      fragmentSource = fragmentSource.replaceAll('\\n', '\n');


      if (state.isEditorMode) {
        const vertArea = state.root.getElementById('vertext');
        const fragArea = state.root.getElementById('fragmentt');

        if (state.codevertex) {
          state.codevertex.setValue(vertexSource)
        } else {
          vertArea.value = vertexSource;
          state.codevertex = CodeMirror.fromTextArea(vertArea, {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'x-shader/x-vertex',
            theme: 'material-darker',
            gutters: ["CodeMirror-linenumbers", "error-gutter"],
          });
          state.codevertex.setSize("100%", "100%");
        }

        if (state.codefrag) {
          state.codefrag.setValue(fragmentSource)
        } else {
          fragArea.value = fragmentSource;
          state.codefrag = CodeMirror.fromTextArea(fragArea, {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'x-shader/x-fragment',
            theme: 'material-darker',
            gutters: ["CodeMirror-linenumbers", "error-gutter"]
          });
          state.codefrag.setSize("100%", "100%");
        }

        clearErrors(state.codevertex);
        clearErrors(state.codefrag);
      } else {
        if (!state.codevertex) {
          state.codevertex = createFakeEditor(vertexSource);
        } else state.codevertex.setValue(vertexSource);

        if (!state.codefrag) {
          state.codefrag = createFakeEditor(fragmentSource);
        } else state.codefrag.setValue(fragmentSource);
      }

      const parsed = parseShaderSections(fragmentSource);



      // limpa buffers antigos
      if (buffers) {
        for (let i = 0; i < buffers.length; i++) {
          if (buffers[i] && buffers[i].destroy) buffers[i].destroy();
        }
      }


      buffers = [];
      texStatic = [];

      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        const key = "Buffer" + i;

        if (parsed[key] && parsed[key].code) {
          buffers[i] = createFBO(measuretCanvas().width, measuretCanvas().height);
        } else {
          buffers[i] = null;
        }

        if (parsed.images["iChannel" + i]) {
          texStatic[i] = loadTexture(parsed.images["iChannel" + i], i);
        } else {
          texStatic[i] = null;
        }
      }


      state.buffers = buffers;
      state.texStatic = texStatic;

      detectDependencies(parsed);
      buildExecutionOrder();


      if (!validateChannels(parsed)) {
        state.program = null;
        return;
      }



      const vs = compileShader(gl, vertexSource, gl.VERTEX_SHADER, 0);

      if (!vs) {
        state.program = null;
        return;
      }

      let fragNotCompiled = false;


      const compileAndSet = (passCode, target, lineOffset, commonCode) => {

        const source = `
#line 1 0
${commonCode}

#line ${lineOffset} 1
${passCode}
`;

        const fs = compileShader(gl, source, gl.FRAGMENT_SHADER, 0);

        if (fs) {
          const newProgram = createProgram(gl, vs, fs);

          if (newProgram) {
            target.program = newProgram;
          } else {
            fragNotCompiled = true;
          }
        } else {
          fragNotCompiled = true;
        }
      };

      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        if (buffers[i]) buffers[i].program = {};
      }

      const mainProgram = {};
      const commonCode = parsed.Common?.code || "";

      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        const key = "Buffer" + i;

        if (parsed[key] && parsed[key].code) {

          compileAndSet(parsed[key].code, buffers[i], parsed[key].line, commonCode);

          if (fragNotCompiled) {
            state.program = null;
            return;
          }
        }
      }

      if (parsed.Main.code) {
        compileAndSet(parsed.Main.code, mainProgram, parsed.Main.line, commonCode);


        if (fragNotCompiled) {
          state.program = null;
          return;
        }
      }

      // ✅ SHADER COMPILOU COM SUCESSO
      state.vertexCode = vertexSource;
      state.fragmentCode = fragmentSource;
      state.program = mainProgram.program;

      // ✅ RESOLVE A PROMISE AQUI 🔥
      if (state.programResolver) {
        state.programResolver(state.program);
        state.programResolver = null;
      }

      if (state.errorDiv) {
        state.errorDiv.textContent = 'SUCESS';
        state.errorDiv.style.color = 'green';
        showError();
      }

      const program = state.program;

      if(state.isEditorMode){
        //COPY current custom uniforms values to editor
        state._uniformCache=ShaderPlayEditor.editor.shared.uniformCache;
        state.customUniforms=ShaderPlayEditor.editor.shared.customUniforms;          
      }


      state.sucessCodes = {
        vert: vertexSource,
        frag: fragmentSource
      };
      state.frameCount = 0;

      state.positionAttributeLocation = gl.getAttribLocation(program, 'position');
      state.iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
      state.iTimeLocation = gl.getUniformLocation(program, 'iTime');
      state.iTimeDeltaLocation = gl.getUniformLocation(program, 'iTimeDelta');
      state.iFrameLocation = gl.getUniformLocation(program, 'iFrame');
      state.iFrameRateLocation = gl.getUniformLocation(program, 'iFrameRate');
      state.iMouseLocation = gl.getUniformLocation(program, 'iMouse');
      state.iDateLocation = gl.getUniformLocation(program, 'iDate');

      state.iChannelLocations = [];

      for (let i = 0; i < state.MAX_CHANNELS; i++) {
        state.iChannelLocations[i] =
          gl.getUniformLocation(program, 'iChannel' + i);
      }

      /*for (let key in state.customUniforms) {
        applyUniform(program, key, state.customUniforms[key]);
      }*/
      applyCustomUniforms(program);
    }



    async function Shader(element, vertexCode, fragmentCode, options = { frameSkip: 0, precision: "highp", alpha: false }) {
      const el = (typeof element === "string")
        ? state.root.getElementById(element)
        : element;

      if (!el) return null;

      if (el instanceof HTMLCanvasElement) {
        state.canvas = el;

        const resize = () => {
          const rect = state.canvas.getBoundingClientRect();
          state.canvas.width = measuretCanvas().width;
          state.canvas.height = measuretCanvas().height;
          resizeCanvasBounce();
        };

        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(state.canvas);

      } else {
        const voidElements = [
          "IMG", "INPUT", "BR", "HR", "META", "LINK", "AREA", "BASE", "COL", "EMBED", "SOURCE", "TRACK", "WBR"
        ];

        if (voidElements.includes(el.tagName)) {
          console.warn("Element not accept background:", el.tagName);
          return null;
        }

        state.canvas = state.root.createElement("canvas");

        const style = getComputedStyle(el);
        if (style.position === "static") {
          el.style.position = "relative";
        }

        state.canvas.style.display = "block";
        state.canvas.style.inset = "0";
        state.canvas.style.width = "100%";
        state.canvas.style.height = "100%";
        state.canvas.style.pointerEvents = "all";
        state.canvas.style.zIndex = "0";

        el.prepend(state.canvas);

        for (const child of el.children) {
          if (child !== state.canvas) {
            child.style.position = child.style.position || "relative";
            child.style.zIndex = "1";
          }
        }

        const resize = () => {
          const rect = el.getBoundingClientRect();
          state.canvas.width = measuretCanvas().width;
          state.canvas.height = measuretCanvas().height;
          resizeCanvasBounce();
        };

        resize();

        const observerel = new ResizeObserver(resize);
        observerel.observe(el);
      }

      state.isEditorMode = false;
      state.entryExample = '-1';
      state.vertexCode = vertexCode.replaceAll('\\n', '\n');
      state.fragmentCode = fragmentCode.replaceAll('\\n', '\n');
      state.sampleCodes["A" + state.entryExample] = { vert: vertexCode, frag: fragmentCode };
      state.canvas.style.color = "transparent";
      state.canvas.style.webkitTextFillColor = "transparent";

      if (!state.alreadyInitied) {
        init(options);
      }



      //wait program
      state.programPromise = new Promise((resolve) => { state.programResolver = resolve; });
      const timeout = 10000;
      let program = null;
      try {
        program = await Promise.race([
          state.programPromise,
          new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout))
        ]);
      } catch {
        console.warn("Shader: timeout waiting for program");
        return null;
      }
      if (!program) return null;

      return state.canvas;
    }

    async function ShaderTextPath(element, vertexCode, fragmentCode, options = { glyph: true, letterSpacing: 0, frameSkip: 0, precision: "highp", alpha: false }) {
      const S = "http://www.w3.org/2000/svg";
      const el = (typeof element === "string") ? state.root.getElementById(element) : element;
      if (!el) return;
      state.lastTextContent = "";
      state.text = el;
      state.isEditorMode = false;

      let txt = (el.textContent || "").replace(/\u200B/g, "").replace(/\r|\n|\t/g, "").trim();
      if (!txt.length) return;

      state.container = state.root.body;
      state.canvas = state.root.createElement("canvas");
      const canvas = state.canvas;
      canvas.style.position = "fixed";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = 9999;
      state.root.body.appendChild(canvas);

      state.svg = state.root.createElementNS(S, "svg");
      const svg = state.svg;
      svg.style.position = "fixed";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = 9999;

      const clipId = "clip_" + Math.random().toString(36).slice(2);
      const defs = state.root.createElementNS(S, "defs");
      const clip = state.root.createElementNS(S, "clipPath");
      clip.setAttribute("id", clipId);
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      defs.appendChild(clip);
      svg.appendChild(defs);
      state.root.body.appendChild(svg);

      const cs = getComputedStyle(el);

      if (state.root.fonts && state.root.fonts.ready) await state.root.fonts.ready;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      var letters = [];
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i];
        if (!ch) continue;
        const t = state.root.createElementNS(S, "text");
        t.textContent = ch;
        t.setAttribute("font-family", cs.fontFamily);
        t.setAttribute("font-size", cs.fontSize);
        t.setAttribute("font-weight", cs.fontWeight);
        t.setAttribute("dominant-baseline", "alphabetic");
        t.setAttribute("x", 0);
        t.setAttribute("y", 0);
        clip.appendChild(t);
        letters.push(t);
      }

      canvas.style.clipPath = `url(#${clipId})`;
      canvas.style.webkitClipPath = `url(#${clipId})`;

      el.style.color = "transparent";
      el.style.webkitTextFillColor = "transparent";
      //el.style.userSelect="none";
      //el.style.webkitUserSelect="none";
      el.style.pointerEvents = "none";

      if (!state.alreadyInitied) init(options);
      else setShader(vertexCode, fragmentCode);

      state.glyphs = letters;
      syncText();
      resizeCanvasBounce();


      if (state.observerElement) { state.observerElement.disconnect(); }
      state.observerElement = new MutationObserver(resizeCanvasBounce);
      state.observerElement.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
      removeGlobalEvent(window, "resize", resizeCanvasBounce);
      removeGlobalEvent(window, "scroll", scrolPage);
      addGlobalEvent(window, "resize", resizeCanvasBounce);
      addGlobalEvent(window, "scroll", scrolPage);

      if (state.root.fonts && state.root.fonts.addEventListener) {
        addGlobalEvent(state.root.fonts, "loadingdone", resizeCanvasBounce);
      }

      //wait program
      state.programPromise = new Promise((resolve) => { state.programResolver = resolve; });
      const timeout = 10000;
      let program = null;
      try {
        program = await Promise.race([
          state.programPromise,
          new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout))
        ]);
      } catch {
        console.warn("Shader: timeout waiting for program");
        return null;
      }
      if (!program) return null;

      acceptClicks();
      return letters;
    }


    async function ShaderText(element, vertexCode, fragmentCode, options = { mode: "text", frameSkip: 0, precision: "highp", alpha: false }) {
      const el = (typeof element === "string")
        ? state.root.getElementById(element)
        : element;

      if (!el) return;


      vertexCode = vertexCode.replaceAll('\\n', '\n');
      fragmentCode = fragmentCode.replaceAll('\\n', '\n');
      state.entryExample = '-1';
      state.sampleCodes["A" + state.entryExample] = {
        vert: vertexCode,
        frag: fragmentCode
      };
      state.vertexCode = vertexCode;
      state.fragmentCode = fragmentCode;


      if (options.glyph) {
        return await ShaderTextPath(element, vertexCode, fragmentCode, options);
      }
      state.text = el;
      state.isEditorMode = false;


      // 🔥 canvas overlay GLOBAL
      state.container = state.root.body;
      state.canvas = state.root.createElement("canvas");
      const canvas = state.canvas;
      canvas.style.position = "fixed";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = 9999;

      state.root.body.appendChild(canvas);

      // 🔥 SVG overlay GLOBAL
      state.svg = state.root.createElementNS("http://www.w3.org/2000/svg", "svg");
      const svg = state.svg;
      svg.style.position = "fixed";
      svg.style.pointerEvents = "all";
      svg.style.zIndex = 9999;

      const clipId = "clip_" + Math.random().toString(36).slice(2);

      const clip = state.root.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clip.setAttribute("id", clipId);

      state.textNode = state.root.createElementNS("http://www.w3.org/2000/svg", "text");

      clip.appendChild(state.textNode);
      svg.appendChild(clip);

      state.root.body.appendChild(svg);

      canvas.style.clipPath = `url(#${clipId})`;
      canvas.style.webkitClipPath = `url(#${clipId})`;

      // 🔥 esconder texto original (sem quebrar layout)
      el.style.color = "transparent";
      el.style.webkitTextFillColor = "transparent";
      //el.style.userSelect="none";
      //el.style.webkitUserSelect="none";
      el.style.pointerEvents = "none";

      if (!state.alreadyInitied) {
        init(options);
      } else {
        setShader(vertexCode, fragmentCode);
      }

      //resizeCanvas();
      if (state.observerElement) { state.observerElement.disconnect(); }
      state.observerElement = new MutationObserver(resizeCanvasBounce);
      state.observerElement.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
      removeGlobalEvent(window, "resize", resizeCanvasBounce);
      removeGlobalEvent(window, "scroll", scrolPage);
      addGlobalEvent(window, "resize", resizeCanvasBounce);
      addGlobalEvent(window, "scroll", scrolPage);


      //wait program
      state.programPromise = new Promise((resolve) => { state.programResolver = resolve; });
      const timeout = 10000;
      let program = null;
      try {
        program = await Promise.race([
          state.programPromise,
          new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout))
        ]);
      } catch {
        console.warn("Shader: timeout waiting for program");
        return null;
      }
      if (!program) return null;

      acceptClicks();
      return svg;
    }

    async function convertToGlyphs() {
      // 1. garantir opentype carregado
      if (!window.opentype) {
        await new Promise((resolve, reject) => {
          const script = state.root.createElement("script");
          script.src = state.siteurl + "opentype.js";
          script.onload = resolve;
          script.onerror = reject;
          state.root.head.appendChild(script);
        });
      }
      // cache de fontes
      const fontCache = {};
      async function getFontUrlFromCSS(family) {
        for (const sheet of state.root.styleSheets) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch (e) {
            continue; // CORS bloqueado
          }
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const ff = rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim();
              if (ff === family) {
                const src = rule.style.getPropertyValue("src");
                const match = src.match(/url\(([^)]+)\)/);
                if (match) {
                  return match[1].replace(/['"]/g, "");
                }
              }
            }
          }
        }
        return null;
      }
      async function loadFont(family) {
        if (fontCache[family]) return fontCache[family];
        let url = await getFontUrlFromCSS(family);
        //Font not found in CSS
        if (!url) {
          console.warn(`[glyphsToPaths] (ttf or woff) Font file not found in CSS: "${family}"`);
          return null;
        }
        //WOFF2 not supported by OpenType.js
        if (url.includes("woff2")) {
          console.warn(
            `[glyphsToPaths] Font "${family}" is only available as WOFF2 (not supported by OpenType.js):`,
            url
          );
          return null;
        }
        // Try loading with OpenType
        try {
          const font = await new Promise((resolve, reject) => {
            opentype.load(url, (err, font) => {
              if (err) reject(err);
              else resolve(font);
            });
          });
          fontCache[family] = font;
          return font;
        } catch (err) {
          console.warn(
            `[glyphsToPaths] Failed to load font "${family}" using OpenType:`,
            url,
            err
          );
          return null;
        }
      }
      // 3. pegar todos os <text>
      const texts = state.svg.querySelectorAll("text");
      state.finalpath = [];
      for (const el of texts) {
        const char = el.textContent;
        if (!char.trim()) continue;
        const style = getComputedStyle(el);
        const fontFamily = style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        const fontSize = parseFloat(style.fontSize);
        const x = parseFloat(el.getAttribute("x") || 0);
        const y = parseFloat(el.getAttribute("y") || 0);
        const font = await loadFont(fontFamily);
        if (font == null) {
          //throw ('Font Source not Found :' + fontFamily);
          if (state.svg.isPath) return state.finalpath;
          if (state.glyphs) return state.glyphs;
          if (state.svg) return state.svg;
          return;
        }
        // escala correta
        const scale = fontSize / font.unitsPerEm;
        const glyph = font.charToGlyph(char);
        // posição correta (baseline já está em y)
        const path = glyph.getPath(x, y, fontSize);
        const d = path.toPathData(3);
        // criar path
        const pathEl = state.root.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("d", d);
        // copiar atributos importantes
        pathEl.setAttribute("fill", "white"); // ou currentColor
        pathEl.setAttribute("clip-rule", "nonzero");
        // manter id/classes se precisar
        if (el.id) pathEl.id = el.id;
        pathEl.setAttribute("data-glyph", char);
        state.finalpath.push(pathEl);
        // substituir
        el.parentNode.replaceChild(pathEl, el);
      }
      state.svg.isPath = true;
      return state.finalpath;
    }

    async function uniform(name, value, type = "float") {

      // ================= iChannel =================
      if (name.startsWith("iChannel")) {
        const index = parseInt(name.replace("iChannel", ""));
        if (isNaN(index)) return false;

        const gl = state.gl;
        if (!gl) return false;

        if (!state._texSource) state._texSource = {};

        let texture = null;

        // STRING → URL
        if (typeof value === "string") {
          texture = await loadTextureAsync(value, index);
          state._texSource[index] = null;
        }

        // IMAGE / CANVAS
        else if (
          value instanceof HTMLImageElement ||
          value instanceof HTMLCanvasElement
        ) {
          texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          if (value instanceof HTMLImageElement && !value.complete) {
            await new Promise(resolve => value.onload = resolve);
          }

          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            value
          );

          state._texSource[index] = value;
        }
        else {
          console.warn("Invalid iChannel value:", value);
          return false;
        }

        if (texture) {
          state.texStatic[index] = texture;
        }

        return true;
      }

      // ================= NORMAL =================

      if (typeof value === "undefined") return state.lastUniforms[name];

      const old = state.customUniforms[name];

      let same = false;

      if (old) {
        if (
          Array.isArray(value) ||
          value instanceof Float32Array ||
          value instanceof Int32Array
        ) {
          same = arraysEqual(old.value, value);
        } else {
          same = old.value === value;
        }
      }

      if (!same) {
        state._uniformVersionCounter = (state._uniformVersionCounter || 0) + 1;

        state.customUniforms[name] = {
          value,
          type: type || "float",
          version: state._uniformVersionCounter
        };

        state.lastUniforms[name] = value;
      }

      return !same;
    }



    //################### EDITOR #########    

    function clearButtons() {
      const ul = state.root.querySelector('#samples ul'); if (ul) { ul.innerHTML = '' }
    }

    function addButton(label = 'EXECUTE', sampleNumber = 0) {
      const ul = state.root.querySelector('#samples ul');
      const li = state.root.createElement('li');
      const button = state.root.createElement('button');
      button.className = 'bottom-button sample';
      button.textContent = label; button.onclick = function () {
        sampleExec(sampleNumber);
      }; li.appendChild(button); ul.prepend(li)
    }

    async function loadAllShaders() {
      const response = await fetch(state.siteurl + "newshader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "load"
        })
      });
      if (!response.ok) {
        console.error("fail load shaders");
        return;
      }
      const data = await response.json();
      clearButtons();
      let list = data.shaders || [];
      //let editExits=false;
      //if(ShaderPlayEditor && ShaderPlayEditor.editor && ShaderPlayEditor.editor.sucessCodes)editExits=true;
      let count = 0;
      list.forEach((shader, i) => {
        count = i;
        state.sampleCodes["A" + i] = { vert: shader.vert.trim(), frag: shader.frag.trim() };
        let label = i + " : " + shader.name;
        addButton(label, i);
        //if (i == state.entryExample) init();
      });

      if (ShaderPlayEditor && ShaderPlayEditor.editor && ShaderPlayEditor.editor.state &&
        ShaderPlayEditor.editor.state.fragmentCode && ShaderPlayEditor.editor.state.vertexCode) {
        state.entryExample = '-1';
        state.sampleCodes["A" + state.entryExample] = {
          vert: ShaderPlayEditor.editor.state.vertexCode,
          frag: ShaderPlayEditor.editor.state.fragmentCode
        };
        state.vertexCode = ShaderPlayEditor.editor.state.vertexCode;
        state.fragmentCode = ShaderPlayEditor.editor.state.fragmentCode;
        ShaderPlayEditor.editor.state.videoElements.forEach((ve, vi) => {
          if (ve) {
            createVideoChannel(ve, vi);
          }
        });
      }
      //ensureGLContext(3);
      init({});
      setTimeout(() => {
        state.root.applyShader();
      }, 1000);
    }

    async function loadShaderButton(num) {
      const urlBase = state.siteurl + "gls/";
      async function loadShader(url) {
        const response = await fetch(urlBase + url);
        if (!response.ok) { return null }
        return await response.text()
      }
      var about = await loadShader(num + '.txt');
      about = num + ' : ' + about;
      const vertexSource = await loadShader(num + '_vert.txt');
      const fragmentSource = await loadShader(num + '_frag.txt');
      if (about && vertexSource && fragmentSource) {
        state.sampleCodes["A" + num] = { vert: vertexSource, frag: fragmentSource };
        addButton(about, num); return true
      } else { return false }
    }

    function tabButtons() {
      const buttons = state.root.querySelectorAll('.tab-buttons button');
      const contents = state.root.querySelectorAll('.tab-content');
      if (!buttons || !contents) return;
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const target = button.getAttribute('data-tab'); buttons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); contents.forEach(content => {
            if (content.id === target) { content.classList.add('active') } else { content.classList.remove('active') }
            if (typeof (state.codevertex) === "undefined" || !state.codevertex) return;
            if (target == "vertex") { setTimeout(() => { state.codevertex.refresh(); state.codevertex.setSize("100%", "100%"); }, 0); setTimeout(() => { resizeCanvas() }, 100) }
            if (target == "fragment") { setTimeout(() => { state.codefrag.refresh(); state.codefrag.setSize("100%", "100%"); }, 0); setTimeout(() => { resizeCanvas() }, 100) }
          })
        })
      })
    }

    function sendForm() {
      if (state.sucessCodes == null) {
        if (state.errorDiv) {
          state.errorDiv.textContent = 'Shader not Compiled';
          state.errorDiv.style.color = 'red';
          showError();
        } else {
          console.console.warn('Shader not Compiled');
        }
        return
      } const clean = str => str.replace(/\s+/g, ''); const userVert = clean(state.sucessCodes.vert); const userFrag = clean(state.sucessCodes.frag); for (let key in state.sampleCodes) {
        const sampleVert = clean(state.sampleCodes[key].vert); const sampleFrag = clean(state.sampleCodes[key].frag); if (userVert === sampleVert && userFrag === sampleFrag) {
          if (state.errorDiv) {
            state.errorDiv.textContent = 'Plagiarism detected';
            state.errorDiv.style.color = 'red';
            showError();
          }
          return;
        }
      } const name = state.root.getElementById('name').value.trim() + ' - ' + state.root.getElementById('email').value.trim(); const svert = state.sucessCodes.vert; const sfrag = state.sucessCodes.frag;
      fetch(state.siteurl + 'newshader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', name: name, vert: svert, frag: sfrag })
      })
        .then(response => {
          if (response.ok) {
            //clearButtons(); loadAllShaders() 
            alert('Your code has been successfully sent!\nAs soon as DIDI sees the submission, it will appear in the list.');
          } else {
            if (state.errorDiv) {
              state.errorDiv.textContent = 'Fail to Send';
              state.errorDiv.style.color = 'red';
            }
            showError()
          }
        }).catch(error => { clearButtons(); loadAllShaders() })
    }

    function clearErrors(cm) { cm.clearGutter("error-gutter"); cm.eachLine(line => { cm.removeLineClass(line, "background", "error-line") }) }

    function showError() {
      const errorDiv = state.errorDiv;
      if (errorDiv) {
        errorDiv.classList.add('show');
        clearTimeout(errorDiv._hideTimeout); errorDiv._hideTimeout = setTimeout(() => {
          errorDiv.classList.remove('show')
        }, 4000)
      }
    }

    function markErrorLine(cm, line) { const marker = state.root.createElement("div"); marker.style.color = "red"; marker.innerHTML = "●"; cm.setGutterMarker(line - 1, "error-gutter", marker); cm.addLineClass(line - 1, "background", "error-line"); state.sucessCodes = null; showError() }

    function showEditor() {
      if (state.root.getElementById("shaderPopupRoot")) return;
      const root = state.root.createElement("div");
      root.id = "shaderPopupRoot";
      Object.assign(root.style, {
        position: "fixed",
        inset: "0",
        color: "#fff",
        background: "#0d0d0f",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column"
      });
      //title
      const title = state.root.createElement("div");
      title.innerHTML = `Shader Editor<a id="logod" href="#" onClick="JAVASCRIPT:window.open('https://didisoftwares.ddns.net/10/','_blank')"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12L20 4L12 20L10 14L4 12Z" stroke="#8b8b8b" stroke-width="2" stroke-linejoin="round"/> </svg> didisoftwares.ddns.net</a>`;
      title.style.cssText = `display: flex;font-weight: bold;gap: 10px;font-family: sans-serif;background: linear-gradient(90deg, rgb(139, 139, 139), rgb(255, 255, 255), rgb(139, 139, 139)) 0% 0% / 200% 100% text;animation: 4s linear 0s infinite normal none running flow;  flex-direction: row; align-content: center; justify-content: center; align-items: center;`;
      const style = state.root.createElement("style");
      style.textContent = `@keyframes flow{from{background-position:0 0}to{background-position:200% 0}}a#logod svg{opacity:.7;transition:.2s}a#logod:hover svg{opacity:1;transform:rotate(12deg)}a#logod{color:#888;display:flex;height:18px;font-size:x-small;text-decoration:none;flex-direction:row;align-items:stretch;flex-wrap:nowrap;gap:2px}`;
      state.root.head.appendChild(style);
      //bar
      const bar = state.root.createElement("div");
      bar.style.cssText = `height:24px;background:linear-gradient(#1f1f1f,#111);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-top:1px solid #2f2f2f;border-bottom:1px solid #000;box-shadow:inset 0 1px 0 #3a3a3a,inset 0 -1px 0 #000`;
      const close = state.root.createElement("button");
      const iframe = state.root.createElement("iframe");
      //iframe.setAttribute("sandbox", `allow-scripts allow-popups allow-forms allow-same-origin allow-top-navigation-by-user-activation`);
      close.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M6 6L18 18M18 6L6 18"stroke="currentColor"stroke-width="2.4"stroke-linecap="round"/></svg>`;
      close.style.cssText = `width:26px;height:20px;display:flex;align-items:center;justify-content:center;border:none;outline:none;cursor:pointer;color:#ff9090;background:linear-gradient(#7a3030,#471b1b);box-shadow:inset 0 1px 0 #a84848,inset 0 -1px 0 #1a0000;transition:.15s`;
      close.onmouseenter = () => {
        close.style.color = "#fff";
        close.style.background = "linear-gradient(#ff3b3b,#a30000)";
      };
      close.onmouseleave = () => {
        close.style.color = "#ff9090";
        close.style.background = "linear-gradient(#7a3030,#471b1b)";
      };
      close.onclick = () => {
        closeEditor();
      };
      close.id = "close";
      bar.appendChild(title);
      bar.appendChild(close);
      iframe.style.flex = "1";
      iframe.style.border = "none";
      root.appendChild(bar);
      root.appendChild(iframe);
      state.root.body.appendChild(root);
      iframe.onload = () => {
        const doc = iframe.contentDocument;
        // ---------------- HTML base ----------------
        doc.open();
        doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="${state.siteurl}codemirror.css">
        </head>
        <body>
        <div id="myContainer">
          </div>
          <div class="tabs">
            <div class="content-area">
              <div class="tab-buttons">
                <button class="active" data-tab="fragment">Fragment</button>
                <button data-tab="vertex">Vertex</button>
                <button data-tab="constants">Constants</button>
                <button data-tab="samples">Samples</button>
              </div>
              <div id="fragment" class="tab-content active">
                <textarea id="fragmentt">Fragment Shader</textarea>
              </div>
              <div id="vertex" class="tab-content">
                <textarea id="vertext">Vertex Shader</textarea>
              </div>
              <div id="constants" class="tab-content">
                <ul>
                  <li> ► <span class="fn">iResolution</span> → <span class="var">vec2</span> (canvas size in pixels)</li>
                  <li> ► <span class="fn">iTime</span> → <span class="var">float</span> (elapsed time in seconds)</li>
                  <li> ► <span class="fn">iMouse</span> → <span class="var">vec4</span> (mouse input [ x, y, click-x, click-y ])</li>
                  <li> ► <span class="fn">iFrame</span> → <span class="var">int</span> (frame count)</li>
                  <li> ► <span class="fn">iChannel</span><span class="opt">0</span> to <span class="fn">iChannel</span><span class="opt">${state.MAX_CHANNELS - 1}</span> → <span class="var">sampler2D</span> (textures) or buffer<br>
                    //iChannelX = IMAGE -> Load Static Texture<br>
                    //iChannelX -> FragmentBufferX code start
                  </li>
                  <li> ► <span class="fn">Common</span> → Common data inserterd in all buffer or render, use //Common</li>
                  <li> ► <span class="opt">funcion createAudioFFT(audio,0)</span> creates <span class="fn">iAudio0</span> → <span class="var">sampler2D</span> usging data in x<br>
                    <span class="desc">float getfrequency(float x, sampler2D iAudio)</span> already included in shader header
                  <li>
                  <li> ► <span class="opt">funcion createVideoChannel(video,0)</span> creates <span class="fn">iVideo0</span> → <span class="var">sampler2D</span><br>
                    iVideo0 is ready to use in shader
                  <li>
                  <!-- Adicione mais constantes aqui -->
                </ul>
              </div>

              <div id="samples" class="tab-content" style="overflow: auto">
                <div class="form-area">
                  <input type="text" id="name" placeholder="Name" class="form-input">
                  <input type="email" id="email" placeholder="Mail" class="form-input">
                  <button onclick="sendForm()" class="form-button">UPLOAD</button>
                </div>
                <ul></ul>
              </div>
            </div>
            <button id="runBtn" class="bottom-button" onclick="applyShader();">EXECUTE</button>
            <div id="errordiv" class="bottom-bar-fixed">
              errors
            </div>
          </div>
          <script>
                  document.errordiv=document.getElementById('errordiv');
          </script>
        </body>
        </html>
        `);
        doc.close();
        function loadScript(src, isModule = false) {
          return new Promise((res, rej) => {
            const s = state.root.createElement("script");
            s.src = src;
            if (isModule) s.type = "module";
            s.onload = res;
            s.onerror = rej;
            state.root.head.appendChild(s);
          });
        }
        (async () => {
          if (typeof (CodeMirror) === 'undefined')
            await loadScript(state.siteurl + "codemirror.js");
          await loadScript(state.siteurl + state.namejs, true);
          // ---------------- INIT UI ----------------                                    
          iframe.contentWindow.ShaderPlayEditor = await ShaderPlay.create(true);
          window.FG = iframe.contentWindow.ShaderPlayEditor;
          ShaderPlayEditor.editor = iframe.contentWindow;
          ShaderPlayEditor.editor.state = state;
          ShaderPlayEditor.editor.shared = { uniformCache: state._uniformCache, customUniforms: state.customUniforms };
          ShaderPlayEditor.editor.ShaderPlayEditor.editorStart();
          //iframe.contentWindow.ShaderPlayEditor.editorStart();           
          /*
          iframe.contentWindow.isEditorMode = true;
          iframe.contentWindow._loadAllShaders();
          iframe.contentWindow._tabButtons();
          setTimeout(() => {
            try {
              iframe.contentWindow._applyShader();
            } catch { }
          }, 2000);
          */
        })();
      };
      iframe.src = "about:blank";
    }


    function closeEditor() {
      const shadowRoot = state.root.getElementById("shaderPopupRoot");
      if (!shadowRoot) return;
      try {
        ShaderPlayEditor.editor.ShaderPlayEditor.destroy();
      } catch (e) { }
      shadowRoot.remove();
      window.ShaderPlayEditor = {
        show: showEditor,
        close: closeEditor
      };
    }

    function editorStart() {
      state.vv = 1;
      state.root = ShaderPlayEditor.editor.document;
      state.errorDiv = ShaderPlayEditor.editor.document.errordiv;
      state.isEditorMode = true;
      loadAllShaders();
      tabButtons();
      state.root.applyShader = () => {
        const scrollInfoV = state.codevertex.getScrollInfo();
        const cursorV = state.codevertex.getCursor();
        const scrollInfoF = state.codefrag.getScrollInfo();
        const cursorF = state.codefrag.getCursor();
        setShader(state.codevertex.getValue(), state.codefrag.getValue());
        state.codevertex.scrollTo(scrollInfoV.left, scrollInfoV.top);
        state.codevertex.setCursor(cursorV);
        state.codefrag.scrollTo(scrollInfoF.left, scrollInfoF.top);
        state.codefrag.setCursor(cursorF);
      }
      state.root.sendForm = () => {
        sendForm();
      }
    }

    // API FINAL    
    window.ShaderPlayEditor = {
      show: showEditor,
      close: closeEditor
    };


    state.root = document;

    if (!isEditor) {
      return {
        Shader,
        ShaderText,
        createAudioFFT, //new
        createVideoChannel,
        uniform,
        setShader,
        setResolution, //new
        destroy,
        showEditor,
        closeEditor,
        convertToGlyphs, //new
        update: resizeCanvasBounce,
        state,
        setDebug
      };
    } else {
      return {
        Shader,
        ShaderText,
        createAudioFFT,
        createVideoChannel,
        uniform,
        setShader,
        destroy,
        showEditor,
        closeEditor,
        convertToGlyphs,
        update: resizeCanvasBounce,
        //editor
        editorStart,
        state,
        loadAllShaders,
        tabButtons,
        setDebug
      };
    }
  }
  create();
  return { create };

})();
