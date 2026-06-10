import * as THREE from 'three';
//import { baseGLB, deFaultTpose } from './base.js';
import { DRACOLoader, GLTFLoader } from './GLTFLoader.js'
import { FBXLoader } from './FBXLoader.js';
import * as PAKO from "./pako.js";

const mixamoRigMap = {
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
};

const bipedRigMap = {
  "Bip01": "hips",
  "Bip01 Pelvis": "hips",
  "Bip01 Spine": "spine",
  "Bip01 Spine1": "chest",
  "Bip01 Spine2": "upperChest",
  "Bip01 Neck": "neck",
  "Bip01 Head": "head",
  "Bip01 L Clavicle": "leftShoulder",
  "Bip01 L UpperArm": "leftUpperArm",
  "Bip01 L Forearm": "leftLowerArm",
  "Bip01 L Hand": "leftHand",
  "Bip01 R Clavicle": "rightShoulder",
  "Bip01 R UpperArm": "rightUpperArm",
  "Bip01 R Forearm": "rightLowerArm",
  "Bip01 R Hand": "rightHand",
  "Bip01 L Thigh": "leftUpperLeg",
  "Bip01 L Calf": "leftLowerLeg",
  "Bip01 L Foot": "leftFoot",
  "Bip01 L Toe0": "leftToes",
  "Bip01 R Thigh": "rightUpperLeg",
  "Bip01 R Calf": "rightLowerLeg",
  "Bip01 R Foot": "rightFoot",
  "Bip01 R Toe0": "rightToes",
};

export class MixamoIntegration {
  constructor({ fbxloader = null, gltfloader = null, dracoloader = null } = {}) {
    this.models = new Map(); // model → { mixer, actions }
    this.rawAnimationData = null;
    //this.modelCache = new Map();
    this.fbxloader = fbxloader || new FBXLoader();
    this.gltfloader = gltfloader || new GLTFLoader();
    this.dracoloader = dracoloader || new DRACOLoader();
    this.objloader = new THREE.ObjectLoader();
    this.baseTPoseModel = null;
    this.tposeDefault = {};
    this.useHips = false;
    this.usePosition = false
    this.debug = false;
  }


  async setTPoseReference() {
    const basemodel = await new Promise((resolve, reject) =>
      this.fbxloader.load('./base/base_rigged.fbx', resolve, undefined, reject)
    );
    //const model = basemodel.scene || basemodel.scenes[0]; // GLTFLoader retorna gltf, não um model direto    
    basemodel.scale.set(1, 1, 1);
    basemodel.updateMatrixWorld(true);
    this.baseTPoseModel = basemodel;
    

    let animation = basemodel.animations[0];
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
    this.tposeDefault = cleanedAnimation;
  }


  async create(scene, animations, options = {}) {
    this.useHips = options.useHips === true;
    this.usePosition = options.usePosition === true;
    this.scene = scene;

    await this.setTPoseReference();

    if (animations) {
      let raw;
      if (animations) {
        const arrayBuffer = await fetch(animations).then(r => r.arrayBuffer());
        const uint8 = new Uint8Array(arrayBuffer);
        raw = this.decompressJSON(uint8);
      } else {
        raw = await fetch(animations).then(r => r.json());
      }
      this.rawAnimationData = this.filterAnimationAll(raw);
    } else {
      this.rawAnimationData = this.filterAnimationAll([this.tposeDefault.toJSON()]);
    }

    return this;
  }


  async correctAllHipsSmart(model, angleThresholdDeg = 10, fps = 30) {
  const baseModel = this.cloneSkinnedModelSafe(this.baseTPoseModel);
  const mixerBase = new THREE.AnimationMixer(baseModel);
  const mixerTarget = model.mixamo.mixer;

  const clipBase = {};
  const clipTarget = model.mixamo.actions;

  // Criar ações base com mesmo nome das ações do modelo
  for (const clipName in clipTarget) {
    const rawClip = this.rawAnimationData.find(a => a.name === clipName);
    if (!rawClip) continue;
    const parsed = THREE.AnimationClip.parse(rawClip);
    const filtered = this.filterAnimationLock([parsed.toJSON()])[0];
    const clip = THREE.AnimationClip.parse(filtered);
    clipBase[clipName] = mixerBase.clipAction(clip);
  }

  const targetHips = model.getObjectByName('mixamorigHips');
  if (!targetHips) return;

  for (const clipName in clipTarget) {
    const baseAction = clipBase[clipName];
    const targetAction = clipTarget[clipName];
    if (!baseAction || !targetAction) continue;

    const clip = targetAction.getClip();
    const duration = clip.duration;
    const frames = Math.ceil(duration * fps);
    const delta = 1 / fps;

    const times = [];
    const values = [];

    baseAction.play();
    targetAction.play();

    for (let i = 0; i <= frames; i++) {
      const t = i * delta;

      mixerBase.setTime(t);
      mixerTarget.setTime(t);

      baseModel.updateMatrixWorld(true);
      model.updateMatrixWorld(true);

      const qBase = new THREE.Quaternion().setFromRotationMatrix(baseModel.matrixWorld);
      const qTarget = new THREE.Quaternion().setFromRotationMatrix(model.matrixWorld);

      const angle0 = qBase.angleTo(qTarget);
      const offset = qBase.clone().multiply(qTarget.clone().invert());
      const qTest = offset.clone().multiply(qTarget);
      const angle1 = qBase.angleTo(qTest);
      const improvement = angle0 - angle1;

      let qFinal;
      if (improvement > THREE.MathUtils.degToRad(1)) {
        const qOrig = targetHips.quaternion.clone();
        const qAdj = offset.clone().multiply(qOrig);
        const alpha = Math.min(improvement / angle0, 1);
        qFinal = qOrig.clone().slerp(qAdj, alpha);
      } else {
        qFinal = targetHips.quaternion.clone();
      }

      times.push(t);
      values.push(qFinal.x, qFinal.y, qFinal.z, qFinal.w);
    }

    baseAction.stop();
    targetAction.stop();

    const newTrack = new THREE.QuaternionKeyframeTrack(
      `${targetHips.name}.quaternion`,
      times,
      values
    );

    const newTracks = clip.tracks.filter(t => t.name !== `${targetHips.name}.quaternion`);
    newTracks.push(newTrack);

    const newClip = new THREE.AnimationClip(clip.name, clip.duration, newTracks);
    const newAction = mixerTarget.clipAction(newClip);
    model.mixamo.actions[clipName] = newAction;
    model.mixamo.actions[clipName].novo = true;
  }
}


 async load(input, animations = null) {  
  let model;
  let url, extension;

  this.baseTPoseModel = null;
  await this.setTPoseReference();

  
  if (typeof input === 'string') {
    url = input;
    extension = url.split('.').pop().toLowerCase();
  } else if (typeof input === 'object' && input.url && input.extension) {
    url = input.url;
    extension = input.extension.toLowerCase();
  } else {
    throw new Error('Invalid input to loadModel');
  }

  // Carrega animações comprimidas (se houver)
  if (animations) {
    const arrayBuffer = await fetch(animations).then(r => r.arrayBuffer());
    const uint8 = new Uint8Array(arrayBuffer);
    const raw = this.decompressJSON(uint8);
    this.rawAnimationData = this.filterAnimationAll(raw);
  }

  // Verifica cache
  /*if (this.modelCache.has(url)) {
    model = this.cloneSkinnedModelSafe(this.modelCache.get(url));
  } else {*/
    let loaderPromise;

    if (extension === 'fbx') {
      loaderPromise = new Promise((resolve, reject) =>
        this.fbxloader.load(url, resolve, undefined, reject)
      );
    } else if (extension === 'gltf' || extension === 'glb') {
      loaderPromise = new Promise((resolve, reject) =>
        this.gltfloader.load(url, resolve, undefined, reject)
      );
    } else if (extension === 'bin') {
      const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
      const json = this.decompressJSON(new Uint8Array(arrayBuffer));
      model = this.objloader.parse(json);
    } else {
      throw new Error(`Unsupported file format: .${extension}`);
    }

    if (!model && loaderPromise) {
      const loaded = await loaderPromise;
      model = extension === 'fbx' ? loaded : loaded.scene;
    }

    //const cleanClone = this.cloneSkinnedModelSafe(model);
    //this.modelCache.set(url, cleanClone);
    model.userData.url = url;
  //}

  if (this.debug) {
    const helper = new THREE.SkeletonHelper(model);
    helper.material.linewidth = 2;
    helper.material.color.set(0x00ff00);
    helper.visible = true;
    model.userData.skeletonHelper = helper;
    model.add(helper);
  }

  // Normaliza nomes de ossos
  model.traverse(obj => {
    if (obj.isBone) {
      obj.name = this.normalizeBoneName(obj.name.replace(/^mixamorig\d*_?/, 'mixamorig'));
      obj.scale.set(1, 1, 1);
    }
  });

  const skinnedMesh = model.getObjectByProperty('type', 'SkinnedMesh');
  if (!skinnedMesh || !skinnedMesh.skeleton) {
    throw new Error("No skinnedMesh Found");
  }
  skinnedMesh.skeleton.pose();
  model.skeleton = skinnedMesh.skeleton;

  if (!this.rawAnimationData) this.rawAnimationData = [];
  this.rawAnimationData = [
    this.tposeDefault.toJSON(),
    ...this.rawAnimationData.filter(
      a => a.name !== 'tpose' && a.name !== 'Armature|tpose'
    )
  ];

  // ✅ Correção: usar cópia limpa da baseTPoseModel
  const animationModel = this.cloneSkinnedModelSafe(this.baseTPoseModel);
  animationModel.updateMatrixWorld(true);

  const rigMap = model.getObjectByName("mixamorigHips") ? mixamoRigMap
               : model.getObjectByName("Bip01") || model.getObjectByName("bip_Hips") ? bipedRigMap
               : null;

  const parsedClips = this.rawAnimationData.map((a) => {
    const filtered = this.filterAnimationLock([a])[0];
    let clip = THREE.AnimationClip.parse(filtered);
    clip.name = clip.name.replace(/^Armature\|/, '');
    clip.tracks.forEach((track) => {
      track.name = track.name.replace(/^mixamorig\d*_?/, 'mixamorig');
    });

    if (rigMap) {
      clip = this.retargetAnimations(clip, animationModel, model, rigMap);
    }
  clip.trim();
  clip.optimize();
    return clip;
  });



  const mixer = new THREE.AnimationMixer(model);

  const actions = parsedClips.reduce((acc, clip) => {
    acc[clip.name] = mixer.clipAction(clip);
    acc[clip.name].clampWhenFinished = true;
    acc[clip.name].zeroSlopeAtEnd = true;    
    acc[clip.name] = THREE.LoopRepeat;
    return acc;
  }, {});

  model.mixamo = {
    mixer,
    actions,
    bones: this.extractUpperLowerBones(model),
  };

  this.models.set(model, model.mixamo);
  delete model.animations;
  this.scene.add(model);

  if (this.debug) {
    const spine = model.getObjectByName('mixamorigSpine') || model.getObjectByName('bip_Spine');
    const axesHelper = new THREE.AxesHelper(60);
    model.userData.axesHelper = axesHelper;
    spine.add(axesHelper);
  }

  this.reloadAnimations(model);  
  await this.correctAllHipsSmart(model);
  this.updateHelpers(model);
  return model;
}


  setHeight(model, targetHeight) {
    // 1. Calcula AABB dos bones (posição mundial)
    const box = new THREE.Box3();
    const boneWorldPos = new THREE.Vector3();
    model.updateMatrixWorld(true);

    model.traverse(obj => {
      if (obj.isBone) {
        obj.getWorldPosition(boneWorldPos);
        box.expandByPoint(boneWorldPos);
      }
    });

    const size = new THREE.Vector3();
    box.getSize(size);
    const currentHeight = size.y;

    if (currentHeight === 0) {
      console.warn("Altura zero. Não é possível escalar.");
      return;
    }

    const scaleFactor = targetHeight / currentHeight;

    // 2. Aplica o scale nas posições locais dos bones (posição em relação ao pai)
    model.traverse(obj => {
      if (obj.isBone) {
        obj.position.multiplyScalar(scaleFactor);
      }
    });

    // 3. Recalcula os boneInverses (importante para o skinning não quebrar)
    const skinnedMeshes = [];
    model.traverse(obj => {
      if (obj.isSkinnedMesh) {
        skinnedMeshes.push(obj);
      }
    });

    skinnedMeshes.forEach(mesh => {
      mesh.skeleton.calculateInverses();
    });

    // 4. Garante que a escala do modelo é 1,1,1
    model.scale.set(1, 1, 1);
    model.updateMatrixWorld(true);
    this.updateHelpers(model);
  }


  async scaleHeight(model, object3D_or_height) {
  const waitForRender = async () => {
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  await waitForRender();
  model.updateMatrixWorld(true);

  let targetHeight;

  if (typeof object3D_or_height === 'number') {
    targetHeight = object3D_or_height;
  } else if (object3D_or_height.isObject3D) {
    const box = this.getModelBox3D(object3D_or_height);
    if (!box) return model;
    const size = new THREE.Vector3();
    box.getSize(size);
    targetHeight = size.y;
  } else {
    console.warn('scaleHeight: parâmetro inválido');
    return model;
  }

  const currentBox = this.getModelBox3D(model);
  if (!currentBox) return model;

  const currentSize = new THREE.Vector3();
  currentBox.getSize(currentSize);
  const currentHeight = currentSize.y;

  if (currentHeight > 0 && targetHeight > 0) {
    const newscale = targetHeight / currentHeight;
    model.scale.multiplyScalar(newscale);

    model.userData.mixamo = model.userData.mixamo || {};
    model.userData.mixamo.scale = newscale;

    model.updateMatrixWorld(true);
    await waitForRender(); // garante que visualmente está atualizado
  }
  

  this.updateHelpers(model);
  return model;
}


  getHeight(object3D) {
    let box = this.getModelBox3D(object3D);
    if (!box) return 0;

    let size = new THREE.Vector3();
    box.getSize(size);
    return size.y;
  }


  getCenter(object3D) {
  const box = this.getModelBox3D(object3D);
  if (!box) return null;

  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
}


  playExclusive(model, name, fadeTime = 0.3) {    
    const mixer = model.mixamo.mixer;
    const actions = model.mixamo.actions;    
    const next = actions[name];
    if (!next) return;
  
    // ✅ Restaurar o estado original de TODOS os actions ANTES de fazer qualquer coisa
    for (const key in actions) {
      const action = actions[key];
      if (action._originalState) {
        this.restoreActionBindings(action);
      }
    }
  
    // ✅ Agora fazer o crossfade ou stop das outras ações
    for (const key in actions) {
      const action = actions[key];
      if (!action.isRunning()) continue;
      if (action === next) continue;
  
      if (fadeTime > 0) {
        action.crossFadeTo(next, fadeTime, false);
      } else {
        action.stop();        
      }
    }
  
    // ✅ Play da ação principal
    next.reset().setEffectiveWeight(1).play();    
  }


  change(model, name, weight = 1) {
    const action = model.mixamo.actions[name];
    if (action) {
      action.reset();
      action.setEffectiveWeight(weight).play();
    }
  }

  
  async changeWithLerp(model, name, targetWeight = 1, time = 0.3) {
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


  changeUpperBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.upperBody;
    return this.setPartial(model, boneNames, name, time);
  }

  
  changeLowerBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.lowerBody;
    return this.setPartial(model, boneNames, name, time);
  }

    
  running(model) {
    return Object.entries(model.mixamo.actions)
      .filter(([_, a]) => a.isRunning())
      .map(([name]) => name);
  }


  stop(model) {
    Object.values(model.mixamo.actions).forEach(a => {
      a.stop().setEffectiveWeight(1.0);
    });    
  }


  stopUpperBody(model) {
    const upperBones = model.mixamo.bones.upperBody;
    this.stopPartialAnimations(model, upperBones);
  }

  
  stopLowerBody(model) {
    const lowerBones = model.mixamo.bones.lowerBody;
    this.stopPartialAnimations(model, lowerBones);
  }


  stopPartialAnimations(model, boneNames) {
    for (const [name, action] of Object.entries(model.mixamo.actions)) {
      if (!action.isRunning()) continue;
  
      const targets = action._propertyBindings.map(b => b.binding?.targetObject?.name);
      const overlaps = targets.some(t => boneNames.includes(t));
      if (!overlaps) continue;
  
      this.restoreActionBindings(action);
      action.stop();
  
      // Remove ações clonadas (ex: walk_female__upper)
      if (name.includes('__')) {
        delete model.mixamo.actions[name];
      }
    }
  }


  clearModelAnimations(model) {
  Object.values(model.mixamo.actions).forEach(action => {
    this.restoreActionBindings(action); // ← importante!
    action.stop();
  });

  model.mixamo.actions = {}; // 💥 zera todas as ações, inclusive clones
  model.mixamo.mixer.stopAllAction();
}


  unload(model) {
    if (!model) return;
  
    this.clearModelAnimations(model); // 💥 limpa bindings, mixers, clones
    this.scene.remove(model);
    this.dispose(model);
    this.models.delete(model);
  
    // Remover helpers visuais
    if (model.userData.skeletonHelper) {
      model.userData.skeletonHelper.parent.remove(model.userData.skeletonHelper);
      model.userData.skeletonHelper.dispose?.();
      model.userData.skeletonHelper = null;
    }
    if (model.userData.axesHelper) {
      model.userData.axesHelper.parent.remove(model.userData.axesHelper);
      model.userData.axesHelper = null;
    }
  }
  

  dispose(model) {
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


  update(delta) {
    this.models.forEach(({ mixer }) => mixer.update(delta));
    



  }

  
  async addAnimation(model,input, finalName) {
    if (!finalName || typeof finalName !== 'string') {
      console.warn("No Name");
      return;
    }

    let extension = typeof input === 'string' ? input.split('.').pop().toLowerCase()
      : input.name ? input.name.split('.').pop().toLowerCase()
        : null;

    let animations = [];

    try {
      if (extension === 'json') {
        const jsonText = typeof input === 'string'
          ? await fetch(input).then(res => res.text())
          : await input.text();
        const json = JSON.parse(jsonText);
        animations = Array.isArray(json) ? json : [json];
      }

      else if (extension === 'bin') {
        const buffer = typeof input === 'string'
          ? await fetch(input).then(r => r.arrayBuffer())
          : await input.arrayBuffer?.() || input;
        const uint8 = new Uint8Array(buffer);
        animations = this.decompressJSON(uint8);
      }

      else if (extension === 'fbx') {
        const result = await new Promise((resolve, reject) =>
          this.fbxloader.load(typeof input === 'string' ? input : URL.createObjectURL(input), resolve, undefined, reject)
        );
        animations = result.animations.map(a => a.toJSON());
      }

      else if (extension === 'glb' || extension === 'gltf') {
        const result = await new Promise((resolve, reject) =>
          this.gltfloader.load(typeof input === 'string' ? input : URL.createObjectURL(input), resolve, undefined, reject)
        );
        animations = result.animations.map(a => a.toJSON());
      }

      else {
        throw new Error("Not Supported.");
      }

      const filtered = this.filterAnimationAll(animations);

      let selected = filtered[0];

      if (filtered.length > 1) {
        const nameList = filtered.map(a => a.name || "NoName");
        const chosen = prompt("Chose :\n" + nameList.join('\n'));
        if (!chosen) {
          alert("No Choice.");
          return;
        }
        selected = filtered.find(a => a.name === chosen);
        if (!selected) {
          alert("Animation not Found");
          return;
        }
      }

      // Força o nome desejado
      selected.name = finalName;
      let clip = THREE.AnimationClip.parse(selected);
      clip.trim();
      clip.optimize();
      selected = clip.toJSON();

      if (!this.rawAnimationData) this.rawAnimationData = [];

      const index = this.rawAnimationData.findIndex(a => a.name === finalName);
      if (index !== -1) {
        this.rawAnimationData[index] = selected;
      } else {
        this.rawAnimationData.push(selected);
      }

      this.reloadAnimations(model);
      return model;
      console.log(`Animatio added "${finalName}".`);
    } catch (e) {
      console.error("Error load animation:", e);
    }
  }



  async loadAnimations(jsonFile) {
    const raw = await fetch(jsonFile).then(r => r.json());
    this.rawAnimationData = this.filterAnimationAll(raw);
  }


  reloadAnimations(model) {
    if (!this.rawAnimationData) return;
    model.skeleton?.pose();
  
    const oldMixer = model.mixamo?.mixer;
    if (oldMixer) {
      oldMixer.stopAllAction();
      oldMixer.uncacheRoot(model);  
    }
  
    const mixer = new THREE.AnimationMixer(model);
    model.mixamo.mixer = mixer;

  
    const parsedClips = this.rawAnimationData.map((a) => {
      const clip = THREE.AnimationClip.parse(a);
      clip.name = clip.name.replace(/^Armature\|/, '');
      clip.tracks.forEach((track) => {
        track.name = track.name.replace(/mixamorig\d*/g, 'mixamorig');
      });
      return clip;
    });
  
    const actions = parsedClips.reduce((acc, clip) => {
      acc[clip.name] = mixer.clipAction(clip);      
      acc[clip.name].clampWhenFinished = true; 
      acc[clip.name].zeroSlopeAtEnd = true;
      return acc;
    }, {});
    model.mixamo.actions = actions;
  }


  downloadAnimationData(name = 'animations.bin') {
    const compressed = this.compressJSON(this.rawAnimationData);
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  async downloadAnimationUnique(input, finalName) {
  if (!finalName || typeof finalName !== 'string') {
    console.warn("No Name");
    return;
  }

  let extension = typeof input === 'string' ? input.split('.').pop().toLowerCase()
                 : input.name ? input.name.split('.').pop().toLowerCase()
                 : null;

  let animations = [];

  try {
    if (extension === 'json') {
      const jsonText = typeof input === 'string'
        ? await fetch(input).then(res => res.text())
        : await input.text();
      const json = JSON.parse(jsonText);
      animations = Array.isArray(json) ? json : [json];
    }

    else if (extension === 'bin') {
      const buffer = typeof input === 'string'
        ? await fetch(input).then(r => r.arrayBuffer())
        : await input.arrayBuffer?.() || input;
      const uint8 = new Uint8Array(buffer);
      animations = this.decompressJSON(uint8);
    }

    else if (extension === 'fbx') {
      const result = await new Promise((resolve, reject) =>
        this.fbxloader.load(typeof input === 'string' ? input : URL.createObjectURL(input), resolve, undefined, reject)
      );
      animations = result.animations.map(a => a.toJSON());
    }

    else if (extension === 'glb' || extension === 'gltf') {
      const result = await new Promise((resolve, reject) =>
        this.gltfloader.load(typeof input === 'string' ? input : URL.createObjectURL(input), resolve, undefined, reject)
      );
      animations = result.animations.map(a => a.toJSON());
    }

    else {
      throw new Error("Format not supported");
    }

    const filtered = this.filterAnimationAll(animations);
    let selected = filtered[0];

    if (filtered.length > 1) {
      const nameList = filtered.map(a => a.name || "NoName");
      const chosen = prompt("Choice:\n" + nameList.join('\n'));
      if (!chosen) {
        alert("No Choice.");
        return;
      }
      selected = filtered.find(a => a.name === chosen);
      if (!selected) {
        alert("Animation not found");
        return;
      }
    }

    // Força nome final
    selected.name = finalName;

    // Comprimir e baixar
    const compressed = this.compressJSON([selected]);
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${finalName}.bin`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);    
  } catch (e) {
    console.error("Error on export file:", e);
  }
}



  //################################ SCONDARY ##################################
  // Compactar um objeto JSON para string base64
  compressJSON(obj) {
    const json = JSON.stringify(obj);
    return PAKO.deflate(json); // Uint8Array
  }

  // Descompactar uma string base64 para objeto JSON
  decompressJSON(uint8array) {
    try {
      const inflated = PAKO.inflate(uint8array, { to: "string" });
      return JSON.parse(inflated);
    } catch (e) {
      console.warn("Failed to decompress animation");
      return [];
    }
  }

  retargetAnimations(clip, animationModel, targetModel, rigMap, scaleHips = true) {
    const tracks = [];
    const _qA = new THREE.Quaternion();
    const _qB = new THREE.Quaternion();
    const _qC = new THREE.Quaternion();
    const _vec3 = new THREE.Vector3();
  
    // ⚠️ Garantir que as matrizes globais estão corretas antes de tudo
    animationModel.updateMatrixWorld(true);
    targetModel.updateMatrixWorld(true);
    this.baseTPoseModel?.updateMatrixWorld(true);
  
    const motionHips = animationModel.getObjectByName("mixamorigHips") || animationModel.getObjectByName("Bip01");
    const targetHips = targetModel.getObjectByName("mixamorigHips");
  
    let hipsPositionScale = 1;
    if (motionHips && targetHips && scaleHips) {
      const motionHeight = motionHips.getWorldPosition(_vec3).y;
      const targetHeight = targetHips.getWorldPosition(_vec3).y;
      hipsPositionScale = Math.abs(targetHeight / motionHeight);
    }
  
    for (const track of clip.tracks) {
      const [sourceName, prop] = track.name.split(".");
      const targetBoneName = rigMap[sourceName];
      if (!targetBoneName) continue;
  
      const targetBone = targetModel.getObjectByName(`mixamorig${targetBoneName.charAt(0).toUpperCase()}${targetBoneName.slice(1)}`);
      if (!targetBone) continue;
  
      const trackName = `${targetBone.name}.${prop}`;
  
      if (track instanceof THREE.QuaternionKeyframeTrack) {
        const values = track.values;
        const newValues = new Float32Array(values.length);
  
        const sourceBone = animationModel.getObjectByName(sourceName);
        if (!sourceBone) continue;
  
        // ⚠️ Muito importante: atualizar mundo antes de capturar poses
        sourceBone.updateMatrixWorld(true);
        targetBone.updateMatrixWorld(true);
  
        const restInv = sourceBone.getWorldQuaternion(_qA).invert();
        const parentWorld = sourceBone.parent.getWorldQuaternion(_qB);
  
        for (let i = 0; i < values.length; i += 4) {
          _qC.fromArray(values, i);
          _qC.premultiply(parentWorld).multiply(restInv);
          _qC.toArray(newValues, i);
        }
  
        tracks.push(new THREE.QuaternionKeyframeTrack(trackName, track.times, newValues));
      }
  
      else if (track instanceof THREE.VectorKeyframeTrack && targetBoneName === 'hips') {
        const values = track.values;
        const newValues = new Float32Array(values.length);
        for (let i = 0; i < values.length; i += 3) {
          newValues[i + 0] = values[i + 0] * hipsPositionScale;
          newValues[i + 1] = values[i + 1] * hipsPositionScale;
          newValues[i + 2] = values[i + 2] * hipsPositionScale;
        }
        tracks.push(new THREE.VectorKeyframeTrack(trackName, track.times, newValues));
      }
    }
  
    const newClip = new THREE.AnimationClip(clip.name, clip.duration, tracks);
    return newClip;
  }

  async setPartial(model, boneNames, animationName, lerpTime = 0.3) {
    return new Promise((resolve) => {
      const mixer = model.mixamo.mixer;
      const isUpper = boneNames.includes('mixamorigSpine') || boneNames.includes('mixamorigNeck');
      const region = isUpper ? 'upper' : 'lower';
      const clip = model.mixamo.actions[animationName]?.getClip();
      if (!clip) return resolve();
  
      // Usa um nome único por região (ex: walk_female__upper)
      const uniqueName = `${animationName}__${region}`;
      let action = model.mixamo.actions[uniqueName];
  
      // Cria clone se ainda não existe
      if (!action) {
        action = mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.loop = THREE.LoopRepeat;
        model.mixamo.actions[uniqueName] = action;
  
        // Salva estado original
        action._originalState = {
          bindings: action._propertyBindings.slice(),
          interpolants: action._interpolants.slice(),
          weights: action._propertyBindings.map(b => b.weight ?? 1)
        };
      }
  
      // Restaura os bindings
      this.restoreActionBindings(action);
      action.reset();
      action.setEffectiveWeight(0);
      action.play();
      mixer.update(0); // força atualização dos bindings
  
      // Aplica apenas aos ossos desejados
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
  
      // Remove outros bindings nas MESMAS regiões de outras ações
      for (const [name, otherAction] of Object.entries(model.mixamo.actions)) {
        if (otherAction === action || !otherAction.isRunning()) continue;
      
        const sameClip = otherAction.getClip() === action.getClip();
        if (sameClip) continue; // ← aqui está o segredo
  
        const newBindings = [];
        const newInterpolants = [];
  
        for (let i = 0; i < otherAction._propertyBindings.length; i++) {
          const boneName = otherAction._propertyBindings[i].binding?.targetObject?.name;
          if (!boneNames.includes(boneName)) {
            newBindings.push(otherAction._propertyBindings[i]);
            newInterpolants.push(otherAction._interpolants[i]);
          }
        }
  
        otherAction._propertyBindings = newBindings;
        otherAction._interpolants = newInterpolants;
      }
  
      // Lerp
      if (lerpTime <= 0) {
        action.setEffectiveWeight(1);
        filteredBindings.forEach(b => b.weight = 1);
        return resolve(action);
      }
  
      const startTime = Date.now();
      const animate = () => {
        const t = Math.min(1, (Date.now() - startTime) / (lerpTime * 1000));
        action.setEffectiveWeight(t);
        filteredBindings.forEach(b => b.weight = t);
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          action.setEffectiveWeight(1);
          filteredBindings.forEach(b => b.weight = 1);
          resolve(action);
        }
      };
      animate();
    });
  }
  
  
  #removeBindingsFromOthers(model, exceptAction, boneNames) {
    const { actions } = model.mixamo;
  
    for (const action of Object.values(actions)) {
      if (action === exceptAction || !action.isRunning()) continue;
  
      // Restaurar original se já foi alterado
      if (action._originalState) {
        this.restoreActionBindings(action);
      }
  
      // Remove apenas os ossos que o novo clip está assumindo
      const newBindings = [];
      const newInterpolants = [];
  
      for (let i = 0; i < action._propertyBindings.length; i++) {
        const target = action._propertyBindings[i].binding?.targetObject?.name;
        if (!boneNames.includes(target)) {
          newBindings.push(action._propertyBindings[i]);
          newInterpolants.push(action._interpolants[i]);
        }
      }
  
      action._propertyBindings = newBindings;
      action._interpolants = newInterpolants;
    }
  }
  

  normalizeBoneName(name) {
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


  
  filterAnimationLock(raw) {    
    const useHips = this.useHips; // Se quiser incluir movimento do Hips futuramente
    const finalAnimations = [];
    let tposeAdded = false;

    raw.forEach(anim => {
      // Verifica se o nome da animação é um tpose
      const animName = anim.name.toLowerCase();

      if (animName === 'tpose' || animName === 'armature|tpose') {
        if (!tposeAdded && this.tposeDefault) {
          try {
            // Converte o JSON da tposeDefault de volta para objeto
            const tposeAnim = this.tposeDefault.toJSON();
            finalAnimations.push(tposeAnim);
            tposeAdded = true;
          } catch (e) {
            console.warn('Erro ao aplicar tposeDefault:', e);
          }
        }
        // Ignora os outros tpose
        return;
      }

      // Filtra as tracks de acordo com o useHips
  const filteredTracks = anim.tracks.filter(track => {
  const [bone, prop] = track.name.split('.');
  if (prop === 'quaternion') return true;
  if (prop === 'position') {
    if (this.usePosition) return true;
    if (bone === 'mixamorigHips' && this.useHips) return true;
    return false;
  }
  return false;
});


      finalAnimations.push({
        ...anim,
        tracks: filteredTracks
      });
    });

    return finalAnimations;
  }


  
  filterAnimationAll(raw) {    
    const finalAnimations = [];
    let tposeAdded = false;

    raw.forEach(anim => {
      const animName = anim.name?.toLowerCase() || "";

      if (animName === 'tpose' || animName === 'armature|tpose') {
        if (!tposeAdded && this.tposeDefault) {
          try {
            const tposeAnim = this.tposeDefault.toJSON();
            finalAnimations.push(tposeAnim);
            tposeAdded = true;
          } catch (e) {
            console.warn('Erro ao aplicar tposeDefault:', e);
          }
        }
        return;
      }

      const filteredTracks = anim.tracks.filter(track => {
  const [bone, prop] = track.name.split('.');
  if (prop === 'quaternion') return true;
  if (prop === 'position') {
    if (this.usePosition) return true;
    if (bone === 'mixamorigHips' && this.useHips) return true;
    return false;
  }
  return false;
});


      finalAnimations.push({
        ...anim,
        tracks: filteredTracks
      });
    });

    return finalAnimations;
  }


  extractUpperLowerBones(model) {
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

  cloneSkinnedModelSafe(source) {
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

  _expandAABB(skinnedMesh, aabb) {
    var vertex = new THREE.Vector3();
    var temp = new THREE.Vector3();
    var skinned = new THREE.Vector3();
    var skinIndices = new THREE.Vector4();
    var skinWeights = new THREE.Vector4();
    var boneMatrix = new THREE.Matrix4();
    var skeleton = skinnedMesh.skeleton;
    var boneMatrices = skeleton.boneMatrices;
    var geometry = skinnedMesh.geometry;
    var index = geometry.index;
    var position = geometry.attributes.position;
    var skinIndex = geometry.attributes.skinIndex;
    var skinWeight = geometry.attributes.skinWeight;
    var bindMatrix = skinnedMesh.bindMatrix;
    var bindMatrixInverse = skinnedMesh.bindMatrixInverse;
    skeleton.update();
    function expand() {
      vertex.applyMatrix4(bindMatrix);
      skinned.set(0, 0, 0);
      for (var j = 0; j < 4; j++) {
        var si = skinIndices.getComponent(j);
        var sw = skinWeights.getComponent(j);
        boneMatrix.fromArray(boneMatrices, si * 16);
        temp.copy(vertex).applyMatrix4(boneMatrix).multiplyScalar(sw);
        skinned.add(temp);
      }
      skinned.applyMatrix4(bindMatrixInverse);
      aabb.expandByPoint(skinned);
    }
    if (index !== null) {
      for (var i = 0; i < index.count; i++) {
        vertex.fromBufferAttribute(position, index.getX(i));
        skinIndices.fromBufferAttribute(skinIndex, index.getX(i));
        skinWeights.fromBufferAttribute(skinWeight, index.getX(i));
        expand();
      }
    } else {
      for (var i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        skinIndices.fromBufferAttribute(skinIndex, i);
        skinWeights.fromBufferAttribute(skinWeight, i);
        expand();
      }
    }
  }

  getModelBox3D(object3D) {
    var aabb = new THREE.Box3();
    var matrixWorld = new THREE.Matrix4();
    var skinnedMeshes = [];
    // Traverse the object3D to find all SkinnedMeshes
    object3D.traverse(function (child) {
      if (child.isSkinnedMesh && child.skeleton) {
        skinnedMeshes.push(child);
      }
    });
    if (skinnedMeshes.length === 0)
      return;
    // Expand the AABB to include all SkinnedMeshes
    skinnedMeshes.forEach(skinnedMesh => {
      var tempAABB = new THREE.Box3();
      this._expandAABB(skinnedMesh, tempAABB);
      tempAABB.applyMatrix4(skinnedMesh.matrixWorld);
      aabb.union(tempAABB);
    }
    );
    return aabb;
  }

  updateHelpers(model) {
    // Remover helpers antigos, se houver
    if (model.userData.skeletonHelper) {
      model.userData.skeletonHelper.parent.remove(model.userData.skeletonHelper);
      if (model.userData.skeletonHelper.dispose)
        model.userData.skeletonHelper.dispose();
      model.userData.skeletonHelper = null;
    }

    if (model.userData.axesHelper) {
      model.userData.axesHelper.parent.remove(model.userData.axesHelper);
      model.userData.axesHelper = null;
    }

    if (this.debug == false) return;
    // Criar novo SkeletonHelper
    const skeletonHelper = new THREE.SkeletonHelper(model);
    skeletonHelper.material.linewidth = 2;
    skeletonHelper.material.depthTest = false; // opcional: desenhar por cima
    skeletonHelper.material.transparent = true;
    skeletonHelper.material.opacity = 0.8;
    scene.add(skeletonHelper);
    model.userData.skeletonHelper = skeletonHelper;

    // Criar novo AxesHelper, no centro do modelo (opcional: pode usar o hips se quiser)
    const axesHelper = new THREE.AxesHelper(60 / model.scale.y); // tamanho do eixo
    axesHelper.position.copy(model.position); // Ou pode pegar posição de algum bone, tipo hips
    scene.add(axesHelper);
    model.userData.axesHelper = axesHelper;
    const spine = model.getObjectByName('mixamorigSpine') || model.getObjectByName('bip_Spine');
    model.userData.axesHelper = axesHelper;
    spine.add(axesHelper);
  }

  restoreActionBindings(action) {
    if (!action._originalState) return;
    action._propertyBindings = action._originalState.bindings.slice();
    action._interpolants = action._originalState.interpolants.slice();
    action._propertyBindings.forEach((b, i) => {
      b.weight = action._originalState.weights[i] ?? 1;
    });
  }
  
}
