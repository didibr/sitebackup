import * as THREE from '../three/module.js';

!function () {//SimplexNoise FUNCIONS
  "use strict"; var r = .5 * (Math.sqrt(3) - 1), e = (3 - Math.sqrt(3)) / 6, t = 1 / 6, a = (Math.sqrt(5) - 1) / 4, o = (5 - Math.sqrt(5)) / 20; function i(r) { var e; e = "function" == typeof r ? r : r ? function () { var r = 0, e = 0, t = 0, a = 1, o = (i = 4022871197, function (r) { r = r.toString(); for (var e = 0; e < r.length; e++) { var t = .02519603282416938 * (i += r.charCodeAt(e)); t -= i = t >>> 0, i = (t *= i) >>> 0, i += 4294967296 * (t -= i) } return 2.3283064365386963e-10 * (i >>> 0) }); var i; r = o(" "), e = o(" "), t = o(" "); for (var n = 0; n < arguments.length; n++)(r -= o(arguments[n])) < 0 && (r += 1), (e -= o(arguments[n])) < 0 && (e += 1), (t -= o(arguments[n])) < 0 && (t += 1); return o = null, function () { var o = 2091639 * r + 2.3283064365386963e-10 * a; return r = e, e = t, t = o - (a = 0 | o) } }(r) : Math.random, this.p = n(e), this.perm = new Uint8Array(512), this.permMod12 = new Uint8Array(512); for (var t = 0; t < 512; t++)this.perm[t] = this.p[255 & t], this.permMod12[t] = this.perm[t] % 12 } function n(r) { var e, t = new Uint8Array(256); for (e = 0; e < 256; e++)t[e] = e; for (e = 0; e < 255; e++) { var a = e + ~~(r() * (256 - e)), o = t[e]; t[e] = t[a], t[a] = o } return t } i.prototype = { grad3: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]), grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1, -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1, 1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1, -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]), noise2D: function (t, a) { var o, i, n = this.permMod12, f = this.perm, s = this.grad3, v = 0, h = 0, l = 0, u = (t + a) * r, d = Math.floor(t + u), p = Math.floor(a + u), M = (d + p) * e, m = t - (d - M), c = a - (p - M); m > c ? (o = 1, i = 0) : (o = 0, i = 1); var y = m - o + e, w = c - i + e, g = m - 1 + 2 * e, A = c - 1 + 2 * e, x = 255 & d, q = 255 & p, D = .5 - m * m - c * c; if (D >= 0) { var S = 3 * n[x + f[q]]; v = (D *= D) * D * (s[S] * m + s[S + 1] * c) } var U = .5 - y * y - w * w; if (U >= 0) { var b = 3 * n[x + o + f[q + i]]; h = (U *= U) * U * (s[b] * y + s[b + 1] * w) } var F = .5 - g * g - A * A; if (F >= 0) { var N = 3 * n[x + 1 + f[q + 1]]; l = (F *= F) * F * (s[N] * g + s[N + 1] * A) } return 70 * (v + h + l) }, noise3D: function (r, e, a) { var o, i, n, f, s, v, h, l, u, d, p = this.permMod12, M = this.perm, m = this.grad3, c = .3333333333333333 * (r + e + a), y = Math.floor(r + c), w = Math.floor(e + c), g = Math.floor(a + c), A = (y + w + g) * t, x = r - (y - A), q = e - (w - A), D = a - (g - A); x >= q ? q >= D ? (s = 1, v = 0, h = 0, l = 1, u = 1, d = 0) : x >= D ? (s = 1, v = 0, h = 0, l = 1, u = 0, d = 1) : (s = 0, v = 0, h = 1, l = 1, u = 0, d = 1) : q < D ? (s = 0, v = 0, h = 1, l = 0, u = 1, d = 1) : x < D ? (s = 0, v = 1, h = 0, l = 0, u = 1, d = 1) : (s = 0, v = 1, h = 0, l = 1, u = 1, d = 0); var S = x - s + t, U = q - v + t, b = D - h + t, F = x - l + 2 * t, N = q - u + 2 * t, C = D - d + 2 * t, P = x - 1 + .5, T = q - 1 + .5, _ = D - 1 + .5, j = 255 & y, k = 255 & w, z = 255 & g, B = .6 - x * x - q * q - D * D; if (B < 0) o = 0; else { var E = 3 * p[j + M[k + M[z]]]; o = (B *= B) * B * (m[E] * x + m[E + 1] * q + m[E + 2] * D) } var G = .6 - S * S - U * U - b * b; if (G < 0) i = 0; else { var H = 3 * p[j + s + M[k + v + M[z + h]]]; i = (G *= G) * G * (m[H] * S + m[H + 1] * U + m[H + 2] * b) } var I = .6 - F * F - N * N - C * C; if (I < 0) n = 0; else { var J = 3 * p[j + l + M[k + u + M[z + d]]]; n = (I *= I) * I * (m[J] * F + m[J + 1] * N + m[J + 2] * C) } var K = .6 - P * P - T * T - _ * _; if (K < 0) f = 0; else { var L = 3 * p[j + 1 + M[k + 1 + M[z + 1]]]; f = (K *= K) * K * (m[L] * P + m[L + 1] * T + m[L + 2] * _) } return 32 * (o + i + n + f) }, noise4D: function (r, e, t, i) { var n, f, s, v, h, l, u, d, p, M, m, c, y, w, g, A, x, q = this.perm, D = this.grad4, S = (r + e + t + i) * a, U = Math.floor(r + S), b = Math.floor(e + S), F = Math.floor(t + S), N = Math.floor(i + S), C = (U + b + F + N) * o, P = r - (U - C), T = e - (b - C), _ = t - (F - C), j = i - (N - C), k = 0, z = 0, B = 0, E = 0; P > T ? k++ : z++, P > _ ? k++ : B++, P > j ? k++ : E++, T > _ ? z++ : B++, T > j ? z++ : E++, _ > j ? B++ : E++; var G = P - (l = k >= 3 ? 1 : 0) + o, H = T - (u = z >= 3 ? 1 : 0) + o, I = _ - (d = B >= 3 ? 1 : 0) + o, J = j - (p = E >= 3 ? 1 : 0) + o, K = P - (M = k >= 2 ? 1 : 0) + 2 * o, L = T - (m = z >= 2 ? 1 : 0) + 2 * o, O = _ - (c = B >= 2 ? 1 : 0) + 2 * o, Q = j - (y = E >= 2 ? 1 : 0) + 2 * o, R = P - (w = k >= 1 ? 1 : 0) + 3 * o, V = T - (g = z >= 1 ? 1 : 0) + 3 * o, W = _ - (A = B >= 1 ? 1 : 0) + 3 * o, X = j - (x = E >= 1 ? 1 : 0) + 3 * o, Y = P - 1 + 4 * o, Z = T - 1 + 4 * o, $ = _ - 1 + 4 * o, rr = j - 1 + 4 * o, er = 255 & U, tr = 255 & b, ar = 255 & F, or = 255 & N, ir = .6 - P * P - T * T - _ * _ - j * j; if (ir < 0) n = 0; else { var nr = q[er + q[tr + q[ar + q[or]]]] % 32 * 4; n = (ir *= ir) * ir * (D[nr] * P + D[nr + 1] * T + D[nr + 2] * _ + D[nr + 3] * j) } var fr = .6 - G * G - H * H - I * I - J * J; if (fr < 0) f = 0; else { var sr = q[er + l + q[tr + u + q[ar + d + q[or + p]]]] % 32 * 4; f = (fr *= fr) * fr * (D[sr] * G + D[sr + 1] * H + D[sr + 2] * I + D[sr + 3] * J) } var vr = .6 - K * K - L * L - O * O - Q * Q; if (vr < 0) s = 0; else { var hr = q[er + M + q[tr + m + q[ar + c + q[or + y]]]] % 32 * 4; s = (vr *= vr) * vr * (D[hr] * K + D[hr + 1] * L + D[hr + 2] * O + D[hr + 3] * Q) } var lr = .6 - R * R - V * V - W * W - X * X; if (lr < 0) v = 0; else { var ur = q[er + w + q[tr + g + q[ar + A + q[or + x]]]] % 32 * 4; v = (lr *= lr) * lr * (D[ur] * R + D[ur + 1] * V + D[ur + 2] * W + D[ur + 3] * X) } var dr = .6 - Y * Y - Z * Z - $ * $ - rr * rr; if (dr < 0) h = 0; else { var pr = q[er + 1 + q[tr + 1 + q[ar + 1 + q[or + 1]]]] % 32 * 4; h = (dr *= dr) * dr * (D[pr] * Y + D[pr + 1] * Z + D[pr + 2] * $ + D[pr + 3] * rr) } return 27 * (n + f + s + v + h) } }, i._buildPermutationTable = n,
    "undefined" != typeof define && define.amd && define((function () { return i })),
    "undefined" != typeof exports ? exports.SimplexNoise = i :
      "undefined" != typeof window && (window.SimplexNoise = i),
    "undefined" != typeof module && (module.exports = i);

}();



class Terrain {
  //######################################
  //############### VARIABLES ############
  //######################################
  constructor(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;

    // Configurações principais
    this.chunkSize = options.chunkSize || 100;
    this.chunkResolution = options.chunkResolution || 50;
    this.renderDistance = options.renderDistance || 2;
    this.noiseScale = options.noiseScale || 0.02;
    this.noiseAmplitude = options.noiseAmplitude || 15;

    // Parâmetros do ruído
    this.octaves = 4;
    this.persistence = 0.5;
    this.lacunarity = 2.0;

    // Estimativa da altura máxima baseada nos parâmetros de ruído
    const estimatedMax = this.noiseAmplitude * ((1 - Math.pow(this.persistence, this.octaves)) / (1 - this.persistence));
    this.minHeight = -estimatedMax;
    this.maxHeight = estimatedMax;

    // Ranges de textura em porcentagem normalizada (0 a 1)
    this.heightRanges = {
      grass: { min: 0.0, max: 0.4 },
      rock: { min: 0.3, max: 0.7 },
      snow: { min: 0.6, max: 1.0 },
    };

    this.simplex = new SimplexNoise('world1');
    this.chunks = new Map();
    this.chunkData = new Map();
    this.heightCache = new Map();

    this.loadChunksFromJSON();
    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.006);
    // Cria o material com shaders
    this.creatematerial();
    this.createSunAndLight();


  }

  //######################################
  //############### Montains Texture and SUN ############
  //######################################
  setHeight(textureName, minPercent, maxPercent) {
    if (this.heightRanges[textureName]) {
      const min = minPercent / 100;
      const max = maxPercent / 100;

      this.heightRanges[textureName].min = min;
      this.heightRanges[textureName].max = max;

      if (this.material && this.material.uniforms[`${textureName}Min`]) {
        this.material.uniforms[`${textureName}Min`].value = min;
        this.material.uniforms[`${textureName}Max`].value = max;
      }
    } else {
      console.warn(`Texture ${textureName} does not exist.`);
    }
  }


  setBlendRange(value) {
    if (this.material && this.material.uniforms.blendRange) {
      this.material.uniforms.blendRange.value = value;
    }
  }


  setTextureScale(textureName, scale) {
    if (this.material && this.material.uniforms[`${textureName}Scale`]) {
      this.material.uniforms[`${textureName}Scale`].value = scale;
    } else {
      console.warn(`Texture scale uniform not found for: ${textureName}`);
    }
  }


  setSunPositionByHour(hour = 50) {
    const normalizedHour = Math.max(0, Math.min(hour, 100)) / 100;

    const elevation = Math.max(0, 90 - Math.abs(normalizedHour * 2 - 1) * 90);
    const azimuth = THREE.MathUtils.lerp(90, 270, normalizedHour);

    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    this.sunVector.setFromSphericalCoords(1, phi, theta);

    const distance = 500;
    const sunPos = new THREE.Vector3();
    sunPos.copy(this.camera.position);
    sunPos.addScaledVector(this.sunVector, distance);

    this.sunLight.position.copy(sunPos);
    this.sunLight.target.position.copy(this.camera.position);
    this.sunLight.target.updateMatrixWorld();

    if (this.sky) {
      this.sky.material.uniforms['sunPosition'].value.copy(this.sunVector);
    }

    // Fog dinâmico com base na hora
    /*if (this.scene.fog) {
        const dayColor = new THREE.Color(0xcccccc);
        const nightColor = new THREE.Color(0x222222);
        const fogColor = dayColor.clone().lerp(nightColor, Math.abs(normalizedHour * 2 - 1));
        this.scene.fog.color.copy(fogColor);
    }*/
  }


  createSunAndLight() {
    // Luz do Sol Direcional
    const mapSize=100;
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(512, 512);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = mapSize;
    this.sunLight.shadow.camera.left = -mapSize;
    this.sunLight.shadow.camera.right = mapSize;
    this.sunLight.shadow.camera.top = mapSize;
    this.sunLight.shadow.camera.bottom = -mapSize;
    this.sunLight.shadow.bias=-0.005;
    this.scene.add(this.sunLight);

    // Sky
    this.sky = new THREE.Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);

    this.sunVector = new THREE.Vector3();

    // Parâmetros atmosféricos padrão
    this.sky.material.uniforms['turbidity'].value = 10;
    this.sky.material.uniforms['rayleigh'].value = 3;
    this.sky.material.uniforms['mieCoefficient'].value = 0.005;
    this.sky.material.uniforms['mieDirectionalG'].value = 0.7;

    // Define uma posição inicial do sol
    this.setSunPositionByHour(10);
  }


  creatematerial() {
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('./terrain/grass.jpg');
    const rockTexture = textureLoader.load('./terrain/rock.jpg');
    const snowTexture = textureLoader.load('./terrain/snow.jpg');

    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
    snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.01
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.grassTex = { value: grassTexture };
      shader.uniforms.rockTex = { value: rockTexture };
      shader.uniforms.snowTex = { value: snowTexture };

      shader.uniforms.chunkSize = { value: this.chunkSize };
      shader.uniforms.grassScale = { value: 0.2 };
      shader.uniforms.rockScale = { value: 0.3 };
      shader.uniforms.snowScale = { value: 0.05 };

      shader.uniforms.grassMin = { value: this.heightRanges.grass.min };
      shader.uniforms.grassMax = { value: this.heightRanges.grass.max };
      shader.uniforms.rockMin = { value: this.heightRanges.rock.min };
      shader.uniforms.rockMax = { value: this.heightRanges.rock.max };
      shader.uniforms.snowMin = { value: this.heightRanges.snow.min };
      shader.uniforms.snowMax = { value: this.heightRanges.snow.max };

      const octaves = 4;
      const persistence = 0.5;
      const estimatedMax = this.noiseAmplitude * ((1 - Math.pow(persistence, octaves)) / (1 - persistence));
      const minHeight = -estimatedMax;
      const maxHeight = estimatedMax;

      shader.uniforms.minHeight = { value: minHeight };
      shader.uniforms.maxHeight = { value: maxHeight };
      shader.uniforms.blendRange = { value: 0.05 };

      // Posição XZ da câmera no mundo (atualizar no render loop)
      shader.uniforms.cameraXZ = { value: new THREE.Vector2(0, 0) };

      // Varyings para passar para fragment shader
      shader.vertexShader = `
          varying float vHeight;
          varying vec2 vUv;
          varying vec2 vWorldXZ;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
          vUv = uv;
          vHeight = position.y;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldXZ = worldPos.xz;
          `
      );

      shader.fragmentShader = `
          uniform sampler2D grassTex;
          uniform sampler2D rockTex;
          uniform sampler2D snowTex;

          uniform float chunkSize;
          uniform float grassScale;
          uniform float rockScale;
          uniform float snowScale;

          uniform float grassMin;
          uniform float grassMax;
          uniform float rockMin;
          uniform float rockMax;
          uniform float snowMin;
          uniform float snowMax;

          uniform float minHeight;
          uniform float maxHeight;
          uniform float blendRange;

          uniform vec2 cameraXZ;

          varying float vHeight;
          varying vec2 vUv;
          varying vec2 vWorldXZ;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          float hNorm = clamp((vHeight - minHeight) / (maxHeight - minHeight), 0.0, 1.0);

          float gT = smoothstep(grassMin - blendRange, grassMin + blendRange, hNorm) * 
                     (1.0 - smoothstep(grassMax - blendRange, grassMax + blendRange, hNorm));
          float rT = smoothstep(rockMin - blendRange, rockMin + blendRange, hNorm) * 
                     (1.0 - smoothstep(rockMax - blendRange, rockMax + blendRange, hNorm));
          float sT = smoothstep(snowMin - blendRange, snowMin + blendRange, hNorm) * 
                     (1.0 - smoothstep(snowMax - blendRange, snowMax + blendRange, hNorm));

          float total = gT + rT + sT;
          if (total > 0.0) {
              gT /= total;
              rT /= total;
              sT /= total;
          }

          vec3 grass = texture2D(grassTex, vUv * chunkSize * grassScale).rgb;
          vec3 rock = texture2D(rockTex, vUv * chunkSize * rockScale).rgb;
          vec3 snow = texture2D(snowTex, vUv * chunkSize * snowScale).rgb;

          vec4 texColor = vec4(grass * gT + rock * rT + snow * sT, 1.0);

          // Transparência radial baseada na distância XZ para a câmera (posição global)
          float dist = distance(vWorldXZ, cameraXZ);

          float radius = 160.0;     // alcance do efeito de transparência
          float fadeRange = 40.0;   // suavidade da borda da transparência

          // alpha vai de 1.0 no centro (próximo da câmera) até 0.0 no raio externo
          float alpha = smoothstep(radius, radius - fadeRange, dist);

          texColor.a = alpha;

          diffuseColor *= texColor;
          diffuseColor.a *= texColor.a;
          `
      );
      material.uniforms = shader.uniforms;
    };

    this.material = material;
  }


  //######################################
  //############### CHUNK MANIPULATION ############
  //######################################

  // Função unificada para interpolar altura com modificações locais
  getHeightInterpolatedWithMods(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;

    // Função auxiliar para obter base + mod
    const getHeightMod = (xx, zz) => {
      const base = this.generateHeight(xx, zz);
      const chunkX = Math.floor(xx / this.chunkSize);
      const chunkZ = Math.floor(zz / this.chunkSize);
      const key = `${chunkX}_${chunkZ}`;
      const mod = this.getLocalModification(key, xx, zz);
      return base + (mod || 0);
    };

    const h00 = getHeightMod(xi, zi);
    const h10 = getHeightMod(xi + 1, zi);
    const h01 = getHeightMod(xi, zi + 1);
    const h11 = getHeightMod(xi + 1, zi + 1);

    const h0 = h00 * (1 - xf) + h10 * xf;
    const h1 = h01 * (1 - xf) + h11 * xf;

    return h0 * (1 - zf) + h1 * zf;
  }

  // Normal calculada usando a função acima
  computeNormalAt(x, z) {
    const delta = 0.5;

    const hL = this.getHeightInterpolatedWithMods(x - delta, z);
    const hR = this.getHeightInterpolatedWithMods(x + delta, z);
    const hD = this.getHeightInterpolatedWithMods(x, z - delta);
    const hU = this.getHeightInterpolatedWithMods(x, z + delta);

    const dx = hL - hR;
    const dz = hD - hU;

    const normal = new THREE.Vector3(dx, 2.0, dz);
    normal.normalize();
    return normal;
  }

  // Mantém generateHeight igual (cache e ruído)
  generateHeight(x, z) {
    const key = `${Math.floor(x * 10)}_${Math.floor(z * 10)}`;
    if (this.heightCache.has(key)) return this.heightCache.get(key);

    let total = 0;
    let frequency = this.noiseScale;
    let amplitude = this.noiseAmplitude;

    for (let i = 0; i < this.octaves; i++) {
      total += this.simplex.noise2D(x * frequency, z * frequency) * amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    this.heightCache.set(key, total);
    return total;
  }

  rebuildChunk(cx, cz) {
    const key = `${cx}_${cz}`;
    const mesh = this.chunks.get(key);
    if (!mesh) return;

    const geometry = mesh.geometry;
    const vertices = geometry.attributes.position;

    for (let i = 0; i < vertices.count; i++) {
      const vx = vertices.getX(i) + cx * this.chunkSize;
      const vz = vertices.getZ(i) + cz * this.chunkSize;
      const vy = this.getHeightInterpolatedWithMods(vx, vz);
      vertices.setY(i, vy);
    }

    vertices.needsUpdate = true;

    const normals = geometry.attributes.normal;
    for (let i = 0; i < vertices.count; i++) {
      const vx = vertices.getX(i) + cx * this.chunkSize;
      const vz = vertices.getZ(i) + cz * this.chunkSize;
      const n = this.computeNormalAt(vx, vz);
      normals.setXYZ(i, n.x, n.y, n.z);
    }
    normals.needsUpdate = true;
  }

  createChunk(cx, cz) {
    const key = `${cx}_${cz}`;
    if (this.chunks.has(key)) return;

    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      this.chunkResolution,
      this.chunkResolution
    );
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const vx = vertices.getX(i) + cx * this.chunkSize;
      const vz = vertices.getZ(i) + cz * this.chunkSize;
      const vy = this.getHeightInterpolatedWithMods(vx, vz);
      vertices.setY(i, vy);
    }

    vertices.needsUpdate = true;

    const normals = geometry.attributes.normal;
    for (let i = 0; i < vertices.count; i++) {
      const vx = vertices.getX(i) + cx * this.chunkSize;
      const vz = vertices.getZ(i) + cz * this.chunkSize;
      const n = this.computeNormalAt(vx, vz);
      normals.setXYZ(i, n.x, n.y, n.z);
    }
    normals.needsUpdate = true;

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(cx * this.chunkSize, 0, cz * this.chunkSize);
    mesh.receiveShadow = true;

    this.scene.add(mesh);
    this.chunks.set(key, mesh);
  }


  //######################################
  //############### CHUNCK MODIFICATIONS localstorage
  //######################################

  saveChunksToJSON() {
    const obj = {};
    for (const [key, mods] of this.chunkData) {
      obj[key] = mods;
    }
    localStorage.setItem('terrainData', JSON.stringify(obj));
  }

  loadChunksFromJSON() {
    const json = localStorage.getItem('terrainData');
    if (!json) return;

    const obj = JSON.parse(json);
    for (const key in obj) {
      this.chunkData.set(key, obj[key]);
    }

    // Reconstrói chunks já carregados
    for (const key of this.chunkData.keys()) {
      const [cx, cz] = key.split('_').map(Number);
      if (this.chunks.has(key)) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  getLocalModification(key, x, z) {
    const data = this.chunkData.get(key);
    if (!data) return null;

    let totalDelta = 0;
    for (const mod of data) {
      const dx = x - mod.x;
      const dz = z - mod.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        totalDelta += mod.deltaHeight * (1 - dist / 5);
      }
    }
    return totalDelta;
  }

  applyModification(cx, cz, x, z, deltaHeight) {
    const key = `${cx}_${cz}`;
    if (!this.chunkData.has(key)) {
      this.chunkData.set(key, []);
    }
    this.chunkData.get(key).push({ x, z, deltaHeight });

    this.rebuildChunk(cx, cz);

    const neighbors = [
      [cx - 1, cz], [cx + 1, cz],
      [cx, cz - 1], [cx, cz + 1],
    ];
    for (const [ncx, ncz] of neighbors) {
      const nkey = `${ncx}_${ncz}`;
      if (this.chunks.has(nkey)) {
        this.rebuildChunk(ncx, ncz);
      }
    }
  }


  //######################################
  //############### UPDATES
  //######################################

  updateShadowCamera() {
    const shadowCam = this.sunLight.shadow.camera;
    shadowCam.position.copy(this.camera.position);
    shadowCam.left = -200;
    shadowCam.right = 200;
    shadowCam.top = 200;
    shadowCam.bottom = -200;
    shadowCam.near = 1;
    shadowCam.far = 1000;
    shadowCam.updateProjectionMatrix();
  }

  update() {
    this.updateShadowCamera();
        
    const cx = Math.floor(this.camera.position.x / this.chunkSize);
    const cz = Math.floor(this.camera.position.z / this.chunkSize);

    if (this.material?.uniforms) {
      this.material.uniforms.cameraXZ.value.set(this.camera.position.x, this.camera.position.z);
    }

    const needed = new Set();

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const key = `${cx + dx}_${cz + dz}`;
        needed.add(key);
        this.createChunk(cx + dx, cz + dz);
      }
    }

    for (const [key, mesh] of this.chunks) {
      if (!needed.has(key)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }
  }

}

export { Terrain };
