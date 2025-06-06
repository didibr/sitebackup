/*
https://jrouwe.github.io/JoltPhysics.js/
*/
import initJolt from "./jolt.js";

let jolt,settings, physicsSystem, bodyInterface;
const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_OBJECT_LAYERS = 2;
const PHYSICS_SCALE = 10;


let objects = [];
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");


initJolt().then((Jolt) => {
    // A variável 'jolt' agora é a instância criada    
    window.Jolt = Jolt;       
    // Initialize Jolt    
	settings = new Jolt.JoltSettings();
	settings.mMaxWorkerThreads = 3; // Limit the number of worker threads to 3 (for a total of 4 threads working on the simulation). Note that this value will always be clamped against the number of CPUs in the system - 1.
	setupCollisionFiltering(settings);
	jolt = new Jolt.JoltInterface(settings);
	Jolt.destroy(settings);
    physicsSystem = jolt.GetPhysicsSystem();
    physicsSystem.SetGravity(new Jolt.Vec3(0, -4.0, 0));
	bodyInterface = physicsSystem.GetBodyInterface();
        
    // Redimensiona canvas e começa    
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


let lastTime = performance.now();

function animate() {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    jolt.Step(deltaTime, deltaTime > 1 / 30 ? 2 : 1);
    redrawAll();
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
    ctx.fillStyle = "#0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const obj of objects) {
        const body = Jolt.castObject(obj.body, Jolt.Body);
        const pos = body.GetPosition();
        const rot = body.GetRotation();
        const angle = 2 * Math.acos(rot.GetW()) * (rot.GetZ() < 0 ? -1 : 1);

        const x = (pos.GetX() / PHYSICS_SCALE) * SCALE;
        const y = canvas.height - (pos.GetY() / PHYSICS_SCALE) * SCALE;
        const w = obj.size.w * SCALE;
        const h = obj.size.h * SCALE;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-angle);
        ctx.fillStyle = obj.color;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
    }
}





function addBox({ name, position, size, color, stat, rotationDeg = 0, mass = 1 }) {
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
    if (!stat) creationSettings.mOverrideMass = mass;

    const body = bodyInterface.CreateBody(creationSettings);
    Jolt.destroy(creationSettings);

    bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);

    objects.push({ name, position: { ...position }, size: { ...size }, color, body });
}





function drawObjects() {
    //Ground
    addBox({
        name:"ground",
        position: { x: 0, y: 0 }, // y=0 significa "na base"
        size: { w: worldWidth(), h: worldHeight()*0.1 },    // worldWidth() significa 100% da largura do canvas - worldHeight() = 100 altura
        color: "#00f",
        stat:true
    });

    addBox({
        name:"red",
        position: { x: 0.9, y: 1 }, 
        size: { w: 0.1, h: 0.1 },   
        color: "#f00",
        rotationDeg: 42,
        mass:0.2,
        stat:false
    });
}



window.addEventListener("resize", resizeCanvas);




