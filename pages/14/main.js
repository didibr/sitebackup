//https://discourse.threejs.org/t/fixing-skeletonutils-retarget-and-retargetclip-functions/65149/11
//https://wickedengine.net/2022/09/animation-retargeting/
import * as THREE from 'three';
import { POSTPROCESS } from 'three/addons/postprocess.js';
import { EVENTS } from 'three/addons/events.js';
import { MixamoIntegration } from './motion.js';
import { GUI } from './lil-gui.module.min.js';
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

  setupGUI();
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




function setupGUI() {
  const gui = new GUI();  
  const params = {
    animation: '',
    upper: '',
    lower: '',
    uploadModel: async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.fbx,.glb,.gltf';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
    
        const extension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const blob = new Blob([arrayBuffer]);
          const url = URL.createObjectURL(blob);
    
          
          let prevAnim = null;
    
          try {
            if (model) {              
              const running = mixamo.running(model);
              if (running.length > 0) prevAnim = running[0]; // pega a primeira em execução
              await mixamo.unload(model);
            }
    
            model = await mixamo.load({ url, extension });
            await mixamo.scaleHeight(model,modelHeight);
            setTimeout(() => {
   const box = mixamo.getModelBox3D(model);
   const bottomY = box?.min.y ?? 0;
   model.position.y -= bottomY;  
   model.position.x=100;
  }, 200);  
            window.M = model;
    
            // ✅ Continua a animação anterior, se existir
            if (prevAnim && model.mixamo.actions[prevAnim]) {
              mixamo.playExclusive(model, prevAnim);              
              params.animation = prevAnim;
            }
    
            refreshAnimationList();
          } catch (err) {
            console.error('Erro ao carregar modelo:', err);
            alert('Erro ao carregar o modelo.');
          }
        };
    
        reader.readAsArrayBuffer(file);
      };
      input.click();
    },

    downloadAnimations: () => {
      mixamo.downloadAnimationData();
    },

    addAndPlay: async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.bin,.fbx,.glb,.gltf,.json';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const name = prompt("Nome da animação:");
        if (!name) return;

        
        //model.scale.set(1, 1, 1);
        //model.updateMatrixWorld(true);

        model=await mixamo.addAnimation(model,file, name);
        window.M=model;
        //mixamo.reloadAnimations(model); // atualiza
        Promise.resolve().then(() => {
          mixamo.playExclusive(model, name);          
          params.animation = name;
          refreshAnimationList();
        });                
        //gui.updateDisplay();
      };
      input.click();
    },

    changeUpperBody: (name) => {
      if (name) mixamo.changeUpperBody(model, name);
    },

    changeLowerBody: (name) => {
      if (name) mixamo.changeLowerBody(model, name);
    },

    reloadAnimations: () => {
      if(!model)return;
      mixamo.reloadAnimations(model);
      Promise.resolve().then(() => {
        mixamo.playExclusive(model, 'tpose');
        params.animation = 'tpose';
        params.upper = '';
        params.lower = '';
        refreshAnimationList();
      });
    }
  };

  function refreshAnimationList() {
    if (!model || !model.mixamo || !model.mixamo.actions) return;
    const names = Object.keys(model.mixamo.actions).filter(n => !n.includes('__'));
    const folder = gui.folders.find(f => f._title === 'Animations');
    if (folder) folder.destroy();

    const animFolder = gui.addFolder('Animations');
    animFolder.add(params, 'animation', names).name('Play')
      .onChange(name => mixamo.playExclusive(model, name));
    animFolder.add(params, 'upper', names).name('Upper Body')
      .onChange(name => params.changeUpperBody(name));
    animFolder.add(params, 'lower', names).name('Lower Body')
      .onChange(name => params.changeLowerBody(name));

      animFolder.add(params, 'reloadAnimations').name('Reload');
  }

  gui.add(params, 'uploadModel').name('Upload Model');
  gui.add(params, 'downloadAnimations').name('Download Animations');
  gui.add(params, 'addAndPlay').name('Add & Play Animation');
  

  refreshAnimationList();
  setTimeout(() => {
    params.reloadAnimations();
  }, 100);  
}





