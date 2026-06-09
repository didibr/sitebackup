import * as THREE from 'https://didisoftwares.ddns.net/22/three/three.ammo.min.js';

class SimpleTimer {
    constructor() {
        this.lastTime = performance.now();
        this.delta = 0;
    }
    update() {
        const now = performance.now();
        this.delta = (now - this.lastTime) / 1000; // segundos
        this.lastTime = now;
    }
    getDelta() {
        return this.delta;
    }
}

window.THREE = THREE;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
let renderElement;
let homesite = 'https://didisoftwares.ddns.net/22/';
let container, sun, ambient;
let scene, renderer;
let camera, light, plane, controls, ssrPass;
//****** animation and mixer
let helper, loader, tloader, objectMain, animationMixer, currentAnimation;
let animationCache = [];
let animationsList = [];
let morphiListArray = null;
let firstTime = true;
let useAudioPlayer = true;
const keys = {};
const frustumSize = 100;
let temporizadorPOS = null;
//****** model and bmp
const ground = 0;
let isBlending = false;
let blendRAF = null;
let blendOldAction = null;
let blendNewAction = null;
let lastEnergy = 0;
let beatCooldown = 0;
let lastBeatTime = 0;
let bpmHistory = [];
let silenceCounter = 0;
let bpmStable = 0;
let bpmConfidence = 0;
if (globalThis.__beatPulse == null) globalThis.__beatPulse = 0;
if (globalThis.__bpmSmooth == null) globalThis.__bpmSmooth = 0;
let player;
let videoPlaying = false;
let danceCHANGETIME = null;
let danceGOTOINIAL = null;
let danceSLOWINTRO = null;
//****** update
let timer;
let accumulator = 0;
let lastTime = 0;
const maxFPS = 30;
const fixedTimeStep = 1 / maxFPS;

//DEBUG
window.CC = changeAnimation;
window.MX = () => animationMixer;
window.AC = () => currentAnimation;
window.HP = () => helper;
window.PP = PosicaoDefinida;
window.OO = () => objectMain;
window.FC = faceChange;


const CONFIG = {
    meio: {
        pos: { x: 0, y: ground, z: 0 },
        range: { x: 0.2, y: 0.2, z: 1 },
        next: "frente",
        animStart: "walk",
        animEnd: "idle",
        rotateFirst: "costas"
    },

    inicial: {
        pos: { x: 0, y: ground, z: 20 },
        range: { x: 0.15, y: 0.15, z: 0.15 },
        next: null,
        animStart: "walk",
        animEnd: "idle",
        rotateFirst: "frente"
    }
};

async function createRender(relement) {
    renderElement = relement;
    await waitAmmo();
}
window.createRender = createRender;
//const pContainer=document.getElementById('pContainer');
//if(pContainer)createRender(pContainer);

async function waitAmmo() {
    await THREE.AmmoLoader();
    while (typeof (Ammo) === "undefined" || typeof Ammo.ready === "undefined") {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    init();
}

function createProgressBar() {
    // Overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `position: fixed;inset: 0;display: flex;align-items: center;
        justify-content: center;background: rgba(0,0,0,0.25);backdrop-filter: blur(4px);
        z-index: 999999;pointer-events: all;`;
    // Container
    const container = document.createElement("div");
    container.style.cssText = `width: 420px;max-width: 90vw;padding: 24px;
        border-radius: 18px;background: rgba(30,30,40,0.55);backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.15);box-shadow:0 8px 32px rgba(0,0,0,0.35),
            0 0 20px rgba(80,180,255,0.15);font-family: Arial, sans-serif;color: white;`;
    // Texto
    const label = document.createElement("div");
    label.textContent = "Loading...";
    label.style.cssText = `margin-bottom: 12px;font-size: 14px;letter-spacing: 0.5px;`;
    // Fundo da barra
    const track = document.createElement("div");
    track.style.cssText = `width: 100%;height: 14px;border-radius: 999px;overflow: hidden;
        background: rgba(255,255,255,0.12);box-shadow: inset 0 0 8px rgba(0,0,0,0.3);`;
    // Barra
    const fill = document.createElement("div");
    fill.style.cssText = `width: 0%;height: 100%;border-radius: inherit;transition: none;
        background: linear-gradient(90deg,#38bdf8,#60a5fa,#818cf8);
        box-shadow:0 0 12px rgba(96,165,250,0.7),0 0 24px rgba(96,165,250,0.4);`;
    // Porcentagem
    const percent = document.createElement("div");
    percent.textContent = "0%";
    percent.style.cssText = `text-align: right;margin-top: 8px;font-size: 13px;opacity: 0.9;`;
    track.appendChild(fill); container.appendChild(label);
    container.appendChild(track); container.appendChild(percent);
    overlay.appendChild(container); document.body.appendChild(overlay);
    let destroyed = false;
    return {
        label, progress(value) {
            if (destroyed) return;
            value = Math.max(0, Math.min(100, value));
            fill.style.width = value + "%";
            percent.textContent = Math.round(value) + "%";
            if (value >= 100) { this.ended(); }
        },
        ended() {
            if (destroyed) return;
            destroyed = true;
            overlay.style.transition = "none";
            overlay.style.opacity = "0";
            setTimeout(() => { overlay.remove(); }, 250);
        }
    };
}


async function init() {
    container = document.createElement('div');
    if (!renderElement) {
        document.body.appendChild(container);
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    } else {
        renderElement.appendChild(container);
        const rect = renderElement.getBoundingClientRect();
        SCREEN_WIDTH = rect.width;
        SCREEN_HEIGHT = rect.height;
        aspect = rect.width / rect.height;
    }
    scene = new THREE.Scene();
    timer = new SimpleTimer();
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    camera.position.set(0, ground + 22, 28);
    camera.lookAt(0, ground + 10, 0);
    scene.add(camera);


    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true /*, powerPreference: "low-power"*/ });
    } catch (e) { console.error("Fail to create WebGL"); return; }
    renderer.setPixelRatio(1);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setAnimationLoop(update);
    container.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;//THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.autoClear = false;
    //renderer.setClearColor(0x000000, 1);
    /*    
    renderer.physicallyCorrectLights = true;    
    */
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.y += ground + 10;
    controls.update();
    controls.enabled = false;
    window.addEventListener('resize', onWindowResize);
    window.addEventListener("keydown", (e) => { keys[e.code] = true; });
    window.addEventListener("keyup", (e) => { keys[e.code] = false; });
    helper = new THREE.MMDAnimationHelper();
    helper.enable('ik', true);
    helper.enable('physics', true);
    helper.enable('cameraAnimation', false);
    loader = new THREE.MMDLoader();
    tloader = new THREE.TextureLoader();
    createScene();
}

function onWindowResize() {
    if (!renderElement) {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    } else {
        const rect = renderElement.getBoundingClientRect();
        SCREEN_WIDTH = rect.width;
        SCREEN_HEIGHT = rect.height;
        aspect = rect.width / rect.height;
    }
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
}

function update() {
    timer.update();
    let delta = timer.getDelta();
    if (delta > 0.1) delta = 0.1;
    accumulator += delta;
    while (accumulator >= fixedTimeStep) {
        if (helper) helper.update(fixedTimeStep);
        updateFFT();
        accumulator -= fixedTimeStep;
    }

    renderer.render(scene, camera);

}



async function createScene() {
    ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.castShadow = true;
    sun.position.set(30, 50, 24);
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 100;
    sun.shadow.bias = -0.0008;
    scene.add(sun);


    var planeGeometry = new THREE.PlaneGeometry(400, 400);
    var planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    scene.add(plane);
    plane.position.set(0, ground, 0);
    plane.rotation.x = - Math.PI / 2;



    animationsList = [
        ['walk.vmd', 0.8],
        ['idle1.vmd', 0.4],
        //['move_esquerda.vmd',1],
        //['move_direita.vmd',1],
        ['danca_random_01.vmd', 0.9],
        //['top_back01_FIX_Bake.vmd',1],
        ['danca_passo01.vmd', 1],
        ['danca_passo02.vmd', 1]
    ];

    //const girls = ["angel", "canta", "kizu", "medley", "sakine"];
    const girls = ["sakine"];
    const ramdomGirl = girls[Math.floor(Math.random() * girls.length)];

    await preloadAnimations(ramdomGirl, animationsList);
    loadMMD(ramdomGirl, 'idle1.vmd');
    //PLAYER PLAY
    if (firstTime) {
        firstTime = false;
        if (useAudioPlayer)
            setTimeout(() => { if (globalThis.loadTrackPlayer) globalThis.loadTrackPlayer(); }, 2000);
    }
}





function changeAnimation(nome, tempo = 0.5) {
    if (nome === currentAnimation) return;
    const clip = animationCache[nome];
    if (!clip) return;
    // Finaliza blend anterior imediatamente
    if (isBlending) {
        if (blendRAF) {
            cancelAnimationFrame(blendRAF);
            blendRAF = null;
        }
        if (blendOldAction) {
            blendOldAction.weight = 0;
            blendOldAction.stop();
        }
        if (blendNewAction) {
            blendNewAction.weight = 1;
            currentAnimation = blendNewAction._clip.name;
            //blendNewAction.timeScale = animationsList[blendNewAction._clip.name][1];
        }
        blendOldAction = null;
        blendNewAction = null;
        isBlending = false;
    }
    const newAction = animationMixer.clipAction(clip);
    const oldAction = animationMixer._actions.find(
        action => action._clip.name === currentAnimation
    );
    //clean now valid
    animationMixer._actions.forEach(action => {
        if (action !== oldAction && action !== newAction) {
            action.weight = 0;
            action.stop();
        }
    });

    blendOldAction = oldAction;
    blendNewAction = newAction;
    newAction.stop();
    newAction.reset();
    newAction.play();
    newAction.timeScale = clip.speed;
    newAction.weight = 0;
    isBlending = true;
    const start = performance.now();
    function updateCh() {
        let t = (performance.now() - start) / (tempo * 1000);
        if (t > 1) t = 1;
        if (oldAction) {
            oldAction.weight = 1 - t;
        }
        newAction.weight = t;
        if (t < 1) {
            blendRAF = requestAnimationFrame(updateCh);
        } else {
            if (oldAction) {
                oldAction.weight = 0;
                oldAction.stop();
            }
            newAction.weight = 1;
            currentAnimation = nome;
            blendOldAction = null;
            blendNewAction = null;
            blendRAF = null;
            isBlending = false;
        }
    }
    updateCh();
}




async function preloadAnimations(modelName, vmdList) {
    let pg = createProgressBar();
    const model = await new Promise((resolve, reject) => {
        loader.load(homesite + 'models/person/' + modelName + '/' + modelName + '.pmx', resolve, undefined, reject);
    });
    const total = vmdList.length;
    let loaded = 0;
    pg.label.textContent = `Loading Animations: ${loaded} of ${total}`;
    const promises = vmdList.map(vmdData => {
        let vmdName = vmdData[0];
        let vmdSpeed = vmdData[1];
        return new Promise((resolve, reject) => {
            objectMain = model;
            objectMain.name = modelName;
            loader.loadAnimation(
                homesite + 'models/moves/' + vmdName,
                objectMain,
                clip => {
                    clip.name = vmdName;
                    clip.speed = vmdSpeed;
                    animationCache[vmdName] = clip;
                    loaded++;
                    pg.progress((loaded / total) * 100);
                    pg.label.textContent = `Loading Animations: ${loaded} of ${total}`;
                    resolve();
                },
                undefined,
                reject
            );
        });
    });
    await Promise.all(promises);
    pg.progress(100);
}


function matColors(materials) {
    const debugColor = false;
    const hasGlove = materials.some(mat => mat.name?.toLowerCase().includes('glove'));
    function defaultMat(mat) {
        mat.metalness = 0.0;
        mat.sheen = 1.0;
        mat.sheenRoughness = 0.9;
        if (debugColor) mat.color.set(0x00ff00);
    }
    //const mhair=tloader.load(homesite + 'models/hair.png');
    //console.log(mhair)
    materials.forEach(mat => {
        //mat.envMap=scene.environment;
        //mat.reflectivity=100;
        if ('emissive' in mat) { mat.emissive?.set(0x000000); }
        if ('emissiveIntensity' in mat) { mat.emissiveIntensity = 0; }
        if ('opacity' in mat) { mat.opacity < 1 ? mat.transparent = true : mat.transparent = false; }
        mat.color.set(0xffffff);
        switch (mat.name.toLowerCase()) {
            case '顔':
            case '肌':
            case 'hand':
            case 'face':
            case 'body': {
                //SKIN
                if (mat.name == 'hand' && hasGlove) {
                    defaultMat(mat);
                    break;
                }
                mat.metalness = 0.0;
                mat.roughness = 0.65;
                mat.clearcoat = 0.05;
                mat.clearcoatRoughness = 1.0;
                mat.envMapIntensity = 0.3;
                if (debugColor) mat.color.set(0xff0000);
                break;
            }
            case '目':
            case 'eye': {
                break;
            }
            case 'shirome':
            case 'facenose':
            case 'eyeshadow':
            case 'eyebrow': {
                mat.opacity = 0;
                mat.transparent = true;
                if (debugColor) mat.color.set(0xffff00);
                break;
            }
            default: {
                defaultMat(mat);
                //lights
                if (mat.name.includes('light') || mat.name === 'headphone') {
                    mat.emissive?.set(0xff00ff);
                    mat.emissiveIntensity = 1;
                    if (debugColor) mat.color.set(0xffffff);
                }
                //hair
                if (mat.name.includes('hair') || mat.name.includes('髪')) {
                    //mat.map=mhair;
                    mat.metalness = 0.0;
                    mat.roughness = 0.85;
                    mat.sheen = 1.0;
                    mat.sheenRoughness = 0.9;
                    mat.clearcoat = 0.15;
                    mat.clearcoatRoughness = 0.4;
                    mat.envMapIntensity = 0.6;
                    if (debugColor) mat.color.set(0x0000ff);
                }
                break;
            }
        }
    });
}

function loadMMD(mdname, firstVMD) {
    let pg = createProgressBar();
    function activate() {
        objectMain.traverse(obj => {
            if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
        });
        const materials = Array.isArray(objectMain.material) ? objectMain.material : [objectMain.material];
        matColors(materials);

        scene.add(objectMain);
        objectMain.position.set(CONFIG.inicial.pos.x, CONFIG.inicial.pos.y, CONFIG.inicial.pos.z);
        helper.add(objectMain, { animation: animationCache[firstVMD] });
        animationMixer = helper.objects.get(objectMain).mixer;
        animationMixer._actions[0].timeScale = animationMixer._actions[0]._clip.speed;
        currentAnimation = firstVMD;
        faceChange('', 0); //clear morphs
        pg.progress(100);
    }
    if (objectMain.name === mdname) { activate(); return; } //same as preloadAnimations
    loader.load(
        homesite + 'models/person/' + mdname + '/' + mdname + '.pmx',
        function (object) {
            objectMain = object; objectMain.name = mdname; activate();
        },
        function (e) {
            var percent = (e.loaded / e.total) * 100;
            if (percent >= 100) percent = 99;
            pg.progress(percent);
        }
    );
};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function motionN(nome) {
    var motionZ = {
        'walk': ['walk.vmd'],
        'dance1': ['danca_random_01.vmd'],
        'idle': ['idle1.vmd'],
        'intro': ['danca_passo01.vmd', 'danca_passo02.vmd']
    }
    var mtcount = motionZ[nome].length;
    var randomnumber = getRandomInt(0, mtcount - 1);
    return motionZ[nome][randomnumber];
}


function PosicaoDefinida(nome, valor, callback) {
    function moverPara(target, range, done) {
        let speed = 0.3;
        clearInterval(temporizadorPOS);
        temporizadorPOS = setInterval(() => {
            let okX = false, okY = false, okZ = false;
            if (objectMain.position.x > target.x + range.x || objectMain.position.x < target.x - range.x) {
                objectMain.position.x += (objectMain.position.x > target.x ? -speed : speed);
            } else okX = true;
            if (objectMain.position.y > target.y + range.y || objectMain.position.y < target.y - range.y) {
                objectMain.position.y += (objectMain.position.y > target.y ? -speed / 3 : speed / 3);
            } else okY = true;
            if (objectMain.position.z > target.z + range.z || objectMain.position.z < target.z - range.z) {
                objectMain.position.z += (objectMain.position.z > target.z ? -speed : speed);
            } else okZ = true;
            if (okX && okY && okZ) {
                clearInterval(temporizadorPOS);
                if (done) done();
            }
        }, 20);
    }
    function rotacionarPara(target, range, done) {
        clearInterval(temporizadorPOS);
        temporizadorPOS = setInterval(() => {
            let rot = objectMain.rotation.y;
            while (rot > 6.2) rot -= 6.2;
            while (rot < 0) rot += 6.2;
            let extra = (rot > target) ? -0.1 : 0.1;
            objectMain.rotation.y += extra;
            if (objectMain.rotation.y > target - range && objectMain.rotation.y < target + range) {
                clearInterval(temporizadorPOS);
                objectMain.rotation.y = target;
                if (done) done();
            }
        }, 20);
    }

    // ===== CONFIGURADO =====
    if (CONFIG[nome]) {
        const cfg = CONFIG[nome];
        const iniciarMovimento = () => {
            if (cfg.animStart) {
                changeAnimation(motionN(cfg.animStart));
            }
            moverPara(cfg.pos, cfg.range, () => {
                if (cfg.animEnd) {
                    changeAnimation(motionN(cfg.animEnd));
                }
                if (cfg.next) {
                    PosicaoDefinida(cfg.next, "", callback);
                } else {
                    if (callback) callback();
                }
            });
        };
        // rotação antes?
        const distancia = objectMain.position.distanceTo(new THREE.Vector3(cfg.pos.x, cfg.pos.y, cfg.pos.z));
        if (cfg.rotateFirst && distancia >= 1) {
            PosicaoDefinida(cfg.rotateFirst, "", iniciarMovimento);
        } else {
            iniciarMovimento();
        }
        return;
    }
    // ===== CASOS BASE =====
    if (nome == 'rodar') {
        clearInterval(temporizadorPOS);
        temporizadorPOS = setInterval(() => {
            objectMain.rotation.y += 0.1;
            valor--;
            if (valor < 1) {
                clearInterval(temporizadorPOS);
                if (callback) callback();
            }
        }, 20);
    }
    if (nome == 'frente') {
        rotacionarPara(0, 0.2, callback);
    }
    if (nome == 'costas') {
        rotacionarPara(3.2, 0.2, callback);
    }
}


function clearDelayeds() {
    if (danceCHANGETIME != null) clearTimeout(danceCHANGETIME);
    if (danceGOTOINIAL != null) clearTimeout(danceGOTOINIAL);
    if (danceSLOWINTRO != null) clearTimeout(danceSLOWINTRO);
    danceCHANGETIME = null;
    danceGOTOINIAL = null;
    danceSLOWINTRO = null;
}

function delayedinitial() {
    if (danceGOTOINIAL == null) {
        PosicaoDefinida('inicial');
        danceGOTOINIAL = setTimeout(function () {
            clearTimeout(danceGOTOINIAL);
            danceGOTOINIAL = null;
        }, 10000);
    }
}

function delayedintro() {
    if (danceSLOWINTRO == null) {
        changeAnimation(motionN('intro'), 0.5);
        danceSLOWINTRO = setTimeout(function () {
            clearTimeout(danceSLOWINTRO);
            danceSLOWINTRO = null;
        }, 10000);
    }
}

function playMovie() {
    PosicaoDefinida('meio', 6, function () {
        changeAnimation(motionN('intro'), 0.5);
    });
}

function stopMovie() {
    //lastanimationAction.weight = 1;
    //const runningAnimation = animationMixer._actions.find( action => action._clip.name === currentAnimation );
    //if(runningAnimation)runningAnimation.weight = 1;
    PosicaoDefinida('inicial', 6, function () {
        changeAnimation(motionN('idle'), 1);
    });
}

let lastSrc = "";
function updateAudio() {
    if (!player) {
        player = document.getElementById("player");
    }
    if (!player) return
    // player.paused / !player.paused substitui sound.isPlaying
    if (player.currentSrc !== lastSrc) {
        lastSrc = player.currentSrc;
        clearDelayeds();
        clearInterval(temporizadorPOS);
        playMovie();
    }
    if (videoPlaying != true && !player.paused) {
        videoPlaying = true;
        clearDelayeds();
        playMovie();
        return;
    }

    if (videoPlaying == true && player.paused) {
        videoPlaying = false;
        stopMovie();
        delayedinitial();
        return;
    }

    if (videoPlaying === true) {
        const gapn = 30; // segundos antes do fim para iniciar o fade
        let currentTime = player.currentTime;
        let duration = player.duration || 0;
        if (duration > 0 && currentTime > 0 && currentTime > duration - gapn) {
            delayedintro();

            const remainingTime = duration - currentTime;
            // 1 → 0 durante os últimos gapn segundos
            const calcy = Math.max(0, remainingTime / gapn);
            const runningAnimation = animationMixer._actions.find(
                action => action._clip.name === currentAnimation
            );

            if (runningAnimation) {
                // peso nunca abaixo de 0.1
                runningAnimation.weight = Math.max(0.6, calcy);
                // velocidade diminui junto com o fade
                //runningAnimation.timeScale = animationsList[currentAnimation][1] * Math.max(0.2, calcy);
            }
        } else {
            // não está chegando ao final
            if (currentTime < gapn) {
                // início da música
                const calcy = Math.min(1, currentTime / gapn);
                const runningAnimation = animationMixer._actions.find(
                    action => action._clip.name === currentAnimation
                );
                //console.log(calcy);
                if (runningAnimation) {
                    // peso sobe gradualmente
                    //runningAnimation.weight = 0.6 + calcy * 0.9;
                    //console.log(runningAnimation.weight)
                    // velocidade sobe gradualmente
                    //runningAnimation.timeScale =animationsList[currentAnimation][1] * (0.2 + calcy * 0.8);
                }
            } else {
                // meio da música
                if (danceCHANGETIME == null) {
                    changeAnimation(motionN('dance1'), 1);
                    danceCHANGETIME = setTimeout(() => {
                        clearTimeout(danceCHANGETIME);
                        danceCHANGETIME = null;
                    }, 10000);
                }
            }
        }

        if (currentTime + 4 < duration) {
            // ainda tocando
        } else {
            // parando
        }
    }
}

//****** AUDIOCONTEXT *******/
function updateFFT() {
    updateAudio();
    if (globalThis.__bassEnergy == null || globalThis.__energySmooth == null) return;
    updateBeat();
}




function updateBeat() {
    return; //not user
    const data = globalThis.__fftData;
    const smooth = globalThis.__energySmooth;
    if (!data || smooth == null) return;
    let energy = 0;
    const len = data.length;
    // ✅ faixa filtrada (grave limpo)
    const start = Math.floor(len * 0.005);
    const end = Math.floor(len * 0.03);
    for (let i = start; i < end; i++) {
        energy += data[i];
    }
    energy /= (end - start);
    energy /= 255; // normaliza 0–1  
    if (energy < 0.02) {
        silenceCounter++;
    } else {
        silenceCounter = 0;
    }

    //se ficar baixo por vários frames → zera BPM
    if (silenceCounter > 300) { // ~0.5s dependendo do FPS
        bpmHistory.length = 0;
        bpmStable = 0;
        bpmConfidence = 0;
        lastBeatTime = 0;
        globalThis.__bpm = 0;
        // opcional: também reduzir pulso
        globalThis.__beatPulse *= 0.8;
        return;
    }



    const delta = energy - lastEnergy;
    if (beatCooldown > 0) beatCooldown--;
    if (
        delta > 0.015 &&
        energy > 0.04 &&
        beatCooldown === 0
    ) {
        globalThis.__beatPulse = 1.0;
        beatCooldown = 6;
        const now = performance.now();
        if (lastBeatTime > 0) {
            const diff = now - lastBeatTime;
            if (diff > 200 && diff < 2000) {
                let bpm = 60000 / diff;
                // normaliza
                while (bpm < 80) bpm *= 2;
                while (bpm > 180) bpm /= 2;
                bpmHistory.push(bpm);
                if (bpmHistory.length > 10) bpmHistory.shift();
                const avgBPM =
                    bpmHistory.reduce((a, b) => a + b, 0) / bpmHistory.length;
                if (bpmStable === 0) { //antjump
                    bpmStable = avgBPM;
                }
                let diffBpm = Math.abs(avgBPM - bpmStable);
                if (diffBpm < 3) {
                    // segue rápido se já perto
                    bpmStable += (avgBPM - bpmStable) * 0.2;
                    bpmConfidence = Math.min(bpmConfidence + 1, 10);
                } else {
                    // ignora saltos bruscos
                    bpmConfidence--;
                    if (bpmConfidence <= 0) {
                        bpmStable += (avgBPM - bpmStable) * 0.05;
                    }
                }
                // resultado final
                globalThis.__bpm = bpmStable;
                //console.log("BPM:", bpmStable.toFixed(1));

            }
        }
        lastBeatTime = now;
        //console.log("BEAT REAL");
    }
    lastEnergy = energy;
    globalThis.__beatPulse *= 0.9;
}



function faceChange(nome, valor) {
    var dictionary = objectMain.morphTargetDictionary;
    var count = 0;
    if (valor > 1) { valor = 1; }
    if (valor < 0) { valor = 0; }
    for (var key in dictionary) {
        if (key === nome) {
            objectMain.morphTargetInfluences[count] = valor;
        } else if (key === '') {
            objectMain.morphTargetInfluences[count] = 0;
        }
        count += 1;
    }
    count = 0;
    morphiListArray = objectMain.morphTargetInfluences;
}

function traduzirInverso(original) {
    var arr = tradutor.split("\n");
    var retorno = original;
    for (var i = 0; i < arr.length; i++) {
        var parr = arr[i].trim().split('	-	');
        if (parr.length > 1)
            if (parr[1].trim() == original.trim()) {
                retorno = parr[0].trim();
                break;
            }
    }
    return retorno;
}

function traduzir(original) {
    return original;
    var arr = tradutor.split("\n");
    var retorno = original;
    for (var i = 0; i < arr.length; i++) {
        var parr = arr[i].trim().split('	-	');
        if (parr.length > 1)
            if (parr[0].trim() == original.trim()) {
                retorno = parr[1].trim();
                break;
            }
    }
    return retorno;
}

var tradutor =
    `笑い	-	Rir
	まばたき	-	Piscando
	ウィンク	-	Wink
	ウィンク右	-	Pisque à direita
	ウィンク２	-	Piscadela 2
	ｳｨﾝｸ２右	-	Link 2 à direita
	びっくり	-	Surpreso
	悲しい	-	Triste
	じと目	-	Olhos e olhos
	あ	-	Oh
	い	-	Eu
	う	-	U
	え	-	Eh
	お	-	Você
	お-	-	Oh-
	いー	-	Bem
	○	-	○
	▲	-	▲
	にやり	-	Lança
	口角下げ	-	Redução do canto da boca
	えー	-	Bem
	泣き	-	Chorando
	にこり	-	Sorriso
	上	-	Acima
	困る	-	Estar em apuros
	怒り	-	Raiva
	上歯上げ	-	Elevando os dentes
	下歯上げ	-	Dentes inferiores
	下歯さげ	-	Dentes inferiores
	歯なし	-	Sem dentes
	瞳小	-	Aluno pequeno
	こっちみんな	-	Todo mundo aqui
	口小	-	Pequeno`;