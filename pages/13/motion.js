import * as THREE from 'three';
//import { baseGLB, deFaultTpose } from './base.js';
import { DRACOLoader, GLTFLoader } from './GLTFLoader.js'
import { FBXLoader } from './FBXLoader.js';
import * as PAKO from "./pako.js";



export class MixamoIntegration {
  constructor({ fbxloader = null, gltfloader = null, dracoloader = null } = {}) {
    this.models = new Map(); // model → { mixer, actons }
    this.rawAnimationData = [];
    this.fbxloader = fbxloader || new FBXLoader();
    this.gltfloader = gltfloader || new GLTFLoader();
    this.dracoloader = dracoloader || new DRACOLoader();
    this.objloader = new THREE.ObjectLoader();
    this.baseTPoseModel = null;
    this.baseTPoseAnimation = {};
    this.options = {};
    this.interestBones = {root:"root",  hip: "CC_Base_Hip", spine: "CC_Base_Spine01" };
  }





async filterAnimation(animation) {
  const filteredTracks = animation.tracks
    .filter(track => 
      //track
      track.name.endsWith('.quaternion') ||
      track.name.endsWith('.position')
    )
    .map(track => {
      const clonedTrack = track.clone();

      // Se o nome do osso (antes do ponto) contém "root"
      const [boneName, property] = clonedTrack.name.split('.');
      if (boneName.toLowerCase().includes('root')) {
        clonedTrack.name = this.interestBones.root+'.' + property;        
      }

      return clonedTrack;
    });

  const cleanedAnimation = animation.clone();
  cleanedAnimation.tracks = filteredTracks;
  return cleanedAnimation;
}



  async setTPoseReference() {
    this.baseTPoseModel = await new Promise((resolve, reject) =>
      this.fbxloader.load('./base.fbx', resolve, undefined, reject)
    );    
    this.baseTPoseModel.scale.set(1, 1, 1);
    this.baseTPoseModel.updateMatrixWorld(true);
    const skinnedMesh = this.baseTPoseModel.getObjectByProperty('type', 'SkinnedMesh');
    if (!skinnedMesh || !skinnedMesh.skeleton) {
      throw new Error("No skinnedMesh Found");
    }
    //skinnedMesh.skeleton.pose();
    this.baseTPoseModel.skeleton = skinnedMesh.skeleton;
    
    console.log(this.baseTPoseModel);

    this.baseTPoseAnimation = await this.filterAnimation(this.baseTPoseModel.animations[0]);
    this.baseTPoseAnimation.name = 'tpose';
    
    //this.tposeTest = await this.filterAnimation(this.baseTPoseModel.animations[1]);
    //this.tposeTest.name = "walk";
    
    this.baseTPoseModel.bones=this.extractUpperLowerBones(this.baseTPoseModel);

    //walk
    let walkmodel= await new Promise((resolve, reject) =>
      this.fbxloader.load('./base_noskin_walkin2.fbx', resolve, undefined, reject)
    );
    walkmodel.scale.set(1, 1, 1);
    walkmodel.updateMatrixWorld(true);
    this.walkmodelAnimation = await this.filterAnimation(walkmodel.animations[1]);
    this.walkmodelAnimation.name = 'walk';

    //IDLE
    let idlemodel= await new Promise((resolve, reject) =>
      this.fbxloader.load('./idle.fbx', resolve, undefined, reject)
    );
    idlemodel.scale.set(1, 1, 1);
    idlemodel.updateMatrixWorld(true);
    this.idleAnimation = await this.filterAnimation(idlemodel.animations[0]);
    this.idleAnimation.name = 'idle';
  }


  async create(scene, animations, options = { useHips: false, usePosition: false, debug: true }) {
    this.options = options;
    this.scene = scene;
    await this.setTPoseReference();
    if (animations) {
      let raw;
      const arrayBuffer = await fetch(animations).then(r => r.arrayBuffer());
      const uint8 = new Uint8Array(arrayBuffer);
      raw = this.decompressJSON(uint8);
      this.rawAnimationData = raw;
    } else {
      this.rawAnimationData = [this.baseTPoseAnimation.toJSON(), this.walkmodelAnimation.toJSON(), this.idleAnimation.toJSON()];
    }
    return this;
  }


  async load(input, animations = null) {
    if (animations) {
      const arrayBuffer = await fetch(animations).then(r => r.arrayBuffer());
      const uint8 = new Uint8Array(arrayBuffer);
      const raw = this.decompressJSON(uint8);
      this.rawAnimationData = raw;
    }

    let model = await new Promise((resolve, reject) =>
      this.fbxloader.load(input, resolve, undefined, reject)
    );
    model.scale.set(1, 1, 1);

    const skinnedMesh = model.getObjectByProperty('type', 'SkinnedMesh');
    if (!skinnedMesh || !skinnedMesh.skeleton) {
      throw new Error("No skinnedMesh Found");
    }
    //skinnedMesh.skeleton.pose();
    model.skeleton = skinnedMesh.skeleton;
    model.updateMatrixWorld(true);
    
     model.traverse(obj => {
      if (obj.isBone) {        
        if(obj.name.toLowerCase().includes('root')){
          obj.name=this.interestBones.root;
        }
        obj.scale.set(1, 1, 1);
      }
    });

    


    if (this.debug) {
      const helper = new THREE.SkeletonHelper(model);
      helper.material.linewidth = 2;
      helper.material.color.set(0x00ff00);
      helper.visible = true;
      model.userData.skeletonHelper = helper;
      scene.add(helper);
    }

    if (!this.rawAnimationData) this.rawAnimationData = [];
    this.rawAnimationData = [
      this.baseTPoseAnimation.toJSON(),
      //this.tposeTest.toJSON(), //TEST WALK
      //this.idleAnimation.toJSON(),
      ...this.rawAnimationData.filter(
        a => a.name !== 'tpose' && a.name !== 'Armature|tpose'
      )
    ];

    model.mixamo = {
      bones:this.extractUpperLowerBones(model)
    };

    model.userData.retargetRotationGlobal = null;

    this.models.set(model, model.mixamo);
    delete model.animations;
    this.scene.add(model);

    await this.reloadAnimations(model);
    return model;
  }



retargetModel(model, rotationEuler, clipName = null) {
   const euler = new THREE.Euler(rotationEuler.x, rotationEuler.y, rotationEuler.z, 'XYZ');
  model.userData.retargetRotationGlobal = {
    x: euler.x,
    y: euler.y,
    z: euler.z
  };

  this.reloadAnimations(model);
  if(clipName!=null)
  this.playUnique(model,clipName,0);
}


  applyPoseDeltaCorrection(baseModel, targetModel, clip) {
    const baseSkeleton = baseModel.skeleton;
    const targetSkeleton = targetModel.skeleton;

    const trackMap = new Map();
    for (const track of clip.tracks) {
      trackMap.set(track.name, track.clone());
    }

    const boneNames = [this.interestBones.root, this.interestBones.hip];
    for (const boneName of boneNames) {
      const baseBone = baseSkeleton.getBoneByName(boneName);
      const targetBone = targetSkeleton.getBoneByName(boneName);
      if (!baseBone || !targetBone) continue;

      ['position', 'quaternion'].forEach(type => {
        const trackName = `${boneName}.${type}`;
        const track = trackMap.get(trackName);
        if (!track) return;

        const times = track.times;
        const values = track.values.slice();

        for (let i = 0; i < times.length; i++) {
          const time = times[i];

          baseModel.skeleton.pose();
          targetModel.skeleton.pose();
          baseModel.updateMatrixWorld(true);
          targetModel.updateMatrixWorld(true);

          const baseMatrix = new THREE.Matrix4().copy(baseBone.matrixWorld);
          const targetMatrix = new THREE.Matrix4().copy(targetBone.matrixWorld);

          if (type === 'position') {
            const basePos = new THREE.Vector3().setFromMatrixPosition(baseMatrix);
            const targetPos = new THREE.Vector3().setFromMatrixPosition(targetMatrix);
            const delta = new THREE.Vector3().subVectors(basePos, targetPos);

            const idx = i * 3;
            values[idx] += delta.x;
            values[idx + 1] += delta.y;
            values[idx + 2] += delta.z;
          } else if (type === 'quaternion') {
            const baseQuat = new THREE.Quaternion().setFromRotationMatrix(baseMatrix);
            const targetQuat = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
            const deltaQuat = baseQuat.clone().multiply(targetQuat.clone().invert());

            const idx = i * 4;
            const origQuat = new THREE.Quaternion(
              values[idx], values[idx + 1], values[idx + 2], values[idx + 3]
            );

            const correctedQuat = deltaQuat.multiply(origQuat).normalize();

            values[idx] = correctedQuat.x;
            values[idx + 1] = correctedQuat.y;
            values[idx + 2] = correctedQuat.z;
            values[idx + 3] = correctedQuat.w;
          }
        }

        if (type === 'position') {
          trackMap.set(trackName, new THREE.VectorKeyframeTrack(trackName, times, values));
        } else if (type === 'quaternion') {
          trackMap.set(trackName, new THREE.QuaternionKeyframeTrack(trackName, times, values));
        }
      });
    }

    return new THREE.AnimationClip(clip.name, clip.duration, [...trackMap.values()]);
  }

  async reloadAnimations(model) {
    if (!this.rawAnimationData) return;

    if (model.mixamo?.mixer) {
      const oldMixer = model.mixamo?.mixer;
      if (oldMixer) {
        oldMixer.stopAllAction();
        oldMixer.uncacheRoot(model);
      }
    }

    const mixer = new THREE.AnimationMixer(model);
    model.mixamo.mixer = mixer;

    const rot = model.userData.retargetRotationGlobal;
    

    // Tenta identificar o nome do hip real do modelo
    //const hipName = this.interestBones.root;

    const parsedClips = this.rawAnimationData.map((a) => {
      const originalClip = THREE.AnimationClip.parse(a);
      const correctedClip = this.applyPoseDeltaCorrection(this.baseTPoseModel, model, originalClip);
      
      if(!rot || rot==null)return correctedClip;        

    const rotationQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rot.x, rot.y, rot.z, 'XYZ')
  );
      
const hipsCandidates = [    
    this.interestBones.root,
    this.interestBones.root2    
  ];

      const newTracks = correctedClip.tracks.map((track) => {
        if (!track.name.endsWith('.quaternion')) return track;
        const isHip = hipsCandidates.some(name => track.name.includes(name));
        if (!isHip) return track;

        const times = track.times;
        const values = track.values;
        const newValues = values.slice();

        for (let i = 0; i < values.length; i += 4) {
          const originalQuat = new THREE.Quaternion(
            values[i], values[i + 1], values[i + 2], values[i + 3]
          );
          const rotatedQuat = rotationQuat.clone();//.multiply(originalQuat);
          newValues[i] = rotatedQuat.x;
          newValues[i + 1] = rotatedQuat.y;
          newValues[i + 2] = rotatedQuat.z;
          newValues[i + 3] = rotatedQuat.w;
        }

        return new THREE.QuaternionKeyframeTrack(track.name, times, newValues);

      });

      return new THREE.AnimationClip(originalClip.name, originalClip.duration, newTracks);
    });


    const actions = parsedClips.reduce((acc, clip) => {
      acc[clip.name] = mixer.clipAction(clip);
      return acc;
    }, {});
    model.mixamo.actions = actions;

    console.log("Actions criadas:", Object.keys(actions));

    if (model.mixamo.actions.tpose) {
      model.mixamo.actions.tpose.play();
    }
  }



  update(delta) {
    this.models.forEach(({ mixer }) => {
      if (typeof (mixer) !== "undefined")
        mixer.update(delta);
    });
  }


  getHeight(object3D) {
    let box = this.getModelBox3D(object3D);
    if (!box) return 0;

    let size = new THREE.Vector3();
    box.getSize(size);
    return size.y;
  }

  async setHeight(model, object3D_or_height) {
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

  getCenter(object3D) {
    const box = this.getModelBox3D(object3D);
    if (!box) return null;

    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }


  updateHelpers(model) {
    // Remover helpers antigos, se houver
    if (model.userData.skeletonHelper) {
      model.userData.skeletonHelper.parent.remove(model.userData.skeletonHelper);
      if (model.userData.skeletonHelper.dispose)
        model.userData.skeletonHelper.dispose();
      model.userData.skeletonHelper = null;
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

  }


  playUnique(model, name, fadeTime = 0.3) {
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


  play(model, name, weight = 1) {
    const action = model.mixamo.actions[name];
    if (action) {
      action.reset();
      action.setEffectiveWeight(weight).play();
    }
  }


  ///#################### SECONDARY FUNCTIONS ###########################

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

  restoreActionBindings(action) {
    if (!action._originalState) return;
    action._propertyBindings = action._originalState.bindings.slice();
    action._interpolants = action._originalState.interpolants.slice();
    action._propertyBindings.forEach((b, i) => {
      b.weight = action._originalState.weights[i] ?? 1;
    });
  }

}
