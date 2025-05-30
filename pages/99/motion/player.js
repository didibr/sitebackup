ENGINE.PLAYER = {
    active: false,
    player: null,
    players: [],
    raycaster: new THREE.Raycaster(),
    dtplayer: class { //database
        pos = { x: 0, y: 0, z: 0 };
        rot = { x: 0, y: 0, z: 0 };
        sca = { x: 1, y: 1, z: 1 };
        target = { x: 0, y: 0, z: 0 };
        lookat = { x: 0, y: 0, z: 0 };
        rotationMatrix = new THREE.Matrix4();
        targetQuaternion = new THREE.Quaternion();
        dummy = new THREE.Object3D();
        movemode = 0; //0-stoped 1-walk 2-sidewalk 3-backwalk
        KEY = "";
        NAME = "";
        speed = { move: 0.007, angle: 0.008, walk: 0.9 };
        fixeye = 1.6;
        zoom = { default: 60, min: 40, max: 80, increment: 1 };
        jump = 0;
    },


    movePlayer: function (delta) {
        if (typeof (ENGINE.PLAYER.player) == _UN || ENGINE.PLAYER.player == null) return;
        var player = ENGINE.PLAYER.player;
        if (typeof (player.group.name) == _UN || typeof (ENGINE.MOTION.bodyList[player.group.name]) == _UN ||
            typeof (ENGINE.MOTION.bodyList[player.group.name].bones) == _UN) return;
        var map = ENGINE._keyMap;
        var playedt = player.dtplayer;       
        var speed = player.dtplayer.speed.move * delta;
        //console.log("s", speed,delta);
        var jumpsize = player.dtplayer.jump;
        var direction = new THREE.Vector3;
        playedt.movemode = 0;
        if (map["KeyW"] && !map["KeyA"] && !map["KeyD"]) {
            ENGINE.camera.getWorldDirection(direction);
            direction.y = 0;
            ENGINE.PLAYER.calculateMove(player, direction, speed);
        }
        if (map["KeyS"] && !map["KeyA"] && !map["KeyD"]) {
            ENGINE.camera.getWorldDirection(direction);
            direction.negate();
            direction.y = 0;
            ENGINE.PLAYER.calculateMove(player, direction, speed);
        }
        if (map["KeyA"]) {            
            var angle = Math.PI / 2;
            if (map["KeyW"]) angle = angle * 0.5;
            if (map["KeyS"]) angle = angle + (angle * 0.5);
            ENGINE.camera.getWorldDirection(direction);
            direction.y = 0;
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            ENGINE.PLAYER.calculateMove(player, direction, speed);
        }
        if (map["KeyD"]) {
            var angle = -Math.PI / 2
            if (map["KeyW"]) angle = angle * 0.5;
            if (map["KeyS"]) angle = angle + (angle * 0.5);
            ENGINE.camera.getWorldDirection(direction);
            direction.y = 0;
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            ENGINE.PLAYER.calculateMove(player, direction, speed);
        }
        if (map["Space"]) {
            ENGINE.PHYSIC.bodyJump(player, jumpsize);
        }
    },


    calculateMove: function (player, direction, speed) {
        //Physic Player moves to direction * speed
        
        var lookPos = player.position.clone();
        var pos = player.position.clone();
        pos.addScaledVector(direction.normalize(), speed);
        lookPos.addScaledVector(direction.normalize(), speed + 10);
        ENGINE.PHYSIC.bodyTeleport(player, pos);        

        //camera fix on player with smooth
        CONTROLS.minAzimuthAngle = CONTROLS.maxAzimuthAngle = CONTROLS.getAzimuthalAngle();
        var npos = CONTROLS.target.clone();
        npos.sub(player.position);
        ENGINE.camera.position.lerp(npos.negate(), 0.2);
        CONTROLS.target.lerp(player.position, 0.2);

        //LOWER BODY DIRECTION ( legs ) based on move direction        
        var playedt = player.dtplayer;
        playedt.lookat.x = lookPos.x; playedt.lookat.y = lookPos.y; playedt.lookat.z = lookPos.z;
        playedt.movemode = 1;//walking

        CONTROLS.update();
        CONTROLS.minAzimuthAngle = CONTROLS.maxAzimuthAngle = Infinity;
    },

    playerLook: function () {
        var manwidth = (GLOBAL.conf.height / 3);
        //UPER BODY Direction Based on Mouse Raycasting
        if (typeof (ENGINE.PLAYER.player) == _UN || ENGINE.PLAYER.player == null) return;
        var player = ENGINE.PLAYER.player;
        var body = ENGINE.MOTION.bodyList[player.group.name];
        var playedt = player.dtplayer;
        ENGINE.PLAYER.raycaster.setFromCamera(ENGINE.mousePos, ENGINE.camera);
        var intersects = ENGINE.PLAYER.raycaster.intersectObject(player.plane);
        if (intersects.length == 1) {
            if (player.position.distanceTo(intersects[0].point) > 5) {
                var lookpoint = intersects[0].point;
                lookpoint.y = player.position.y;
                playedt.target.x = lookpoint.x; playedt.target.y = lookpoint.y; playedt.target.z = lookpoint.z;
                lookpoint.y += (manwidth * 0.5) - playedt.fixeye;
                body.bones["Spine"].parent.lookAt(lookpoint); //rotate bone spine           
            }
        }
    },



    updateRotations: function (delta) {
        if (typeof (ENGINE.PLAYER.player) == _UN || ENGINE.PLAYER.player == null) return;
        var player = ENGINE.PLAYER.player;
        if (typeof (player.group.name) == _UN || typeof (ENGINE.MOTION.bodyList[player.group.name]) == _UN ||
            typeof (ENGINE.MOTION.bodyList[player.group.name].bones) == _UN) return;
        var body = ENGINE.MOTION.bodyList[player.group.name];
        var spine = body.bones["Spine"].parent;
        var playedt = player.dtplayer;
        //var manwidth = (GLOBAL.conf.height / 3);
     

        //###############
        //# usefull angles
        //###############
        var zVec = new THREE.Vector3(0, 0, 1);
        //legs and lower body direction
        var target = new THREE.Vector3(playedt.target.x, playedt.target.y, playedt.target.z);
        playedt.dummy.position.copy(player.position);
        playedt.dummy.lookAt(target);
        zVec = new THREE.Vector3(0, 0, 1);
        zVec.applyQuaternion(playedt.dummy.quaternion);
        var targetAngle = THREE.Math.radToDeg(Math.atan2(zVec.x, zVec.z));
        //aim and upper body direction
        var lookat = new THREE.Vector3(playedt.lookat.x, playedt.lookat.y, playedt.lookat.z);
        playedt.dummy.position.copy(player.position);
        playedt.dummy.lookAt(lookat);
        zVec = new THREE.Vector3(0, 0, 1);
        zVec.applyQuaternion(playedt.dummy.quaternion);
        var lookatAngle = THREE.Math.radToDeg(Math.atan2(zVec.x, zVec.z));
        //spine rotation
        zVec = new THREE.Vector3(0, 0, 1);
        zVec.applyQuaternion(spine.quaternion);
        var spineAngle = THREE.Math.radToDeg(Math.atan2(zVec.x, zVec.z));
        spineAngle = spineAngle < 0 ? spineAngle * -1 : spineAngle;

        
        var nAngle = 0;
        if (targetAngle != lookatAngle) {
            if (targetAngle > lookatAngle) {
                nAngle = targetAngle - lookatAngle;
                if (nAngle > 220) {
                    nAngle = targetAngle - (lookatAngle*-1);
                }
            } else {
                nAngle = lookatAngle - targetAngle;
                if (nAngle > 220) {
                    nAngle = targetAngle - (lookatAngle * -1);
                }
            }            
        }
                
        //console.log("a", nAngle, targetAngle, lookatAngle, playedt.movemode);
        nAngle = nAngle < 0 ? nAngle * -1 : nAngle;
        
        if (playedt.movemode == 0) { //not walking            
            ENGINE.MOTION.setUnique(player.group.name, "idle", true);
            if (nAngle > 67 || spineAngle>67) { //rotate to direction
                playedt.lookat.x = target.x;
                playedt.lookat.y = target.y;
                playedt.lookat.z = target.z;                
                lookat = new THREE.Vector3(target.x, target.y, target.z);
            } if (nAngle >= 158) {
                //Player inversion occur           
            }
        } else { //walking            
            if (nAngle >= 130 ) { //walk back
                playedt.movemode = 3;
                ENGINE.MOTION.setUnique(player.group.name, "walk", false, playedt.speed.walk);
            } else {
                if (nAngle > 67) { //sidewalk
                    ENGINE.MOTION.setUnique(player.group.name, "swwalk", true, playedt.speed.walk);
                    playedt.movemode = 2; //Lerp to left angle
                } else { //normal direction
                    ENGINE.MOTION.setUnique(player.group.name, "walk", true, playedt.speed.walk);
                    playedt.movemode = 1;
                }
            }
        }
        

     
        //###############
        //# BODY ANGLE relative to keyboard (playedt.lookat)
        //###############     
        if (playedt.movemode == 3) { //invert rotation            
            playedt.rotationMatrix.lookAt(target, player.position, new THREE.Vector3(0, 1, 0));
            playedt.targetQuaternion.setFromRotationMatrix(playedt.rotationMatrix);            
        } else { //add smooth rotation to legs                  
            playedt.rotationMatrix.lookAt(lookat, player.position, new THREE.Vector3(0, 1, 0));
            playedt.targetQuaternion.setFromRotationMatrix(playedt.rotationMatrix);         
        }
        //Lower Body - Legs Update        
        if (!body.object.quaternion.equals(playedt.targetQuaternion)) {
            var step = playedt.speed.angle * delta;
            body.object.quaternion.rotateTowards(playedt.targetQuaternion, step);
            if (playedt.movemode == 0) {//stoped rotation                
                ENGINE.PLAYER.playerLook();
            }
        }


    },

    fpsInterval: undefined,
    startTime: undefined,
    now: undefined,
    then: undefined,
    elapsed: undefined,
    update: function (newtime, keymap) {
        if (typeof (this.fpsInterval) == _UN) {
            this.fpsInterval = 20;
            this.then = window.performance.now();
            this.startTime = this.then;            
        }
        //this.animate(newtime);
        this.now = newtime;
        this.elapsed = this.now - this.then;
        if (this.elapsed > this.fpsInterval) {
            this.animate(this.elapsed);
            this.then = this.now - (this.elapsed % this.fpsInterval);
        }
    },

    animate: function (fps) {        
        ENGINE.PLAYER.movePlayer(fps);
        ENGINE.PLAYER.updateRotations(fps);
        ENGINE.PLAYER.playerLook();
    },

    create: function (name, main) {
        var mansize = GLOBAL.conf.height - (GLOBAL.conf.height / 5);
        var manwidth = (GLOBAL.conf.height / 3);
        const geometry = new THREE.CylinderGeometry(manwidth / 2, manwidth / 2, mansize, 6);
        const material = new THREE.MeshBasicMaterial({ color: "white", wireframe: true, visible:false });
        const player = new THREE.Mesh(geometry, material);
        player.layers.enableAll();

        const basegeometry = new THREE.PlaneGeometry(GLOBAL.conf.width * 10, GLOBAL.conf.width * 10, 1, 1);
        var plane = new THREE.Mesh(basegeometry, HELPER.materials(0));
        plane.rotation.x = THREE.Math.degToRad(-90);
        plane.visible = false;

        player.plane = plane;
        player.group = { name: "Player" }
        HELPER.addMaterial(material);
        HELPER.addObject(player);
        ENGINE.PLAYER.players.push(player);
        player.dtplayer = new ENGINE.PLAYER.dtplayer();
        player.dtplayer.NAME = name;
        player.dtplayer.jump = (GLOBAL.conf.height / 5) * 2;
        ENGINE.scene.add(player);
        if (main == true) {
            ENGINE.PLAYER.player = player;
            var pos = ENGINE.TELEPORT.getMapSpawn();
            if (pos != null) {
                player.position.set(pos.x, pos.y, pos.z);
                ENGINE.MOTION.load("./3d/motion/zbot.fbx", player.group.name, 0.949, player, (obj) => {
                    player.attach(plane);
                    plane.position.set(0, -4.6, 0);
                });

                ENGINE.camera.position.set(pos.x - 20, pos.y + 20, pos.z - 20);
                CONTROLS.target.set(pos.x, pos.y, pos.z);
                CONTROLS.screenSpacePanning = false;
                CONTROLS.enablePan = false;
                CONTROLS.maxDistance = CONTROLS.minDistance = player.dtplayer.zoom.default;
                CONTROLS.minPolarAngle = 0.6444643125549909;//0.1728786603604932;
                CONTROLS.maxPolarAngle = 0.6444643125549909;//1.3712127935080203;
                CONTROLS.mouseButtons = {
                    LEFT: THREE.MOUSE.PAN,//THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE//THREE.MOUSE.PAN
                }
                CONTROLS.update();
            }
            ENGINE.PLAYER.active = true;
        }
        player.position.y += mansize / 2;
        ENGINE.PHYSIC.insert(player);
        return player;
    },

    zoom: function (inOff) {
        if (typeof (ENGINE.PLAYER.player) == _UN || ENGINE.PLAYER.player == null) return;
        var dtplayer = ENGINE.PLAYER.player.dtplayer;
        if (inOff == true) {
            if (dtplayer.zoom.default + dtplayer.zoom.increment > dtplayer.zoom.min &&
                dtplayer.zoom.default + dtplayer.zoom.increment < dtplayer.zoom.max) {
                dtplayer.zoom.default += dtplayer.zoom.increment;
                CONTROLS.maxDistance = CONTROLS.minDistance = dtplayer.zoom.default;
                CONTROLS.update();
            }            
        } else {
            if (dtplayer.zoom.default - dtplayer.zoom.increment > dtplayer.zoom.min &&
                dtplayer.zoom.default - dtplayer.zoom.increment < dtplayer.zoom.max) {
                dtplayer.zoom.default -= dtplayer.zoom.increment;
                CONTROLS.maxDistance = CONTROLS.minDistance = dtplayer.zoom.default;
                CONTROLS.update();
            }
        }
    },


}