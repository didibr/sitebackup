window.HELPER = {
    blinkColor: 0x0ff00,

    materials: function (num) {
        var color = "blue";
        if (num == 0) color = "blue";
        if (num == 1) color = "red";
        if (num == 2) color = "lime";
        if (num == 3) color = "yellow";
        if (num == 4) color = "purple";
        if (num == 5) color = "gray";
        if (num == 6) color = "orange";
        if (num == 7) color = "white";
        if (num == 8) color = "coral";
        if (num == 9) color = "beige";
        if (num == 10) color = GLOBAL.baseTexture.color;
        return new THREE.MeshStandardMaterial({ color: color });
    },

    today: function (date) {
        return ((date.getDate() < 10) ? "0" : "") + date.getDate() + (((date.getMonth() + 1) < 10) ? "0" : "") + (date.getMonth() + 1) + date.getFullYear();
    },
    // For the time now
    timeNow: function (date) {
        return ((date.getHours() < 10) ? "0" : "") + date.getHours() + ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes() + ((date.getSeconds() < 10) ? "0" : "") + date.getSeconds();
    },

    animateVector3: function (v1, v2, duration,updateCalb,finishCalb) {
        var easing = TWEEN.Easing.Quadratic.InOut;
        var tweenVector3 = new TWEEN.Tween(v1)
            .to({ x: v2.x, y: v2.y, z: v2.z, }, duration)
            .easing(easing)
            .onUpdate(function (d) {
                if (updateCalb) {
                    updateCalb(d,this);
                }
            })
            .onComplete(function () {
                if (finishCalb) finishCalb();
            });
        tweenVector3.start();
        return tweenVector3;
    },
    
    rotateAboutPoint: function (obj, point, axis, theta, pointIsWorld) {
        pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;
        if (pointIsWorld) {
            obj.parent.localToWorld(obj.position); // compensate for world coordinate
        }
        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset
        if (pointIsWorld) {
            obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
        }
        obj.rotateOnAxis(axis, theta); // rotate the OBJECT
    },

    updateArray: function (model, data) {
        for (var k = 0; k < Object.keys(model).length; k++) {
            var kname = Object.keys(model)[k];
            if (typeof (data[kname]) !== 'undefined') {
                model[kname] = data[kname];
            }
        }
    },

    transfCtrlMode: function (mode) {
        if (typeof (mode) == 'undefined') return;
        if (typeof (TransformControl) !== 'undefined' &&
            typeof (TransformControl.control) !== 'undefined') {
            TransformControl.control.setMode(mode);
            //if(TransformControl.control.object)
            //HELPER.showTransform(TransformControl.control.object);
        }
    },

    transfCtrlShow: function (obj) {
        if (typeof (obj) == 'undefined') return;
        //ENGINE.scene.add(obj);
        ENGINE.scene.add(TransformControl.control);
        if (TransformControl.control.target != obj) {
            TransformControl.control.attach(obj);
            TransformControl.control.target = obj;
        }
        TransformControl.control.visible = true;
    },

    transfCtrlHide: function () {
        if (TransformControl.control == null) return;
        TransformControl.control.detach();
        TransformControl.control.target = null;
        //const geometry = new THREE.SphereGeometry(0.25);
        //const material = new THREE.MeshBasicMaterial({ color: 'black' });
        //const objr = new THREE.Mesh(geometry, material);    
        //ENGINE.scene.add(objr);        
        //TransformControl.control.attach(objr);
        //TransformControl.control.detach(objr);
        TransformControl.control.visible = false;
        ENGINE.scene.remove(TransformControl.control);
        TransformControl.onchange = function (event) { };
        //ENGINE.scene.remove(objr);  
        //TransformControl.control.detach(TransformControl.control.object);      
    },

    addBoxFake: function (pos) {
        var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        var pobj = new THREE.Mesh(geometry, HELPER.materials[2]);
        pobj.position.set(pos.x, pos.y, pos.y);
        ENGINE.scene.add(pobj);
        return pobj;
    },

    isOnRay: function (object) {
        if (typeof (ENGINE.intersects) == _UN || ENGINE.intersects.length <= 0) return false;
        for (var i = 0; i < ENGINE.intersects.length; i++) {
            var value = ENGINE.intersects[i];
            if (value && value.object) {
                if (value.object === object) {
                    return true;
                    break;
                }
            }
        }
        return false;
    },

    setIntervalX: function (callback, lastcall, delay, repetitions) {
        var x = 0;
        var intervalID = window.setInterval(function () {
            callback();
            if (++x === repetitions) {
                lastcall();
                window.clearInterval(intervalID);
            }
        }, delay);
    },

    blinkObject: function (object) {
        if (typeof (object) == _UN || object == null || typeof (object.visible) == _UN) return;
        function gR(object, sett) {
            if (sett == true) {
                if (object.visible == true) {
                    object.visible = false;
                } else {
                    object.visible = true;
                }
            } else {
                object.visible = true;
            }
        }
        HELPER.setIntervalX(
            () => { gR(object, true); },
            () => { gR(object, false); }
            , 100, 8);
    },


    Vec3PosEquals: function (v1, v2) {
        var epsilon = Number.EPSILON;
        return ((Math.abs(v1.x - v2.x) < epsilon) && (Math.abs(v1.y - v2.y) < epsilon) && (Math.abs(v1.z - v2.z) < epsilon));
    },

    Vec3QuatEquals: function (v1, v2) {
        var epsilon = Number.EPSILON;
        return ((Math.abs(v1._x - v2._x) < epsilon) && (Math.abs(v1._y - v2._y) < epsilon) && (Math.abs(v1._z - v2._z) < epsilon) && (Math.abs(v1._w - v2._w) < epsilon));
    },

    createMaterial: function (material) {
        if (material == _UN) {
            material = new THREE.MeshStandardMaterial();//({ color: 0xcccccc });
        } else {
            material = new material();
        }
        HELPER.addMaterial(material);
        return material;
    },

    aplyTexture: function (object, file) {
        //THREE.MeshStandardMaterial      
        //if (!object.material || !object.material.map) return;               
        var texture = LOADER.textureLoader.load(file);
        HELPER.addTexture(texture);
        if (ENGINE.debug.notexture == false) object.material.map = texture;
        HELPER.updateTextureData(object);
    },

    addMaterial: function (mat) {
        ENGINE.xcolectorMaterial.push(mat);
    },

    addObject: function (obj) {
        ENGINE.xcolectorObject.push(obj);
    },

    addTexture: function (text) {
        ENGINE.xcolectorTexture.push(text);
    },

    /*
    tranverse: async function (obj, callback) {
        var nodes = [];
        window.SA = obj;
        console.log("sa");
        if (typeof (obj.children) == _UN && obj.length > 0) {
            obj.children = obj;
        }
        if (obj.children && obj.children.length > 0) {
            console.log("sb");
            for (var i = 0; i < obj.children.length; i++) {
                window.SS = obj.children[i];
                console.log("ss" + i);
                //await callback(obj.children[i]);
                nodes.push(obj.children[i]);
                if (obj.children[i].children && obj.children[i].children.length > 0) {
                    HELPER.tranverse(obj.children[i].children, callback);
                }

            }
        }
        for (var i = 0; i < nodes.length; i++) {
            callback(nodes[i]);
        }
    },
    
    tranverse: async function (obj, callback) {
        var nodes0 = [];
        var nodes1 = [];
        var nodes2 = [];
        var nodes3 = [];
        var nodes4 = [];
        function ndadd(obj2,arra) {
            if (typeof (obj2.children) == _UN && obj2.length > 0) {
                obj2.children = obj2;
            }
            if (obj2.children && obj2.children.length > 0) {
                arra.push(obj2.children);
            }
        }
        ndadd(obj,nodes0);
        for (var i = 0; i < nodes0.length; i++) {
            ndadd(nodes0[i], nodes1);            
        }
        for (var i = 0; i < nodes1.length; i++) {
            ndadd(nodes1[i], nodes2);
        }
        for (var i = 0; i < nodes2.length; i++) {
            ndadd(nodes2[i], nodes3);
        }
        for (var i = 0; i < nodes3.length; i++) {
            ndadd(nodes3[i], nodes4);
        }
        var nodex = nodes0.concat(nodes1, nodes2, nodes3, nodes4);
        for (var i = 0; i < nodex.length; i++) {
            callback(nodex[i]);
        }
    },*/

    setTexture: function (obj, file) {
        var parent = obj.parent;
        if (parent.group) {
            if (typeof (parent.group.texture) == _UN) {
                parent.group.texture = {};
            }
            //if(tile.group.texture[side]==null)tile.group.texture[side]=new GLOBAL.baseTexture();
            parent.group.texture[obj.group.face] = new GLOBAL.baseTexture();
            parent.group.texture[obj.group.face].file = file;
            obj.group.texture = parent.group.texture[obj.group.face];
            HELPER.aplyTexture(obj, file);
        }
        return obj.group;
    },

    setTextureInstance: function (obj, file) {
        if (obj.parent.group) {
            if (typeof (obj.parent.group.texture) == _UN) {
                obj.parent.group.texture = {};
            }
            //if(tile.group.texture[side]==null)tile.group.texture[side]=new GLOBAL.baseTexture();
            obj.parent.group.texture[obj.group.face] = new GLOBAL.baseTexture();
            obj.parent.group.texture[obj.group.face].file = file;
            obj.group.texture = obj.parent.group.texture[obj.group.face];
        }
        return obj.group;
    },

    setDataTexture: function (data, option) {
        data = JSON.parse(data);
        var file = "";
        if (data.file !== "") file = GLOBAL.conf.tilepath + data.file;
        var obj = ENGINE.scene.getObjectById(parseInt(data.id));
        console.log('tt', obj);
        if (option == "Texture") {
            HELPER.setTexture(obj, file);
        }
        if (option == "Reflex") {
            obj.group.texture.bumpmap = file;
            HELPER.updateTextureData(obj);
        }
        if (option == "Emissive") {
            obj.group.texture.emap = file;
            HELPER.updateTextureData(obj);
        }
        if (option == "Alpha") {
            obj.group.texture.amap = file;
            HELPER.updateTextureData(obj);
        }
    },


    updateTextureData: function (object) {
        //obj.group always is scene children (for OBJECTS)        
        if (object.group && object.group.name && object.group.name == "ObjChild") {
            HELPER.updateTextureAction(object, object.material, object.group.texture);
            return;
        }
        if (object == null || object.group == null || typeof (object.parent) == _UN || typeof (object.parent.group) == _UN || typeof (object.parent.group.texture) == _UN) {
            if (typeof (object.material) !== _UN) object.material.needsUpdate = true;
            return;
        }
        var objmat = object.material;
        var objgtexture = object.parent.group.texture[object.group.face];
        HELPER.updateTextureAction(object, objmat, objgtexture);
    },

    updateTextureAction: function (object, objmat, objtexture) {
        //if (typeof (objgtexture) == _UN || objgtexture==null)return;
        //console.log("mat", objmat, objgtexture);
        var textureL;
        //if (typeof (objtexture) == _UN) {
        //    console.warn("Basetexture Reseted");
        //    return;
        // }
        objmat.side = objtexture.side
        objmat.transparent = objtexture.transp == 1 ? true : false;
        objmat.opacity = objtexture.opac;
        if (objmat.transparent == true && objmat.opacity == 0) {
            objmat.visible = false;
            return;
        } else {
            objmat.visible = true;
        }
        objmat.receiveShadow = objtexture.rcvsh == 1 ? true : false;
        objmat.castShadow = objtexture.castsh == 1 ? true : false;
        if (typeof (objmat.color) !== _UN && objtexture.color != "") {
            if (ENGINE.debug.notexture == false)
                objmat.color.set(objtexture.color);
        }

        //if (object.parent.group.name == "Wall") {
        //console.log('Y', object.parent.group.name);
        //}

        //textura                
        if (objtexture.file == "" || objtexture.file == null) {
        } else {
            if (ENGINE.debug.notexture == false) {
                var spname = objtexture.file.split('/');
                spname = spname[spname.length - 1];
                if (spname.startsWith("shader_") == true) {
                    spname = spname.replace(".png", "");
                    object.material = SHADER.materials[spname.substring(7).toUpperCase()].material;
                    objmat = object.material;
                } else {
                    textureL = LOADER.textureLoader.load(objtexture.file);
                    HELPER.addTexture(textureL);
                    if (typeof (objmat.map) == _UN) objmat = HELPER.materials(10);
                    objmat.map = textureL;
                }
            }
        }

        //effects
        if (objtexture.effects.BLOOM == 1) {
            object.layers.enable(10);
        } else {
            object.layers.disable(10);
        }
        if (objtexture.effects.FILM == 1) {
            object.layers.enable(11);
        } else {
            object.layers.disable(11);
        }
        if (objtexture.effects.BLUUR == 1) {
            object.layers.enable(12);
        } else {
            object.layers.disable(12);
        }

        //reflexo            
        if (objtexture.bumpmap == "" || objtexture.bumpmap == null) {
            objmat.bumpMap = null;
        } else {
            textureL = LOADER.textureLoader.load(objtexture.bumpmap);
            HELPER.addTexture(textureL);
            objmat.bumpMap = textureL;
        }
        objmat.roughness = objtexture.rough;
        objmat.metalness = objtexture.metal;

        //opacity
        if (objtexture.amap == "" || objtexture.amap == null) {
            objmat.alphaMap = null;
        } else {
            textureL = LOADER.textureLoader.load(objtexture.amap);
            HELPER.addTexture(textureL);
            objmat.alphaMap = textureL;
        }
        objmat.alphaTest = objtexture.atest;

        //brilho interno            
        if (objtexture.emap == "" || objtexture.emap == null) {
            objmat.emissiveMap = null;
        } else {
            textureL = LOADER.textureLoader.load(objtexture.emap);
            HELPER.addTexture(textureL);
            objmat.emissiveMap = textureL;
        }
        objmat.emissiveIntensity = objtexture.eitensity;

        if (objmat.emissive && objtexture.emissive)
            objmat.emissive.set(objtexture.emissive);

        if (typeof (objmat.map) !== _UN && objmat.map !== null) {
            if (objmat.map.repeat) {
                objmat.map.repeat.x = objtexture.repeat.x;
                objmat.map.repeat.y = objtexture.repeat.y;
            }
            if (objmat.map.offset) {
                objmat.map.offset.x = objtexture.offset.x;
                objmat.map.offset.y = objtexture.offset.y;
            }
            if (objmat.map.center) {
                objmat.map.center.x = objtexture.center.x;
                objmat.map.center.y = objtexture.center.y;
            }
            objmat.map.rotation = THREE.Math.degToRad(objtexture.rotation);
        }
        //shaders = {};
        //object.group.texture = objgtexture;
        objmat.needsUpdate = true;
    },


    createShapeCapsule: function (radius, height) {
        var tickness = 1;
        var extrudeSettings = {
            steps: 2,
            depth: height - (tickness * 2),
            bevelEnabled: true,
            bevelThickness: tickness,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 2
        };
        var circleRadius = radius - extrudeSettings.bevelSize;
        var circleShape = new THREE.Shape()
            .moveTo(0, circleRadius)
            .quadraticCurveTo(circleRadius, circleRadius, circleRadius, 0)
            .quadraticCurveTo(circleRadius, - circleRadius, 0, - circleRadius)
            .quadraticCurveTo(- circleRadius, - circleRadius, - circleRadius, 0)
            .quadraticCurveTo(- circleRadius, circleRadius, 0, circleRadius);
        var mesh = new THREE.ExtrudeGeometry(circleShape, extrudeSettings);
        mesh.rotateX(-Math.PI / 2);
        return mesh;
    },

    makeRelease: function (obj) {
        obj.traverse(function (child) {
            if (child.group && child.group.texture) {
                delete child.group.texture;
            }
            if (child.helper && typeof (child.helper) != _UN && child.helper.parent) {
                child.helper.parent.remove(child.helper);
            }
            //if (child.target && typeof (child.target) != _UN && child.target.parent) {
            //    child.target.parent.remove(child.target);
            //}
        });
        if (obj.group && obj.group.texture) delete obj.group.texture;
    }


}