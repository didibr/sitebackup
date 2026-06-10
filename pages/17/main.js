import * as THREE from 'three/addons/module.js';
import { POSTPROCESS } from 'three/addons/postprocess.js';
import { AmmoLoader } from 'three/addons/ammo.js';
import { IPHYSICS } from 'three/addons/physics.js';
import { EVENTS } from 'three/addons/events.js'
//import { Terrain } from './terrain/terrain.js'


window.camera = null, window.scene = null, window.renderer = null;
let postprocess = new POSTPROCESS();
let container;
let control;
let physics;
let rayintersects = [], raycaster = new THREE.Raycaster(), raycasterDisabled = false;
const clock = new THREE.Clock();

await waitAmmo();

async function waitAmmo() {
  await AmmoLoader();
  while (typeof (Ammo) === _UN || typeof Ammo.ready === _UN) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  physics = new IPHYSICS(THREE);
  init();
  //EVENTS.create(THREE);
  //EVENTS.onClick = onClick;
}

//on recalculate scene
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  //postprocess.setSize(window.innerWidth, window.innerHeight);
}

//html loaded init three creation
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
  control = new THREE.OrbitControls(camera, renderer.domElement);
  control.update();
  await postprocess.createPostProcess();


  update();
  initSucess();
  window.addEventListener('resize', onWindowResize);
}

//UPDATE FUNCTIONS for 30 FPS
function update() {
  var delta = clock.getDelta();
  var elapsed = clock.getElapsedTime();
  if (delta && delta != null && control && typeof (control != _UN)) {
    physics.update(delta);
    postprocess.update(delta, elapsed);
    postprocess.render();
    //renderer.render(scene,camera);
    control.update();
  }
  requestAnimationFrame(update);
}

//scene loaded
async function initSucess() {

  var light = new THREE.DirectionalLight(0xFFFFFF, 0.4);
  light.position.set(3.2, 20, 0.5);
  light.target.position.set(0, 0, 0);
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = - 10;
  light.shadow.camera.left = - 10;
  light.shadow.camera.right = 10;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 14;
  light.castShadow = true;
  scene.add(light);
  //add global ambient light to not stay darkness in shadows
  var light2 = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.6);
  scene.add(light2);

  const material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
  const material2 = new THREE.MeshPhongMaterial({ color: 0x555588 });

  const plane = new THREE.Mesh(new THREE.BoxGeometry(150, 1, 150), material);
  //plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);
  physics.createObj(plane, 'box', 'tile', null, 0);

  // Coin (cilindro fino)
  const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32);
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    roughness: 0.5,
    metalness: 0.9,
  });
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.castShadow = true;
  coin.receiveShadow = true;
  coin.name = 'coin';
  coin.rotation.x = 1.4;
  coin.position.set(0, 30, 0);
  scene.add(coin);
  window.coin = coin;

  physics.createObj(coin, 'hull', 'obj', null, 0.5);

  // Cria múltiplas cópias do coin
  for (let i = 0; i < 100; i++) {
    let extracoin = coin.clone();
    extracoin.position.set(
      Math.random() * 3 - 1.5,
      30 + i + (Math.random() * 60 - 1),
      Math.random() * 3 - 1.5
    );
    extracoin.rotation.x = 1 + ((Math.random() * 3 - 1) / 2);
    scene.add(extracoin);
    physics.createObj(extracoin, 'hull', 'obj', null, 0.5);
  }

  // Sombrero (retângulo achatado)
  const sombreroGeometry = new THREE.BoxGeometry(10, 2, 10);
  const sombreroMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513, // marrom
    roughness: 1,
    metalness: 0
  });
  const sombrero = new THREE.Mesh(sombreroGeometry, sombreroMaterial);
  sombrero.castShadow = true;
  sombrero.receiveShadow = true;
  sombrero.name = 'sombrero';
  //sombrero.scale.set(3, 3, 3);
  sombrero.position.set(0, 5, 0);
  scene.add(sombrero);
  window.sombrero = sombrero;

  physics.createObj(sombrero, 'box', 'obj', null, 4);


}