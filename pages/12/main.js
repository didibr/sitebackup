//https://discourse.threejs.org/t/fixing-skeletonutils-retarget-and-retargetclip-functions/65149/11
//https://wickedengine.net/2022/09/animation-retargeting/
import * as THREE from 'three';
import { POSTPROCESS } from 'three/addons/postprocess.js';
import { EVENTS } from 'three/addons/events.js';
import { MixamoIntegration } from './motion.js';
//import { FBXLoader } from './FBXLoader.js';

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
//const fbxloader = new FBXLoader();

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
  mixamo=new MixamoIntegration(scene);

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
  if(mixamo && mixamo.update){
    if(!window.pause)
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
  
  //camera.rotation.set(0, 0, 0);
  //controls.enabled = false; //disable camera updates     
  //model.position.x=40; 
  await mixamo.create(scene,null);  
  modelHeight=170;   
  /*model=await mixamo.load('./backup/human.fbx');
  modelHeight=170;
  await mixamo.scaleHeight(model,modelHeight);
  model.position.x=100;  
  //setTimeout(() => {
   const box = mixamo.getModelBox3D(model);
   const bottomY = box?.min.y ?? 0;
   model.position.y -= bottomY;  
   */
  //}, 500);    
  /*
  fbxloader.load('./zbot.fbx',async(loaded)=>{
    model=await mixamo.load(loaded);
    window.M=model;
  })
  */
  //model.position.x=-40;
  //mixamo.playExclusive(model,'walk');
  //mixamo.playExclusive(model,'walk');
  enableDrop();
  window.M=model;
  window.MX=mixamo;
  window.C=scene;
}


function enableDrop() {
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  document.addEventListener('drop', async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) {
      alert('Nenhum arquivo foi solto.');
      return;
    }

    const validExtensions = ['fbx', 'glb', 'gltf'];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(extension)) {
      alert('Por favor, solte um arquivo .fbx, .glb ou .gltf válido.');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);      
      
      try {        
        if (model) {          
          await mixamo.unload(model); // descarrega modelo anterior, se houver
        }        
        model = await mixamo.load({ url, extension }); // passa objeto com url e extensão
        mixamo.scaleHeight(model,modelHeight);
        window.M = model;        
      } catch (err) {
        console.error('Erro ao carregar modelo:', err);
        alert('Erro ao carregar o modelo. Verifique o console para mais detalhes.');
      }
    };

    reader.readAsArrayBuffer(file);
  });
}








