/*
https://jrouwe.github.io/JoltPhysics.js/
*/
import initJolt from "./jolt.js";
let jolt, settings, physicsSystem, bodyInterface;
const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_OBJECT_LAYERS = 2;
const PHYSICS_SCALE = 10;
let objects = [];
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
//
let lastTime = performance.now();
//
let currentWord = "";
let currentObj = null;
let currentPosition = null;

// Initialize Jolt and setup the physics system
initJolt().then((Jolt) => {
  window.Jolt = Jolt;
  settings = new Jolt.JoltSettings();
  settings.mMaxWorkerThreads = 3;
  setupCollisionFiltering(settings);
  jolt = new Jolt.JoltInterface(settings);
  Jolt.destroy(settings);
  physicsSystem = jolt.GetPhysicsSystem();
  physicsSystem.SetGravity(new Jolt.Vec3(0, -4.0, 0));
  bodyInterface = physicsSystem.GetBodyInterface();
  resizeCanvas();
  drawObjects();
  animate();
});

// Setup collision filters between object layers
let setupCollisionFiltering = function (settings) {
  let objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
  objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
  objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);
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

function updateFloatingLabelFontSize() {
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;
  const canvasWidth = canvas.clientWidth;
  const fontSize = canvasWidth * 0.030 + 'px'; // 5% da largura
  // Itera pelas folhas de estilo ativas
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === '.floating-label') {
          rule.style.fontSize = fontSize;
          return; // Sai após encontrar e mudar a regra
        }
      }
    } catch (e) {
      // Algumas folhas (como as de outros domínios) podem causar erros de segurança
      continue;
    }
  }
}

// Resize the canvas and redraw all elements
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  updateFloatingLabelFontSize();
  redrawAll();
}

// Remove bodies that fall below the screen
function cleanupFallenObjects() {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    const body = Jolt.castObject(obj.body, Jolt.Body);
    const pos = body.GetPosition();
    if (pos.GetY() < 0) {
      bodyInterface.RemoveBody(obj.body.GetID());
      if (obj.labelElement) {
        obj.labelElement.remove();
      }
      objects.splice(i, 1);
    }
  }
}

// Animate the physics simulation and redraw each frame
function animate() {
  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  jolt.Step(deltaTime, deltaTime > 1 / 30 ? 2 : 1);
  cleanupFallenObjects();
  redrawAll();
  requestAnimationFrame(animate);
}

// Return the world width in normalized units
function worldWidth() {
  return canvas.width / Math.min(canvas.width, canvas.height);
}

// Return the world height in normalized units
function worldHeight() {
  return canvas.height / Math.min(canvas.width, canvas.height);
}

// Redraw all objects on the screen using canvas and labels
function redrawAll() {
  const SCALE = Math.min(canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff00";
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
    if (obj.labelElement) {
      obj.labelElement.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${(-angle).toFixed(3)}rad)`;
    }
  }
}

// Create and attach a floating label to a box object
function addLabelToBox(obj, text) {
  const container = document.getElementById("myContainer");
  const div = document.createElement("div");
  div.className = "floating-label";
  div.innerText = text;
  container.prepend(div);
  obj.labelElement = div;
}

// Add a new box to the physics world and store it in the object list
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
  var obj = objects[objects.length - 1];
  if (name !== "ground") {
    addLabelToBox(obj, name);
  }
  return obj;
}

// Return a random float between min and max
function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Update the currently typed word box (static preview)
function updateTypingBox() {
  if (currentObj && currentObj.body) {
    const idx = objects.findIndex(o => o.body.GetID().GetIndex() === currentObj.body.GetID().GetIndex());
    if (idx !== -1) {
      bodyInterface.RemoveBody(objects[idx].body.GetID());
      if (objects[idx].labelElement) {
        objects[idx].labelElement.remove();
      }
      objects.splice(idx, 1);
    }
  }
  if (currentWord.length === 0) {
    currentObj = null;
    return;
  }
  const width = 0.08 * currentWord.length;
  const obj = addBox({
    name: currentWord,
    position: currentPosition,
    size: { w: width, h: 0.08 },
    color: "#00000000",
    stat: true
  });
  currentObj = {
    body: obj.body
  };
}

function getRandomLightColor() {
  const channels = [0, 0, 0];
  // Decide aleatoriamente entre 1 ou 2 canais fortes
  const numBright = Math.random() < 0.5 ? 1 : 2;
  // Embaralha os índices (0: R, 1: G, 2: B)
  const indices = [0, 1, 2].sort(() => Math.random() - 0.5);
  // Define os canais brilhantes
  for (let i = 0; i < numBright; i++) {
    channels[indices[i]] = 100 + Math.floor(Math.random() * 56); // 200–255
  }
  // Os canais restantes recebem valores baixos
  for (let i = numBright; i < 3; i++) {
    channels[indices[i]] = Math.floor(Math.random() * 10); // 0–49
  }
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

// Create initial objects and handle typing and key input events
function drawObjects() {
  addBox({
    name: "ground",
    position: { x: 0, y: 0 },
    size: { w: worldWidth(), h: worldHeight() * 0.1 },
    color: "#000",
    stat: true
  });
  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (key.length === 1 && key.match(/[a-zA-Z]/)) {
      currentWord += key.toUpperCase();
      if (!currentPosition) {
        currentPosition = {
          x: getRandomInRange(
            worldWidth() * 0.2, worldWidth() * 0.8),
          y: getRandomInRange(
            worldHeight()*0.4, worldHeight()*0.98)
        };
      }
      updateTypingBox();
    }
    if (key === "Backspace") {
      if (currentWord.length > 0) {
        currentWord = currentWord.slice(0, -1);
        updateTypingBox();
      }
    }
    if ((key === " " || key === "Enter") && currentWord.length > 0) {
      if (currentObj && currentObj.body) {
        const idx = objects.findIndex(o => o.body.GetID().GetIndex() === currentObj.body.GetID().GetIndex());
        if (idx !== -1) {
          bodyInterface.RemoveBody(objects[idx].body.GetID());
          if (objects[idx].labelElement) {
            objects[idx].labelElement.remove();
          }
          objects.splice(idx, 1);
        }
      }
      const newBox = addBox({
        name: currentWord,
        position: currentPosition,
        size: { w: 0.06 * currentWord.length, h: 0.08 },
        color: "#00000000",
        stat: false,
        mass: 0.2
      });
      newBox.labelElement.style.color=getRandomLightColor();
      const side = Math.random() < 0.5 ? -1 : 1;
      const impulse = 10 * currentWord.length;      
      bodyInterface.AddImpulse(
        newBox.body.GetID(),
        new Jolt.Vec3(0, impulse*side, 0),
        new Jolt.Vec3(0, 0, 0)
      );
      currentWord = "";
      currentObj = null;
      currentPosition = null;
    }
  });
}

// Handle canvas resizing to match window size
window.addEventListener("resize", resizeCanvas);
