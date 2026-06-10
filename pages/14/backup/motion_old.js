import * as THREE from 'three';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './FBXLoader.js';

export class MixamoIntegration {
  constructor() {
    this.models = new Map(); // model → { mixer, actions }
    this.defaultAnimations = null;
    this.modelCache = new Map();
    this.loader = new FBXLoader();
  }

  async create(scene, animations, allowDownload = false) {
    this.allowDownload = allowDownload;
    this.scene = scene;
    if (animations) {
      const data = await fetch(animations).then(r => r.json());
      this.defaultAnimations = data.map(a => {
        const clip = THREE.AnimationClip.parse(a);
        clip.name = clip.name.replace(/^Armature\|/, ''); // Remove o prefixo "Armature|"
        return clip;
      });
      //console.log(this.defaultAnimations);
    }
    return this;
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


  async loadModel(url, config = null) {
    let model;
    if (this.modelCache.has(url)) {
      model = this.cloneSkinnedModelSafe(this.modelCache.get(url));
    } else {
      model = await new Promise((resolve, reject) =>
        this.loader.load(url, resolve, undefined, reject)
      );
      this.modelCache.set(url, this.cloneSkinnedModelSafe(model));
    }
    const mixer = new THREE.AnimationMixer(model);
    const animations = this.defaultAnimations;
    const actions = animations.reduce((acc, a) => {
      acc[a.name] = mixer.clipAction(a);
      return acc;
    }, {});

    model.mixamo = { mixer, actions, bones: this.extractUpperLowerBones(model) };
    this.models.set(model, model.mixamo);
    this.scene.add(model);
    return model;
  }

 
  animationStopAll(model) {
    Object.values(model.mixamo.actions).forEach(a => a.stop());
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
      this.restoreActionBindings(action); // <- restaurar caso tenha usado parcial
    });
    model.mixamo.mixer.stopAllAction();
  }


  getAnimationRunning(model) {
    return Object.entries(model.mixamo.actions)
      .filter(([_, a]) => a.isRunning())
      .map(([name]) => name);
  }

  async loadAnimations(jsonFile) {
    const data = await fetch(jsonFile).then(r => r.json());
      this.defaultAnimations = data.map(a => {
        const clip = THREE.AnimationClip.parse(a);
        clip.name = clip.name.replace(/^Armature\|/, ''); // Remove o prefixo "Armature|"
        return clip;
      });
  }

  reloadModelAnimations(model) {
    if (!this.defaultAnimations) return;
    const mixer = model.mixamo.mixer;
    const animations = this.defaultAnimations;
    const actions = animations.reduce((acc, a) => {
      acc[a.name] = mixer.clipAction(a);
      return acc;
    }, {});    
    model.mixamo.actions = actions;                
  }

  setAnimationUpperBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.upperBody;
    return this._setPartial(model, boneNames, name, time);
  }

  setAnimationLowerBody(model, name, time = 0.3) {
    const boneNames = model.mixamo.bones.lowerBody;
    return this._setPartial(model, boneNames, name, time);
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

  restoreActionBindings(action) {
    if (!action._originalState) return;
    action._propertyBindings = action._originalState.bindings.slice();
    action._interpolants = action._originalState.interpolants.slice();
    action._propertyBindings.forEach((binding, i) => {
      binding.weight = action._originalState.weights[i];
    });
  }

  async _setPartial(model, boneNames, newPose, lerpTime) {
    return new Promise(resolve => {
      const mixer = model.mixamo.mixer;
      const action = model.mixamo.actions[newPose];
      if (!action) return resolve();

      action.play();
      action.setEffectiveWeight(0);

      if (!action._originalState) {
        action._originalState = {
          bindings: action._propertyBindings.slice(),
          interpolants: action._interpolants.slice(),
          weights: action._propertyBindings.map(binding => binding.weight)
        };
      }

      const filteredBindings = [];
      const filteredInterpolants = [];
      const bindings = action._propertyBindings || [];
      const interpolants = action._interpolants || [];

      bindings.forEach((propertyMixer, index) => {
        const { binding } = propertyMixer;
        if (binding && binding.targetObject && boneNames.includes(binding.targetObject.name)) {
          filteredBindings.push(propertyMixer);
          filteredInterpolants.push(interpolants[index]);
        }
      });

      action._propertyBindings = filteredBindings;
      action._interpolants = filteredInterpolants;
      filteredBindings.forEach(binding => binding.weight = 0);

      const startTime = Date.now();
      function animateWeights() {
        const now = Date.now();
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / (lerpTime * 1000));
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


  update(delta) {
    this.models.forEach(({ mixer }) => mixer.update(delta));
  }
}
