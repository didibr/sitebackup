import planck from './planck.js';

class PHISICS {

    constructor() {
        this.forcePause=false;
        this.enabled = true;
        this.jDebug = false;
        this.scale = 1;
        this.bodies = [];
        this.joints = [];
        this.world = new planck.World({
            gravity: planck.Vec2(0, -10)
        });
        this.defaultOptions = {
            density: 1.0,       // massa (peso do objeto)
            friction: 0.3,      // atrito (desliza ou não)
            restitution: 0.2    // quique (0 = sem quique, 1 = pula muito)
        };
        this.CATEGORY = {
            CAR: 0x0002,
            WORLD: 0x0004
        };
        this.world.on('begin-contact', (contact) => {

            const a = contact.getFixtureA().getBody();
            const b = contact.getFixtureB().getBody();

            function handle(body, other) {

                if (other.isGround) {
                    // 🔥 salva último chão + tempo
                    body._lastGround = body._newGround || null;
                    body._newGround = other;
                }

                if (body._ghost && other.isGround) {
                    body._contactCount = (body._contactCount || 0) + 1;
                }
            }

            handle(a, b);
            handle(b, a);
        });

        this.world.on('end-contact', (contact) => {

            const a = contact.getFixtureA().getBody();
            const b = contact.getFixtureB().getBody();

            function handle(body, other) {
                if (body._ghost && other.isGround) {
                    body._contactCount = Math.max(0, (body._contactCount || 0) - 1);
                }
            }

            handle(a, b);
            handle(b, a);
        });
        this.world.on('pre-solve', (contact) => {

            const fixtureA = contact.getFixtureA();
            const fixtureB = contact.getFixtureB();

            const bodyA = fixtureA.getBody();
            const bodyB = fixtureB.getBody();

            // =========================
            // 🔥 ghost ativo → ignora colisão
            // =========================
            if (
                (bodyA._ghost && bodyB.isGround) ||
                (bodyB._ghost && bodyA.isGround)
            ) {
                contact.setEnabled(false);
                return;
            }

            const isCarA = bodyA.isCar;
            const isCarB = bodyB.isCar;

            const isGroundA = bodyA.isGround;
            const isGroundB = bodyB.isGround;

            if (!(isCarA || isCarB)) return;
            if (!(isGroundA || isGroundB)) return;

            const carBody = isCarA ? bodyA : bodyB;
            const groundBody = isGroundA ? bodyA : bodyB;

            // =========================
            // 🔥 BLOQUEIO POR GROUND RECENTE + DIREÇÃO
            // =========================            

            const lastGround = carBody._lastGround;
            const newGround = carBody._newGround;

            let isRecentSameGround = false;
            if (newGround === lastGround && groundBody == newGround) isRecentSameGround = true;

            // 🔥 pega dados da colisão
            const worldManifold = contact.getWorldManifold(null);
            const normal = worldManifold.normal;
            const vel = carBody.getLinearVelocity();

            // 👉 só bloqueia se for o mesmo chão E colisão real
            if (isRecentSameGround) {
                return;
            }

            // =========================
            // 🔥 SUA REGRA ORIGINAL (INALTERADA)
            // =========================

            const dot = normal.y;

            const isFromBelow = dot < 0.1;
            const isGoingUp = vel.y > 0.08;

            if (isFromBelow && isGoingUp) {

                const car = this.getParts(carBody);

                contact.setEnabled(false);
                contact.setFriction(0);
                contact.setRestitution(0);
                contact.setTangentSpeed(0);

                // 🔥 ativa ghost
                if (car.bcar) {
                    Object.values(car).forEach(part => {
                        part._ghost = true;
                    });
                }
            }
        });
    }

    pause() {
    this.enabled = false;

    for (const obj of this.bodies) {

            if (!obj.mesh) continue;

            const body = obj.body;

        // 🔥 zera movimento
        body.setLinearVelocity(planck.Vec2(0, 0));
        body.setAngularVelocity(0);

        // 🔥 remove forças acumuladas
        body.setAwake(false);

        // 🔥 trava posição (opcional mas perfeito pra carro)
        body.setType('static');
    }
}

resume() {
    if(this.forcePause)return;
    this.enabled = true;

    for (const obj of this.bodies) {

            if (!obj.mesh) continue;

            const body = obj.body;

        // 🔥 volta ao normal
        body.setType('dynamic');
        body.setAwake(true);
    }
}

    getParts(body) {
        const car = body._car;

        if (!car) {
            return { body };
        }

        return {
            bcar: car.body,
            blef: car.left.body,
            brig: car.right.body
        };
    }

    getCollisionFilter(type = "world", collider = true) {

        if (type === "car") {
            return {
                filterCategoryBits: this.CATEGORY.CAR,
                filterMaskBits: collider
                    ? (this.CATEGORY.CAR | this.CATEGORY.WORLD)
                    : this.CATEGORY.WORLD
            };
        }

        if (type === "world") {
            return {
                filterCategoryBits: this.CATEGORY.WORLD,
                filterMaskBits: this.CATEGORY.CAR
            };
        }

        return {};
    }

    addChain(points, options = {}) {

        const opt = {
            ...this.defaultOptions,
            ...options,
            ...this.getCollisionFilter("world") // 🔥 AQUI
        };

        const body = this.world.createBody();

        const vertices = points.map(p =>
            planck.Vec2(
                p.x / this.scale,
                p.y / this.scale
            )
        );

        body.createFixture(
            planck.Chain(vertices),
            {
                density: opt.density,
                friction: opt.friction,
                restitution: opt.restitution,

                // 🔥 IMPORTANTE
                filterCategoryBits: opt.filterCategoryBits,
                filterMaskBits: opt.filterMaskBits,
                groupIndex: opt.groupIndex || 0
            }
        );

        this.bodies.push(body);

        return body;
    }

    addChainOneSide(points, options = {}) {

        const opt = {
            ...this.defaultOptions,
            ...options,
            ...this.getCollisionFilter("world")
        };

        const body = this.world.createBody();

        const vertices = points.map(p =>
            planck.Vec2(p.x / this.scale, p.y / this.scale)
        );

        const chain = planck.Chain(vertices, false);

        body.createFixture(chain, {
            density: opt.density,
            friction: opt.friction,
            restitution: opt.restitution,

            filterCategoryBits: opt.filterCategoryBits,
            filterMaskBits: opt.filterMaskBits
        });

        body.isGround = true;

        this.bodies.push(body);

        return body;
    }

    addEdges(points, options = {}) {

        const opt = {
            ...this.defaultOptions,
            ...options,
            ...this.getCollisionFilter("world")
        };

        const body = this.world.createBody();

        for (let i = 0; i < points.length - 1; i++) {

            const p1 = points[i];
            const p2 = points[i + 1];

            const v1 = planck.Vec2(
                p1.x / this.scale,
                p1.y / this.scale
            );

            const v2 = planck.Vec2(
                p2.x / this.scale,
                p2.y / this.scale
            );

            body.createFixture(
                planck.Edge(v1, v2),
                {
                    density: opt.density,
                    friction: opt.friction,
                    restitution: opt.restitution,

                    filterCategoryBits: opt.filterCategoryBits,
                    filterMaskBits: opt.filterMaskBits,
                    groupIndex: opt.groupIndex || 0
                }
            );
        }

        this.bodies.push(body);

        return body;
    }

    addOneSideEdges(points, options = {}) {

        const opt = {
            ...this.defaultOptions,
            ...options,
            ...this.getCollisionFilter("world")
        };

        const body = this.world.createBody();

        for (let i = 0; i < points.length - 1; i++) {

            const p0 = points[i - 1] || points[i];       // anterior
            const p1 = points[i];                        // atual
            const p2 = points[i + 1];                    // próximo
            const p3 = points[i + 2] || p2;              // próximo do próximo

            const v0 = planck.Vec2(p0.x / this.scale, p0.y / this.scale);
            const v1 = planck.Vec2(p1.x / this.scale, p1.y / this.scale);
            const v2 = planck.Vec2(p2.x / this.scale, p2.y / this.scale);
            const v3 = planck.Vec2(p3.x / this.scale, p3.y / this.scale);

            const edge = planck.Edge(v1, v2, v0, v3);

            body.createFixture(edge, {
                density: opt.density,
                friction: opt.friction,
                restitution: opt.restitution,

                filterCategoryBits: opt.filterCategoryBits,
                filterMaskBits: opt.filterMaskBits
            });
        }
        this.bodies.push(body);

        return body;
    }

    addJoint(objA, objB, posA, posB, opts = {}) {

        if (!opts.type) opts = {

            type: 'revolute',          // Tipo do joint: 'revolute' (gira), 'distance' (mola), 'weld' (fixo), 'prismatic' (desliza)

            collideConnected: false,   // Se os dois corpos conectados colidem entre si

            // -------------------------
            // 🔹 REVOLUTE (dobradiça)
            // -------------------------
            enableLimit: false,        // Ativa limite de rotação
            lowerAngle: 0,             // Ângulo mínimo permitido (em radianos)
            upperAngle: 0,             // Ângulo máximo permitido (em radianos)

            enableMotor: false,        // Ativa motor de rotação
            motorSpeed: 0,             // Velocidade do motor (rad/s)
            maxMotorTorque: 0,         // Torque máximo que o motor pode aplicar

            // -------------------------
            // 🔹 DISTANCE (mola / corda)
            // -------------------------
            length: null,              // Comprimento da ligação (null = calcula automaticamente)
            frequencyHz: 0,            // Rigidez da mola (quanto maior, mais dura)
            dampingRatio: 0,           // Amortecimento (0 = oscila, 1 = para rápido)

            // -------------------------
            // 🔹 PRISMATIC (slider)
            // -------------------------
            axis: { x: 1, y: 0 },     // Direção do movimento (ex: {x:1,y:0} = horizontal)

            enableLimitPrismatic: false, // Ativa limite de movimento linear
            lowerTranslation: 0,         // Posição mínima no eixo
            upperTranslation: 0,         // Posição máxima no eixo

            enableMotorPrismatic: false, // Ativa motor linear
            motorSpeedPrismatic: 0,      // Velocidade do movimento
            maxMotorForce: 0             // Força máxima do motor

        };

        // 🔹 pega os bodies associados
        const bodyA = this.bodies.find(b => b.mesh === objA)?.body;
        const bodyB = this.bodies.find(b => b.mesh === objB)?.body;

        if (!bodyA || !bodyB) {
            console.warn("Body não encontrado para um dos objetos");
            return;
        }

        // 🔹 converte posição local → mundo → planck
        /*const worldA = objA.localToWorld(posA.clone());
        const worldB = objB.localToWorld(posB.clone());    
        const anchorA = planck.Vec2(worldA.x / this.scale, worldA.y / this.scale);
        const anchorB = planck.Vec2(worldB.x / this.scale, worldB.y / this.scale);
        */

        const worldA = objA.getWorldPosition(new THREE.Vector3());
        const anchorA = planck.Vec2(worldA.x / this.scale, worldA.y / this.scale);
        const worldB = objB.getWorldPosition(new THREE.Vector3());
        const anchorB = planck.Vec2(worldB.x / this.scale, worldB.y / this.scale);

        let joint;

        // -----------------------------------
        // 🔹 REVOLUTE (dobradiça)
        // -----------------------------------
        if (opts.type === 'revolute') {

            joint = planck.RevoluteJoint({
                collideConnected: opts.collideConnected,
                enableLimit: opts.enableLimit,
                lowerAngle: opts.lowerAngle,
                upperAngle: opts.upperAngle
            }, bodyA, bodyB, anchorA);

        }

        // -----------------------------------
        // 🔹 DISTANCE (mola / corda)
        // -----------------------------------
        else if (opts.type === 'distance') {

            joint = planck.DistanceJoint({
                collideConnected: opts.collideConnected,
                length: opts.length || anchorA.clone().sub(anchorB).length(),
                frequencyHz: opts.frequencyHz,
                dampingRatio: opts.dampingRatio
            }, bodyA, bodyB, anchorA, anchorB);

        }

        // -----------------------------------
        // 🔹 WELD (cola fixa)
        // -----------------------------------
        else if (opts.type === 'weld') {

            joint = planck.WeldJoint({
                collideConnected: opts.collideConnected
            }, bodyA, bodyB, anchorA);

        }

        // -----------------------------------
        // 🔹 PRISMATIC (slider)
        // -----------------------------------
        else if (opts.type === 'prismatic') {

            const axis = planck.Vec2(opts.axis.x, opts.axis.y);

            joint = planck.PrismaticJoint({
                collideConnected: opts.collideConnected,
                localAxisA: axis
            }, bodyA, bodyB, anchorA);

        }

        // -----------------------------------
        // 🔹 WHEEL (carro real)
        // -----------------------------------
        else if (opts.type === 'wheel') {

            const axis = planck.Vec2(opts.axis.x, opts.axis.y);

            joint = planck.WheelJoint({
                collideConnected: opts.collideConnected,

                enableMotor: opts.enableMotor,
                motorSpeed: opts.motorSpeed,
                maxMotorTorque: opts.maxMotorTorque,

                frequencyHz: opts.frequencyHz,
                dampingRatio: opts.dampingRatio

            }, bodyA, bodyB, anchorB, axis);
        }

        else {
            console.warn("Tipo de joint desconhecido:", opts.type);
            return;
        }

        this.world.createJoint(joint);
        if (this.jDebug == true) {
            this.joints.push(joint);
        }

        return joint;
    }

    // -----------------------------------
    // 🔹 Cria shape baseado no mesh
    // -----------------------------------
    createShapeFromMesh(mesh) {
        const geo = mesh.geometry;

        // 🔹 LINHA (Edge)
        if (geo.attributes?.position?.count === 2) {
            const pos = geo.attributes.position.array;
            const v1 = planck.Vec2(
                (pos[0] + mesh.position.x) / this.scale,
                (pos[1] + mesh.position.y) / this.scale
            );
            const v2 = planck.Vec2(
                (pos[3] + mesh.position.x) / this.scale,
                (pos[4] + mesh.position.y) / this.scale
            );

            return planck.Edge(v1, v2);
        }

        // 🔹 bounding box fallback
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        const width = box.max.x - box.min.x;
        const height = box.max.y - box.min.y;

        // 🔹 CIRCLE
        if (geo.type === 'CircleGeometry' || geo.type.includes('Circle')) {
            //return planck.Circle((width / 2) / this.scale);
            const radius = geo.parameters.radius; // ✅ pega o raio real
            return planck.Circle(radius / this.scale);
        }

        // 🔹 POLYGON (genérico)
        if (geo.attributes?.position) {
            const vertices = [];
            const pos = geo.attributes.position.array;

            for (let i = 0; i < pos.length; i += 3) {
                vertices.push(planck.Vec2(
                    (pos[i] + mesh.position.x) / this.scale,
                    (pos[i + 1] + mesh.position.y) / this.scale
                ));
            }

            // ⚠️ planck só aceita polígonos convexos
            if (vertices.length >= 3 && vertices.length <= 8) {
                return planck.Polygon(vertices);
            }
        }

        // 🔹 BOX (fallback padrão)
        return planck.Box(
            (width / 2) / this.scale,
            (height / 2) / this.scale
        );
    }

    // -----------------------------------
    // 🔹 ADD BODY (dinâmico)
    // -----------------------------------
    addBody(mesh, options = {}) {
        const opts = { ...this.defaultOptions, ...options };

        const body = this.world.createDynamicBody({
            position: planck.Vec2(
                mesh.position.x / this.scale,
                mesh.position.y / this.scale
            )
        });
        const shape = this.createShapeFromMesh(mesh);
        body.createFixture(shape, opts);
        this.bodies.push({ mesh, body });
        return body;
    }

    remove(targetBody) {
        const index = this.bodies.findIndex(obj => obj.body === targetBody);
        if (index === -1) return;
        const obj = this.bodies[index];
        // remove do mundo físico
        this.world.destroyBody(obj.body);
        // remove da cena (Three.js)
        if (obj.mesh && obj.mesh.parent) {
            obj.mesh.parent.remove(obj.mesh);
        }
        // remove do array
        this.bodies.splice(index, 1);
    }

    removeBody(body) {
        const parts = Object.values(this.getParts(body));
        parts.forEach(part => {
            this.remove(part);
        });
    }

    removeByMesh(mesh) {
        const index = this.bodies.findIndex(obj => obj.mesh === mesh);
        if (index === -1) return;
        const obj = this.bodies[index];
        this.removeBody(obj.body);
    }

    addBodyWheel(group, options = {}) {
        const opts = { ...this.defaultOptions, ...options };

        const body = this.world.createDynamicBody({
            position: planck.Vec2(
                group.position.x / this.scale,
                group.position.y / this.scale
            )
        });

        group.updateWorldMatrix(true, true);

        let created = false;

        group.traverse((child) => {

            if (!child.isMesh) return;

            const geo = child.geometry;

            // 🔥 DETECTA CIRCLE
            if (geo.type === "CircleGeometry") {

                const radius = geo.parameters.radius;

                const worldPos = new THREE.Vector3();
                child.getWorldPosition(worldPos);

                const localX = (worldPos.x - group.position.x) / this.scale;
                const localY = (worldPos.y - group.position.y) / this.scale;

                const shape = planck.Circle(
                    planck.Vec2(localX, localY),
                    radius / this.scale
                );

                body.createFixture(shape, opts);
                created = true;
            }
        });

        // fallback (caso não ache circle)
        if (!created) {
            console.warn("⚠️ Nenhum CircleGeometry encontrado no wheelGroup");
        }

        this.bodies.push({ mesh: group, body });

        return body;
    }

    addCompoundBody(group, options = {}, dynamic = true) {
        const opts = { ...this.defaultOptions, ...options };
        const body = dynamic
            ? this.world.createDynamicBody({
                position: planck.Vec2(
                    group.position.x / this.scale,
                    group.position.y / this.scale
                )
            })
            : this.world.createBody({
                position: planck.Vec2(
                    group.position.x / this.scale,
                    group.position.y / this.scale
                )
            });

        group.updateWorldMatrix(true, true);

        group.traverse((child) => {

            if (!child.isMesh) return;

            const geo = child.geometry;
            if (!geo.attributes?.position) return;

            const pos = geo.attributes.position.array;

            // posição mundial do mesh
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);

            // -------------------------
            // 🔹 TENTAR POLYGON DIRETO
            // -------------------------
            const vertices = [];

            for (let i = 0; i < pos.length; i += 3) {
                vertices.push(planck.Vec2(
                    (pos[i] + worldPos.x - group.position.x) / this.scale,
                    (pos[i + 1] + worldPos.y - group.position.y) / this.scale
                ));
            }

            try {
                if (vertices.length >= 3 && vertices.length <= 8) {
                    const shape = planck.Polygon(vertices);
                    body.createFixture(shape, opts);
                    return;
                }
            } catch (e) {
                // fallback abaixo
            }

            // -------------------------
            // 🔹 FALLBACK: TRIANGULAR (earcut-like)
            // -------------------------

            for (let i = 0; i < pos.length; i += 9) {

                const tri = [
                    planck.Vec2(
                        (pos[i] + worldPos.x - group.position.x) / this.scale,
                        (pos[i + 1] + worldPos.y - group.position.y) / this.scale
                    ),
                    planck.Vec2(
                        (pos[i + 3] + worldPos.x - group.position.x) / this.scale,
                        (pos[i + 4] + worldPos.y - group.position.y) / this.scale
                    ),
                    planck.Vec2(
                        (pos[i + 6] + worldPos.x - group.position.x) / this.scale,
                        (pos[i + 7] + worldPos.y - group.position.y) / this.scale
                    )
                ];

                try {
                    const shape = planck.Polygon(tri);
                    body.createFixture(shape, opts);
                } catch (e) {
                    // ignora tri inválido
                }
            }

        });

        this.bodies.push({ mesh: group, body });

        return body;
    }

    teleportCar(car, x, y, angle = 0) {

        const chassisBody = car.body;

        // 🔹 pega posição atual do chassis (mundo físico)
        const basePos = chassisBody.getPosition();

        // 🔹 calcula offset das rodas em relação ao chassis
        const leftOffset = car.left.body.getPosition().clone().sub(basePos);
        const rightOffset = car.right.body.getPosition().clone().sub(basePos);

        const newPos = planck.Vec2(x / this.scale, y / this.scale);

        // 🔥 CHASSIS
        chassisBody.setLinearVelocity(planck.Vec2(0, 0));
        chassisBody.setAngularVelocity(0);
        chassisBody.setTransform(newPos, angle);
        chassisBody.setAwake(true);

        // 🔥 RODA ESQUERDA
        const leftPos = newPos.clone().add(leftOffset);
        const leftBody = car.left.body;

        leftBody.setLinearVelocity(planck.Vec2(0, 0));
        leftBody.setAngularVelocity(0);
        leftBody.setTransform(leftPos, angle);
        leftBody.setAwake(true);

        // 🔥 RODA DIREITA
        const rightPos = newPos.clone().add(rightOffset);
        const rightBody = car.right.body;

        rightBody.setLinearVelocity(planck.Vec2(0, 0));
        rightBody.setAngularVelocity(0);
        rightBody.setTransform(rightPos, angle);
        rightBody.setAwake(true);
    }


    // -----------------------------------
    // 🔹 ADD GROUND (estático)
    // -----------------------------------
    addGround(mesh, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const body = this.world.createBody({
            position: planck.Vec2(
                mesh.position.x / this.scale,
                mesh.position.y / this.scale
            )
        });
        const shape = this.createShapeFromMesh(mesh);
        body.createFixture(shape, opts);
        return body;
    }

    // -----------------------------------
    // 🔹 UPDATE
    // -----------------------------------
    update(delta = 1 / 60) {
        if (!this.enabled || this.forcePause) return;

        this.world.step(delta);

        for (const obj of this.bodies) {

            if (!obj.mesh) continue;

            const body = obj.body;

            if (body._ghost) {
                const parts = Object.values(this.getParts(body));
                // 🔥 verifica se ALGUMA parte ainda está em contato
                const hasContact = parts.some(part => (part._contactCount || 0) > 0);
                // 🔥 se NENHUMA estiver em contato → desativa ghost
                if (!hasContact) {
                    parts.forEach(part => {
                        part._ghost = false;
                    });
                }
            }


            // =========================
            // 🔹 UPDATE NORMAL
            // =========================
            const pos = body.getPosition();
            const angle = body.getAngle();

            obj.mesh.position.set(
                pos.x * this.scale,
                pos.y * this.scale,
                obj.mesh.position.z
            );

            obj.mesh.rotation.z = angle;

            //CAIU NO BURACO
            if (pos.y < -200) {
                if (body.isCar && !body.isWhell && typeof (body._car.onFall) === "function") { //carro com funcao                    
                    body._car.onFall(body._car);
                } else if (body.isCar && !body.isWhell) { //carro sem funcao                    
                    if (typeof (body._car.onFall) === "function") {
                        body._car.onFall(body._car);
                    } else {
                        this.removeBody(body);
                        obj.mesh.position.y = -2000;
                    }
                } else if (!body.isCar) { //objetos                    
                    this.removeBody(body);
                    obj.mesh.position.y = -2000;
                }
            }
        }

    }
}

export default PHISICS;