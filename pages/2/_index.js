
//import { Ammo as AmmoW } from "./build/ammow.js"
//import * as PHYS from './i_physics.js'
//import { PMREMGenerator } from './PMREMGenerator.js';
//import { GLTFExporter } from 'three/addons/loaders/GLTFExporter.js';
import * as THREE from 'three';
import { IRENDER } from './i_render.js'; //PostProcess Renders
import * as EXTRA from './_extra.js';
import { ISCENE } from './i_scenes.js';
import { OBJECT3D } from './i_objects.js';
import { ANIMATE } from './i_animate.js';
import { ICAMERA } from './i_camera.js';
import { IHUD } from './i_hud.js';
import { PLAYER } from './i_player.js';
import { IAI } from './i_ai.js';


//######### LOADERS ############
var textureLD=new THREE.TextureLoader();
window.LOADER = {
    audioLoader: new THREE.AudioLoader(),
    textureLoader:{
        load:async (url,execute)=>{
            url=await getImage(url);
            return textureLD.load(url,execute);
        },
        loadAsync:async (url)=>{
            url=await getImage(url);
            return textureLD.loadAsync(url);
        }
    },   
    //glbexporter: new GLTFExporter(),
    glbloader: new THREE.GLTFLoader(),
    fileLoader: new THREE.FileLoader(),
    zip: JSZip,
}
window.CSS2D = {
    Renderer: THREE.CSS2DRenderer,
    Object: THREE.CSS2DObject
}

const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('./build/jsm/libs/draco/');
LOADER.glbloader.setDRACOLoader(dracoLoader);

//######### GLOBAL VARIABLES ############
window.THREE = THREE;
window.scene = null;
window.renderer = null;
window.renderer2 = null; //css render
window.camera = null;
window.control = null;
window.MONITORLIGHT = null;
window.materials = [];
window.objects = [];
window.audios = [];
window.objectbyNames = {};
window.bublesUpdate = [];
window.AUDIOlistener = null;
window.now = Date.now();
window.ai = new IAI();
var timer;
var transformCtl;
window.iplayer = new PLAYER();
window.ihud = new IHUD();
window.iscene = new ISCENE();
var irender = new IRENDER();
var iobj3D = new OBJECT3D();
var ianimate = new ANIMATE();
var rayintersects = [], raycaster = new THREE.Raycaster(), raycasterDisabled = false;
var waitforaudio, waitforaudiotimes = 0;
const start = Date.now();
const clock = new THREE.Clock();

window.getOByName = function (oname, objmain) {
    if (typeof (objectbyNames[oname]) != _UN) {
        return objectbyNames[oname];
    } else {
        if (typeof (objmain) == _UN) objmain = scene;
        if (typeof (objmain.getObjectByName(oname)) != _UN) {
            objectbyNames[oname] = objmain.getObjectByName(oname)
            return objectbyNames[oname];
        } else return;
    }
}

window.getImage = async (fileSRC) => {
    //indexedDB.deleteDatabase('pack');       
    var filename=fileSRC;
    if(filename.startsWith("./")==true)filename=filename.slice(2);   
    if(filename.startsWith("models/")==true)filename='images/'+filename;
    filename="./"+filename;
    return filename;
}

//######### DEBUG ONLY ############
function transfCtrlShow(obj) {
    if (typeof (obj) == _UN) return;
    if (typeof (transformCtl) == _UN) transformCtl = new THREE.TransformControls(camera, renderer.domElement);
    scene.add(transformCtl);
    if (transformCtl.target != obj) {
        transformCtl.attach(obj);
        transformCtl.target = obj;
    }
    transformCtl.visible = true;
}


//######### HTML START BUTTON ############
$(document).ready(function () {
    initUserWait();
});

function initUserWait() {
    waitforaudiotimes += 1;
    if (navigator.userActivation.hasBeenActive) {
        clearTimeout(waitforaudio);
        waitforaudio = false;
        init();
    } else {
        //console.log('waiting gestue');
        if (waitforaudiotimes > 10) {
            //console.log('stop waiting gestue');
            waitforaudiotimes = 0;
            clearTimeout(waitforaudio);
            waitforaudio = true;
            init();
        } else {
            waitforaudio = setTimeout(() => { initUserWait(); }, 500);
        }
    }
}

//sucess init 3d scene
function initSucess() {
    function contextmenu(event) { event.preventDefault(); }
    renderer.domElement.addEventListener('contextmenu', contextmenu);
    animate();
}


//######### Create Materials ############
async function createMaterial() {
    async function createAPong(front, back) {
        return [
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ map: await LOADER.textureLoader.loadAsync(front) }),
            new THREE.MeshPhongMaterial({ map: await LOADER.textureLoader.loadAsync(back) })
        ];
    }
    async function createAstandart(front, bump, rought, repeat, color) {
        if (!color) color = 0xffffff;
        var stdd = [
            new THREE.MeshPhongMaterial({ color: color }),
            new THREE.MeshPhongMaterial({ color: color }),
            new THREE.MeshPhongMaterial({ color: color }),
            new THREE.MeshPhongMaterial({ color: color }),
            new THREE.MeshStandardMaterial({
                roughness: 0.8,
                color: 0xffffff,
                metalness: 0.2,
                bumpScale: 1,
                map: await LOADER.textureLoader.loadAsync(front)
            }),
            new THREE.MeshPhongMaterial({ color: color })
        ];
        var floorMat = stdd[4];
        floorMat.map.wrapS = floorMat.map.wrapT = THREE.RepeatWrapping;
        floorMat.map.anisotropy = 4;
        if (repeat) floorMat.map.repeat.copy(repeat);
        if (bump) {
            floorMat.bumpMap = await LOADER.textureLoader.loadAsync(bump);
            floorMat.bumpMap.wrapS = floorMat.bumpMap.wrapT = THREE.RepeatWrapping;
            floorMat.bumpMap.anisotropy = 4;
            floorMat.bumpMap.repeat.copy(floorMat.map.repeat);
        }
        if (rought) {
            floorMat.roughnessMap = await LOADER.textureLoader.loadAsync(rought);
            floorMat.roughnessMap.wrapS = floorMat.roughnessMap.wrapT = THREE.RepeatWrapping;
            floorMat.roughnessMap.anisotropy = 4;
            floorMat.roughnessMap.repeat.copy(floorMat.map.repeat);
        }
        return stdd;
    }

    const maptexture1 = await LOADER.textureLoader.load('./models/envROOM1.jpg', (ttexture) => {
        ttexture.encoding = THREE.sRGBEncoding;
        ttexture.mapping = THREE.EquirectangularReflectionMapping;
    });
    const maptexture2 = await LOADER.textureLoader.load('./models/envROOM2.jpg', (ttexture) => {
        ttexture.encoding = THREE.sRGBEncoding;
        ttexture.mapping = THREE.EquirectangularReflectionMapping;
    });
    var cubemapdir = './images/cubmap1/';
    const maptexture3 = new THREE.CubeTextureLoader().load([
        await getImage(cubemapdir + 'posx.jpg'), await getImage(cubemapdir + 'negx.jpg'),
        await getImage(cubemapdir + 'posy.jpg'), await getImage(cubemapdir + 'negy.jpg'),
        await getImage(cubemapdir + 'posz.jpg'), await getImage(cubemapdir + 'negz.jpg')
    ]);
    /*=new LOADER.textureLoader.load('./models/window/field.jpg',(ttexture)=>{
        ttexture.encoding = THREE.sRGBEncoding;
        ttexture.mapping = THREE.EquirectangularReflectionMapping;
    });
    */
    const metalbase = new THREE.MeshPhysicalMaterial({
        metalness: .9,
        roughness: .05,
        clearcoat: 1,
        transparent: true,
        transmission: 0.9,
        opacity: .5,
        reflectivity: 0.2,
        //refractionRatio: 0.985,
        ior: 0.9,
        side: 2,
        //flatShading:true,
        //envMap: maptexture2,
        envMapIntensity: 0.6
    });
    const glassSceneMaterial = new THREE.MeshPhysicalMaterial({
        metalness: .9,
        roughness: .05,
        envMapIntensity: 0.9,
        clearcoat: 1,
        transparent: true,
        transmission: 0,
        opacity: .5,
        reflectivity: 0.2,
        //refractionRatio: 0.985,
        ior: 0.9,
        side: 2,
        //flatShading:true,
        envMap: maptexture2,
        envMapIntensity: 0.4
    });
    const waterCubeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x56D8FF,
        //emissive: { r: 0.05, g: 0.05, b: 0.05 },
        transmission: 1,
        opacity: 1,
        metalness: 0,
        roughness: 0,
        ior: 1.5,
        thickness: 0.01,
        specularIntensity: 1,
        specularColor: 0xffffff,
        envMapIntensity: 1,
        side: THREE.DoubleSide,
        transparent: false,
        depthWrite: false
    });

    //########CREATING
    document.getElementById('loadingItens').innerText = 'loading materials';
    materials[99] = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    materials[98] = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });
    //Floor texture
    materials[97] = await createAstandart('./images/wood/wood.jpg', './images/wood/wood_bump.jpg', './images/wood/wood_rough.jpg', new THREE.Vector2(2.5, 5), 0x534211);
    materials[97][4].color.set(0x666666);
    //wall texture
    materials[96] = await createAstandart('./images/red.jpg', undefined, undefined, new THREE.Vector2(3, 3));
    materials[96] = materials[96][4];
    materials[96].roughness = 1;
    materials[96].metalness = 0;
    materials[96].color.set(0xAAAAAA);
    //wall stripes
    materials[95] = await createAstandart('./images/wood2/wood2.jpg', './images/wood2/wood2_bump.jpg', './images/wood2/wood2_rough.jpg', new THREE.Vector2(4.5, 1));
    materials[95][4].metalness = 0;
    materials[95][4].color.set(0xAAAAAA);
    //GLASS
    materials[94] = glassSceneMaterial;
    //Water Cube Trasmission
    materials[93] = waterCubeMaterial;
    //GLASS window
    materials[92] = glassSceneMaterial.clone();
    materials[92].envMap = maptexture1;
    //window exterior
    materials[91] = new THREE.MeshBasicMaterial({ envMap: maptexture3, side: 0 });
    //METAL
    materials[90] = metalbase.clone();
    materials[90].opacity = 1;


    //###################### mat1    
    materials[0] = [
        new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
        new THREE.MeshPhongMaterial({ color: 0x00ffff }) // side
    ];
    //###################### mat2
    materials[1] = new THREE.MeshBasicMaterial({ color: 0xffffff });
    //materials[1].map.wrapS = materials[1].map.wrapT = THREE.RepeatWrapping;
    //materials[1].map.repeat.set(0.01, 0.01);
    //###################### TV_noise video
    var video = document.getElementById('tv_nosignal');
    video.src = 'video/tv_noise.mp4';
    video.muted = true;
    video.addEventListener('ended', function (e) {
        video.play();
    });
    video.play();
    var texture = new THREE.VideoTexture(video);
    texture.repeat.set(1.8, 2.2);
    materials[2] = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture });
    materials[2].video = video;
    //###################### Reserver To TV_MONITOR - Off
    materials[3] = new THREE.MeshStandardMaterial({
        map: await LOADER.textureLoader.loadAsync('./images/traped.jpg'),
        metalness: 0.5,
    });
    materials[3].map.wrapS = materials[3].map.wrapT = THREE.RepeatWrapping;
    materials[3].map.repeat.set(1.8, 2.2);
    materials[3].map.flipY = false;
    materials[3].color.setHex(0x1E6B5C);
    //###################### CLIP VIDEOS - channel 1    
    materials[4] = new THREE.MeshLambertMaterial({ color: 0xffffff });
    materials[4].video = document.getElementById('tv_clips');;
    var vidSources = [
        "video/mc_hammer.mp4",
        "video/erithms.mp4",
        "video/heman_comedi.mp4",
        "video/guns.mp4",
        "video/boney_m.mp4"
    ];
    Math.random();
    var activeVideo = Math.floor((Math.random() * vidSources.length));
    function fixvideo() {
        var src = vidSources[activeVideo];
        if (src.endsWith("video/boney_m.mp4") ||
            src.endsWith("video/erithms.mp4") ||
            src.endsWith("video/guns.mp4") ||
            src.endsWith("video/mc_hammer.mp4")
        ) {
            if (materials[4].map != null)
                materials[4].map.repeat.set(1.7, 2.4);
            else return { x: 1.7, y: 2.4 }
        } else {
            if (materials[4].map != null)
                materials[4].map.repeat.set(1.8, 2.4);
            else return { x: 1.8, y: 2.4 }
        }
    }
    materials[4].video.onloadedmetadata = function (e) {
        if (!materials[4].video.randomStart) {
            materials[4].video.randomStart = true;
            var duration = materials[4].video.duration;
            duration = Math.random() * (duration - 1) + 1;
            materials[4].video.currentTime = duration;
        }
    }
    materials[4].video.src = vidSources[activeVideo];
    materials[4].video.addEventListener('ended', function (e) {
        activeVideo = (++activeVideo) % vidSources.length;
        if (activeVideo === vidSources.length) {
            activeVideo = 0;
        }
        materials[4].video.src = vidSources[activeVideo];
        fixvideo();
        materials[4].video.play();
    });
    materials[4].video.volume = 0.8;
    var fixpos = fixvideo();
    materials[4].video.play();
    texture = new THREE.VideoTexture(materials[4].video);
    texture.repeat.set(fixpos.x, fixpos.y);//texture.colorSpace = THREE.SRGBColorSpace;  
    texture.flipY = false;
    materials[4].map = texture;
    //materials[4].color.set(0x888888);
    materials[4].video.volume = 0.8;
    //materials[4].video = video;
    //###################### Reserved To ATARI monitor
    materials[5] = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        //metalness: 0.5,
    });
    //##################### Atari Manual pages
    /* Moved to Object creation
    materials[6] = await createAPong('./images/manual/amanual0.jpg', './images/manual/amanual1.jpg');
    materials[7] = await createAPong('./images/manual/amanual2.jpg', './images/manual/amanual3.jpg');
    materials[8] = await createAPong('./images/manual/amanual4.jpg', './images/manual/amanual5.jpg');
    materials[9] = await createAPong('./images/manual/amanual6.jpg', './images/manual/amanual7.jpg');
    materials[10] = await createAPong('./images/manual/amanual8.jpg', './images/manual/amanual9.jpg');
    materials[11] = await createAPong('./images/manual/amanual10.jpg', './images/manual/amanual10.jpg');
    */
    //##################### TV channel shows
    materials[12] = new THREE.MeshLambertMaterial({ color: 0xffffff });
    materials[12].video = document.getElementById('tv_shows');
    materials[12].video.muted = true;
    materials[12].video.addEventListener('ended', function (e) {
        materials[12].video.play();
    });
    materials[12].video.onloadedmetadata = function (e) {
        if (!materials[12].video.randomStart) {
            materials[12].video.randomStart = true;
            var duration = materials[12].video.duration;
            duration = Math.random() * (duration - 1) + 1;
            materials[12].video.currentTime = duration;
        }
    }
    materials[12].video.src = 'video/channel5.mp4';
    materials[12].video.play();
    var texture = new THREE.VideoTexture(materials[12].video);
    texture.repeat.set(2.05, 2.86);
    texture.center.set(0.1, 0.1);
    texture.flipY = false;
    //materials[12].color.set(0xAAAAAA);
    materials[12].map = texture;
    //##################### TV channel serie
    materials[13] = new THREE.MeshLambertMaterial({ color: 0xffffff });
    materials[13].video = document.getElementById('tv_series');
    materials[13].video.muted = true;
    materials[13].video.addEventListener('ended', function (e) {
        materials[13].video.play();
    });
    materials[13].video.onloadedmetadata = function (e) {
        if (!materials[13].video.randomStart) {
            materials[13].video.randomStart = true;
            var duration = materials[13].video.duration;
            duration = Math.random() * (duration - 1) + 1;
            materials[13].video.currentTime = duration;
        }
    }
    materials[13].video.src = 'video/channel7.mp4';
    materials[13].video.play();
    var texture = new THREE.VideoTexture(materials[13].video);
    texture.repeat.set(2.05, 2.86);
    texture.center.set(0.1, 0.1);
    texture.flipY = false;
    //materials[13].color.set(0xAAAAAA);
    materials[13].map = texture;

}

//######### LIST of 3D Objects Definitions ############
async function create3DObject(value, execute) {
    document.getElementById('loadingItens').innerText = 'inserting: ' + value;
    iobj3D.create(value, execute);
}

//######### create 3D or static audio ############
async function createAudio(local, volume, loop, autostart, toObject, distance, newname) {
    if (!AUDIOlistener) {
        AUDIOlistener = new THREE.AudioListener();
        camera.add(AUDIOlistener);
    }

    document.getElementById('loadingItens').innerText = 'audio: ' + local.split('/').pop().toLowerCase();

    let sound = audios.find(audio => audio.name === (newname || local));

    if (sound) {
        if (toObject) toObject.add(sound);
        sound.setVolume(volume);
        sound.setLoop(loop);
        sound.autoplay = autostart;
        if (autostart) sound.play();
        return sound;
    }

    try {
        sound = toObject
            ? new THREE.PositionalAudio(AUDIOlistener)
            : new THREE.Audio(AUDIOlistener);

        if (toObject) {
            if (distance) sound.setRefDistance(distance);
            toObject.add(sound);
        }
        
        const buffer = await LOADER.audioLoader.loadAsync(local);
        sound.setBuffer(buffer);
        sound.setVolume(volume);
        sound.setLoop(loop);
        sound.autoplay = autostart;
        if (autostart) sound.play();

        sound.name = newname || local;
        audios.push(sound);
        return sound;

    } catch (err) {
        console.error(`Erro ao carregar o áudio "${local}":`, err);
        return null;
    }
}


//######### create 3D or static audio ############
async function createAudioFromMedia(media, volume = 1, toObject = null, distance = null, newname = null) {
    try {
        // Verifica se o listener já existe
        if (!AUDIOlistener) {
            AUDIOlistener = new THREE.AudioListener();
            camera.add(AUDIOlistener);
        }

        // Atualiza UI
        const loadingElem = document.getElementById('loadingItens');
        if (loadingElem) loadingElem.innerText = 'audio: internal';

        // Verifica se já existe áudio com esse nome
        let sound = audios.find(audio => audio.name === newname);

        if (sound) {
            if (toObject) toObject.add(sound);
            sound.setVolume(volume);
            return sound;
        }

        // Cria novo som
        sound = toObject
            ? new THREE.PositionalAudio(AUDIOlistener)
            : new THREE.Audio(AUDIOlistener);

        if (toObject && distance) {
            sound.setRefDistance(distance);
            toObject.add(sound);
        }

        if (!media || typeof media !== 'object') {
            console.error("Media element inválido ou não fornecido.");
            return null;
        }

        sound.setMediaElementSource(media);
        sound.ismediaElement = true;
        sound.mediaElement = media;
        sound.setVolume(volume);
        sound.name = newname || `media-${Date.now()}`;

        audios.push(sound);
        return sound;

    } catch (err) {
        console.error("Erro ao criar áudio a partir do media element:", err);
        return null;
    }
}



//######### 3D initialization ############
async function init() {
    $($('.box')[0]).removeClass('animation_paused');
    $($('.box')[1]).removeClass('animation_paused');
    $($('.box')[2]).removeClass('animation_paused');
    $('#loadingText').text('Loading Scene...');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
    camera.position.y = 84;
    camera.position.z = 220;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        precision: "highp", //highp", "mediump" or "lowp"
        powerPreference: "high-performance" //"low-power", //"high-performance", "low-power" or "default"
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;//THREE.VSMShadowMap;//THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;                
    renderer.toneMapping = THREE.ACESFilmicToneMapping;//THREE.ACESFilmicToneMapping;//THREE.ReinhardToneMapping;//THREE.LinearToneMapping;//THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    //renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.gammaFactor = 1;
    //renderer.autoClear = false;
    //renderer.preserveDrawingBuffer = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    //scene.background.setRGB(1,1,1);
    scene.background = null; //transparent    
    var mainDiv = document.getElementById('main');
    renderer.domElement.classList.add('cmain');
    mainDiv.appendChild(renderer.domElement);
    THREE.Cache.enabled = true;
    //CSS Renderer
    renderer2 = new CSS2D.Renderer();
    renderer2.setSize(window.innerWidth, window.innerHeight);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = '0px';//renderer2.domElement.style.backgroundColor = "rgba(0,0,0,0)";
    mainDiv.appendChild(renderer2.domElement);
    //start creation
    control = new ICAMERA();
    await createMaterial();
    await create3DObject();
    await irender.createPostProcess();
    await iplayer.construct();
    iscene.init(createAudio, createAudioFromMedia, create3DObject, scene, iplayer, ihud);
    iscene.createScene(CURR_SCENE, initSucess);
    var filters = irender.filters;
    if(isWebGL2Supported==true){        
        filters.N8AO.enabled=true;
    }
    window.GAME = { materials, objects, audios, transfCtrlShow, rayintersects, filters };
    window.addEventListener('resize', onWindowResize);
    EVENTS.create(THREE);
    EVENTS.onClick = onClick;
    EVENTS.onKeyUp = onKeyUp;
    EVENTS.onKeyDown = onKeyDown;
}

function isWebGL2Supported() {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2');
        canvas.remove(); // Remove o canvas da árvore DOM (se foi adicionado, ou apenas limpa a referência)
        return !!(window.WebGL2RenderingContext && context);
    } catch (e) {
        return false;
    }
}

//#####################################################
//######### Scene Events and Functions ############
//#####################################################

//on recalculate scene
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer2.setSize(window.innerWidth, window.innerHeight);
}

//on loop native function
var deltafps = 0;
var timestep = 1 / 30; //frameRate
function animate() {
    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();
    deltafps += delta;
    if (delta && delta != null && iscene.creating == false && control && typeof (control != _UN)) {
        while (deltafps >= timestep) {
            //updates
            if (deltafps < 0.3) {
                var test = 0.02;
                control.update(test, EVENTS._keyMap, EVENTS.mouseHPos, 1);
                iplayer.update(test);
                control.update(test, EVENTS._keyMap, EVENTS.mouseHPos, 2);
                ihud.update();
                iscene.update();
                ai.update();
                //PHYSIC.update(timestep);    
                //animate        
                now = Date.now();
                timer = now - start;
                ianimate.animateObjects(test, timer);
            }
            deltafps -= timestep;
            //if (deltafps > 5) deltafps = 0;
        }
        irender.update(delta, elapsed);
        render();
    }
    requestAnimationFrame(animate);
}

//on render scene
function render() {
    renderer2.render(scene, camera);
    irender.render(() => {
        if (raycasterDisabled == false && EVENTS.mousePos != null) {
            raycaster.setFromCamera(EVENTS.mousePos, camera);
        }
    });
}

//window keyUp
function onKeyUp(code) {
    if (getOByName('joy_btn') && code == 'Space') getOByName('joy_btn').position.y = 0;
    if (typeof (CTRL) == _UN || typeof (scene) == _UN || getOByName('tv_channel_box') == null) return;
    var tv_channel = getOByName('tv_channel_box');
    if (typeof (tv_channel.lastChannel) == _UN || tv_channel.lastChannel + 2 != usefullChannels.atari.channel) return;
    switch (code) {
        case 'ArrowLeft': CTRL(jt.ConsoleControls.JOY0_LEFT, false); break;
        case 'ArrowRight': CTRL(jt.ConsoleControls.JOY0_RIGHT, false); break;
        case 'ArrowUp': CTRL(jt.ConsoleControls.JOY0_UP, false); break;
        case 'ArrowDown': CTRL(jt.ConsoleControls.JOY0_DOWN, false); break;
        case 'Space': CTRL(jt.ConsoleControls.JOY0_BUTTON, false); break;
    }

}

//window keydown
function onKeyDown(code) {
    if (code == 'Space') {
        if (getOByName('joy_btn')) {
            var joyaudio = getOByName('./audio/joy_b' + rdn + '_press.mp3');
            if (typeof (joyaudio) != _UN) {
                getOByName('joy_btn').position.y = -0.25;
                var rdn = Math.floor(Math.random() * 3 + 1);
                if (joyaudio.isPlaying) joyaudio.stop(); joyaudio.play();
            }
        }
    }
    if (typeof (CTRL) == _UN || typeof (scene) == _UN || getOByName('tv_channel_box') == null) return;
    var tv_channel = getOByName('tv_channel_box');
    if (typeof (tv_channel.lastChannel) == _UN || tv_channel.lastChannel + 2 != usefullChannels.atari.channel) return;
    switch (code) {
        case 'ArrowLeft': CTRL(jt.ConsoleControls.JOY0_LEFT, true); break;
        case 'ArrowRight': CTRL(jt.ConsoleControls.JOY0_RIGHT, true); break;
        case 'ArrowUp': CTRL(jt.ConsoleControls.JOY0_UP, true); break;
        case 'ArrowDown': CTRL(jt.ConsoleControls.JOY0_DOWN, true); break;
        case 'Space': CTRL(jt.ConsoleControls.JOY0_BUTTON, true); break;
    }
}

//window mouse click
function onClick(mouseButtons) {
    if (mouseButtons.left != 1) return;

    if (ihud.menuActive == true) {
        if (ihud.isHover() == true) {
            return;
        } else {
            ihud.closeMenu(null);
        }
    }

    raycaster.layers.set(0);
    rayintersects = raycaster.intersectObjects(scene.children, true);
    for (var e = 0; e < rayintersects.length; e++) {
        var intercept = rayintersects[e].object;

        var tinfo = intercept.id;
        if (intercept.name && intercept.name != '') tinfo += ' - ' + intercept.name;
        document.getElementById('info2').innerText = tinfo;

        if (typeof (intercept.onClick) == 'function') {
            intercept.onClick(intercept);
        }

        //intercept parent parent
        if (intercept.parent && intercept.parent.parent && intercept.parent.parent.name) {
            if (intercept.parent.parent.name == 'musicbox_tampa') { //MusicBox Open/Close                
                if (intercept.parent.parent.abrindo == 5) {
                    intercept.parent.parent.abrindo = 1;
                    return;
                } else {
                    intercept.parent.parent.abrindo = 0;
                    return;
                }
            }
            if (intercept.parent.parent.name == 'tv_channel_box') { //change tv channel
                if (typeof (intercept.parent.parent.lastChannel) == _UN) intercept.parent.parent.lastChannel = 0;
                intercept.parent.parent.lastChannel += 1;
                intercept.parent.parent.channelChanged = 1;
                if (intercept.parent.parent.lastChannel > 12) intercept.parent.parent.lastChannel = 0;
                // console.log(intercept.parent.parent.lastChannel);
            }
        }

        //intercept parent
        if (intercept.parent && intercept.parent.name) {
            if (intercept.parent.name.startsWith('cart_single')) { //cartrights
                if (getOByName('drawn1') == null || getOByName('drawn1').push != 0) return;
                cartClick(intercept.parent);
            }
            if (intercept.parent.name == 'cart_inserted_box') {
                if (intercept.parent.inserted != null) {
                    ianimate.cartPutOrEject(0, intercept.parent.inserted);
                }
            }
            if (intercept.parent.name == 'stair_box' && intercept.parent.newscene) {
                const p = rayintersects[e].point;
                ihud.showMenu(intercept, 'stair_click', p, {
                    SCENE: intercept.parent.newscene,
                    NAME: intercept.parent.name
                });
            }
        }

        //intercept direct
        if (intercept && intercept.name && typeof (intercept.name) == 'string') {

            if (intercept.name == 'room_floor' || intercept.name == 'carpet_box') {
                const p = rayintersects[e].point;
                ihud.showMenu(intercept, 'floor_click', p, { PLAYER_ACT: true });
            }

            if (intercept.name == 'polySurface13') { //TV power                
                if (!intercept.power || intercept.power == 0) {
                    intercept.power = 1;
                } else {
                    intercept.power = 0;
                }
            }
            if (intercept.name.startsWith('atari_switch')) { //atari switchers pressed                               
                if (typeof (intercept.push) != _UN)
                    if (intercept.push == 0) {
                        var audioswt = getOByName('./audio/atari_switch.mp3');
                        if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                        intercept.push = 1;
                    }
            }
            if (intercept.name.startsWith('drawn')) { //atari button pressed                                
                if (typeof (intercept.push) != _UN)
                    if (intercept.push == 0) {
                        var audioswt = getOByName('./audio/draw_open.mp3');
                        if (audioswt) {
                            if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                        }
                        intercept.push = 1;
                    }
            }
            if (intercept.name.startsWith('door') && intercept.name.endsWith('_box') == false) { //atari button pressed                                
                if (typeof (intercept.parent) != _UN && typeof (intercept.parent.op) == _UN && typeof (intercept.parent.parent) && intercept.parent.parent.op) {
                    intercept = intercept.parent;
                }
                if (intercept.parent && typeof (intercept.parent.push) != _UN)
                    if (intercept.parent.push == 0) {
                        var audioswt;
                        if (intercept.parent.audioOpen && intercept.parent.state == 0) {
                            audioswt = getOByName(intercept.parent.audioOpen);
                        }
                        if (intercept.parent.audioClose && intercept.parent.state == 1) {
                            audioswt = getOByName(intercept.parent.audioClose);
                        }
                        if (audioswt) {
                            if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                        }
                        intercept.parent.push = 1;
                    }
            }
            if (intercept.name.startsWith('apage')) { //atari manual pages                            
                if (typeof (intercept.push) != _UN)
                    if (intercept.push == 0) {
                        //var audioswt = getOByName('./audio/draw_open.mp3');
                        //if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                        intercept.push = 1;
                    }
            }
            if (intercept.name == 'tlamp_pusher' || intercept.name == 'tlamp_top') { //lamp desk                           
                var ltop = getOByName('tlamp_top');
                if (typeof (ltop.push) == _UN) ltop.push = 0;
                //var audioswt = getOByName('./audio/draw_open.mp3');
                //if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                if (intercept.push == 1) {
                    intercept.push = 0;
                    ltop.layers.toggle(10);
                    getOByName('tlamp_lamp').layers.toggle(10);
                    getOByName('tlamp_light').intensity = 0;
                } else {
                    intercept.push = 1;
                    ltop.layers.toggle(10);
                    getOByName('tlamp_lamp').layers.toggle(10);
                    getOByName('tlamp_light').intensity = getOByName('tlamp_light').lumen;
                }
            }
            if (intercept.name.startsWith('glass') && intercept.atachedCurtain && intercept.atachedCurtain.frame) { //window glass                                               
                intercept.atachedCurtain.frame[0].push = 1;
            }
        }
        return;

    }
}


//#####################################################
//######### 3D Objects Animation/Iteration Area #######
//#####################################################

function cartClick(cart) {
    var cnumber = parseInt(cart.name.substr(11));
    if (typeof (cart.permit) == _UN || cart.permit == null) {
        cart.permit = 1;//permit insert
    }
    if (cart.permit == 1) ianimate.cartPutOrEject(cart.permit, cnumber);
}


