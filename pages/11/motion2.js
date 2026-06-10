import * as THREE from 'three';
//import { baseGLB, deFaultTpose } from './base.js';
import { GLTFLoader } from './GLTFLoader.js'
import { FBXLoader } from './FBXLoader.js';



export class MixamoIntegration {
  #_mixamo = null;
  constructor({ fbxloader = null, gltfloader = null } = {}) {
    this.#_mixamo = new Mixamo({ fbxloader, gltfloader });
    //Exposed
    this.create = this.#_mixamo.create.bind(this.#_mixamo);
    this.load = this.#_mixamo.loadModel.bind(this.#_mixamo);
    this.unload = this.#_mixamo.unloadModel.bind(this.#_mixamo);
    this.dispose = this.#_mixamo.disposeModel.bind(this.#_mixamo);
    this.update = this.#_mixamo.update.bind(this.#_mixamo);
    this.animation = {
      play: this.#_mixamo.playExclusive.bind(this.#_mixamo),
      playUpper: this.#_mixamo.setAnimationUpperBody.bind(this.#_mixamo),
      playLower: this.#_mixamo.setAnimationLowerBody.bind(this.#_mixamo),
      stop: this.#_mixamo.animationStopAll.bind(this.#_mixamo),
      stopUpper: this.#_mixamo.animationStopUpper.bind(this.#_mixamo),
      stopLower: this.#_mixamo.animationStopLower.bind(this.#_mixamo),
      change: this.#_mixamo.changeAnimation.bind(this.#_mixamo),
      changeLerp: this.#_mixamo.changeAnimationWithLerp.bind(this.#_mixamo),
      load: this.#_mixamo.loadAnimations.bind(this.#_mixamo),
      reload: this.#_mixamo.reloadModelAnimations.bind(this.#_mixamo),
      clear: this.#_mixamo.clearModelAnimations.bind(this.#_mixamo),
      running: this.#_mixamo.getAnimationRunning.bind(this.#_mixamo),
    };
  }
}

const debug = true;

class Mixamo {
  constructor({ fbxloader = null, gltfloader = null } = {}) {
    this.models = new Map(); // model → { mixer, actions }    
    this.modelCache = new Map();
    this.fbxloader = fbxloader || new FBXLoader();
    this.gltfloader = gltfloader || new GLTFLoader();
    this.rawAnimationData = null;
    this.baseTPoseModel = null;
    this.boneNameMap = new Map();
  }

  #normalizeBoneName(name) {
    const map = {
      // Pés e dedos
      'bip_L_Foot': 'mixamorigLeftFoot',
      'bip_R_Foot': 'mixamorigRightFoot',
      'bip_L_Toe0': 'mixamorigLeftToeBase',
      'bip_R_Toe0': 'mixamorigRightToeBase',
      'bip_L_Toe0Nub': 'mixamorigLeftToe_End',
      'bip_R_Toe0Nub': 'mixamorigRightToe_End',

      // Pernas
      'bip_L_Thigh': 'mixamorigLeftUpLeg',
      'bip_R_Thigh': 'mixamorigRightUpLeg',
      'bip_L_Calf': 'mixamorigLeftLeg',
      'bip_R_Calf': 'mixamorigRightLeg',

      // Braços
      'bip_L_UpperArm': 'mixamorigLeftArm',
      'bip_R_UpperArm': 'mixamorigRightArm',
      'bip_L_Forearm': 'mixamorigLeftForeArm',
      'bip_R_Forearm': 'mixamorigRightForeArm',

      // Mãos
      'bip_L_Hand': 'mixamorigLeftHand',
      'bip_R_Hand': 'mixamorigRightHand',

      // Tronco
      'bip_Spine': 'mixamorigSpine',
      'bip_Spine1': 'mixamorigSpine1',
      'bip_Spine2': 'mixamorigSpine2',
      'bip_Neck': 'mixamorigNeck',
      'bip_Head': 'mixamorigHead',

      // Base
      'bip_Hips': 'mixamorigHips',
      'bip_Pelvis': 'mixamorigHips',
    };

    return map[name] || name;
  }

  #isZUpModel(model) {
    const spine = model.getObjectByName('mixamorigSpine') || model.getObjectByName('bip_Spine');
    if (!spine) return false;

    const dir = new THREE.Vector3();
    spine.getWorldDirection(dir);
    return Math.abs(dir.z) > Math.abs(dir.y); // Se Z está mais "em pé" que Y
  }

  #correctModelOrientation(model) {
    model.updateMatrixWorld(true);

    const findBone = (names) =>
      names.map(name => model.getObjectByName(name)).find(Boolean);

    const hips = findBone(['mixamorigHips', 'bip_Hips', 'Hips']);
    const head = findBone(['mixamorigHead', 'bip_Head', 'Head']);
    const foot = findBone(['mixamorigLeftFoot', 'bip_L_Foot', 'LeftFoot']);

    if (!hips || !head || !foot) return;

    const headPos = new THREE.Vector3();
    const footPos = new THREE.Vector3();
    head.getWorldPosition(headPos);
    foot.getWorldPosition(footPos);

    const direction = new THREE.Vector3().subVectors(headPos, footPos).normalize();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const dot = direction.dot(yAxis);

    // Se o esqueleto estiver mais alinhado com Z ou X, rotacionar para Y
    if (dot < 0.5) {
      const up = new THREE.Vector3(0, 1, 0);
      const modelUp = new THREE.Vector3();
      hips.getWorldDirection(modelUp);

      // Corrige rotação geral - normalmente Z-up → -90º em X
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      model.quaternion.premultiply(quaternion);

      model.updateMatrixWorld(true);
    }
  }


  updateAnimations(modelUrl,aname) {
   function saveFile(name, type, data) {
    if (data !== null && navigator.msSaveBlob) {
      return navigator.msSaveBlob(new Blob([data], { type: type }), name);
    }

    var blob = new Blob([data], { type: type });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
    this.fbxloader.load(modelUrl, function (object) {
      let animation = object.animations[0];

    // Remove tracks de escala
     var filteredTracks = animation.tracks.filter(function (track) {
      return track.name.endsWith('.quaternion');
    });

    // Cria uma nova animação sem as escalas
    let cleanedAnimation = animation.clone();
    cleanedAnimation.tracks = filteredTracks;
    cleanedAnimation.name=aname;
    let data = JSON.stringify(cleanedAnimation);
    saveFile(aname+".json", "application/json", data);
      //console.log(data);
      //saveFile("animation.txt", "data:attachment/text", data);
    });
  }

  async create(scene, animations) {
    this.scene = scene;

    //this.updateAnimations('./base/a_fwalk.fbx','fwalk');

    await this.setTPoseReference(); // só precisa uma vez
    if (animations) {
      const raw = await fetch(animations).then(r => r.json());
      this.rawAnimationData = this.#filterAnimationJSONData(raw);
    } else {
      const raw = JSON.parse(this.#tposeClipDefault);
      this.rawAnimationData = this.#filterAnimationJSONData([raw]);
    }
    return this;
  }

  async loadModel(input, config = null) {
    let model;
    let url, extension;

    if (typeof input === 'string') {
      url = input;
      extension = url.split('.').pop().toLowerCase();
    } else if (typeof input === 'object' && input.url && input.extension) {
      url = input.url;
      extension = input.extension.toLowerCase();
    } else {
      throw new Error('Invalid input to loadModel');
    }


    // Carrega config de animação se existir
    if (config) {
      const raw = await fetch(config).then(r => r.json());
      this.rawAnimationData = this.#filterAnimationJSONData(raw);
    }

    // Verifica cache
    if (this.modelCache.has(url)) {
      model = this.#cloneSkinnedModelSafe(this.modelCache.get(url));
    } else {
      // Detecta extensão      
      let loaderPromise;

      if (extension === 'fbx') {
        loaderPromise = new Promise((resolve, reject) =>
          this.fbxloader.load(url, resolve, undefined, reject)
        );
      } else if (extension === 'gltf' || extension === 'glb') {
        loaderPromise = new Promise((resolve, reject) =>
          this.gltfloader.load(url, resolve, undefined, reject)
        );
      } else {
        throw new Error(`Unsupported file format: .${extension}`);
      }

      const loaded = await loaderPromise;

      // GLTFLoader retorna { scene, animations, ... }
      model = extension === 'fbx' ? loaded : loaded.scene;

      this.modelCache.set(url, this.#cloneSkinnedModelSafe(model));
    }

    if (debug) {
      const helper = new THREE.SkeletonHelper(model);
      helper.material.linewidth = 2;
      helper.material.color.set(0x00ff00); // Verde
      helper.visible = true;
      model.add(helper); // ou: this.scene.add(helper);
    }

    this.#correctModelOrientation(model);

    // Normaliza nomes de ossos
    model.traverse(obj => {
      if (obj.isBone) {
        obj.name = this.#normalizeBoneName(obj.name.replace(/^mixamorig\d*_?/, 'mixamorig'));
        obj.scale.set(1, 1, 1);
      }
    });

    const skinnedMesh = model.getObjectByProperty('type', 'SkinnedMesh');
    if (!skinnedMesh || !skinnedMesh.skeleton) {
      throw new Error("No skinnedMesh Found");
    }

    skinnedMesh.skeleton.pose();
    model.skeleton = skinnedMesh.skeleton;


  const tposeRaw = JSON.parse(this.#tposeClipDefault);
const filtered = this.#filterAnimationJSONData([tposeRaw])[0];
const indices = this.rawAnimationData
  .map((a, i) => ((a.name === 'Armature|tpose' || a.name === 'tpose') ? i : -1))
  .filter(i => i !== -1);

if (indices.length > 0) {
  // Substitui o primeiro
  this.rawAnimationData[indices[0]] = filtered;
  // Remove duplicados, se houver
  for (let i = indices.length - 1; i > 0; i--) {
    this.rawAnimationData.splice(indices[i], 1);
  }
} else {
  this.rawAnimationData.push(filtered);
}



    // Parse de animações
    const parsedClips = this.rawAnimationData.map((a) => {
      const clip = THREE.AnimationClip.parse(a);
      //this.#removeScaleTracks(clip);
      clip.name = clip.name.replace(/^Armature\|/, '');
      clip.tracks.forEach((track) => {
        track.name = track.name.replace(/^mixamorig\d*_?/, 'mixamorig');
      });
      return clip;
    });

    // Antes de retarget
    const tposeClip = parsedClips.find(c => c.name === 'tpose');
    if (tposeClip) {
      const tempMixer = new THREE.AnimationMixer(model);
      const tposeAction = tempMixer.clipAction(tposeClip);
      tposeAction.play();
      tempMixer.update(1.0); // força aplicação da pose
      if (this.#isZUpModel(model)) console.log('ZUP');
      //tempMixer.stopAllAction();
    }


    this.#retargetClipsToModel(parsedClips, model);

    // Mixer e ações
    const mixer = new THREE.AnimationMixer(model);
    const actions = parsedClips.reduce((acc, clip) => {
      acc[clip.name] = mixer.clipAction(clip);
      return acc;
    }, {});

    model.mixamo = {
      mixer,
      actions,
      bones: this.#extractUpperLowerBones(model),
    };

    this.models.set(model, model.mixamo);
    delete model.animations;

    const animations = {
      play: (name, fadeTime = 0.3) => { this.playExclusive(model, name, fadeTime); return animations; },
      playUpper: (name, time = 0.3) => { this.setAnimationUpperBody(model, name, time); return animations; },
      playLower: (name, time = 0.3) => { this.setAnimationLowerBody(model, name, time); return animations; },
      stop: () => { this.animationStopAll(model); return animations; },
      stopUpper: () => { this.animationStopUpper(model); return animations; },
      stopLower: () => { this.animationStopLower(model); return animations; },
      change: (name, weight = 1) => { this.changeAnimation(model, name, weight); return animations; },
      changeLerp: (name, targetWeight = 1, time = 0.3) => { this.changeAnimationWithLerp(model, name, targetWeight, time); return animations; },
      load: (animationsData) => { this.loadAnimations(animationsData); return animations; },
      reload: () => { this.reloadModelAnimations(model); return animations; },
      clear: () => { this.clearModelAnimations(model); return animations; },
      running: () => { return this.getAnimationRunning(model); },
    };

    model.mixamo.animations = animations;
    this.scene.add(model);
    this.autoMapBones(this.baseTPoseModel, model);

    if (debug) {
      const spine = model.getObjectByName('mixamorigSpine') || model.getObjectByName('bip_Spine');
      const axesHelper = new THREE.AxesHelper(60);
      spine.add(axesHelper);
    }

    return model;
  }


  animationStopAll(model) {
    Object.values(model.mixamo.actions).forEach(a => {
      a.stop()
        .setEffectiveWeight(1.0);
    });
  }

  animationStopUpper(model) {
    const upperBones = model.mixamo.bones.upperBody;
    for (const action of Object.values(model.mixamo.actions)) {
      if (!action.isRunning()) continue;
      if (!action._originalState) {
        // Backup original state
        action._originalState = {
          bindings: action._propertyBindings.slice(),
          interpolants: action._interpolants.slice(),
          weights: action._propertyBindings.map(binding => binding.weight)
        };
      }
      const newBindings = [];
      const newInterpolants = [];
      const bindings = action._originalState.bindings;
      const interpolants = action._originalState.interpolants;
      bindings.forEach((b, i) => {
        const target = b.binding?.targetObject?.name;
        if (!upperBones.includes(target)) {
          newBindings.push(b);
          newInterpolants.push(interpolants[i]);
        }
      });
      action._propertyBindings = newBindings;
      action._interpolants = newInterpolants;
    }
  }

  animationStopLower(model) {
    const lowerBones = model.mixamo.bones.lowerBody;
    for (const action of Object.values(model.mixamo.actions)) {
      if (!action.isRunning()) continue;
      if (!action._originalState) {
        // Salva estado original se ainda não estiver salvo
        action._originalState = {
          bindings: action._propertyBindings.slice(),
          interpolants: action._interpolants.slice(),
          weights: action._propertyBindings.map(binding => binding.weight)
        };
      }
      const newBindings = [];
      const newInterpolants = [];
      const bindings = action._originalState.bindings;
      const interpolants = action._originalState.interpolants;
      bindings.forEach((b, i) => {
        const target = b.binding?.targetObject?.name;
        if (!lowerBones.includes(target)) {
          newBindings.push(b);
          newInterpolants.push(interpolants[i]);
        }
      });
      action._propertyBindings = newBindings;
      action._interpolants = newInterpolants;
    }
  }

  changeAnimation(model, name, weight = 1) {
    const action = model.mixamo.actions[name];
    if (action) {
      action.reset();
      action.setEffectiveWeight(weight).play();
    }
  }

  async changeAnimationWithLerp(model, name, targetWeight = 1, time = 0.3) {
    const { actions } = model.mixamo;
    const action = actions[name];
    if (!action) return;
    const running = Object.values(actions).find(a => a.isRunning() && a !== action);
    action.reset().play().setEffectiveWeight(targetWeight);
    if (running) {
      running.crossFadeTo(action, time, false);
    }
    await new Promise(r => setTimeout(r, time * 1000));
  }


  playExclusive(model, name, fadeTime = 0.3) {
    const { actions } = model.mixamo;
    for (const [key, act] of Object.entries(actions)) {
      if (key !== name && act.isRunning()) {
        act.fadeOut(fadeTime);
      }
    }
    const newAction = actions[name];
    if (newAction) {
      newAction.reset().fadeIn(fadeTime).play();
    }
  }

  clearModelAnimations(model) {
    Object.values(model.mixamo.actions).forEach(action => {
      this.#restoreActionBindings(action); // <- restaurar caso tenha usado parcial
    });
    model.mixamo.mixer.stopAllAction();
  }

  getAnimationRunning(model) {
    return Object.entries(model.mixamo.actions)
      .filter(([_, a]) => a.isRunning())
      .map(([name]) => name);
  }

  async loadAnimations(jsonFile) {
    const raw = await fetch(jsonFile).then(r => r.json());
    this.rawAnimationData = this.#filterAnimationJSONData(raw);
  }

  reloadModelAnimations(model) {
    if (!this.rawAnimationData) return;

    // 1. Limpa pose atual do esqueleto (garante bone state limpo)
    model.skeleton?.pose();

    // 2. Limpa e descarta mixer antigo completamente
    const oldMixer = model.mixamo?.mixer;
    if (oldMixer) {
      oldMixer.stopAllAction();
      oldMixer.uncacheRoot(model); // Remove ações, clips e tracking do modelo
    }

    // 3. Cria mixer novo (não reaproveita nenhum do antigo)
    const mixer = new THREE.AnimationMixer(model);
    model.mixamo.mixer = mixer;

    //addTpose if not exist
    if (!this.rawAnimationData.some(a => a.name === 'Armature|tpose' || a.name === 'tpose')) {
      const tposeRaw = JSON.parse(this.#tposeClipDefault);
      this.rawAnimationData.push(this.#filterAnimationJSONData([tposeRaw])[0]);
    }

    // 4. Recria clips completamente do zero (parse do raw JSON)
    const parsedClips = this.rawAnimationData.map((a) => {
      const clip = THREE.AnimationClip.parse(a);
      this.#removeScaleTracks(clip);
      clip.name = clip.name.replace(/^Armature\|/, '');
      clip.tracks.forEach((track) => {
        track.name = track.name.replace(/mixamorig\d*/g, 'mixamorig');
      });
      return clip;
    });

    // 5. Retargeting (opcional, mas deve trabalhar com clips puros, sem modificar o modelo!)
    this.#retargetClipsToModel(parsedClips, model);

    // 6. Cria novas ações (clipAction automaticamente registra no mixer)
    const actions = parsedClips.reduce((acc, clip) => {
      acc[clip.name] = mixer.clipAction(clip);
      return acc;
    }, {});
    model.mixamo.actions = actions;
  }


  setAnimationUpperBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.upperBody;
    return this.#setPartial(model, boneNames, name, time);
  }

  setAnimationLowerBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.lowerBody;
    return this.#setPartial(model, boneNames, name, time);
  }

  unloadModel(model) {
    this.scene.remove(model);
    this.disposeModel(model);
    this.models.delete(model);
  }

  disposeModel(model) {
    model.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  downloadModel(model, name = 'model.glb') {
    const exporter = new GLTFExporter();
    exporter.parse(model, glb => {
      const blob = new Blob([glb], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }, { binary: true });
  }

  update(delta) {
    this.models.forEach(({ mixer }) => mixer.update(delta));
  }

  async setTPoseReference() {
    const gltf = await new Promise((resolve, reject) =>
      this.fbxloader.load('./base/base_rigged.fbx', resolve, undefined, reject)
    );
    const model = gltf;//gltf.scene || gltf.scenes[0]; // GLTFLoader retorna gltf, não um model direto
    model.updateMatrixWorld(true);
    this.baseTPoseModel = model;

    let animation = this.baseTPoseModel.animations[0];
    //deixa so quaternion
    var filteredTracks = animation.tracks.filter(function (track) {
      return track.name.endsWith('.quaternion');
    });
    // Remove apenas as tracks de escala
    /*var filteredTracks = animation.tracks.filter(function (track) {
      return !track.name.endsWith('.scale');
    });*/
    // Cria uma nova animação sem as escalas
    let cleanedAnimation = animation.clone();
    cleanedAnimation.tracks = filteredTracks;
    cleanedAnimation.name = 'tpose';
    this.tposeClipDefault = cleanedAnimation.toJSON();

  }

  autoMapBones(baseModel, targetModel) {
    const map = new Map();

    // Colete ossos de ambos os modelos
    const baseBones = [];

    baseModel.traverse(obj => { if (obj.type && obj.type == "Object3D") baseBones.push(obj); });

    const targetBones = [];
    targetModel.traverse(obj => { if (obj.isBone) targetBones.push(obj); });

    for (const baseBone of baseBones) {
      let bestMatch = null;
      let bestScore = -Infinity;

      for (const targetBone of targetBones) {
        const nameScore = this.#nameSimilarity(baseBone.name, targetBone.name);
        const distScore = -baseBone.position.distanceTo(targetBone.position);

        const totalScore = nameScore * 2 + distScore; // ajuste pesos aqui
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMatch = targetBone;
        }
      }

      if (bestMatch) {
        map.set(bestMatch.name, baseBone.name); // ← origem Mixamo
      }
    }

    this.#setBoneNameMap(Object.fromEntries(map));
    return map;
  }

  //######################################################################
  //################################ PRIVATE #############################
  //######################################################################
  #setBoneNameMap(map) {
    this.boneNameMap = new Map(Object.entries(map));
  }

  #nameSimilarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();

    // Remove prefixos comuns
    a = a.replace(/^(mixamorig|def|cc_base|joint|bone|bip\d*)[_\-]?/g, '');
    b = b.replace(/^(mixamorig|def|cc_base|joint|bone|bip\d*)[_\-]?/g, '');

    let score = 0;
    if (a === b) score += 10;
    if (a.includes(b) || b.includes(a)) score += 5;
    if (a[0] === b[0]) score += 1;

    return score;
  }

  #restoreActionBindings(action) {
    if (!action._originalState) return;
    action._propertyBindings = action._originalState.bindings.slice();
    action._interpolants = action._originalState.interpolants.slice();
    action._propertyBindings.forEach((binding, i) => {
      binding.weight = action._originalState.weights[i];
    });
  }

  async #setPartial(model, boneNames, animationName, lerpTime = 0.3) {
    return new Promise((resolve) => {
      const mixer = model.mixamo.mixer;
      const action = model.mixamo.actions[animationName];
      if (!action) return resolve();

      this.#stopPartialAnimations(model, boneNames); // ← limpa anterior daquela parte

      action.reset();
      action.setEffectiveWeight(0);
      action.play();
      mixer.update(0); // força bindings

      const filteredBindings = [];
      const filteredInterpolants = [];

      const allBindings = action._propertyBindings;
      const allInterpolants = action._interpolants;

      for (let i = 0; i < allBindings.length; i++) {
        const target = allBindings[i].binding?.targetObject?.name;
        if (boneNames.includes(target)) {
          filteredBindings.push(allBindings[i]);
          filteredInterpolants.push(allInterpolants[i]);
        } else {
          allBindings[i].weight = 0;
        }
      }

      action._propertyBindings = filteredBindings;
      action._interpolants = filteredInterpolants;

      if (lerpTime <= 0) {
        action.setEffectiveWeight(1);
        filteredBindings.forEach(binding => binding.weight = 1);
        return resolve(action);
      }

      const startTime = Date.now();
      function animateWeights() {
        const now = Date.now();
        const t = Math.min(1, (now - startTime) / (lerpTime * 1000));
        action.setEffectiveWeight(t);
        filteredBindings.forEach(binding => binding.weight = t);

        if (t < 1) {
          requestAnimationFrame(animateWeights);
        } else {
          resolve(action);
        }
      }

      animateWeights();
    });
  }

  #stopPartialAnimations(model, boneNames) {
    const { actions } = model.mixamo;

    for (const action of Object.values(actions)) {
      if (!action.isRunning()) continue;

      const bindings = action._propertyBindings || [];
      const allTargets = bindings.map(b => b.binding?.targetObject?.name).filter(Boolean);

      const affectsOnlyThoseBones = allTargets.every(name => boneNames.includes(name));

      if (affectsOnlyThoseBones) {
        this.#restoreActionBindings(action);
        action.stop();
      }
    }
  }



  #cloneSkinnedModelSafe(source) {
    const sourceClone = source.clone(false); // clone apenas estrutura    
    function cloneChildrenWithoutAudio(src, dst) {
      src.children.forEach(child => {
        if (child.type === 'PositionalAudio' || child.type === 'Audio') return;

        const childClone = child.clone(false);
        dst.add(childClone);
        cloneChildrenWithoutAudio(child, childClone);
      });
    }
    cloneChildrenWithoutAudio(source, sourceClone);
    const sourceSkinnedMeshes = {};
    const cloneBones = {};
    const cloneSkinnedMeshes = {};
    source.traverse(obj => {
      if (obj.isSkinnedMesh) sourceSkinnedMeshes[obj.uuid] = obj;
    });
    sourceClone.traverse(obj => {
      if (obj.isBone) cloneBones[obj.name] = obj;
      if (obj.isSkinnedMesh) cloneSkinnedMeshes[obj.name] = obj;
    });
    for (const name in cloneSkinnedMeshes) {
      const skinnedMesh = cloneSkinnedMeshes[name];
      const sourceMesh = Object.values(sourceSkinnedMeshes).find(m => m.name === name);
      if (!sourceMesh) continue;
      const sourceSkeleton = sourceMesh.skeleton;
      const orderedCloneBones = sourceSkeleton.bones.map(b => cloneBones[b.name]);
      skinnedMesh.bind(new THREE.Skeleton(orderedCloneBones, sourceSkeleton.boneInverses), skinnedMesh.matrixWorld);
    }
    return sourceClone;
  }

  #extractUpperLowerBones(model) {
    const upperKeywords = [
      "Spine", "Chest", "Neck", "Head",
      "Shoulder", "Arm", "ForeArm", "Hand"
    ];
    const lowerKeywords = [
      "Hips", "UpLeg", "Leg", "Knee", "Foot", "Toe"
    ];
    const upperBody = new Set();
    const lowerBody = new Set();
    model.traverse(obj => {
      if (obj.isBone) {
        const name = obj.name;
        for (const keyword of upperKeywords) {
          if (name.includes(keyword)) {
            upperBody.add(name);
            break;
          }
        }
        for (const keyword of lowerKeywords) {
          if (name.includes(keyword)) {
            lowerBody.add(name);
            break;
          }
        }
      }
    });
    return {
      upperBody: [...upperBody],
      lowerBody: [...lowerBody]
    };
  }


  #removeScaleTracks(clip) {
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.scale'));
  }

  #filterAnimationJSONData(raw) {
    const useHips = false; //ACTIVATE ANIMATION JUMP AND MOVE ENTIRE
    return raw.map(anim => {
      let tkx = null;
      if (!useHips) {
        tkx = anim.tracks.filter(track => {
          const [, prop] = track.name.split('.');
          return prop === 'quaternion';
        });
      } else {
        tkx = anim.tracks.filter(track => {
          const [bone, prop] = track.name.split('.');
          return prop === 'quaternion' || (prop === 'position' && bone === 'mixamorigHips');
        });
      }
      return {
        ...anim,
        tracks: tkx
      };
    });
  }


  #retargetClipsToModel(clips, model, tposeName = 'tpose') {
    if (!this.baseTPoseModel) return; // fallback se não carregou base

    this.baseTPoseModel.updateMatrixWorld(true);
    model.updateMatrixWorld(true);

    const sourceTPose = this.#extractTPoseData(this.baseTPoseModel);
    const targetTPose = this.#extractTPoseData(model);

    const safeDivide = (a, b) => (b === 0 ? 1 : a / b);
    //console.log(sourceTPose)
    //console.log(targetTPose)


    const offsets = new Map();
    for (let [name, sBone] of sourceTPose.entries()) {
      name = this.#normalizeBoneName(name.replace(/^mixamorig\d*_?/, 'mixamorig'));
      const tBone = targetTPose.get(name);
      if (!tBone) continue;
      const scale = new THREE.Vector3(
        safeDivide(tBone.scale.x, sBone.scale.x),
        safeDivide(tBone.scale.y, sBone.scale.y),
        safeDivide(tBone.scale.z, sBone.scale.z),
      );
      const pos = new THREE.Vector3().subVectors(tBone.pos, sBone.pos);
      const rot = new THREE.Matrix4()
        .copy(sBone.matrix)
        .invert()
        .multiply(tBone.matrix);

      offsets.set(name, { scale, pos, rot });
    }

    this.#filterAndRetargetQuaternions(clips, offsets);
  }



  #filterAndRetargetQuaternions(clips, offsets) {
    const useHips = false; //ACTIVATE ANIMATION JUMP AND MOVE ENTIRE
    for (const clip of clips) {
      if (!useHips) {
        clip.tracks = clip.tracks.filter(track => {
          const [, prop] = track.name.split('.');
          return prop === 'quaternion';
        });
      } else {
        clip.tracks = clip.tracks.filter(track => {
          const [bone, prop] = track.name.split('.');
          return prop === 'quaternion' || (prop === 'position' && bone === 'mixamorigHips');
        });
      }

      for (const track of clip.tracks) {
        const [boneName, prop] = track.name.split('.');
        const data = offsets.get(boneName);
        if (!data) continue;

        const q = new THREE.Quaternion();

        for (let i = 0; i < track.values.length; i += 4) {
          q.set(track.values[i], track.values[i + 1], track.values[i + 2], track.values[i + 3]);
          const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
          m.premultiply(data.rot);
          const out = new THREE.Quaternion().setFromRotationMatrix(m);
          track.values.set([out.x, out.y, out.z, out.w], i);
        }

      }
    }
  }

  #extractTPoseData(model) {
    const tpose = new Map();
    model.traverse(obj => {
      if (obj.isBone || /^mixamorig/.test(obj.name)) {
        tpose.set(obj.name, {
          matrix: obj.matrixWorld.clone(),
          pos: new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),
          scale: new THREE.Vector3().setFromMatrixScale(obj.matrixWorld),
        });
      }
    });
    return tpose;
  }


  #tposeClipDefault = null;//deFaultTpose;


}


