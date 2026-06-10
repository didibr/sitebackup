const DEBUG = false;
const DEBUGPARALAX = false;

class CAR1 {
    constructor(loader, debug) {
        this.loader = loader;
        this.imageChassis = "./images/cars/1/chassis.png";
        this.imageWheel = "./images/cars/1/whell.png";
    }

    createWheel(x, chassisGroup, scene, physics, options) {
        const whellIMAGE = this.imageWheel;
        const wheelGroup = new THREE.Group();

        // 🔹 MESH DEBUG
        const wheel = new THREE.Mesh(
            new THREE.CircleGeometry(1.0, 8),
            new THREE.MeshBasicMaterial({
                color: 'black',
                wireframe: true,
                //depthWrite: true
            })
        );

        // 🔹 IMAGEM
        const texture = this.loader.load(whellIMAGE);
        const imageWheel = new THREE.Mesh(
            new THREE.CircleGeometry(1.2, 16),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            })
        );

        // 🔹 ADD NO GROUP
        wheelGroup.add(wheel);
        wheelGroup.add(imageWheel);
        wheel.visible = DEBUG;
        imageWheel.visible = !DEBUG;

        // 🔹 POSIÇÃO
        wheelGroup.position.set(x, 6.6, 0);

        // 🔹 ADD NA SCENE
        scene.add(wheelGroup);

        // 🔹 PHYSICS (usa o group agora)
        const body = physics.addBodyWheel(wheelGroup, {
            density: options.Wdensity || 1.0,
            friction: options.Wfriction || 2.5,
            restitution: options.Wrestitution || 0.0,

            ...physics.getCollisionFilter("car", options.collider)
        });
        body.isCar = true;
        body.isWhell = true;

        // 🔹 JOINT
        const joint = physics.addJoint(
            chassisGroup,
            wheelGroup,
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            {
                type: 'wheel',
                axis: { x: 0, y: 1 },

                enableMotor: true,
                motorSpeed: 0,
                maxMotorTorque: options.torque,

                frequencyHz: options.JfrequencyHz || 4,
                dampingRatio: options.JdampingRatio || 0.7,

                enableLimit: true,
                lowerTranslation: -0.5,
                upperTranslation: 0.5
            }
        );

        return { wheelGroup, wheel, joint, body };
    }

    createCar(scene, physics, options = { collider: true }) {
        const chassiIMAGE = this.imageChassis;
        const chassisGroup = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
            color: 'black',
            wireframe: true,
            //depthWrite: false
        });

        // 🔹 BASE (menor e mais proporcional)            
        var shape = new THREE.Shape();
        var w = 12;
        var h = 2.1;
        var d = 1;
        var chanfro = 1.0; // tamanho do corte
        // começa no topo esquerdo
        shape.moveTo(-w / 2, h / 2);
        // topo direito
        shape.lineTo(w / 2, h / 2);
        // lado direito descendo
        shape.lineTo(w / 2, -h / 2 + chanfro);
        // 🔻 corte diagonal direita
        shape.lineTo(w / 2 - chanfro, -h / 2);
        // base até esquerda
        shape.lineTo(-w / 2 + chanfro, -h / 2);
        // 🔻 corte diagonal esquerda
        shape.lineTo(-w / 2, -h / 2 + chanfro);
        // fecha no topo esquerdo
        shape.lineTo(-w / 2, h / 2);
        var extrudeSettings = {
            depth: d,
            bevelEnabled: false
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();
        const base = new THREE.Mesh(geometry, mat);
        chassisGroup.add(base);

        // 🔹 CABINE (trapézio)
        var shape = new THREE.Shape();
        shape.moveTo(-2.5, 1);   // esquerda cima
        shape.lineTo(2.5, 1);    // direita cima
        shape.lineTo(3.5, -1);   // direita baixo
        shape.lineTo(-4.0, -1);  // esquerda baixo
        shape.closePath();
        var extrudeSettings = {
            depth: 1,
            bevelEnabled: false
        };
        const cabinGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const top = new THREE.Mesh(cabinGeometry, mat);
        top.position.set(-0.6, 2, -0.5); // ajuste fino (centralizar Z)
        chassisGroup.add(top);
        top.visible = DEBUG;


        // 🔹 POSIÇÃO            
        chassisGroup.position.set(0, 8, 0);
        scene.add(chassisGroup);


        const body = physics.addCompoundBody(chassisGroup, {
            density: 1,
            friction: 0.5,
            ...physics.getCollisionFilter("car", options.collider)
        });
        body.setAngularDamping(3);
        body.isCar = true;


        //CHSASSI IMAGE
        const texture = this.loader.load(chassiIMAGE);
        const imagechassi = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 6),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            })
        );
        if (options.collor) {
            imagechassi.material.color.set(options.collor);
        }
        chassisGroup.add(imagechassi);
        imagechassi.position.set(0, 0.4, 0);


        base.visible = DEBUG;
        imagechassi.visible = !DEBUG;

        // 🔹 RODAS (mais próximas)            

        options.torque = 600;
        options.Wdensity = 1.0;       //mais leve = responde mais rápido
        options.Wfriction = 1.4;     //mais grip
        options.Wrestitution = 0;
        options.JfrequencyHz = 8.5;    //mais rígido (menos "mola")               
        options.JdampingRatio = 0.7; //amortecimento



        const left = this.createWheel(-3.4, chassisGroup, scene, physics, options);
        const right = this.createWheel(3.4, chassisGroup, scene, physics, options);

        return {
            body,
            chassis: chassisGroup,
            left,
            right,
            speed: 0,
            options
        };
    }
}

class PARALLAX {
    constructor(scene, loader, mapBounds) {
        this.scene = scene;
        this.loader = loader;
        this.mapBounds = mapBounds;
        this.layers = [];
        this.terrainMeshes = []; // 🔥 camadas do terreno
    }

    dispose() {

        // 🔥 remover layers (parallax)
        this.layers.forEach(layer => {

            this.scene.remove(layer.mesh);

            if (layer.mesh.geometry)
                layer.mesh.geometry.dispose();

            if (layer.mesh.material) {

                if (layer.mesh.material.map)
                    layer.mesh.material.map.dispose();

                layer.mesh.material.dispose();
            }

        });

        this.layers = [];

        // 🔥 remover terreno (gerarCamadasTerreno)
        this.terrainMeshes.forEach(mesh => {

            this.scene.remove(mesh);

            if (mesh.geometry)
                mesh.geometry.dispose();

            if (mesh.material) {

                if (mesh.material.uniforms) {
                    // shader → liberar texturas
                    Object.values(mesh.material.uniforms).forEach(u => {
                        if (u.value instanceof THREE.Texture) {
                            u.value.dispose();
                        }
                    });
                }

                mesh.material.dispose();
            }

        });

        this.terrainMeshes = [];
    }

    addLayer(options) {
        const texture = this.loader.load(options.image);

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipMapLinearFilter;

        // 🔥 corte opcional
        const cutLeft = options.cutLeft || 0;   // ex: 0.1
        const cutRight = options.cutRight || 0; // ex: 0.2

        const usable = 1 - cutLeft - cutRight;
        const finalUsable = Math.max(0.0001, usable);

        // 🔥 aplica repeat já com corte
        texture.repeat.set((options.repeatX || 5) * finalUsable, 1);

        // 🔥 desloca UV
        texture.offset.x = cutLeft;

        const width = options.width || 500;
        const height = options.height || 200;

        const geo = new THREE.PlaneGeometry(width, height);

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geo, material);

        mesh.position.set(
            0,
            options.y || 50,
            options.z || -100
        );

        this.scene.add(mesh);

        this.layers.push({
            mesh,
            speed: options.speed || 0.2,
            baseX: mesh.position.x
        });
    }

    getLinhaY(linha, x) {
        for (let i = 0; i < linha.length - 1; i++) {

            const p1 = linha[i];
            const p2 = linha[i + 1];

            if ((x >= p1.x && x <= p2.x) || (x >= p2.x && x <= p1.x)) {

                const t = (x - p1.x) / (p2.x - p1.x || 1);
                return p1.y + t * (p2.y - p1.y);
            }
        }

        return linha[0].y;
    }

    gerarCamadasTerreno(linhas, scene, options = {}) {

        const FUNDO = options.fundo ?? -200;
        const loader = new THREE.TextureLoader();

        if (!options.scale) options.scale = [0.05, 0.03, 0.01];

        let rawCamadas = options.camadas ?? [0xff0000, 0x0000ff, 0x00ff00];

        if (!Array.isArray(rawCamadas)) rawCamadas = [rawCamadas];

        let camadas = rawCamadas.map(c => {
            if (typeof c === "string") return loader.load(c);
            if (typeof c === "number") return new THREE.Color(c);
            return c;
        });

        while (camadas.length < 3) {
            camadas.push(camadas[camadas.length - 1]);
        }

        const isTextureMode = camadas[0] instanceof THREE.Texture;

        // 🔥 MUITO IMPORTANTE: habilitar repetição
        camadas.forEach(tex => {
            if (tex instanceof THREE.Texture) {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
            }
        });

        linhas.forEach((linha, index) => {

            if (!linha || linha.length < 2) return;

            const shape = new THREE.Shape();

            shape.moveTo(linha[0].x, linha[0].y);
            linha.forEach(p => shape.lineTo(p.x, p.y));

            shape.lineTo(linha[linha.length - 1].x, FUNDO);
            shape.lineTo(linha[0].x, FUNDO);

            const geo = new THREE.ShapeGeometry(shape);
            const pos = geo.attributes.position;

            const tValues = [];

            for (let i = 0; i < pos.count; i++) {

                const x = pos.getX(i);
                const y = pos.getY(i);

                const yLinha = this.getLinhaY(linha, x);

                let t;

                if (y >= yLinha) t = 1;
                else if (y <= FUNDO) t = 0;
                else t = (y - FUNDO) / (yLinha - FUNDO);

                t = Math.max(0, Math.min(1, t));

                tValues.push(t);
            }

            geo.setAttribute('t', new THREE.Float32BufferAttribute(tValues, 1));

            let mat;

            if (!isTextureMode) {

                const colors = [];
                const total = camadas.length - 1;

                tValues.forEach(t => {

                    let i = Math.floor(t * total);
                    if (i >= total) i = total - 1;

                    const f = (t * total) - i;

                    const c1 = camadas[i];
                    const c2 = camadas[i + 1];

                    const c = c1.clone().lerp(c2, f);

                    colors.push(c.r, c.g, c.b);
                });

                geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                mat = new THREE.MeshBasicMaterial({
                    vertexColors: true,
                    side: THREE.DoubleSide
                });

            } else {

                mat = new THREE.ShaderMaterial({

                    uniforms: {
                        tex1: { value: camadas[0] },
                        tex2: { value: camadas[1] },
                        tex3: { value: camadas[2] },

                        scale1: { value: options.scale[0] },
                        scale2: { value: options.scale[1] },
                        scale3: { value: options.scale[2] }
                    },

                    vertexShader: `
                    attribute float t;

                    varying float vT;
                    varying vec2 vWorld;

                    void main() {
                        vT = t;

                        // 🔥 usa posição do mundo (resolve UV bugado)
                        vWorld = position.xy;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,

                    fragmentShader: `
                    uniform sampler2D tex1;
                    uniform sampler2D tex2;
                    uniform sampler2D tex3;

                    uniform float scale1;
                    uniform float scale2;
                    uniform float scale3;

                    varying float vT;
                    varying vec2 vWorld;

                    void main() {

                        vec2 uv1 = vWorld * scale1;
                        vec2 uv2 = vWorld * scale2;
                        vec2 uv3 = vWorld * scale3;

                        vec4 c1 = texture2D(tex1, uv1);
                        vec4 c2 = texture2D(tex2, uv2);
                        vec4 c3 = texture2D(tex3, uv3);

                        vec4 color;

                        if (vT < 0.5) {
                            float f = vT * 2.0;
                            color = mix(c1, c2, f);
                        } else {
                            float f = (vT - 0.5) * 2.0;
                            color = mix(c2, c3, f);
                        }

                        gl_FragColor = color;
                    }
                `,

                    side: THREE.DoubleSide
                });
            }

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -index * 0.1;

            scene.add(mesh);
            this.terrainMeshes.push(mesh);
        });
    }

    update(camera, receivedkeys) {
        if (!camera) return;

        if (DEBUGPARALAX) {
            const move = 3;
            if (receivedkeys["ArrowRight"]) camera.position.x += move;
            if (receivedkeys["ArrowLeft"]) camera.position.x -= move;
            if (receivedkeys["ArrowUp"]) camera.position.y += move;
            if (receivedkeys["ArrowDown"]) camera.position.y -= move;
        }

        const camX = camera.position.x;

        this.layers.forEach(layer => {
            // 🔥 parallax correto (base + offset)
            layer.mesh.position.x = layer.baseX + camX * layer.speed;
        });
    }
}

class MAP {
    constructor() {
        this.linhas;
        this.bounds = {};
        this.meshes = [];
        this.bodies = [];
        this.debugMeshes = [];
        this.race = {
            leftX: null,
            rightX: null,
            started: false,
            finished: false,
            startTime: 0,
            endTime: 0,
            meshes: []
        };
    }

    dispose(scene, physics) {
        this.race.meshes.forEach(m => scene.remove(m));
        this.race.meshes = [];
        // 🔥 remover meshes visuais
        this.meshes.forEach(mesh => {

            scene.remove(mesh);

            if (mesh.geometry)
                mesh.geometry.dispose();

            if (mesh.material)
                mesh.material.dispose();

        });

        this.meshes = [];

        // 🔥 remover debug
        this.debugMeshes.forEach(mesh => {

            scene.remove(mesh);

            if (mesh.geometry)
                mesh.geometry.dispose();

            if (mesh.material)
                mesh.material.dispose();

        });

        this.debugMeshes = [];

        // 🔥 remover física
        this.bodies.forEach(body => {
            physics.world.destroyBody(body); // ou sua função equivalente
        });

        this.bodies = [];

        // 🔥 limpar dados
        this.linhas = [];
        this.bounds = {};
    }

    createRaceMarkers(scene) {

        if (!this.linhas || this.linhas.length === 0) return;

        let minX = Infinity;
        let maxX = -Infinity;

        // 🔥 pega extremos reais
        this.linhas.forEach(linha => {
            linha.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
            });
        });

        const leftX = minX + 30;
        const rightX = maxX - 30;

        this.race.leftX = leftX;
        this.race.rightX = rightX;

        // 🔥 remove antigos
        this.race.meshes.forEach(m => scene.remove(m));
        this.race.meshes = [];

        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });

        const height = (this.bounds.maxY - this.bounds.minY) + 100;

        function createLine(x) {
            const geo = new THREE.PlaneGeometry(1.5, height);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(x, (height / 2) + (this.bounds.minY - 50), 5);
            return mesh;
        }

        const leftMesh = createLine.call(this, leftX);
        const rightMesh = createLine.call(this, rightX);

        scene.add(leftMesh);
        scene.add(rightMesh);

        this.race.meshes.push(leftMesh, rightMesh);

        // reset estado
        this.race.started = false;
        this.race.finished = false;
    }

    updateRace(car) {

        if (!car || !car.options.driveable) return;

        const ui = window.RACE_UI;
        if (!ui) return;

        const x = car.chassis.position.x;

        // =========================
        // START
        // =========================
        if (!this.race.started && x >= this.race.leftX) {
            this.race.started = true;
            this.race.finished = false;
            this.race.startTime = performance.now();

            ui.innerText = "START!";
        }

        // =========================
        // DURANTE
        // =========================
        if (this.race.started && !this.race.finished) {

            const time = (performance.now() - this.race.startTime) / 1000;
            ui.innerText = time.toFixed(3) + " s";
        }

        // =========================
        // FINISH
        // =========================
        if (this.race.started && !this.race.finished && x >= this.race.rightX) {
            this.race.finished = true;
            this.race.endTime = performance.now();

            const finalTime = (this.race.endTime - this.race.startTime) / 1000;

            ui.innerText = "🏁 " + finalTime.toFixed(3) + " s";
        }
    }

    // =========================
    // SUAVIZAÇÃO (INALTERADO)
    // =========================
    suavizarCurva(pontos, subdivisoes = 5) {
        if (pontos.length < 3) return pontos;
        const curva = new THREE.CatmullRomCurve3(pontos);
        return curva.getPoints(pontos.length * subdivisoes);
    }

    simplify(points, tolerance = 0.5) {
        const result = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prev = result[result.length - 1];
            const dx = points[i].x - prev.x;
            const dy = points[i].y - prev.y;
            if (Math.hypot(dx, dy) > tolerance) result.push(points[i]);
        }
        return result;
    }

    limitSlope(points, maxSlope = 1.0) {
        const result = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prev = result[result.length - 1];
            const curr = points[i];

            let dx = curr.x - prev.x;
            let dy = curr.y - prev.y;

            const slope = dy / (dx || 0.0001);

            if (Math.abs(slope) > maxSlope) {
                dy = Math.sign(dy) * Math.abs(dx) * maxSlope;
            }

            result.push(new THREE.Vector3(prev.x + dx, prev.y + dy, 0));
        }
        return result;
    }

    smooth(points, iterations = 2) {
        let pts = [...points];
        for (let k = 0; k < iterations; k++) {
            const newPts = [pts[0]];
            for (let i = 1; i < pts.length - 1; i++) {
                newPts.push(new THREE.Vector3(
                    (pts[i - 1].x + pts[i].x + pts[i + 1].x) / 3,
                    (pts[i - 1].y + pts[i].y + pts[i + 1].y) / 3,
                    0
                ));
            }
            newPts.push(pts[pts.length - 1]);
            pts = newPts;
        }
        return pts;
    }

    getLinhaY(linha, x) {
        for (let i = 0; i < linha.length - 1; i++) {

            const p1 = linha[i];
            const p2 = linha[i + 1];

            if ((x >= p1.x && x <= p2.x) || (x >= p2.x && x <= p1.x)) {

                const t = (x - p1.x) / (p2.x - p1.x || 1);
                return p1.y + t * (p2.y - p1.y);
            }
        }

        return linha[0].y;
    }

    normalizeLine(points) {

        if (!points || points.length < 2) return points;

        // 🔥 1. remover pontos muito próximos (ruído)
        const filtered = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prev = filtered[filtered.length - 1];
            const curr = points[i];

            if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 2.0) {
                filtered.push(curr);
            }
        }

        // 🔥 2. calcular média da normal da linha inteira
        let totalNy = 0;

        for (let i = 0; i < filtered.length - 1; i++) {

            const p1 = filtered[i];
            const p2 = filtered[i + 1];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            const len = Math.hypot(dx, dy) || 1;

            const nx = -dy / len;
            const ny = dx / len;

            totalNy += ny;
        }

        // 🔥 3. se a média da normal está pra baixo → inverter tudo
        if (totalNy < 0) {
            filtered.reverse();
        }

        return filtered;
    }

    debugNormals(scene, lines) {

        const normalSize = 5; // tamanho da seta

        lines.forEach(line => {

            for (let i = 0; i < line.length - 1; i++) {

                const p1 = line[i];
                const p2 = line[i + 1];

                // 🔥 direção do segmento
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;

                const len = Math.hypot(dx, dy) || 1;

                // 🔥 normal (perpendicular)
                const nx = -dy / len;
                const ny = dx / len;

                // 🔥 ponto médio
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                // 🔥 linha da normal
                const points = [
                    new THREE.Vector3(midX, midY, 5),
                    new THREE.Vector3(
                        midX + nx * normalSize,
                        midY + ny * normalSize,
                        5
                    )
                ];

                const geo = new THREE.BufferGeometry().setFromPoints(points);

                const mat = new THREE.LineBasicMaterial({
                    color: 0xff0000
                });

                const lineMesh = new THREE.Line(geo, mat);

                scene.add(lineMesh);
                this.debugMeshes.push(lineMesh);
            }
        });
    }

    getClosestPoint(x, y, offset = 10) {

        if (!this.linhas || this.linhas.length === 0) return null;

        let melhorPonto = null;
        let menorScore = Infinity;

        // 🔥 guardar info da linha escolhida
        let melhorLinha = null;
        let melhorMinX = 0;
        let melhorMaxX = 0;

        for (const linha of this.linhas) {

            let minX = Infinity;
            let maxX = -Infinity;

            for (const p of linha) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
            }

            if ((maxX - minX) < 20) continue;

            for (let i = 0; i < linha.length - 1; i++) {

                const p1 = linha[i];
                const p2 = linha[i + 1];

                const vx = p2.x - p1.x;
                const vy = p2.y - p1.y;

                const len2 = vx * vx + vy * vy || 1;

                const wx = x - p1.x;
                const wy = y - p1.y;

                let t = (wx * vx + wy * vy) / len2;
                t = Math.max(0, Math.min(1, t));

                const projX = p1.x + vx * t;
                const projY = p1.y + vy * t;

                const dx = x - projX;
                const dy = y - projY;

                let dist = dx * dx + dy * dy;

                const edge = Math.min(t, 1 - t);
                const penalty = 1 / (edge + 0.05);

                const score = dist * penalty;

                if (score < menorScore) {
                    menorScore = score;
                    melhorPonto = { x: projX, y: projY };

                    // 🔥 salva info da linha
                    melhorLinha = linha;
                    melhorMinX = minX;
                    melhorMaxX = maxX;
                }
            }
        }

        if (!melhorPonto) return null;

        // =========================
        // 🔥 DETECTA LADO
        // =========================
        const midX = (melhorMinX + melhorMaxX) / 2;

        let finalX = melhorPonto.x;

        if (melhorPonto.x < midX) {
            // 👉 lado esquerdo
            finalX += offset;
        } else {
            // 👉 lado direito
            finalX -= offset;
        }

        return {
            x: finalX,
            y: melhorPonto.y
        };
    }

    colapsarParaLinhaCentral(linhas, tolerancia = 2.0) {

        const usadas = new Set();
        const resultado = [];

        function dist(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.hypot(dx, dy);
        }

        for (let i = 0; i < linhas.length; i++) {

            if (usadas.has(i)) continue;

            const l1 = linhas[i];
            let encontrouPar = false;

            for (let j = i + 1; j < linhas.length; j++) {

                if (usadas.has(j)) continue;

                const l2 = linhas[j];

                // compara início e fim (linhas paralelas próximas)
                const dStart = dist(l1[0], l2[0]);
                const dEnd = dist(l1[l1.length - 1], l2[l2.length - 1]);

                if (dStart < tolerancia && dEnd < tolerancia) {

                    // 🔥 cria linha central
                    const tamanho = Math.min(l1.length, l2.length);
                    const meio = [];

                    for (let k = 0; k < tamanho; k++) {

                        const p1 = l1[k];
                        const p2 = l2[k];

                        meio.push(new THREE.Vector3(
                            (p1.x + p2.x) * 0.5,
                            (p1.y + p2.y) * 0.5,
                            0
                        ));
                    }

                    resultado.push(meio);

                    usadas.add(i);
                    usadas.add(j);
                    encontrouPar = true;
                    break;
                }
            }

            if (!encontrouPar) {
                resultado.push(l1);
                usadas.add(i);
            }
        }

        return resultado;
    }

    extrairLinhasCentro(source, data, options) {

        const width = source.width;
        const height = source.height;

        function isBlack(i) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 200) return false;

            const brightness = (r + g + b) / 3;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max - min;

            return brightness < 200;
        }

        // =========================
        // 1. pegar pontos centrais (igual antes)
        // =========================
        const pontos = [];

        for (let x = 0; x < width; x++) {

            let coluna = [];

            for (let y = 0; y < height; y++) {
                const i = (y * width + x) * 4;
                if (isBlack(i)) coluna.push(y);
            }

            if (coluna.length === 0) continue;

            let grupo = [coluna[0]];

            for (let i = 1; i < coluna.length; i++) {
                if (coluna[i] - coluna[i - 1] <= 1) {
                    grupo.push(coluna[i]);
                } else {
                    pontos.push({
                        x,
                        y: grupo.reduce((a, b) => a + b, 0) / grupo.length
                    });
                    grupo = [coluna[i]];
                }
            }

            pontos.push({
                x,
                y: grupo.reduce((a, b) => a + b, 0) / grupo.length
            });
        }

        // =========================
        // 2. conectar pontos por distância (ESSENCIAL)
        // =========================
        const linhas = [];
        const usados = new Set();

        function dist2(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return dx * dx + dy * dy;
        }

        const MAX_DIST = 10 * 10;
        const MAX_BACKTRACK = 5; // 🔥 permite voltar um pouco no X

        for (let i = 0; i < pontos.length; i++) {

            if (usados.has(i)) continue;

            const linha = [pontos[i]];
            usados.add(i);

            let atual = pontos[i];

            while (true) {

                let melhor = -1;
                let menor = Infinity;

                for (let j = 0; j < pontos.length; j++) {

                    if (usados.has(j)) continue;

                    const p = pontos[j];

                    const dx = p.x - atual.x;

                    // 🔥 REGRA PRINCIPAL (ESSA SALVA TUDO)
                    if (dx < -MAX_BACKTRACK) continue;

                    const d = dist2(atual, p);

                    if (d < menor && d < MAX_DIST) {
                        menor = d;
                        melhor = j;
                    }
                }

                if (melhor === -1) break;

                atual = pontos[melhor];
                usados.add(melhor);
                linha.push(atual);
            }

            if (linha.length > 5) {
                linhas.push(linha);
            }
        }

        // =========================
        // 3. converter para THREE
        // =========================
        return linhas.map(linha =>
            linha.map(p => new THREE.Vector3(
                (p.x - width / 2) * options.scale,
                -(p.y - height / 2) * options.scale,
                0
            ))
        );
    }
    // =========================
    // MAIN
    // =========================
    async createGroundFromImage(scene, physics, options) {

        if (typeof (options.model) === 'undefined' && !options.paths) {
            options.model = 1;
        }

        let linhas = [];

        // =========================
        // 🔥 CASO 1: PATHS (EDITOR)
        // =========================
        if (options.paths) {

            const width = options.width || 600;
            const height = options.height || 123;

            linhas = options.paths.map(p => {

                const pathData = (typeof p === "string")
                    ? JSON.parse(p)
                    : (p.exportJSON ? JSON.parse(p.exportJSON()) : p);

                let segments = null;

                if (Array.isArray(pathData)) {
                    for (const item of pathData) {
                        if (item && item.segments) {
                            segments = item.segments;
                            break;
                        }
                    }
                }

                if (!segments || segments.length < 2) return null;

                const linha = segments.map(seg => {

                    let x, y;

                    if (Array.isArray(seg[0])) {
                        x = seg[0][0];
                        y = seg[0][1];
                    } else if (Array.isArray(seg)) {
                        x = seg[0];
                        y = seg[1];
                    } else {
                        return null;
                    }

                    return new THREE.Vector3(
                        (x - width / 2) * options.scale,
                        -(y - height / 2) * options.scale,
                        0
                    );
                }).filter(p => p !== null);

                return linha;
            }).filter(l => l && l.length > 1);

        }

        // =========================
        // 🔥 CASO 2: IMAGEM (FALLBACK)
        // =========================
        else {

            let img = new Image();

            if (options.image) {
                img.src = options.image;
            } else {
                img.src = `./images/b1.png`;
            }

            await img.decode();

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;

            // 🔥 fundo branco evita transparência bugada
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            linhas = this.extrairLinhasCentro(img, data, options);
        }
        
        // 👉 daqui pra baixo continua seu código normal
        //linhas = this.colapsarParaLinhaCentral(linhas, 3.0);

        // =========================
        // SUAVIZAÇÃO ORIGINAL (MANTIDA)
        // =========================
        const linhasProcessadas = [];

        // 🔥 ordenar topo → fundo
        linhas.sort((a, b) => {
            const ay = a.reduce((s, p) => s + p.y, 0) / a.length;
            const by = b.reduce((s, p) => s + p.y, 0) / b.length;
            return ay - by; // maior Y primeiro (mais alto)
        });

        linhas.forEach(linha => {
            if (linha.length < 2) return;

            let l = linha;
            l = this.simplify(l, 2.0);

            if (options.suavizarCurva) {
                l = this.limitSlope(l, options.limitSlope || 5.0);
                l = this.smooth(l, options.smooth || 3);
                l = this.suavizarCurva(l, 6);
            }

            l = this.normalizeLine(l);
            linhasProcessadas.push(l);

            // física original
            const body = physics.addChainOneSide(l, {
                friction: 4.0,
                restitution: 0
            });
            body.isGround = true;
            this.bodies.push(body);
        });

        if (DEBUG) this.debugNormals(scene, linhasProcessadas);

        //GERA PISTA PRETA ESPESSA
        function gerarPista(linha, largura = 5) {
            const esquerda = [];
            const direita = [];

            for (let i = 0; i < linha.length; i++) {

                const p0 = linha[i - 1] || linha[i];
                const p1 = linha[i];
                const p2 = linha[i + 1] || linha[i];

                const dx = p2.x - p0.x;
                const dy = p2.y - p0.y;

                const len = Math.hypot(dx, dy) || 1;

                // normal perpendicular
                const nx = -dy / len;
                const ny = dx / len;

                esquerda.push(new THREE.Vector3(
                    p1.x + nx * largura,
                    p1.y + ny * largura,
                    0
                ));

                direita.push(new THREE.Vector3(
                    p1.x - nx * largura,
                    p1.y - ny * largura,
                    0
                ));
            }

            return { esquerda, direita };
        }

        const materialLinha = new THREE.MeshBasicMaterial({
            color: 'black',
            //depthWrite: true 
        });
        linhasProcessadas.forEach(linha => {
            if (linha.length < 2) return;

            //var geo; //new THREE.BufferGeometry().setFromPoints(linha);

            const pista = gerarPista(linha, 0.5);
            const shape = new THREE.Shape();

            pista.esquerda.forEach((p, i) => {
                if (i === 0) shape.moveTo(p.x, p.y);
                else shape.lineTo(p.x, p.y);
            });

            for (let i = pista.direita.length - 1; i >= 0; i--) {
                const p = pista.direita[i];
                shape.lineTo(p.x, p.y);
            }

            var geo = new THREE.ShapeGeometry(shape);


            //const line = new THREE.Line(geo, materialLinha);
            const mesh = new THREE.Mesh(geo, materialLinha);

            // 🔥 joga um pouquinho pra frente pra não dar z-fighting
            mesh.position.z = 0.1;


            scene.add(mesh);
            this.meshes.push(mesh);
        });


        //PEGA DADOS DO TAMANHO DAS LINHAS
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        linhasProcessadas.forEach(linha => {
            linha.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
        });

        this.linhas = linhasProcessadas;
        this.bounds = {
            minX,
            maxX,
            minY,
            maxY,
            width: maxX - minX,
            height: maxY - minY,
        };

    }
}

class MODELS {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.cars = [];
        this.parallax;
        this.currentMap;
    }

    async createMap(scene, renderer, physics, options) {
        this.currentMap = new MAP();
        await this.currentMap.createGroundFromImage(scene, physics, options);
        this.currentMap.createRaceMarkers(scene);
        const parallax = new PARALLAX(scene, this.loader, this.currentMap.bounds);
        this.parallax = parallax;

        renderer.setClearColor(new THREE.Color("#e6f6fe"), 1);

        if (!DEBUG) {
            this.parallax.addLayer({
                image: "./images/maps/1/ceu.png",
                speed: 0.1,
                z: -200,
                y: 80,
                width: 10000,
                height: 260,
                repeatX: 12,
            });

            this.parallax.addLayer({
                image: "./images/maps/1/montain.png",
                speed: 0.3,
                z: -150,
                y: -80,
                width: 10000,
                height: 800,
                repeatX: 12,
            });


            this.parallax.gerarCamadasTerreno(this.currentMap.linhas, scene,
                {
                    camadas: ["./images/maps/t1.jpg", "./images/maps/t1.jpg", "./images/maps/snow.jpg"],
                    scale: [0.05, 0.05, 0.04]
                });

        }
        /*
        this.parallax.addLayer({
            image: "mt.png",
            speed: 0.2,    
            z: -200,
            y: -20,
            width: 1000,
            height: 320,
            repeatX: 8
        });*/

        /*speeds
        0.05  → bem longe (céu)
        0.2   → montanha longe
        0.4   → médio
        0.7   → perto
        */
        const map = this.currentMap;
        return { map, parallax };
    }

    createCar(scene, physics, map_paralax, options = { model: 1, driveable: false, collider: false }) {
        let car = null;
        if (typeof (options.model) === 'undefined') options.model = 1;
        if (typeof (options.collider) === 'undefined') options.collider = false;
        if (typeof (options.driveable) === 'undefined') options.driveable = false;

        if (options.model == 1) {//MODEL 1
            const car1 = new CAR1(this.loader, DEBUG);
            car = car1.createCar(scene, physics, options);
            car.body._car = car;
            car.left.body._car = car;
            car.right.body._car = car;
        }

        this.cars.push(car);
        if (typeof (options.x) !== 'undefined' && typeof (options.y) !== 'undefined') {
            physics.teleportCar(car, options.x, options.y);
        }
        car.onFall = () => {
            let car_x = car.chassis.position.x;
            let car_y = car.chassis.position.y;
            let moveto = map_paralax.map.getClosestPoint(car_x, car_y);
            physics.teleportCar(car, moveto.x, moveto.y + 15);
        }

        return car;
    }


    updateCamera(camera, car, delta) {

        const followSpeed = 5; // maior = mais rápido

        const t = 1 - Math.exp(-followSpeed * delta);

        if (car)
            camera.position.x += (car.chassis.position.x - camera.position.x) * t;
        camera.position.y += (car.chassis.position.y - camera.position.y) * t;


    }

    updateCar(receivedkeys, delta, camera) {
        let keys = {};
        

        this.cars.forEach((car) => {
            if (car.options.driveable) {
                keys = { ...receivedkeys };
            } else {
                keys = { ...(car.keys || {}) };
            }

            const maxSpeed = 50;
            const brakeStrength = 0.20;

            let target = 0;
            let accelerating = false;

            if (keys["ArrowRight"]) {
                target = -maxSpeed;
                accelerating = true;
            }
            else if (keys["ArrowLeft"]) {
                target = maxSpeed;
                accelerating = true;
            }

            // 🔹 ACELERAÇÃO
            if (accelerating) {
                car.speed = THREE.MathUtils.lerp(
                    car.speed,
                    target,
                    5 * delta
                );
            }

            // 🔹 FREIO
            if (keys["Space"]) {
                car.speed *= Math.max(0, 1 - brakeStrength * delta);

                car.left.joint.enableMotor(true);
                car.right.joint.enableMotor(true);

                car.left.joint.setMaxMotorTorque(car.options.torque * 1.5);
                car.right.joint.setMaxMotorTorque(car.options.torque * 1.5);

                car.left.joint.setMotorSpeed(0);
                car.right.joint.setMotorSpeed(0);
            }
            // 🔹 ACELERANDO
            else if (accelerating) {
                car.left.joint.enableMotor(true);
                car.right.joint.enableMotor(true);

                car.left.joint.setMaxMotorTorque(car.options.torque);
                car.right.joint.setMaxMotorTorque(car.options.torque);

                car.left.joint.setMotorSpeed(car.speed);
                car.right.joint.setMotorSpeed(car.speed);
            }
            // 🔹 RODA LIVRE (ESSA É A PARTE IMPORTANTE)
            else {
                car.left.joint.enableMotor(false);
                car.right.joint.enableMotor(false);
            }

            // 🔹 LIMITADOR
            car.speed = THREE.MathUtils.clamp(car.speed, -maxSpeed, maxSpeed);

            //is follow by camera
            if (car.options.follow) {
                this.updateCamera(camera, car, delta);
            }

            if (this.currentMap) {
                this.currentMap.updateRace(car);
            }
        });

        if (this.parallax && this.parallax.update)
            this.parallax.update(camera, receivedkeys);
    }

}
export default MODELS;