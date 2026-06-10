import * as THREE from 'three';
import { POSTPROCESS } from 'three/addons/postprocess.js'; //PostProcess Renders
import { AmmoLoader } from 'three/addons/ammo.js'; //Ammo physics engine
import { IPHYSICS } from 'three/addons/physics.js'; //physics render
import { EVENTS } from 'three/addons/events.js'


window.camera = null, window.scene = null, window.renderer = null;
let postprocess = new POSTPROCESS();
let container;
let controls;
let physics;
let rayintersects = [], raycaster = new THREE.Raycaster(), raycasterDisabled = false;
const clock = new THREE.Clock();

await waitAmmo();
EVENTS.create(THREE);
EVENTS.onClick = onClick;

async function waitAmmo() {
  await AmmoLoader();
  while (typeof (Ammo) === _UN || typeof Ammo.ready === _UN) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  physics = new IPHYSICS(THREE);
  init();
}


function isWebGL2Supported() {
  try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');canvas.remove(); 
      return !!(window.WebGL2RenderingContext && context);
  } catch (e) {
      return false;
  }
}

async function init() {
  container = document.getElementById("myContainer");
  renderer = new THREE.WebGL1Renderer({ alpha: false, antialias: false, });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  //renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  container.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  //camera
  camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 1, 20000);
  camera.position.set(0, 40, 30);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();
  await postprocess.createPostProcess();
  if(isWebGL2Supported==true){        
    postprocess.filters.N8AO.enabled=true;
  }
  animate();
  createObjects();

  window.addEventListener('resize', onWindowResize);
}



function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}


const timestep = 1 / 60; // 60 FPS físico
const maxSubSteps = 5;   // Máximo de substeps por frame (evita lag spikes)
let accumulator = 0;
function animate() {
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();    
    const safeDelta = Math.min(deltaTime, 0.1); // no máximo 100ms/frame
    accumulator += safeDelta;    
    let substeps = 0;
    while (accumulator >= timestep && substeps < maxSubSteps) {
        physics.update(timestep);
        detectTouch();
        accumulator -= timestep;
        substeps++;
    }
    postprocess.update(safeDelta, elapsedTime);
    render();
    requestAnimationFrame(animate);
}

//on render scene
function render() {
  postprocess.render(() => { });
  if (raycasterDisabled == false && EVENTS.mousePos != null) {
    raycaster.setFromCamera(EVENTS.mousePos, camera);
  }
}


let touchCount=1;
function detectTouch(){
   //DETECTAR COLISÕES AQUI:
   const dispatcher = physics.physicsWorld.getDispatcher();
   const numManifolds = dispatcher.getNumManifolds();    
   for (let i = 0; i < numManifolds; i++) {
       const contactManifold = dispatcher.getManifoldByIndexInternal(i);
       const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
       const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);                

       const numContacts = contactManifold.getNumContacts();
       if (numContacts > 0) {
           //console.log(rb0)
           scene.traverse((obj) => {
            if (obj && obj.userData && obj.userData.piece==true &&obj.userData.physicsBody && obj.userData.physicsBody.kB)
                if (obj.userData.physicsBody.kB == rb0.kB && obj.layers.mask==1){
                  obj.layers.toggle(10);
                  touchCount++;
                  if(touchCount>1 && touchCount < 100){
                    touchCount=200;
                    animateCameraToTop(8000);
                  }
                }
            });

       }
   }
}

function onClick(mouseButtons) {
  if (mouseButtons.left != 1) return;
  raycaster.layers.set(0);
  rayintersects = raycaster.intersectObjects(scene.children, true);
  if(rayintersects.length==0)return;
  var intercept = rayintersects[0];
  var object=intercept.object;
  if(object.userData && object.userData.piece && object.userData.physicsBody){
        if(touchCount > 100)return;
        if(object.layers.mask==1)object.layers.toggle(10);        
        const body = object.userData.physicsBody;        
        const forceDirection = new THREE.Vector3();
        forceDirection.copy(raycaster.ray.direction).normalize();
        const forceMagnitude = 14;
        const force = physics._v1;
        force.setValue(
            forceDirection.x * forceMagnitude,
            forceDirection.y * forceMagnitude,
            forceDirection.z * forceMagnitude
        );        
        const hitPoint = intercept.point;
        // Posição do corpo
        const transform = physics.transformAux2;
        body.getMotionState().getWorldTransform(transform);
        const origin = transform.getOrigin();
        const bodyPosition = new THREE.Vector3(origin.x(), origin.y(), origin.z());
        // Calcula o vetor relativo do ponto de impacto em relação ao centro do corpo
        const relPos = new THREE.Vector3();
        relPos.subVectors(hitPoint, bodyPosition);
        const relPosAmmo = physics._v2;
        relPosAmmo.setValue(relPos.x, relPos.y, relPos.z);
        // Aplica impulso no ponto específico
        body.applyImpulse(force, relPosAmmo);
        // Libera memória temporária do Ammo        
  }      
}

function createObjects() {
  var light2 = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.5);
  scene.add(light2);

  const material1 = new THREE.MeshPhongMaterial({ color: 0x777777 });


  const plane = new THREE.Mesh(new THREE.BoxGeometry(800, 1, 800), material1);
  //plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);
  physics.createObj(plane, "box", "wall", null, 0);


 
  createDominoSpiralColored({
    turns: 5,
    piecesPerTurn: 12,
    spacing: 14, // mais espaçado
    minRadius:14,
    direction:-1,
    startAngle:30,
    position: { x: 0, y: 0, z: 0 },       
  });

  camera.position.set(0, 60, 100);
  controls.enabled=false;
}


function animateCameraToTop(duration = 2000) {
  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(0, 200, 0);
  
  const startTime = performance.now();

  function canimate() {
    const now = performance.now();
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1); // Normaliza (0 a 1)

    // Interpolação suave (ease in/out)
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    camera.position.lerpVectors(startPos, endPos, ease);

    // Mantém olhando para 0,0,0
    controls.target.set(0, 0, 0);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(canimate);
    }
  }

  canimate();
}


function createDominoSpiralColored({
  turns = 5,
  spacing = 14,
  minRadius = 14,
  direction = 1,
  startAngle = 0,
  position = { x: 0, y: 0, z: 0 },
}) {
  const dominoWidth = 3;
  const dominoHeight = 20;
  const dominoDepth = 10;

  const totalAngle = turns * Math.PI * 2;
  const radiusStepPerRadian = spacing / (2 * Math.PI);
  let angle = 0;

  // Cache para materiais já criados com mesma cor na face direita
  const materialMap = new Map();

  // Função para gerar cor no arco-íris
  function randomRainbowColor() {
    const hue = Math.floor(Math.random() * 360); // 0 a 359 graus
    const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
    return color.getHex();
  }

  while (angle < totalAngle) {
    const radius = minRadius + radiusStepPerRadian * angle;
    const currentAngle = angle * direction + startAngle;

    const x = position.x + Math.cos(currentAngle) * radius;
    const z = position.z + Math.sin(currentAngle) * radius;
    const y = position.y + dominoHeight / 2;

    // Gera cor para a face direita
    const colorHex = randomRainbowColor();

    let materials;
    if (materialMap.has(colorHex)) {
      materials = materialMap.get(colorHex);
    } else {
      materials = [
        new THREE.MeshStandardMaterial({ color: colorHex }), // front
        new THREE.MeshStandardMaterial({ color: colorHex }), // back
        new THREE.MeshStandardMaterial({ color: 0x777777 }), // top
        new THREE.MeshStandardMaterial({ color: 0x777777 }), // bottom
        new THREE.MeshStandardMaterial({ color: 0x777777 }), // 
        new THREE.MeshStandardMaterial({ color: 0x777777 }), // 
      ];
      materialMap.set(colorHex, materials);
    }

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth),
      materials
    );

    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set(x, y, z);
    box.rotation.y = -currentAngle + Math.PI / 2;

    scene.add(box);
    physics.createObj(box, "box", "obj", null, 2);
    box.userData.piece = true;

    const deltaAngle = spacing / radius;
    angle += deltaAngle;
  }
}






