import * as THREE from 'three';
import { POSTPROCESS } from 'three/addons/postprocess.js';
//import { AmmoLoader } from 'three/addons/ammo.js';
//import { IPHYSICS } from 'three/addons/physics.js';
import { EVENTS } from 'three/addons/events.js'
import { Terrain } from './terrain/terrain.js'

window.camera = null, window.scene = null, window.renderer = null;
let postprocess = new POSTPROCESS();
let container;
let controls;
let physics;
let rayintersects = [], raycaster = new THREE.Raycaster(), raycasterDisabled = false;
const clock = new THREE.Clock();
const timestep = 1 / 60;
const maxSubSteps = 5;
let accumulator = 0;
let terrain;
//await waitAmmo();
/*async function waitAmmo() {
  await AmmoLoader();
  while (typeof (Ammo) === _UN || typeof Ammo.ready === _UN) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  physics = new IPHYSICS(THREE);
  init();
  EVENTS.create(THREE);
  EVENTS.onClick = onClick;  
}*/

init();
  EVENTS.create(THREE);
  EVENTS.onClick = onClick;  

function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2'); canvas.remove();
    return !!(window.WebGL2RenderingContext && context);
  } catch (e) {
    return false;
  }
}

async function init() {
  container = document.getElementById("myContainer");
  renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;//(fast)THREE.BasicShadowMap;//(mediun)THREE.PCFShadowMap//(slow)THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  container.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 1, 20000);
  camera.position.set(0, 40, 30);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();
  await postprocess.createPostProcess();
  if (isWebGL2Supported == true) {
    postprocess.filters.N8AO.enabled = false;
  }
  postprocess.filters.SMAA.enabled = true;
  animate();
  createObjects();
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  const safeDelta = Math.min(deltaTime, 0.1);
  accumulator += safeDelta;
  let substeps = 0;
  if(physics && physics.update){
  while (accumulator >= timestep && substeps < maxSubSteps) {
    physics.update(timestep);
    accumulator -= timestep;
    substeps++;
  }}
  postprocess.update(safeDelta, elapsedTime);
  render();
  requestAnimationFrame(animate);
}

function render() {
  if (terrain) {
    terrain.update();
    updateCamera();
  }
  postprocess.render(() => { });
  if (raycasterDisabled == false && EVENTS.mousePos != null) {
    raycaster.setFromCamera(EVENTS.mousePos, camera);
  }
}


function onClick(mouseButtons) {
  return;//disabled
  if (mouseButtons.left != 1) return;
  raycaster.layers.set(0);
  rayintersects = raycaster.intersectObjects(scene.children, true);
  if (rayintersects.length == 0) return;
  var intercept = rayintersects[0];
  var object = intercept.object;
}



function createObjects() {
  terrain = new Terrain(scene, camera, {
    chunkSize: 160,
    chunkResolution: 50,
    renderDistance: 2,
    noiseScale: 0.008,
    noiseAmplitude: 10,
  });
  //terrain.setTextureScale('rock',0.3);
  camera.position.set(0, 20, 40);
  controls.target.set(0, 10, 0); //look up
  controls.update();
  camera.rotation.set(0,0,0);
  controls.enabled = false; //disable camera updates   
  terrain.setSunPositionByHour(40); //set sun position
  navigator.wakeLock.request('screen'); //no lost focus    
  window.T = terrain;
}

let angleY = 0;
let lastpoint=new THREE.Vector2();
function updateCamera() {
  if (!terrain || !camera || !camera.position) return;

  const speed=0.3;
  if(EVENTS._keyMap['KeyA'])angleY+=0.02 * speed;  
  if(EVENTS._keyMap['KeyD'])angleY-=0.02 * speed; 
  const dx = Math.sin(angleY) * speed;
  const dz = Math.cos(angleY) * speed;  
  camera.position.x -= dx;
  camera.position.z -= dz; // trocado para "+", pois Z em Three.js cresce pra trás  
  camera.rotation.y = angleY;

  const posX = camera.position.x;
  const posZ = camera.position.z;
  if(lastpoint.distanceTo(new THREE.Vector2(posX,posZ))> 0.2){
    lastpoint.set(posX,posZ);
    const groundY = terrain.getHeightInterpolatedWithMods(posX, posZ);
    camera.position.y = groundY + 3;  
  }  
}



