import * as THREE from 'three';
import { FBXLoader } from './FBXLoader.js';

export class MixamoIntegration {
  constructor() {
    this._mixamo = new Mixamo();    
    //Exposed
    this.create = this._mixamo.create.bind(this._mixamo);
    this.load = this._mixamo.loadModel.bind(this._mixamo);
    this.unload = this._mixamo.unloadModel.bind(this._mixamo);
    this.dispose = this._mixamo.disposeModel.bind(this._mixamo);
    this.update = this._mixamo.update.bind(this._mixamo);
    this.animation = {
      play: this._mixamo.playExclusive.bind(this._mixamo),   
      playUpper: this._mixamo.setAnimationUpperBody.bind(this._mixamo),   
      playLower: this._mixamo.setAnimationLowerBody.bind(this._mixamo),            
      stop: this._mixamo.animationStopAll.bind(this._mixamo),
      stopUpper: this._mixamo.animationStopUpper.bind(this._mixamo),
      stopLower: this._mixamo.animationStopLower.bind(this._mixamo),
      change: this._mixamo.changeAnimation.bind(this._mixamo),
      changeLerp: this._mixamo.changeAnimationWithLerp.bind(this._mixamo),      
      load: this._mixamo.loadAnimations.bind(this._mixamo),      
      reload: this._mixamo.reloadModelAnimations.bind(this._mixamo),      
      clear: this._mixamo.clearModelAnimations.bind(this._mixamo),
      running: this._mixamo.getAnimationRunning.bind(this._mixamo),
    };
  }
}


class Mixamo {
  constructor() {
    this.models = new Map(); // model → { mixer, actions }    
    this.modelCache = new Map();
    this.loader = new FBXLoader();
    this.rawAnimationData = null;
  }

  async create(scene, animations) {    
    this.scene = scene;
    if (animations) {
      const raw = await fetch(animations).then(r => r.json());
      this.rawAnimationData = this.#filterAnimationJSONData(raw);
    } else {
      const raw = JSON.parse(this.#tposeClipDefault);
      this.rawAnimationData = this.#filterAnimationJSONData([raw]);
    }
    return this;
  }
  
  async loadModel(url, config = null) {
    let model;
    if (config) {
      const raw = await fetch(config).then(r => r.json());
      this.rawAnimationData = this.#filterAnimationJSONData(raw);
    }
    if (this.modelCache.has(url)) {
      model = this.#cloneSkinnedModelSafe(this.modelCache.get(url));
    } else {
      model = await new Promise((resolve, reject) =>
        this.loader.load(url, resolve, undefined, reject)
      );
      this.modelCache.set(url, this.#cloneSkinnedModelSafe(model));
    }
    //bone normalize
    model.traverse(obj => {
      if (obj.isBone) {        
        obj.name = this.#normalizeBoneName(obj.name);
        //console.log('🦴 Bone normalizado:', obj.name);
        obj.scale.set(1, 1, 1); // limpa qualquer escala herdada
      }
    });
    const skinnedMesh = model.getObjectByProperty('type', 'SkinnedMesh');
    if (skinnedMesh?.skeleton) {
      skinnedMesh.skeleton.pose(); // Garante que o esqueleto começa correto
      model.skeleton = skinnedMesh.skeleton;
    }
    model.skeleton?.pose();
    //raw to AnimationClips
    const parsedClips = this.rawAnimationData.map((a) => {
      const clip = THREE.AnimationClip.parse(a);
      clip.name = this.#normalizeTrackName(clip.name);
      clip.tracks.forEach(track => {
        const parts = track.name.split('.');
        const boneName = parts[0];
        const property = parts.slice(1).join('.');
        const normalized = this.#normalizeBoneName(boneName);
        track.name = `${normalized}.${property}`;
      });
      return clip;
    });

    //tpose retarget
    this.#retargetClipsToModel(parsedClips, model);
    //mixer
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
    model.animations=undefined;
    const animations = {
      play: (name, fadeTime = 0.3) => { this.playExclusive(model, name, fadeTime);return animations;},
      playUpper: (name, time = 0.3) => {this.setAnimationUpperBody(model, name, time);return animations;},
      playLower: (name, time = 0.3) => { this.setAnimationLowerBody(model, name, time); return animations;},
      stop: () => {this.animationStopAll(model);return animations;},
      stopUpper: () => {this.animationStopUpper(model);return animations;},
      stopLower: () => { this.animationStopLower(model);return animations;},
      change: (name, weight = 1) => {this.changeAnimation(model, name, weight);return animations;},
      changeLerp: (name, targetWeight = 1, time = 0.3) => {this.changeAnimationWithLerp(model, name, targetWeight, time);return animations;},
      load: (animationsData) => {this.loadAnimations(animationsData);return animations;},
      reload: () => {this.reloadModelAnimations(model); return animations;},
      clear: () => {this.clearModelAnimations(model);return animations;},
      running: () => {return this.getAnimationRunning(model);},
    };    
    model.mixamo.animations = animations;
    
    this.scene.add(model);
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
  
    // 4. Recria clips completamente do zero (parse do raw JSON)
    const parsedClips = this.rawAnimationData.map((a) => {
      const clip = THREE.AnimationClip.parse(a);
      clip.name = this.#normalizeTrackName(clip.name);
      clip.tracks.forEach(track => {
        const parts = track.name.split('.');
        const raw = parts[parts.length - 1];
        track.name = [...parts.slice(0, -1), this.#normalizeBoneName(raw)].join('.');
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


  //######################################################################
  //################################ PRIVATE #############################
  //######################################################################
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
      "Spine", "Spine1", "Spine2", "Chest", "UpperChest",
      "Neck", "Head", "HeadTop", "Clavicle", "Shoulder", "Collar",
      "Arm", "UpperArm", "ForeArm", "Elbow", "Wrist", "Hand",
      "Thumb", "Index", "Middle", "Ring", "Pinky"
    ];
  
    const lowerKeywords = [
      "Pelvis", "Hips", "Hip", "Thigh", "UpLeg", "Leg", "Shin", "Knee", "Calf",
      "Foot", "Toe", "ToeBase"
    ];
  
    const upperBody = new Set();
    const lowerBody = new Set();
  
    model.traverse(obj => {
      if (!obj.isBone) return;
      const raw = obj.name;
      const name = this.#normalizeBoneName(raw); // << agora sempre normaliza
  
      const upperMatch = upperKeywords.some(kw => name.includes(kw));
      const lowerMatch = lowerKeywords.some(kw => name.includes(kw));
  
      if (upperMatch) upperBody.add(name);
      if (lowerMatch) lowerBody.add(name);
    });
  
    //console.log('✅ Ossos upperBody:', [...upperBody]);
    //console.log('✅ Ossos lowerBody:', [...lowerBody]);
  
    return {
      upperBody: [...upperBody],
      lowerBody: [...lowerBody]
    };
  }
  

  #normalizeBoneName(rawName) {
    let name = rawName;
  
    // Remove prefixos comuns
    name = name
      .replace(/^mixamorig\d*/i, '')
      .replace(/^mixamo/i, '')
      .replace(/^Armature\|?/i, '')
      .replace(/^Bip0?_?|^Bip01_?/i, '')
      .replace(/^ValveBiped\.Bip01_?/i, '')
      .replace(/^DEF_|^CTRL_|^ORG_|^MCH_|^FK_|^IK_/i, '')
      .replace(/_Nub|_end$/i, '')
      .replace(/\.L$|\.R$/i, '')
      .replace(/\s+/g, '');
  
    // boneL_ → boneLeft / boneR_ → boneRight
    name = name.replace(/^boneL_/, 'boneLeft').replace(/^boneR_/, 'boneRight');
  
    // Map dedos genéricos para nomes compatíveis
    name = name
      .replace(/HandFinger0(1)?/g, 'HandHandThumb1')
      .replace(/HandFinger1(1)?/g, 'HandHandIndex1')
      .replace(/HandFinger2(1)?/g, 'HandHandMiddle1')
      .replace(/HandFinger3(1)?/g, 'HandHandRing1')
      .replace(/HandFinger4(1)?/g, 'HandHandPinky1');
  
    // Garantir que partes principais estão corretas
    name = name
      .replace(/Shoulder/i, 'Shoulder')
      .replace(/UpperArm|Arm/i, 'Arm')
      .replace(/ForeArm|Forearm|Elbow/i, 'ForeArm')
      .replace(/Hand/i, 'Hand')
      .replace(/Leg/i, 'Leg')
      .replace(/UpLeg|Thigh/i, 'UpLeg')
      .replace(/Foot/i, 'Foot')
      .replace(/ToeBase|Toe0/i, 'ToeBase')
      .replace(/Toe/i, 'Toe')
      .replace(/Hips|Pelvis/i, 'Hips')
      .replace(/Spine1?/i, 'Spine1')
      .replace(/Spine2|Chest/i, 'Spine1') // compatível
      .replace(/Neck/i, 'Neck')
      .replace(/HeadTop_End|HeadTop|HeadNub/i, 'HeadTop')
      .replace(/Head/i, 'Head');
  
    // Assegura capitalização
    name = name.charAt(0).toUpperCase() + name.slice(1);
  
    return name.startsWith('bone') ? name : `bone${name}`;
  }
  
  
  #findClosestBoneMatch(target, boneList, maxDistance = 3) {
    let bestMatch = null;
    let bestScore = Infinity;
  
    for (const boneName of boneList) {
      const score = this.#levenshteinDistance(target, boneName);
      if (score < bestScore && score <= maxDistance) {
        bestScore = score;
        bestMatch = boneName;
      }
    }
  
    return bestMatch;
  }
  
  // Distância de Levenshtein (leve e eficaz)
  #levenshteinDistance(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
      Array(a.length + 1).fill(0)
    );
  
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // remoção
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j - 1] + cost // substituição
        );
      }
    }
  
    return matrix[b.length][a.length];
  }
  
  

  #normalizeTrackName(rawName) {
    // Identifica a última ocorrência entre '|', ':' ou '_'
    const lastIndex = Math.max(
      rawName.lastIndexOf('|'),
      rawName.lastIndexOf(':'),
      rawName.lastIndexOf('_')
    );  
    const name = lastIndex >= 0 ? rawName.substring(lastIndex + 1) : rawName;  
    // Capitaliza primeira letra    
    return name;
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
    const mixer = new THREE.AnimationMixer(model);
    const tposeClip = clips.find(c => c.name === tposeName);
    if (!tposeClip) {
      console.warn('T-Pose not found in animation set');
      return;
    }

    const tposeAction = mixer.clipAction(tposeClip);
    tposeAction.play();
    mixer.update(0);

    const tposeBones = new Map();
    model.traverse(obj => {
      if (obj.isBone) {
        tposeBones.set(obj.name, {
          matrix: obj.matrixWorld.clone(),
          pos: new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),
          scale: new THREE.Vector3().setFromMatrixScale(obj.matrixWorld),
        });
      }
    });

    tposeAction.stop();
    model.skeleton.pose();

    const modelBones = new Map();
    model.traverse(obj => {
      if (obj.isBone) {
        modelBones.set(obj.name, {
          matrix: obj.matrixWorld.clone(),
          pos: new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),
          scale: new THREE.Vector3().setFromMatrixScale(obj.matrixWorld),
        });
      }
    });

    const offsets = new Map();
    for (const [name, tBone] of tposeBones.entries()) {
      const mBone = modelBones.get(name);
      if (!mBone) continue;

      const scale = new THREE.Vector3(
        mBone.scale.x / tBone.scale.x || 1,
        mBone.scale.y / tBone.scale.y || 1,
        mBone.scale.z / tBone.scale.z || 1
      );

      const pos = new THREE.Vector3().subVectors(mBone.pos, tBone.pos);

      const rot = new THREE.Matrix4()
        .copy(tBone.matrix)
        .invert()
        .multiply(mBone.matrix);

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
        let data = offsets.get(boneName);
        if (!data) {
          const closest = this.#findClosestBoneMatch(boneName, [...offsets.keys()]);
          if (closest) {
            console.warn(`🔁 Bone '${boneName}' not found, using closest match: '${closest}'`);
            data = offsets.get(closest);
          } else {
            continue; // skip if nothing close enough
          }
        }


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

  #tposeClipDefault = '{"name":"Armature|tpose","duration":0.03333333507180214,"tracks":[{"name":"mixamorig12Head.quaternion","times":[0,0.03333333507180214],"values":[-6.097708560304227e-9,-1.1711157196570703e-19,3.105272208675865e-19,1,-6.097708560304227e-9,-1.1711157196570703e-19,3.105272208675865e-19,1],"type":"quaternion"},{"name":"mixamorig12RightHandMiddle2.quaternion","times":[0,0.03333333507180214],"values":[-0.0002005655551329255,-0.008751949295401573,0.009559807367622852,0.9999159574508667,-0.0002005655551329255,-0.008751949295401573,0.009559807367622852,0.9999159574508667],"type":"quaternion"},{"name":"mixamorig12RightHandPinky4.quaternion","times":[0,0.03333333507180214],"values":[4.3597543708528974e-7,-2.2770841212604864e-7,-3.3804462873376906e-7,1,4.3597543708528974e-7,-2.2770841212604864e-7,-3.3804462873376906e-7,1],"type":"quaternion"},{"name":"mixamorig12LeftHandPinky3.quaternion","times":[0,0.03333333507180214],"values":[0.00008104406151687726,-0.01632729358971119,0.009443401359021664,0.9998220801353455,0.00008104406151687726,-0.01632729358971119,0.009443401359021664,0.9998220801353455],"type":"quaternion"},{"name":"mixamorig12LeftHandRing2.quaternion","times":[0,0.03333333507180214],"values":[-0.00006098767335060984,0.005662210751324892,-0.002513870829716325,0.9999808073043823,-0.00006098767335060984,0.005662210751324892,-0.002513870829716325,0.9999808073043823],"type":"quaternion"},{"name":"mixamorig12LeftHandMiddle2.quaternion","times":[0,0.03333333507180214],"values":[-0.0001668157201493159,0.012585718184709549,-0.006192950531840324,0.9999015927314758,-0.0001668157201493159,0.012585718184709549,-0.006192950531840324,0.9999015927314758],"type":"quaternion"},{"name":"mixamorig12LeftHandThumb4.quaternion","times":[0,0.03333333507180214],"values":[-3.166497464235363e-8,3.3527612686157227e-8,3.3527619791584584e-8,1,-3.166497464235363e-8,3.3527612686157227e-8,3.3527619791584584e-8,1],"type":"quaternion"},{"name":"mixamorig12RightHandIndex2.quaternion","times":[0,0.03333333507180214],"values":[-0.00020128996402490884,-0.008276883512735367,0.01026945374906063,0.9999129772186279,-0.00020128996402490884,-0.008276883512735367,0.01026945374906063,0.9999129772186279],"type":"quaternion"},{"name":"mixamorig12RightHandThumb1.quaternion","times":[0,0.03333333507180214],"values":[0.2560127079486847,-0.04318065941333771,-0.2294372320175171,0.9380573034286499,0.2560127079486847,-0.04318065941333771,-0.2294372320175171,0.9380573034286499],"type":"quaternion"},{"name":"mixamorig12LeftHandMiddle3.quaternion","times":[0,0.03333333507180214],"values":[0.00007946732512209564,-0.010002341121435165,0.006238851230591536,0.9999305009841919,0.00007946732512209564,-0.010002341121435165,0.006238851230591536,0.9999305009841919],"type":"quaternion"},{"name":"mixamorig12LeftHandIndex3.quaternion","times":[0,0.03333333507180214],"values":[0.0000393059708585497,-0.006357737351208925,0.004191042855381966,0.9999710321426392,0.0000393059708585497,-0.006357737351208925,0.004191042855381966,0.9999710321426392],"type":"quaternion"},{"name":"mixamorig12RightLeg.quaternion","times":[0,0.03333333507180214],"values":[-0.0461573526263237,0.0016569563886150718,0.010091131553053856,0.9988818168640137,-0.0461573526263237,0.0016569563886150718,0.010091131553053856,0.9988818168640137],"type":"quaternion"},{"name":"mixamorig12LeftHandMiddle1.quaternion","times":[0,0.03333333507180214],"values":[-0.009452156722545624,-0.02380405180156231,-0.062279652804136276,0.9977300763130188,-0.009452156722545624,-0.02380405180156231,-0.062279652804136276,0.9977300763130188],"type":"quaternion"},{"name":"mixamorig12RightHandPinky3.quaternion","times":[0,0.03333333507180214],"values":[0.00005434875492937863,0.006074271164834499,-0.006590055767446756,0.9999598264694214,0.00005434875492937863,0.006074271164834499,-0.006590055767446756,0.9999598264694214],"type":"quaternion"},{"name":"mixamorig12LeftLeg.quaternion","times":[0,0.03333333507180214],"values":[-0.002993936650454998,-0.00029575059306807816,-0.010777795687317848,0.9999374151229858,-0.002993936650454998,-0.00029575059306807816,-0.010777795687317848,0.9999374151229858],"type":"quaternion"},{"name":"mixamorig12LeftHandPinky2.quaternion","times":[0,0.03333333507180214],"values":[-0.00016911921557039022,0.01635967753827572,-0.0062179770320653915,0.9998468160629272,-0.00016911921557039022,0.01635967753827572,-0.0062179770320653915,0.9998468160629272],"type":"quaternion"},{"name":"mixamorig12RightToe_End.quaternion","times":[0,0.03333333507180214],"values":[-0.0006149089313112199,0.0001243178703589365,-0.002113043563440442,0.9999975562095642,-0.0006149089313112199,0.0001243178703589365,-0.002113043563440442,0.9999975562095642],"type":"quaternion"},{"name":"mixamorig12LeftHandThumb3.quaternion","times":[0,0.03333333507180214],"values":[-0.0006673420430161059,-0.005220841150730848,0.09421398490667343,0.995538055896759,-0.0006673420430161059,-0.005220841150730848,0.09421398490667343,0.995538055896759],"type":"quaternion"},{"name":"mixamorig12LeftHandThumb2.quaternion","times":[0,0.03333333507180214],"values":[0.00020730006508529186,-0.002705874852836132,0.10968220233917236,0.9939630031585693,0.00020730006508529186,-0.002705874852836132,0.10968220233917236,0.9939630031585693],"type":"quaternion"},{"name":"mixamorig12LeftHandThumb1.quaternion","times":[0,0.03333333507180214],"values":[0.181768536567688,0.05504586920142174,0.1849297434091568,0.9642256498336792,0.181768536567688,0.05504586920142174,0.1849297434091568,0.9642256498336792],"type":"quaternion"},{"name":"mixamorig12LeftHandRing1.quaternion","times":[0,0.03333333507180214],"values":[-0.012364805676043034,-0.02310531586408615,-0.06558398902416229,0.997502863407135,-0.012364805676043034,-0.02310531586408615,-0.06558398902416229,0.997502863407135],"type":"quaternion"},{"name":"mixamorig12RightHandRing3.quaternion","times":[0,0.03333333507180214],"values":[0.0001287996128667146,0.009669243358075619,-0.012970282696187496,0.9998691082000732,0.0001287996128667146,0.009669243358075619,-0.012970282696187496,0.9998691082000732],"type":"quaternion"},{"name":"mixamorig12Neck.quaternion","times":[0,0.03333333507180214],"values":[0.05472125858068466,2.1716582667056393e-18,1.2783795125598775e-18,0.9985016584396362,0.05472125858068466,2.1716582667056393e-18,1.2783795125598775e-18,0.9985016584396362],"type":"quaternion"},{"name":"mixamorig12RightHandThumb3.quaternion","times":[0,0.03333333507180214],"values":[-0.0005407435237430036,0.004702205769717693,-0.09551185369491577,0.995417058467865,-0.0005407435237430036,0.004702205769717693,-0.09551185369491577,0.995417058467865],"type":"quaternion"},{"name":"mixamorig12RightHandRing1.quaternion","times":[0,0.03333333507180214],"values":[0.046479955315589905,0.029355190694332123,-0.010974040254950523,0.9984275102615356,0.046479955315589905,0.029355190694332123,-0.010974040254950523,0.9984275102615356],"type":"quaternion"},{"name":"mixamorig12RightHandThumb2.quaternion","times":[0,0.03333333507180214],"values":[0.0002921487030107528,0.0038301213644444942,-0.09520180523395538,0.9954505562782288,0.0002921487030107528,0.0038301213644444942,-0.09520180523395538,0.9954505562782288],"type":"quaternion"},{"name":"mixamorig12RightFoot.quaternion","times":[0,0.03333333507180214],"values":[0.5312178134918213,0.006702341139316559,-0.10001926869153976,0.8412840962409973,0.5312178134918213,0.006702341139316559,-0.10001926869153976,0.8412840962409973],"type":"quaternion"},{"name":"mixamorig12RightHandMiddle4.quaternion","times":[0,0.03333333507180214],"values":[0.0000025306653697043657,-1.1635711416602135e-7,-2.9629154596477747e-7,1,0.0000025306653697043657,-1.1635711416602135e-7,-2.9629154596477747e-7,1],"type":"quaternion"},{"name":"mixamorig12LeftHandRing4.quaternion","times":[0,0.03333333507180214],"values":[2.4330800485472537e-8,-7.543712854385376e-8,-2.902233973145485e-7,1,2.4330800485472537e-8,-7.543712854385376e-8,-2.902233973145485e-7,1],"type":"quaternion"},{"name":"mixamorig12RightHandIndex3.quaternion","times":[0,0.03333333507180214],"values":[0.000004658330453821691,0.00036503846058622,-0.0005506493034772575,0.9999997615814209,0.000004658330453821691,0.00036503846058622,-0.0005506493034772575,0.9999997615814209],"type":"quaternion"},{"name":"mixamorig12Hips.quaternion","times":[0,0.03333333507180214],"values":[0.000001330172949565167,0.00001823672209866345,-0.0005764708621427417,0.9999998211860657,0.000001330172949565167,0.00001823672209866345,-0.0005764708621427417,0.9999998211860657],"type":"quaternion"},{"name":"mixamorig12RightHandIndex1.quaternion","times":[0,0.03333333507180214],"values":[0.050212275236845016,0.031592853367328644,-0.017339514568448067,0.9980881810188293,0.050212275236845016,0.031592853367328644,-0.017339514568448067,0.9980881810188293],"type":"quaternion"},{"name":"mixamorig12LeftShoulder.quaternion","times":[0,0.03333333507180214],"values":[0.5094887018203735,0.48666444420814514,-0.611018180847168,0.36088189482688904,0.5094887018203735,0.48666444420814514,-0.611018180847168,0.36088189482688904],"type":"quaternion"},{"name":"mixamorig12LeftHand.quaternion","times":[0,0.03333333507180214],"values":[0.039249103516340256,0.07368787378072739,0.047009021043777466,0.9953992962837219,0.039249103516340256,0.07368787378072739,0.047009021043777466,0.9953992962837219],"type":"quaternion"},{"name":"mixamorig12LeftHandIndex2.quaternion","times":[0,0.03333333507180214],"values":[-0.0002356667973799631,0.015549303032457829,-0.008842610754072666,0.9998399615287781,-0.0002356667973799631,0.015549303032457829,-0.008842610754072666,0.9998399615287781],"type":"quaternion"},{"name":"mixamorig12LeftFoot.quaternion","times":[0,0.03333333507180214],"values":[0.4972028434276581,0.004343240521848202,0.08150053769350052,0.863787055015564,0.4972028434276581,0.004343240521848202,0.08150053769350052,0.863787055015564],"type":"quaternion"},{"name":"mixamorig12HeadTop_End.quaternion","times":[0,0.03333333507180214],"values":[-2.2205746923791773e-16,9.224365346961322e-20,-9.293632675974689e-20,1,-2.2205746923791773e-16,9.224365346961322e-20,-9.293632675974689e-20,1],"type":"quaternion"},{"name":"mixamorig12LeftHandPinky1.quaternion","times":[0,0.03333333507180214],"values":[-0.011391877196729183,-0.023084739223122597,-0.06375572830438614,0.9976334571838379,-0.011391877196729183,-0.023084739223122597,-0.06375572830438614,0.9976334571838379],"type":"quaternion"},{"name":"mixamorig12LeftHandRing3.quaternion","times":[0,0.03333333507180214],"values":[0.00017733515414875,-0.015528259798884392,0.010114527307450771,0.9998282790184021,0.00017733515414875,-0.015528259798884392,0.010114527307450771,0.9998282790184021],"type":"quaternion"},{"name":"mixamorig12RightHandMiddle1.quaternion","times":[0,0.03333333507180214],"values":[0.04740545153617859,0.03054165281355381,-0.01507359929382801,0.9982948899269104,0.04740545153617859,0.03054165281355381,-0.01507359929382801,0.9982948899269104],"type":"quaternion"},{"name":"mixamorig12RightShoulder.quaternion","times":[0,0.03333333507180214],"values":[0.5351831316947937,-0.4579150676727295,0.5945492386817932,0.3878195285797119,0.5351831316947937,-0.4579150676727295,0.5945492386817932,0.3878195285797119],"type":"quaternion"},{"name":"mixamorig12RightHandMiddle3.quaternion","times":[0,0.03333333507180214],"values":[0.00009113686246564612,0.006503306329250336,-0.008992550894618034,0.999938428401947,0.00009113686246564612,0.006503306329250336,-0.008992550894618034,0.999938428401947],"type":"quaternion"},{"name":"mixamorig12RightHandPinky2.quaternion","times":[0,0.03333333507180214],"values":[-0.00019903732754755765,-0.011074284091591835,0.00968884490430355,0.9998916983604431,-0.00019903732754755765,-0.011074284091591835,0.00968884490430355,0.9998916983604431],"type":"quaternion"},{"name":"mixamorig12RightHand.quaternion","times":[0,0.03333333507180214],"values":[-0.04990355297923088,-0.06920835375785828,0.020862022414803505,0.9961348176002502,-0.04990355297923088,-0.06920835375785828,0.020862022414803505,0.9961348176002502],"type":"quaternion"},{"name":"mixamorig12RightHandIndex4.quaternion","times":[0,0.03333333507180214],"values":[1.7869750124077655e-8,5.944093217635782e-8,8.915503713069484e-8,1,1.7869750124077655e-8,5.944093217635782e-8,8.915503713069484e-8,1],"type":"quaternion"},{"name":"mixamorig12RightHandPinky1.quaternion","times":[0,0.03333333507180214],"values":[0.04602328687906265,0.029699407517910004,-0.013525452464818954,0.9984071850776672,0.04602328687906265,0.029699407517910004,-0.013525452464818954,0.9984071850776672],"type":"quaternion"},{"name":"mixamorig12LeftHandMiddle4.quaternion","times":[0,0.03333333507180214],"values":[-2.480810792349075e-7,1.2759119272232056e-7,-3.891182842608032e-8,1,-2.480810792349075e-7,1.2759119272232056e-7,-3.891182842608032e-8,1],"type":"quaternion"},{"name":"mixamorig12RightHandRing4.quaternion","times":[0,0.03333333507180214],"values":[0.0000031689410207036417,-2.3706525098532438e-7,-3.7564308286164305e-7,1,0.0000031689410207036417,-2.3706525098532438e-7,-3.7564308286164305e-7,1],"type":"quaternion"},{"name":"mixamorig12LeftArm.quaternion","times":[0,0.03333333507180214],"values":[-0.20183874666690826,-0.006882177200168371,0.15933668613433838,0.9663465023040771,-0.20183874666690826,-0.006882177200168371,0.15933668613433838,0.9663465023040771],"type":"quaternion"},{"name":"mixamorig12LeftForeArm.quaternion","times":[0,0.03333333507180214],"values":[0.05763475224375725,-0.006650732830166817,-0.12392639368772507,0.9905939102172852,0.05763475224375725,-0.006650732830166817,-0.12392639368772507,0.9905939102172852],"type":"quaternion"},{"name":"mixamorig12Spine1.quaternion","times":[0,0.03333333507180214],"values":[-5.587935802964239e-8,1.1691732651475384e-13,-6.733780200107731e-13,1,-5.587935802964239e-8,1.1691732651475384e-13,-6.733780200107731e-13,1],"type":"quaternion"},{"name":"mixamorig12RightUpLeg.quaternion","times":[0,0.03333333507180214],"values":[0.01466000359505415,-0.006808605510741472,-0.9996143579483032,-0.022581206634640694,0.01466000359505415,-0.006808605510741472,-0.9996143579483032,-0.022581206634640694],"type":"quaternion"},{"name":"Armature.quaternion","times":[0,0.03333333507180214],"values":[8.146033536604591e-8,0,0,1,8.146033536604591e-8,0,0,1],"type":"quaternion"},{"name":"mixamorig12LeftHandPinky4.quaternion","times":[0,0.03333333507180214],"values":[1.4551915228366852e-8,-1.6437843441963196e-7,-2.457964001223445e-7,1,1.4551915228366852e-8,-1.6437843441963196e-7,-2.457964001223445e-7,1],"type":"quaternion"},{"name":"mixamorig12RightHandRing2.quaternion","times":[0,0.03333333507180214],"values":[-0.0001069807622116059,-0.006078966893255711,0.005991765297949314,0.9999635815620422,-0.0001069807622116059,-0.006078966893255711,0.005991765297949314,0.9999635815620422],"type":"quaternion"},{"name":"mixamorig12LeftHandIndex4.quaternion","times":[0,0.03333333507180214],"values":[0.000002710032504182891,1.1209342432039193e-7,4.145904881625029e-7,1,0.000002710032504182891,1.1209342432039193e-7,4.145904881625029e-7,1],"type":"quaternion"},{"name":"mixamorig12LeftToe_End.quaternion","times":[0,0.03333333507180214],"values":[-0.01325711514800787,-0.0016660216497257352,0.007838943973183632,0.9998800158500671,-0.01325711514800787,-0.0016660216497257352,0.007838943973183632,0.9998800158500671],"type":"quaternion"},{"name":"mixamorig12LeftToeBase.quaternion","times":[0,0.03333333507180214],"values":[0.30193769931793213,-0.05403835326433182,-0.020228976383805275,0.9515798687934875,0.30193769931793213,-0.05403835326433182,-0.020228976383805275,0.9515798687934875],"type":"quaternion"},{"name":"mixamorig12RightToeBase.quaternion","times":[0,0.03333333507180214],"values":[0.2744746208190918,0.06620918214321136,0.0917317271232605,0.9549164175987244,0.2744746208190918,0.06620918214321136,0.0917317271232605,0.9549164175987244],"type":"quaternion"},{"name":"mixamorig12RightHandThumb4.quaternion","times":[0,0.03333333507180214],"values":[-4.470348358154297e-8,-1.8312571615412427e-22,4.284083843231201e-8,1,-4.470348358154297e-8,-1.8312571615412427e-22,4.284083843231201e-8,1],"type":"quaternion"},{"name":"mixamorig12Spine.quaternion","times":[0,0.03333333507180214],"values":[-0.05472252890467644,-0.00004975435513188131,0.0005746092065237463,0.9985014200210571,-0.05472252890467644,-0.00004975435513188131,0.0005746092065237463,0.9985014200210571],"type":"quaternion"},{"name":"mixamorig12LeftHandIndex1.quaternion","times":[0,0.03333333507180214],"values":[-0.004747307859361172,-0.025323940441012383,-0.0587155781686306,0.9979422092437744,-0.004747307859361172,-0.025323940441012383,-0.0587155781686306,0.9979422092437744],"type":"quaternion"},{"name":"mixamorig12RightForeArm.quaternion","times":[0,0.03333333507180214],"values":[0.03800513222813606,0.004200953524559736,0.02795892395079136,0.9988775253295898,0.03800513222813606,0.004200953524559736,0.02795892395079136,0.9988775253295898],"type":"quaternion"},{"name":"mixamorig12Spine2.quaternion","times":[0,0.03333333507180214],"values":[1.862645326866641e-8,3.2526065174565133e-18,1.3010427103801819e-18,1,1.862645326866641e-8,3.2526065174565133e-18,1.3010427103801819e-18,1],"type":"quaternion"},{"name":"mixamorig12LeftUpLeg.quaternion","times":[0,0.03333333507180214],"values":[-0.015288857743144035,0.013790314085781574,-0.9995787739753723,0.020454177632927895,-0.015288857743144035,0.013790314085781574,-0.9995787739753723,0.020454177632927895],"type":"quaternion"},{"name":"mixamorig12RightArm.quaternion","times":[0,0.03333333507180214],"values":[-0.18213894963264465,0.0004388753732200712,-0.06770000606775284,0.9809393286705017,-0.18213894963264465,0.0004388753732200712,-0.06770000606775284,0.9809393286705017],"type":"quaternion"}],"uuid":"8A27DF04-EFA9-4140-9092-9E2C23BA957E","blendMode":2500}';

}


