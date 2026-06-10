//https://discourse.threejs.org/t/fixing-skeletonutils-retarget-and-retargetclip-functions/65149/11
//https://wickedengine.net/2022/09/animation-retargeting/
import * as THREE from 'three';
import { POSTPROCESS } from 'three/addons/postprocess.js';
import { EVENTS } from 'three/addons/events.js';
import { FBXLoader } from './FBXLoader.js';
import { MixamoIntegration } from './motion.js'

window.TT=THREE;

window.camera = null, window.scene = null, window.renderer = null;
let postprocess = new POSTPROCESS();
let container;
let controls;
let rayintersects = [], raycaster = new THREE.Raycaster(), raycasterDisabled = false;
const clock = new THREE.Clock();
const timestep = 1 / 60;
const maxSubSteps = 5;
let accumulator = 0;
let modelHeight=0;

//LOADERS
//const gtlfLoader=new THREE.GLTFLoader();
//const dracoLoader = new THREE.DRACOLoader();
//dracoLoader.setDecoderPath('../draco/')
const fbxloader = new FBXLoader();

let mixamo=null;
let model=null;


init();
EVENTS.create(THREE);
//EVENTS.onClick = onClick;  

async function init() {
  container = document.getElementById("myContainer");
  renderer = new THREE.WebGL1Renderer({ alpha: false, antialias: false, });
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
    while (accumulator >= timestep && substeps < maxSubSteps) {
      //Update antthrootle cumulative
      accumulator -= timestep;
      substeps++;
    }        
      //if(typeof(M)!="undefined" && M.mixer.update(deltaTime);    
      if(mixamo && mixamo.update){
        mixamo.update(deltaTime);
      }
      
  postprocess.update(safeDelta, elapsedTime);
  render();
  requestAnimationFrame(animate);
}

function render() {  
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


async function createObjects() {
  var light2 = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.9);
  scene.add(light2);
  const material1 = new THREE.MeshPhongMaterial({ color: 0x777777 });
  const material2 = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const plane = new THREE.Mesh(new THREE.BoxGeometry(2800, 1, 2800), material1);
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);  
  camera.position.set(0, 240, 260);
  controls.target.set(0, 20, 0); //look up
  controls.update();
 
  window.C=scene;

  mixamo=new MixamoIntegration();
  window.MX=mixamo;
  await mixamo.create(scene);
  model=await mixamo.load('./wood_rig.fbx');
  await mixamo.setHeight(model,170);  
  mixamo.playUnique(model,'idle');

  window.M=model;



  return;
  fbxloader.load('./cat.fbx', (modelbase) => {
    window.N = modelbase;
    scene.add(modelbase);
    fbxloader.load('./human_3ds.fbx', (modelView) => {
      window.M = modelView;
      scene.add(modelView);
      modelView.clips={};
      modelView.mixer = new THREE.AnimationMixer(modelView);
       modelbase.animations.forEach((baseclip)=>{

        var filteredTracks = baseclip.tracks.filter(function (track) {
          return track.name.endsWith('.quaternion');
        });
        var newclip=baseclip.clone();
        newclip.tracks=filteredTracks;
          modelView.clips[newclip.name] = modelView.mixer.clipAction(newclip);
       });        
       const helper = new THREE.SkeletonHelper(modelView);
          helper.material.linewidth = 2;
          helper.material.color.set(0x00ff00);
          helper.visible = true;
          modelView.userData.skeletonHelper = helper;
          scene.add(helper);
      M.clips.catwalk_loop_251070.play();
         

    })
  })

}













