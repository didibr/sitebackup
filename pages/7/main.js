/*
https://jrouwe.github.io/JoltPhysics.js/
https://opengameart.org/content/cute-platformer-sisters
*/
import initJolt from "./jolt.js";
let imageCat="https://didisoftwares.ddns.net/7/cat.png";
let imageB1="https://didisoftwares.ddns.net/7/img/block_black.png";
let imageB2="https://didisoftwares.ddns.net/7/img/block_brow.png";
let imageB3="https://didisoftwares.ddns.net/7/img/block_gray.png";
let imageB4="https://didisoftwares.ddns.net/7/img/block_yellow.png";
let jolt, settings, physicsSystem, bodyInterface;
const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_OBJECT_LAYERS = 2;
const PHYSICS_SCALE = 20;
let lastTime = performance.now();
let catBody, cat;
let isGrounded = false;
let isGroundedTimed = null;
let input = {
    left: false,
    right: false,
    space: false,
    e: false
};

let debug = false;
let objects = [];
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let cameraX = 0;
let cameraY = 0;



initJolt().then((Jolt) => {
    window.Jolt = Jolt;
    settings = new Jolt.JoltSettings();
    settings.mMaxWorkerThreads = 3; // Limit the number of worker threads to 3 (for a total of 4 threads working on the simulation). Note that this value will always be clamped against the number of CPUs in the system - 1.
    setupCollisionFiltering(settings);
    jolt = new Jolt.JoltInterface(settings);
    Jolt.destroy(settings);
    physicsSystem = jolt.GetPhysicsSystem();
    physicsSystem.SetGravity(new Jolt.Vec3(0, -4.0, 0));
    bodyInterface = physicsSystem.GetBodyInterface();
    //initialize    
    resizeCanvas();
    drawObjects();
    animate();
});


let setupCollisionFiltering = function (settings) {
    // Layer that objects can be in, determines which other objects it can collide with
    // Typically you at least want to have 1 layer for moving bodies and 1 layer for static bodies, but you can have more
    // layers if you want. E.g. you could have a layer for high detail collision (which is not used by the physics simulation
    // but only if you do collision testing).
    let objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

    // Each broadphase layer results in a separate bounding volume tree in the broad phase. You at least want to have
    // a layer for non-moving and moving objects to avoid having to update a tree full of static objects every frame.
    // You can have a 1-on-1 mapping between object layers and broadphase layers (like in this case) but if you have
    // many object layers you'll be creating many broad phase trees, which is not efficient.
    const BP_LAYER_NON_MOVING = new Jolt.BroadPhaseLayer(0);
    const BP_LAYER_MOVING = new Jolt.BroadPhaseLayer(1);
    const NUM_BROAD_PHASE_LAYERS = 2;
    let bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(NUM_OBJECT_LAYERS, NUM_BROAD_PHASE_LAYERS);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_NON_MOVING);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING);

    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectVsBroadPhaseLayerFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(settings.mBroadPhaseLayerInterface, NUM_BROAD_PHASE_LAYERS, settings.mObjectLayerPairFilter, NUM_OBJECT_LAYERS);
};


function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    redrawAll();
}


function animate() {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    var numSteps = deltaTime > 1.0 / 55.0 ? 2 : 1;
    //jolt.Step(deltaTime, deltaTime > 1 / 30 ? 2 : 1);
    jolt.Step(deltaTime, numSteps);
    // Atualizar a posição da câmera
    if (catBody) {
        const body = Jolt.castObject(catBody, Jolt.Body);
        const pos = body.GetPosition();
        const SCALE = Math.min(canvas.width, canvas.height);

        // Posição do gato no mundo
        const catX = (pos.GetX() / PHYSICS_SCALE) * SCALE;
        const catY = canvas.height - (pos.GetY() / PHYSICS_SCALE) * SCALE;

        // Centraliza o gato no meio do canvas
        const targetX = catX - canvas.width / 2;
        const targetY = catY - canvas.height / 2;

        // Interpolação suave (seguimento fluido)
        const lerp = 0.1;
        cameraX += (targetX - cameraX) * lerp;
        cameraY += (targetY - cameraY) * lerp;
    }
    redrawAll();
    gameLoop();
    requestAnimationFrame(animate);
}

function worldWidth() {
    return canvas.width / Math.min(canvas.width, canvas.height);
}

function worldHeight() {
    return canvas.height / Math.min(canvas.width, canvas.height);
}


function redrawAll() {
    const SCALE = Math.min(canvas.width, canvas.height);
    if (debug) {
        ctx.fillStyle = "#0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
    }

    for (const obj of objects) {
        const body = Jolt.castObject(obj.body, Jolt.Body);
        const pos = body.GetPosition();
        const rot = body.GetRotation();
        const angle = 2 * Math.acos(rot.GetW()) * (rot.GetZ() < 0 ? -1 : 1);

        const x = (pos.GetX() / PHYSICS_SCALE) * SCALE;
        const y = canvas.height - (pos.GetY() / PHYSICS_SCALE) * SCALE;
        const w = Math.round(obj.size.w * SCALE);
        const h = Math.round(obj.size.h * SCALE);

        if (debug) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-angle);
            ctx.fillStyle = obj.color;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.restore();
        }

        // Atualiza o elemento HTML se existir
        if (obj.htmlElement) {
            const screenX = Math.round(x - cameraX);
            const screenY = Math.round(y - cameraY);

            obj.htmlElement.style.position = 'absolute';
            // Ajuste para posicionar o centro do elemento no centro da caixa            
            //if (obj.name == "cat") {
            //    obj.htmlElement.style.left = `${(screenX - (w / 2)) - 10}px`;
            //    obj.htmlElement.style.top = `${(screenY - (h / 2)) - 4}px`;
            //} else {
                obj.htmlElement.style.left = `${(screenX - (w / 2) + 5)}px`;
                obj.htmlElement.style.top = `${(screenY - (h / 2)) + 2}px`;
                obj.htmlElement.style.width = `${w}px`;
                obj.htmlElement.style.height = `${h}px`;
            //}
            // Rotaciona o elemento HTML para acompanhar a caixa
            obj.htmlElement.style.transform = `rotate(${-angle}rad)`;
            obj.htmlElement.style.transformOrigin = 'center center';
        }
    }

    if (debug) ctx.restore()
}






function addBox({ name, position, size, color, stat, rotationDeg = 0, mass = 1, htmlElement = null }) {
    let MY_LAYER = LAYER_NON_MOVING;
    let motionType = Jolt.EMotionType_Static;
    if (!stat) {
        motionType = Jolt.EMotionType_Dynamic;
        MY_LAYER = LAYER_MOVING;
    }
    const bodyPosition = new Jolt.RVec3(
        (position.x + size.w / 2) * PHYSICS_SCALE,
        (position.y + size.h / 2) * PHYSICS_SCALE,
        0
    );
    const angle = rotationDeg * Math.PI / 180;
    const bodyRotation = new Jolt.Quat(0, 0, Math.sin(angle / 2), Math.cos(angle / 2));

    const shape = new Jolt.BoxShape(
        new Jolt.Vec3((size.w / 2) * PHYSICS_SCALE, (size.h / 2) * PHYSICS_SCALE, 1),
        0.05,
        null
    );
    const creationSettings = new Jolt.BodyCreationSettings(shape, bodyPosition, bodyRotation, motionType, MY_LAYER);
    if (!stat) {
        creationSettings.mOverrideMass = mass;
        creationSettings.mMotionQuality = Jolt.EMotionQuality_LinearCast;
    }
    if (name == "cat") {
        creationSettings.mAngularDamping = 10; //cat rotation slow
        //creationSettings.mFriction = 4;
    } else {
        creationSettings.mFriction = 0.8;
    }

    const body = bodyInterface.CreateBody(creationSettings);
    Jolt.destroy(creationSettings);

    bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);

    objects.push({ name, position: { ...position }, size: { ...size }, color, body, htmlElement });
}


function CatGifCanvasController(options) {
    const {
        canvasId,
        imageUrl,
        frameWidth = 400,
        frameHeight = 200,
        columns = [
            { index: 0, frames: 12 },
            { index: 1, frames: 6 },
            { index: 2, frames: 12 },
            { index: 3, frames: 3 }
        ],
        initialColumn = 0,
        speed = 100, // ms por frame
        zoom = 1,
        backgroundColor = 'rgba(0,0,0,0)'
    } = options;
    let pauseAtEnd = false;
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas não encontrado:', canvasId);
        return;
    }
    const ctx = canvas.getContext('2d');
    let img = new Image();
    img.src = imageUrl;

    // Ajusta canvas para tamanho do frame * zoom
    function resizeCanvas() {
        canvas.width = frameWidth * zoom;
        canvas.height = frameHeight * zoom;
    }
    resizeCanvas();

    let columnIndex = initialColumn;
    let frameIndex = 0;
    let lastTime = 0;
    let frameDuration = speed;
    let running = false;
    let direction = 'right'; // 'left' ou 'right'

    function drawFrame() {
        if (!img.complete) return; // espera imagem carregar

        // Fundo com background color
        ctx.fillStyle = backgroundColor;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (backgroundColor !== 'rgba(0,0,0,0)') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const col = columns[columnIndex];
        const sx = col.index * frameWidth;
        const sy = frameIndex * frameHeight;

        ctx.save();

        // Espelha horizontalmente se direction == 'left'
        if (direction === 'left') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(
            img,
            sx, sy, frameWidth, frameHeight, // fonte
            0, 0, frameWidth * zoom, frameHeight * zoom // destino no canvas
        );

        ctx.restore();
    }

    function update(timestamp) {
        if (!running) return;

        const col = columns[columnIndex];

        if (timestamp - lastTime >= frameDuration) {
            if (pauseAtEnd && frameIndex === col.frames - 1) {
                stop();
                drawFrame();
                return;
            }

            frameIndex = (frameIndex + 1) % col.frames;
            lastTime = timestamp;
        }

        drawFrame();

        requestAnimationFrame(update);
    }

    function start() {
        if (!running) {
            running = true;
            lastTime = performance.now();
            requestAnimationFrame(update);
        }
    }

    function stop() {
        running = false;
    }

    function setColumn(index) {
        if (columnIndex == index) return;
        if (index >= 0 && index < columns.length) {
            var previuspaused = (columnIndex == 1 && index == 3) || (columnIndex == 3 && index == 1);
            columnIndex = index;
            frameIndex = 0;
            pauseAtEnd = (index === 1 || index === 3);
            if (previuspaused || (!pauseAtEnd && !running)) {
                start();  // reinicia a animação se não for a coluna que pausa
            }
        }
    }

    function setSpeed(ms) {
        frameDuration = ms;
    }

    function setZoom(z) {
        zoom = z;
        resizeCanvas();
    }

    function setBackgroundColor(rgba) {
        backgroundColor = rgba;
    }

    function setDirection(dir) {
        if (direction == dir) return;
        if (dir === 'left' || dir === 'right') {
            direction = dir;
        }
    }

    function index() {
        return columnIndex;
    }

    img.onload = () => {
        drawFrame();
    };

    return {
        start,
        stop,
        setColumn,
        setSpeed,
        setZoom,
        setBackgroundColor,
        setDirection,
        index
    };
}



function criarImagem(src) {    
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.pointerEvents = 'none';
    div.style.backgroundImage = `url('${src}')`;
    div.style.backgroundRepeat = 'repeat';
    div.style.backgroundSize = 'contain'; // ou 'auto' dependendo do efeito
    div.style.width = '20px';  // será redimensionado depois
    div.style.height = '20px';

    const container = canvas.parentElement;
    if (container) {
        container.style.position = 'relative';
        container.prepend(div);
    }
    return div;
}




function drawObjects() {
    cat = CatGifCanvasController({
        canvasId: 'cat-canvas',
        imageUrl: imageCat,
        frameWidth: 400,
        frameHeight: 200,
        speed: 100,
        zoom: 0.3,
        backgroundColor: 'rgba(0,0,0,0)'
        //cat.setSpeed(80);                 // Acelera
        //cat.setZoom(0.3);                 // Aplica zoom
        //cat.setBackgroundColor('rgba(0,0,0,0.5)');  // Altera fundo
    });
    cat.start();
    cat.setColumn(1);                 // Muda para a coluna 1  
    cat.setSpeed(100);
    //Ground
    addBox({
        name: "ground",
        position: { x: 0, y: 0 }, // y=0 significa "na base"
        size: { w: worldWidth() * 2, h: worldHeight() * 0.1 },    // worldWidth() significa 100% da largura do canvas - worldHeight() = 100 altura
        color: "#00f",
        stat: true,
        htmlElement: criarImagem(imageB1)
    });

    addBox({
        name: "block0",
        position: { x: 2.1, y: 0.6 },
        size: { w: 0.20, h: 0.2 },
        color: "#ff0",
        rotationDeg: 0,
        stat: true,
        htmlElement: criarImagem(imageB2)
    });

    addBox({
        name: "cat",
        position: { x: 0.9, y: 0.6 },
        size: { w: 0.35, h: 0.2 },
        color: "#00000000",
        rotationDeg: 0,
        mass: 2.2,
        stat: false,
        htmlElement: document.getElementById('cat-canvas')
    });

    addBox({
        name: "block1",
        position: { x: 1.8, y: 0.4 },
        size: { w: 0.20, h: 0.2 },
        color: "#ff0",
        rotationDeg: 0,
        mass: 4,
        stat: false,
        htmlElement: criarImagem(imageB3)
    });

    addBox({
        name: "block2",
        position: { x: 1.6, y: 0.2 },
        size: { w: 0.60, h: 0.2 },
        color: "#ff0",
        rotationDeg: 0,
        mass: 4,
        stat: false,
        htmlElement: criarImagem(imageB4)
    });
}


function keyDown(e) {
    if (e.key === "ArrowLeft" || e.key === "a") input.left = true;
    if (e.key === "ArrowRight" || e.key === "d") input.right = true;
    if (e.code === "Space") input.space = true;
    if (e.key.toLowerCase() === "e") input.e = true;
}

function keyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a") input.left = false;
    if (e.key === "ArrowRight" || e.key === "d") input.right = false;
    if (e.code === "Space") input.space = false;
    if (e.key.toLowerCase() === "e") input.e = false;
}





function gameLoop() {
    if (!catBody || !cat) return;
    const jumpStrength = 7;
    const moveBoost = 10;
    const speed = 5;
    const body = Jolt.castObject(catBody, Jolt.Body);
    const velocity = body.GetLinearVelocity();
    let vx = 0;


    if (input.left) vx -= speed;
    if (input.right) vx += speed;

    if (vx !== 0 || input.space) {
        bodyInterface.ActivateBody(body.GetID());
    }

    // Aplica velocidade no plano XY
    body.SetLinearVelocity(new Jolt.Vec3(vx, velocity.GetY(), 0));

    // Atualiza sprite
    if (vx > 0) cat.setDirection('left');
    else if (vx < 0) cat.setDirection('right');

    if (vx !== 0) {
        if (cat.index() !== 0 && isGrounded) cat.setColumn(0);
    } else {
        if (cat.index() !== 1 && isGrounded) cat.setColumn(1);
    }

    // Pular se estiver no chão
    if (input.space && isGrounded) {
        let vy = jumpStrength;

        if (input.left) vx -= moveBoost;
        if (input.right) vx += moveBoost;

        if (cat.index() !== 3) cat.setColumn(3);
        body.SetLinearVelocity(new Jolt.Vec3(vx, vy, 0));
        input.space = false;
        isGrounded = false;
        isGroundedTimed = setTimeout(() => { clearTimeout(isGroundedTimed); isGroundedTimed = null; }, 1000)
    }

    // Detectar se está no chão com base na velocidade Y
    if (!isGrounded && isGroundedTimed == null && Math.abs(velocity.GetY()) < 0.01) {
        isGrounded = true;
        if (cat.index() !== 0) cat.setColumn(0);
    }
}


setTimeout(() => {
    catBody = objects.find(obj => obj.name === "cat").body;
}, 2000);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);