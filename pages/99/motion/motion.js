ENGINE.MOTION = {
    motionList: null,
    bodyList: [], //list by bodyName
    modelList: [], //list by filename
    _changes: new Array(),//changes in use
    _variable: class {
        active = [];
        mixer = null;
        action = null;
        object = null;
        shape = null;
        bones = null;
        sca = null; //last applyed scale    
    },


    updateAnimations: function (modelUrl) {
        function saveFile(name, type, data) {
            if (data !== null && navigator.msSaveBlob)
                return navigator.msSaveBlob(new Blob([data], { type: type }), name);
            var a = $("<a style='display: none;'/>");
            var url = window.URL.createObjectURL(new Blob([data], { type: type }));
            a.attr("href", url);
            a.attr("download", name);
            $("body").append(a);
            a[0].click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
        LOADER.fbxloader.load(modelUrl, function (object) {
            var data = JSON.stringify(object.animations[0]);
            //console.log(data);
            saveFile("animation.txt", "data:attachment/text", data);
        });
    },

    load: function (fbx, name, scale, container, callbak) {
        if (typeof (ENGINE.MOTION.bodyList[name]) !== _UN) {
            console.warn('Animation Already Exist: ' + name);
            if (typeof (callbak) == 'function') callbak(ENGINE.MOTION.bodyList[name].object);
            return;
        }
        if (ENGINE.MOTION.modelList[fbx]) {            
            //ANIMATED._loaded[fbx].obj.remove(ANIMATED._loaded[fbx].audio); //remove atached audios
            var object = SkeletonUtils.clone(ENGINE.MOTION.modelList[fbx].obj);
            //ANIMATED._loaded[fbx].obj.add(ANIMATED._loaded[fbx].audio); //put audios back            
            object.scale.addScalar(ENGINE.MOTION.modelList[fbx].sca);
            /*            
            for (var i = 0; i < ENGINE.MOTION.modelList[fbx].obj.animations.length; i++) {
                object.animations.push(ENGINE.MOTION.modelList[fbx].obj.animations[i].clone());
            }
            */
            //object.position.set(0, 0, 0);
            //object.quaternion.set(0, 0, 0, 1);
            ENGINE.MOTION.loadEnd(object, fbx, name, scale, container, callbak);
        } else {
            LOADER.fbxloader.load(fbx, function (object) {
                ENGINE.MOTION.loadEnd(object, fbx, name, scale, container, callbak);
            });
        }
    },


    loadEnd: function (object, fbx, name, scale, container, callbak) {
        if (typeof (scale) == _UN) scale = 0.985;
        object.scale.subScalar(scale);
        ENGINE.MOTION.bodyList[name] = new ENGINE.MOTION._variable();
        var body = ENGINE.MOTION.bodyList[name];
        body.object = object;
        body.shape = container;
        body.shape.group.login = name;
        body.mixer = new THREE.AnimationMixer(object);
        body.sca = scale;
        body.action = new Array();
        body.bones = new Array();
        //var audio = new THREE.Object3D();
        //body.audio = audio;


        //console.log(ANIMATED._animations.length);
        object.animations = new Array();
        for (var i = 0; i < ENGINE.MOTION.motionList.length; i++) {
            var anim = THREE.AnimationClip.parse(ENGINE.MOTION.motionList[i]);
            object.animations.push(anim);
        }

        var firstname = null;
        for (var i = 0; i < object.animations.length; i++) {
            var clip = object.animations[i].name;
            var clipAnim = body.mixer.clipAction(object.animations[i]);
            clip = clip.split('|');
            clip = clip[clip.length - 1];
            if (firstname == null || clip == 'idle') firstname = clip;
            body.action[clip] = clipAnim;
            body.action[clip].togle = function () {
                ENGINE.MOTION.swap(name, this);
            }
            switch (clip) {
                //unique
                case 'swdie': break;
                case 'tpose': break;
                //legworks
                case 'swwalk': break;
                case 'idledie': break;
                case 'idle': break;
                case 'idlearmed': break;
                case 'run': break;
                case 'swrun': break;
                case 'walk': break;
                //uperbody
                case 'swwithdraw': break;
                case 'archaim': break;
                case 'Lswatack': clipAnim.timeScale = 2; break;
                case 'swatack': clipAnim.timeScale = 2; break;
                case 'swdraw': break;
                case 'punch': clipAnim.timeScale = 2; break;
                case 'drop': break;
                //extra
                case 'swimpact': break;
                case 'jump': clipAnim.timeScale = 1.5; break;
            }
        }
        if (firstname !== null) body.action[firstname].play();
        body.active = [];

        //obj child apply shadows
        object.traverse(function (child) {            
            if (child.isMesh) {
                if (child.material && child.material.map && child.material.map.format) {
                    child.material.map.format = THREE.RGBAFormat;
                    child.material.map.encoding = THREE.LinearEncoding;
                }
                child.castShadow = true;
                child.receiveShadow = true;
                //child.material.transparent = false;
                //if (child.material.specular)
                //    child.material.specular.setScalar(0.2);
            }
            if (child.isBone && child.name) {
                var boneName = child.name;
                if (boneName.startsWith('mixamorig') == true)
                    boneName = boneName.substr('mixamorig'.length, boneName.length);
                while (isNaN(boneName[0]) == false) {
                    boneName = boneName.substr(1, boneName.length)
                }
                body.bones[boneName] = child;
            }
            //}catch{e}{
            //window.TT=child;
            //console.log('Error 140',name,fbx);
            //}      
        });
        //object.add(audio);
        //body.shape.add(object);
        

        //ENGINE.scene.add(object);
        //var shapepos = ANIMATED._data[name].shape.position.clone();
        //object.position.y = shapepos.y - 1.30;
        var bbox = new THREE.Box3().setFromObject(body.shape);
        body.shape.attach(object);
        object.position.set(0, -((bbox.max.y - bbox.min.y)*0.5), 0);
        object.quaternion.set(0, 0, 0, 1);        
        //ENGINE.Physic.bodyTeleport(ANIMATED._data[name].shape, shapepos.add(new THREE.Vector3(0, 4, 0)));
        if (!ENGINE.MOTION.modelList[fbx]) ENGINE.MOTION.modelList[fbx] = { obj: object,/* audio: audio,*/ sca: scale };
        if (typeof (callbak) == 'function') callbak(object);
    },


    swap: function (name, animation) {
        var clip = animation._clip.name;
        clip = clip.split('|');
        clip = clip[clip.length - 1];
        ENGINE.MOTION.change(name, clip);
        /*var clipname = ANIMATED._data[name].active;
        if (typeof (ANIMATED._data[name]) == 'undefined' ||
          typeof (ANIMATED._data[name].action[newpose]) == 'undefined') {
          console.warn('Animation or clip not found', name, newpose);
          return;
        }
        ANIMATED._data[name].action[clipname].weight = 0;
        ANIMATED._data[name].action[clipname].stop();    
        ANIMATED._data[name].action[newpose].weight = 1;
        ANIMATED._data[name].action[newpose].play();    
        */
    },

    setUnique: function (name, newpose, positive, newspeed) {
        if (typeof (newspeed) == _UN) newspeed = 1;
        var body = ENGINE.MOTION.bodyList[name];
        if (typeof (body) == _UN ||
            typeof (body.action[newpose]) == _UN) {
            console.warn('Animation or clip not found', name, newpose);
            return;
        }
        body.action[newpose].timeScale = newspeed;
        if (positive == true) {
            if (body.action[newpose].timeScale < 0)
                body.action[newpose].timeScale = body.action[newpose].timeScale * -1;
        } else {
            if (body.action[newpose].timeScale > 0)
                body.action[newpose].timeScale = -body.action[newpose].timeScale;
        }        
        body.action[newpose].weight = 1;
        if(body.action[newpose].isRunning()==false)body.action[newpose].play();
        ENGINE.MOTION.deanimateType(name, newpose, false);
    },

    change: function (name, newpose, speed) {
        if (typeof (speed) == _UN) speed = 1;
        var body = ENGINE.MOTION.bodyList[name];        
        if (typeof (body) == _UN ||
            typeof (body.action[newpose]) == _UN) {
            console.warn('Animation or clip not found', name, newpose);
            return;
        }
        var ctype = ENGINE.MOTION.getType(newpose);
        var clipname = body.active[ctype];
        //ANIMATED._data[name].action[newpose].weight = 0;
        body.action[newpose].play();
        var onlist = false;
        for (var i = 0; i < ENGINE.MOTION._changes.length; i++) {
            var data = ENGINE.MOTION._changes[i];
            if (data.name == name && data.clip == clipname && data.type == ctype && data.newp == newpose && data.time == speed) {
                onlist = true;
                break;
            }
        }
        if (onlist == false && clipname != newpose)
            ENGINE.MOTION._changes.push({ name: name, clip: clipname, type: ctype, newp: newpose, time: speed });
    },


    deanimateType: function (name, newpose, selftoo) {
        var body = ENGINE.MOTION.bodyList[name];
        if (typeof (body) == _UN) {
            console.warn('deanimateType no animation for ', name);
            return;
        }
        var ctype = this.getType(newpose);
        for (var i = 0; i < Object.keys(body.action).length; i++) {
            var cname = Object.keys(body.action)[i];
            if (ctype == this.getType(cname)) {
                if (cname != newpose) {
                    body.action[cname].weight = 0;
                    body.action[cname].stop();
                } else if (selftoo == true) {
                    body.action[cname].weight = 0;
                    body.action[cname].stop();
                    body.active[ctype] = 'tpose';
                }
            }
        }
    },

    getType: function (newpose) {
        var atype = 4;
        switch (newpose) {
            //unique
            case 'swdie': atype = 0; break;
            case 'tpose': atype = 0; break;
            //legworks
            case 'swwalk': atype = 1; break;
            case 'idledie': atype = 1; break;
            case 'idle': atype = 1; break;
            case 'idlearmed': atype = 1; break;
            case 'run': atype = 1; break;
            case 'swrun': atype = 1; break;
            case 'walk': atype = 1; break;
            //uperbody
            case 'swwithdraw': atype = 2; break;
            case 'archaim': atype = 2; break;
            case 'swatack': atype = 2; break;
            case 'swdraw': atype = 2; break;
            case 'punch': atype = 2; break;
            case 'drop': atype = 2; break;
            //extra
            case 'swimpact': atype = 3; break;
            case 'jump': atype = 3; break;
        }
        return atype;
    },


    update: function (delta) {        
        //var body = ENGINE.MOTION.bodyList[name];
        for (var k = 0; k < Object.keys(ENGINE.MOTION.bodyList).length; k++) {
            var kname = Object.keys(ENGINE.MOTION.bodyList)[k];
            var body = ENGINE.MOTION.bodyList[kname];
            if (typeof (body) !== _UN) {
                if (body.mixer) {
                    var spinerot = body.bones["Spine"].parent.rotation.clone();
                    body.mixer.update(delta);
                    body.bones["Spine"].parent.rotation.copy(spinerot);
                    //body.bones["Spine"].parent
                }
                    
            }
        }
        for (var i = 0; i < ENGINE.MOTION._changes.length; i++) {
            var data = ENGINE.MOTION._changes[i];
            var body = ENGINE.MOTION.bodyList[data.name];
            var playw = 0;
            if (typeof (data.clip) != _UN || data.clip != null) {
                playw = body.action[data.clip].weight;
            }
            playw = playw - (delta * data.time);
            if (playw <= 0) {
                playw = 0;
                if (typeof (data.clip) != _UN || data.clip != null) {
                    body.action[data.clip].weight = playw;
                    body.action[data.clip].stop();
                }
                body.active[data.type] = data.newp;
                body.action[data.newp].weight = 1;
               // this.deanimateType(data.name, data.newp, false);
                ENGINE.MOTION._changes.splice(i, 1);
                break;
            } else {
                body.action[data.clip].weight = playw;
                body.action[data.newp].weight = 1 - playw;
            }
        }
    },


}

if (ENGINE.MOTION.motionList == null) {
    //"./3d/model/" + data.base[i].obj.type + "/" + data.base[i].obj.name + ".txt";
    $.getJSON("./3d/motion/motions.json", function (data) {
        ENGINE.MOTION.motionList = data;
    });
}