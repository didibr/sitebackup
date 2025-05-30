//########################################################################
//########## AI AND MOVIMENTATION ########################################
//########################################################################
ENGINE.ENEMY_AI = {
    rayCaster: null, //used to trace line from enemy to player
    camera: null, //used to check if player in fild of view of enemy  
    cameraCtl: null,
    frustum: null,
    debugDirection: false,
    debugCamera: false,

    update: function (delta) { //call from game.update      
    },


    usefullMatrix: new THREE.Matrix4(),//reused matric to calc enemy direction
    updateEnemys: function (enemy, delta) { //from game.updateplayers
        //##### Creating facing direction
        if (typeof (enemy.userData.lookDir) == _UN) {
            enemy.userData.arrowDirection = new THREE.Vector3(0, 0, 1);
        }
        if (enemy.userData.life == 0) {//died body
            return;
        }
        var body = ENGINE.MOTION.bodyList[enemy.group.login];
        if (typeof (body) == _UN || typeof (body.object) == _UN) return;
        ENGINE.ENEMY_AI.usefullMatrix.extractRotation(body.object.matrix);
        var direction = new THREE.Vector3(0, 0, 1);
        direction.applyMatrix4(ENGINE.ENEMY_AI.usefullMatrix);
        enemy.userData.arrowDirection = direction;

        //##### check if is changing elevation
        if (ENGINE.ENEMY_AI.checkElevationChange(enemy, delta) == true) return;

        //##### Patrolining
        if (enemy.userData.spawn.patrol == 1 &&
            enemy.userData.isChase == false &&
            enemy.userData.isFolowPath == false) {
            ENGINE.ENEMY_AI.movimentEnemyPatrol(enemy, delta);
        }
        //##### chassing            
        if (enemy.userData.isChase == true && enemy.userData.chasePlayerLogin != "" &&
            enemy.userData.isFolowPath == false) {
            ENGINE.ENEMY_AI.movimentEnemyChasing(enemy, delta);
        }
        //##### folow path
        if (enemy.userData.isFolowPath == true) {
            ENGINE.ENEMY_AI.movimentEnemyFolowPath(enemy, delta);
        }
        //##### agro tests
        if (enemy.userData.spawn.agressive == 1 &&
            enemy.userData.isChase == false) {
            ENGINE.ENEMY_AI.checkAgro(enemy, body);
        }
        //DEBUG
        if (ENGINE.ENEMY_AI.debugDirection == true && typeof (ENGINE.MOTION.bodyList[enemy.group.login]) != _UN) {
            if (typeof (enemy.userData.arrow) == _UN) {
                const length = 4;
                const hex = 0x00ff00;
                enemy.userData.arrow = new THREE.ArrowHelper(enemy.userData.arrowDirection.normalize(), enemy.position, length, hex);
                enemy.userData.arrow.setLength(4, 1, 1);
                ENGINE.scene.add(enemy.userData.arrow);
            } //ENGINE.arrow                       
            enemy.userData.arrow.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
            enemy.userData.arrow.setDirection(enemy.userData.arrowDirection.normalize());
            enemy.userData.arrow.setColor("#00ff00");
            if (enemy.userData.isFolowPath == true) {
                enemy.userData.arrow.setColor("#ffff00");
            }
            if (enemy.userData.isChase == true) {
                enemy.userData.arrow.setColor("#ff0000");
            }
        }//DEBUG END
    },


    //check Elevation and change if near to point
    checkElevationChange: function (enemy, delta) {
        if (enemy.userData.isChangingElevation == true && enemy.userData.elevationTarget != null) {
            //var halfsize = (GLOBAL.conf.height - (GLOBAL.conf.height / 5)) / 2;
            var rampData = enemy.userData.elevationTarget;
            var rampIN = rampData.in;
            var rampOUT = rampData.out;
            var cellINP = rampIN.pos;
            var cellOUTP = rampOUT.pos;
            var enemP = new THREE.Vector2(enemy.position.x, enemy.position.z);
            var dist = enemP.distanceTo(cellINP);
            if (dist > 5) return;

            enemy.userData.isChangingElevation = false;
            enemy.userData.elevationTarget = null;
            enemy.userData.isChangingElevationTime = ENGINE.now + GLOBAL.conf.enRampChangeElevation;
            var outpoint = new THREE.Vector3(
                cellOUTP.x,
                (rampOUT.elevation * GLOBAL.conf.height),
                cellOUTP.y
            );

            if (rampIN.elevation == 1) {//going down
                outpoint.y = enemy.position.y - 5;
            }
            //console.log("g", outpoint);

            enemy.dtplayer.dummy.position.copy(enemy.position);
            enemy.dtplayer.dummy.lookAt(outpoint);
            enemy.dtplayer.dummy.translateZ(15);
            outpoint = enemy.dtplayer.dummy.position.clone();//reused var
            enemy.userData.newpos = outpoint;
            return false;
        } else {
            //check if need to step over ramp
            if (enemy.userData.isChangingElevationTime != 0 &&
                enemy.userData.elevationTargetPosition != null) {
                var distance = enemy.userData.newpos.distanceTo(enemy.position);
                var reached = false;
                if (ENGINE.now - enemy.userData.isChangingElevationTime > 0) { //moving up or dow in ramp               
                    ENGINE.ENEMY.chaseTo(enemy, delta);
                    if (distance < 1) reached = true;
                } else {//reached time
                    reached = true;
                }
                if (reached == true) {
                    enemy.userData.isChangingElevationTime = 0;
                    ENGINE.PHYSIC.bodyTeleport(enemy, enemy.userData.newpos);
                    enemy.dtplayer.dummy.position.copy(enemy.position);
                    var gotoPos = enemy.userData.elevationTargetPosition.clone();
                    enemy.userData.elevationTargetPosition = null;
                    enemy.userData.chasePath = ENGINE.PATH.pathTo(enemy, gotoPos); //continue chase or folow
                    enemy.userData.isChase = true;//new
                    enemy.userData.isFolowPath = false;//new
                    //var playerChase = ENGINE.PLAYER.getPlayer(enemy.userData.chasePlayerLogin);
                    //if (playerChase != null && typeof (enemy.userData.chasePath) != _UN) {
                    //    this.updateAgroStatus(enemy, playerChase);//update agro status                                            
                    //}                    
                }
                return true;
            } else {
                return false;
            }
        }
    },

    //check if agro someone
    checkAgro: function (enemy, body) {
        //if (enemy.group.login != "3931"/*"agro0"*/) return;                
        var alltargets = []; //players on frustum       
        //setting camera
        if (ENGINE.ENEMY_AI.camera == null) {//create camera
            ENGINE.ENEMY_AI.camera = new THREE.PerspectiveCamera(GLOBAL.conf.enAgroDistViewChase, GLOBAL.conf.enAgroCameraOffSet.aspect, 1, GLOBAL.conf.enAgroDistViewChase);
            ENGINE.ENEMY_AI.camera.setFocalLength(GLOBAL.conf.enAgroCameraOffSet.focal);
            ENGINE.ENEMY_AI.frustum = new THREE.Frustum();
            ENGINE.ENEMY_AI.cameraCtl = OrbitControl.createExtra(ENGINE.ENEMY_AI.camera, ENGINE.renderer.domElement);
            ENGINE.ENEMY_AI.cameraCtl.enabled = false;
        }

        var origin = enemy.position; //mesh.boundingSphere.center;          
        var direction = enemy.userData.arrowDirection.clone();
        direction.add(origin);
        ENGINE.ENEMY_AI.cameraCtl.enabled = true;
        ENGINE.ENEMY_AI.cameraCtl.object.position.copy(origin);
        ENGINE.ENEMY_AI.cameraCtl.target.copy(direction);
        ENGINE.ENEMY_AI.cameraCtl.update();
        ENGINE.ENEMY_AI.cameraCtl.enabled = false;

        //seting frustum to catch targets
        ENGINE.ENEMY_AI.frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(
            ENGINE.ENEMY_AI.camera.projectionMatrix,
            ENGINE.ENEMY_AI.camera.matrixWorldInverse));

        //DEBUG
        if (ENGINE.ENEMY_AI.debugCamera == true) {
            if (enemy.cam == undefined) {
                enemy.cam = new THREE.CameraHelper(ENGINE.ENEMY_AI.camera);
                enemy.cam.update();
                ENGINE.scene.add(enemy.cam);
            } else {
                enemy.cam.update();
            }
        }


        //catch targets     
        for (var i = 0; i < ENGINE.PLAYER.players.length; i++) {
            var target = ENGINE.PLAYER.players[i];
            var dtplayer = target.dtplayer;
            if (typeof (dtplayer.movemode) != _UN && target.group.name == "Player") {
                //valid player test on frustum
                var distance = origin.distanceTo(target.position);
                if (distance < GLOBAL.conf.enAgroDistViewChase) {
                    if (ENGINE.ENEMY_AI.frustum.intersectsObject(target) == true) {
                        alltargets.push(target);//enemy.chase(target);
                    }
                }
            }
        }
        //test if view is obstructed
        var finaltarget = null;
        if (ENGINE.ENEMY_AI.rayCaster == null) ENGINE.ENEMY_AI.rayCaster = new THREE.Raycaster();
        enemy.dtplayer.dummy.position.copy(origin);
        var direction = new THREE.Vector3();
        var far = new THREE.Vector3();
        var intersects = [];
        for (var i = 0; i < alltargets.length; i++) {
            var target = alltargets[i];
            enemy.dtplayer.dummy.lookAt(target.position);
            direction = direction.subVectors(target.position, origin).normalize();
            far = far.subVectors(origin, target.position).length();

            ENGINE.ENEMY_AI.rayCaster.set(origin, direction);
            ENGINE.ENEMY_AI.rayCaster.far = far;

            intersects = ENGINE.ENEMY_AI.rayCaster.intersectObjects(ENGINE.GAME.objcts3D);
            if (intersects.length > 0 && intersects[0].object.group &&
                intersects[0].object.group.login &&
                intersects[0].object.group.login == target.group.login) {//aiming
                if (finaltarget == null) {
                    finaltarget = target;
                } else {
                    //finaltarget = nearest target
                    if (enemy.position.distanceTo(target.position) <
                        enemy.position.distanceTo(finaltarget.position)) {
                        finaltarget = target;
                    }
                }
            }
        }
        //have a target
        if (finaltarget != null) {
            ENGINE.ENEMY_AI.agroOnTarget(enemy, finaltarget);
        }
    },

    updateAgroStatus: function (enemy, target) { //return true on stop        
        if (enemy.userData.spawn.agressive != 1) return;
        var distance = enemy.position.distanceTo(target.position);
        if (distance < GLOBAL.conf.enAgroDistViewChaseFar)
            enemy.userData.chaseFailTime = ENGINE.now;
        if (ENGINE.now - enemy.userData.chaseFailTime >
            GLOBAL.conf.enAgroDistViewChaseFarTime) { //stop agro too far away/time
            //console.log('Stoping Agro Chase');            
            enemy.chase();
        }
    },


    //ENEMY on patrol
    movimentEnemyPatrol: function (enemy, delta) {
        if (enemy.userData.isPatroling == false) { //stoped enemy patroler
            if (ENGINE.now - enemy.userData.lastPatrolTime >
                GLOBAL.conf.enpatrolTime) { //is time to patroll
                enemy.userData.lastPatrolTime = ENGINE.now;
                var moveornot = (Math.random() < 0.9);//percentage chance to move
                if (moveornot == true) { //start to patrol
                    enemy.dtplayer.rotatingStoped = GLOBAL.conf.enrotatingStoped;
                    enemy.userData.isPatroling = true;
                    enemy.userData.newpos = new THREE.Vector3(
                        enemy.userData.spawn.pos.x, enemy.position.y, enemy.userData.spawn.pos.z
                    );
                    enemy.userData.newpos.x += HELPER.getRandomRange(-enemy.userData.spawn.patrolto, enemy.userData.spawn.patrolto);
                    enemy.userData.newpos.z += HELPER.getRandomRange(-enemy.userData.spawn.patrolto, enemy.userData.spawn.patrolto);
                    //ENGINE.ENEMY.patrolTo(player, moveto, delta);
                }
            }
        } else { //update patroling
            ENGINE.ENEMY.patrolTo(enemy, delta);
        }
    },

    //binded on players "folowPath(position/object)"
    folowPathFNC: function (enemy, objpos) {
        var pos = null;
        if (objpos.isVector3) pos = objpos.clone();
        if (typeof (objpos.position) != _UN && objpos.position.isVector3)
            pos = objpos.position.clone();
        if (pos == null) return;
        /*var destination = new THREE.Vector3(
            pos.x, enemy.position.y, pos.z
        );*/
        var destination = pos.clone();
        enemy.userData.chasePath =
            ENGINE.PATH.pathTo(enemy, destination);
        enemy.userData.isFolowPath = true;
    },

    //binded on player "chase(player/enemy/login)"
    chaseFNC: function (enemy, chasePlayer) {
        enemy.userData.isChangingElevation = false;
        enemy.userData.elevationTarget = null;
        if (typeof (chasePlayer) == _UN || chasePlayer == null) {
            //stop chase and folow path
            this.resetSpineRotation(enemy);
            enemy.userData.isChase = false;
            enemy.userData.chasePlayerLogin = "";
            /*var ppos = new THREE.Vector3(
                enemy.userData.spawn.pos.x, enemy.position.y, enemy.userData.spawn.pos.z
            );*/
            var ppos = new THREE.Vector3(
                enemy.userData.spawn.pos.x, enemy.userData.spawn.pos.y, enemy.userData.spawn.pos.z
            );
            ENGINE.ENEMY_AI.folowPathFNC(enemy, ppos);
        } else { //start chase
            if (typeof (chasePlayer) == "string") chasePlayer = ENGINE.PLAYER.getPlayer(chasePlayer);
            if (typeof (chasePlayer.userData) != _UN &&
                typeof (chasePlayer.group.login) != _UN) {
                enemy.userData.chasePlayerLogin = chasePlayer.group.login;
                enemy.userData.chasePath = ENGINE.PATH.pathTo(enemy, chasePlayer.position);
                enemy.userData.chaseLastPos = chasePlayer.position.clone();
                enemy.userData.isChase = true;
            } else {
                enemy.userData.isChase = false;
            }
        }
    },

    //global folowpath
    folowPath (enemy, delta) {
        if (enemy.userData.chasePath == null) {//ERROR WRONG STEP            
            var lastpos = ENGINE.PATH.cellToPosition({ x: enemy.userData.lastGrid[0], y: enemy.userData.lastGrid[1] });
            enemy.userData.newpos = new THREE.Vector3(
                lastpos.x, enemy.position.y, lastpos.y
            );
            enemy.userData.chasePath = [];
            return true;
        }//END ERROR WRONG STEP
        //DEBUG
        if (ENGINE.PATH.debug == true) {
            var gridTile = ENGINE.PATH.gridTile[0];
            for (var i = 0; i < enemy.userData.chasePath.length; i++) {
                var cpos = enemy.userData.chasePath[i];
                gridTile.dgrid[cpos[1]][cpos[0]].material = ENGINE.PATH.matPlayer;
            }
        }//DEBUG END
        if (enemy.userData.chasePath.length > 0) {
            var currentpos = new THREE.Vector2(enemy.position.x, enemy.position.z);
            var movingtpos;
            if (typeof (enemy.userData.newpos) != _UN) {
                movingtpos = new THREE.Vector2(enemy.userData.newpos.x, enemy.userData.newpos.z);
            } else {
                movingtpos = currentpos.clone();
            }
            var distance = currentpos.distanceTo(movingtpos);
            if (distance < GLOBAL.conf.squarewidth / 2) {
                //DEBUG
                if (ENGINE.PATH.debug == true) {
                    var gridTile = ENGINE.PATH.gridTile[0];
                    if (enemy.userData.lastGrid) {
                        gridTile.dgrid
                        [enemy.userData.lastGrid[1]][enemy.userData.lastGrid[0]]
                            .material = ENGINE.PATH.matbase0;
                    }
                }//DEBUG END
                var chasenode = enemy.userData.chasePath.shift();
                enemy.userData.lastGrid = chasenode;
                var chasenodePos = ENGINE.PATH.cellToPosition({ x: chasenode[0], y: chasenode[1] });
                enemy.userData.newpos = new THREE.Vector3(
                    chasenodePos.x, enemy.position.y, chasenodePos.y
                );
            } else {
                //player.dtplayer.rotatingStoped = GLOBAL.conf.enrotatingStoped;
                ENGINE.ENEMY.chaseTo(enemy, delta);
            }
            return true;//moved to path
        } else {
            return false;//no more moves
        }
    },

    //ENEMY FOLOW PATH
    movimentEnemyFolowPath: function (enemy, delta) {
        var folowok = ENGINE.ENEMY_AI.folowPath(enemy, delta);//folow path
        if (folowok == false) { //end of folowpath   
            enemy.userData.isFolowPath = false;
            if (enemy.userData.isRun == true) enemy.userData.isRun = false;
            ENGINE.ENEMY.stopMoves(enemy);
            //rotate according spawn rotation data
            var data = enemy.userData.spawn;
            if (data && data.rot && typeof (data.rot.x) != _UN) {
                //enemy.rotation.set(data.rot.x, data.rot.y, data.rot.z, "XYZ");
                enemy.dtplayer.dummy.rotation.set(data.rot.x, data.rot.y, data.rot.z, "XYZ");
                ENGINE.PHYSIC.bodyRotateQuaternion(enemy, enemy.dtplayer.dummy.quaternion);
            }

        }
    },

    //retargeting due phisical contact
    movimentEnemyRetarget (enemy1, enemy2) {
        //for folowpatch or chasing
        if (enemy1.userData.isFolowPath == true ||
            (enemy1.userData.isChase == true && enemy1.userData.chasePlayerLogin != "")) {

            if (typeof (enemy1.userData.retarGetingTime) == _UN)
                enemy1.userData.retarGetingTime = ENGINE.now - 300000;

            if (ENGINE.now - enemy1.userData.retarGetingTime >
                GLOBAL.conf.enretargetingStop) {
                enemy1.userData.retarGetingTime = ENGINE.now;

                enemy1.dtplayer.dummy.position.copy(enemy1.position);
                enemy1.dtplayer.dummy.lookAt(enemy2.position);
                //random move avoid
                //THREE.Math.radToDeg(objRotation); - retorna angulo de 0 / 90 ou 0 / -90
                //THREE.Math.degToRad(angulo); - retorna rotacao de 0 / (Math.PI * 2) ou 6.28
                //player1.dtplayer.dummy.translateZ(+GLOBAL.conf.squarewidth;
                //step back and save position
                enemy1.dtplayer.dummy.translateZ(-GLOBAL.conf.squarewidth);
                var backpos = enemy1.dtplayer.dummy.position.clone();
                //go to origin and look to position in back
                enemy1.dtplayer.dummy.position.copy(enemy1.position);
                enemy1.dtplayer.dummy.lookAt(backpos);
                //add random angle
                enemy1.dtplayer.dummy.rotation.y += HELPER.getRandomRange(-1.2, 1.2);
                enemy1.dtplayer.dummy.translateZ(GLOBAL.conf.squarewidth);
                var gridTo = ENGINE.PATH.positionToCel(enemy1.dtplayer.dummy.position);
                enemy1.dtplayer.dummy.position.copy(enemy1.position);

                if (enemy1.userData.isChase == true) {//is chasing take another path
                    var playerChase = ENGINE.PLAYER.getPlayer(enemy1.userData.chasePlayerLogin);
                    enemy1.userData.chasePath = ENGINE.PATH.pathTo(enemy1, playerChase.position);
                    if (enemy1.userData.chasePath == null) enemy1.userData.chasePath = [];
                    enemy1.userData.chaseLastPos = playerChase.position.clone();
                    enemy1.userData.chasePath.unshift([gridTo.x, gridTo.y]);
                }
                if (enemy1.userData.isFolowPath == true) {//is folow path 1 step back                    
                    if (enemy1.userData.chasePath == null) enemy1.userData.chasePath = [];
                    enemy1.userData.chasePath.unshift([gridTo.x, gridTo.y]);
                }
            } else {
                enemy1.userData.retarGetingTime = ENGINE.now;
                enemy1.userData.pauseTicks = ENGINE.now + GLOBAL.conf.enretargetingStop;
                enemy1.dtplayer.movemode = 0;
                ENGINE.ENEMY.stopMoves(enemy1);
            }

        }
    },



    //ENEMY chassing
    movimentEnemyChasing: function (enemy, delta) {
        var playerChase = ENGINE.PLAYER.getPlayer(enemy.userData.chasePlayerLogin);
        if (playerChase != null && typeof (enemy.userData.chasePath) != _UN) {
            //retarget when player change position
            //generate folowpath
            var distance = enemy.userData.chaseLastPos.distanceTo(playerChase.position);
            if (distance > GLOBAL.conf.squarewidth * 2) {
                enemy.userData.chasePath = ENGINE.PATH.pathTo(enemy, playerChase.position);
                enemy.userData.chaseLastPos = playerChase.position.clone();
            }
            var folowok = false;
            if (enemy.userData.isChaseTargetStopRay == true) {//folow if not in ray
                var direction = new THREE.Vector3();
                var far = new THREE.Vector3();
                var intersects = [];
                enemy.dtplayer.dummy.position.copy(enemy.position);
                enemy.dtplayer.dummy.lookAt(playerChase.position);
                if (ENGINE.ENEMY_AI.rayCaster == null) ENGINE.ENEMY_AI.rayCaster = new THREE.Raycaster();

                direction = direction.subVectors(playerChase.position, enemy.position).normalize();
                far = enemy.userData.weaponRange;
                //far.subVectors(enemy.dtplayer.dummy.position, playerChase.position).length();

                ENGINE.ENEMY_AI.rayCaster.set(enemy.position, direction);
                ENGINE.ENEMY_AI.rayCaster.far = far;



                intersects = ENGINE.ENEMY_AI.rayCaster.intersectObjects(ENGINE.GAME.objcts3D);
                //console.log(intersects.length, intersects[0].object.group);
                if (intersects.length > 0 && intersects[0].object.group &&
                    intersects[0].object.group.login &&
                    intersects[0].object.group.login == enemy.userData.chasePlayerLogin) {
                    folowok = false;
                    //is in AIM
                } else {
                    folowok = ENGINE.ENEMY_AI.folowPath(enemy, delta);//folow path
                }

            } else {//folow always
                folowok = ENGINE.ENEMY_AI.folowPath(enemy, delta);//folow path
            }
            if (folowok == true) { //is folowing  
                this.resetSpineRotation(enemy);
                this.updateAgroStatus(enemy, playerChase);//update agro status
            } else { //no more folow                
                if (enemy.userData.isChaseTargetStopRay == true) {
                    //START RANGED ATACK
                    ENGINE.ENEMY_AI.atackTarget(enemy, playerChase, delta);
                } else {
                    //START MELEE ATACK
                    ENGINE.ENEMY_AI.atackTarget(enemy, playerChase, delta);
                }
            }
        }
    },



    //#####################################################
    // FIGHT AI AREA

    resetSpineRotation: function (enemy) {
        var enemyName = enemy.group.name;
        var motionEnemy = ENGINE.MOTION.bodyList[enemyName];
        var spineDef = ENGINE.MOTION.getmodelData(enemy.group.model).spineDef;
        motionEnemy.bones["Spine"].parent.rotation.set(spineDef.x, spineDef.y, spineDef.z);
    },

    atackTargetExecute: function (enemy, player) {
        var itemonHand = ENGINE.PLAYER.getItemAtached(enemy, 'RightHand');
        if (itemonHand == null) itemonHand = ENGINE.PLAYER.getItemAtached(enemy, 'LeftHand');
        
        
        //var motionEnemy = ENGINE.MOTION.bodyList[enemy.group.login];
        //var spinefix = ENGINE.MOTION.getmodelData(enemy.group.model).spineFix;
        //var targetpos = player.position.clone();
        var atack = false;
        if (itemonHand == null || itemonHand.class == null) { //unarmed
            console.log("Unnarmed Attack");
            if (typeof(enemy.audio.audio02)!=_UN) {
                enemy.audio.audio02(true);
            }
            ENGINE.MOTION.animateNoLoop(enemy.group.login, "punch", true, 1, 0.7);
            atack = true;
        }
        if (itemonHand != null && itemonHand.class == 5) {
            HELPER.particleFireCast(enemy, 10);
            if (itemonHand.audio && itemonHand.audio.audio03) itemonHand.audio.audio03();
            if (itemonHand.light && itemonHand.light.use) itemonHand.light.use();
            ENGINE.MOTION.animateOnce(enemy.group.login, "use_pistol", true, 1, 0.7);
            atack = true;
        }
        if (itemonHand != null && itemonHand.class == 6) {
            HELPER.particleFireCast(enemy, 10);
            if (itemonHand.audio && itemonHand.audio.audio03) itemonHand.audio.audio03();
            if (itemonHand.light && itemonHand.light.use) itemonHand.light.use();
            ENGINE.MOTION.animateOnce(enemy.group.login, "use_rifle", true, 1, 1);
            atack = true;
        }
        //sucess atack - calculate damage
        if (atack == true) {
            ENGINE.ENEMY_AI.calculateDamageOnTarget(enemy, player);
        }
    },



    //player is under atack
    atackTarget: function (enemy, player, delta) {
        var dtenemy = enemy.dtplayer;
        dtenemy.movemode = 5;
        var targetpos = player.position.clone();
        ENGINE.PLAYER.spineFix(enemy, targetpos);
        //atack part
        //enemy.userData.weaponSpeed = rHandITEM.item.speed;
        //enemy.userData.weaponRange = rHandITEM.item.range;
        //enemy.userData.weaponClass = rHandITEM.class;//sworld
        //player.userData.weaponAtackTime        
        if (ENGINE.now - enemy.userData.weaponAtackTime >
            (GLOBAL.conf.enWeaponSpeedMultiply * enemy.userData.weaponSpeed)) { //check if fire delay ok
            enemy.userData.weaponAtackTime = ENGINE.now;
            ENGINE.ENEMY_AI.atackTargetExecute(enemy, player);
        }
    },

    //player is a target acquired
    agroOnTarget: function (enemy, player) {
        var itemonHand = ENGINE.PLAYER.getItemAtached(enemy, 'RightHand');
        if (itemonHand == null) itemonHand = ENGINE.PLAYER.getItemAtached(enemy, 'LeftHand');
        if (itemonHand != null) {
            if (itemonHand.class == 5 || itemonHand.class == 6)/*ranged weapons*/ {
                enemy.userData.isChaseTargetStopRay = true; //ranged att
            } else {
                enemy.userData.isChaseTargetStopRay = false; //meleee att
            }
            enemy.userData.weaponSpeed = itemonHand.item.speed;
            enemy.userData.weaponRange = itemonHand.item.range;
            enemy.userData.weaponClass = itemonHand.class;//sworld 
        }
        if (player == null) return;
        this.resetSpineRotation(enemy);
        enemy.userData.chaseFailTime = ENGINE.now;
        enemy.chase(player);
    },


    //damage calculation
    calculateDamageOnTarget: function (player, target) {
        function addItemValue(owner, data) {
            if (data != undefined && data != null) {
                owner.userData.armor += data.item.armor;
                owner.userData.damage += data.item.damage;
            }
        }
        player.userData.armor = 0;
        player.userData.damage = 1;
        target.userData.armor = 0;
        target.userData.damage = 1;
        //enemy.userData.weaponRange = 1;
        //enemy.userData.weaponClass = 3;//sworld 
        var e_rHandITEM = ENGINE.PLAYER.getItemAtached(player, 'RightHand');
        var e_lHandITEM = ENGINE.PLAYER.getItemAtached(player, 'LeftHand');
        var e_legsITEM = ENGINE.PLAYER.getItemAtached(player, 'RightUpLeg');//same as 'LeftUpLeg'        
        var e_shoesITEM = ENGINE.PLAYER.getItemAtached(player, 'RightFoot');//same as left
        var e_armorITEM = ENGINE.PLAYER.getItemAtached(player, 'Spine1');
        var e_headITEM = ENGINE.PLAYER.getItemAtached(player, 'Head');
        addItemValue(player, e_rHandITEM);
        addItemValue(player, e_lHandITEM);
        addItemValue(player, e_legsITEM);
        addItemValue(player, e_shoesITEM);
        addItemValue(player, e_armorITEM);
        addItemValue(player, e_headITEM);

        if (e_rHandITEM == null && e_lHandITEM == null) { //unarmed
            player.userData.damage = 10;
            player.userData.weaponSpeed = 30;
            player.userData.weaponRange = 3;
        }

        var p_rHandITEM = ENGINE.PLAYER.getItemAtached(target, 'RightHand');
        var p_lHandITEM = ENGINE.PLAYER.getItemAtached(target, 'LeftHand');
        var p_legsITEM = ENGINE.PLAYER.getItemAtached(target, 'RightUpLeg');//same as 'LeftUpLeg'        
        var p_shoesITEM = ENGINE.PLAYER.getItemAtached(target, 'RightFoot');//same as left
        var p_armorITEM = ENGINE.PLAYER.getItemAtached(target, 'Spine1');
        var p_headITEM = ENGINE.PLAYER.getItemAtached(target, 'Head');
        addItemValue(target, p_rHandITEM);
        addItemValue(target, p_lHandITEM);
        addItemValue(target, p_legsITEM);
        addItemValue(target, p_shoesITEM);
        addItemValue(target, p_armorITEM);
        addItemValue(target, p_headITEM);

        

        if (target.userData.life && target.userData.life > 0) {
            var damage = player.userData.damage;
            var defende = target.userData.armor;
            var life = target.userData.life;
            if (defende > 90) defende = 90;
            if (defende < 0) defende = 0;
            if (damage > 100) damage = 100;
            if (damage < 0) damage = 1;

            damage = damage - ((defende / 100) * damage);
            life = life - damage;
            target.userData.life = life;
            if (target.userData.life < 0.9) {
                //Hit and Kill
                target.userData.life = 0;
                ENGINE.ENEMY_AI.killAction(target);
            } else {
                //Hit and not Kill
                ENGINE.MOTION.animateNoLoop(target.group.login, "hit", true, 1, 0.4);
                if (target.group.type == "Enemy") {//enemy agro on hit                   
                    ENGINE.ENEMY_AI.agroOnTarget(target, player);
                }
            }

        }
    },


    //someone dies
    killAction: function (target) {
        if (typeof (target.userData.life) == _UN || target.userData.life != 0) return;
        var object = ENGINE.MOTION.bodyList[target.group.login].object;
        //reset animations        
        target.dtplayer.movemode = -1;
        /*
        var motionNames = ENGINE.MOTION.getanimationNames();
        for (var e = 0; e < Object.keys(motionNames).length; e++) {
            var motion = motionNames[Object.keys(motionNames)[e]].name;            
            ENGINE.MOTION.animate(player.group.login, motion, true, 0, 0);            
        }
        */
        //remove from 3dobjects
        //if (ENGINE.GAME.objcts3D.includes(player)) {         
        const index = ENGINE.GAME.objcts3D.indexOf(target);
        if (index > -1) {
            ENGINE.GAME.objcts3D.splice(index, 1); // 2nd parameter means remove one item only
        }
        //}
        if (target.group.type == "Enemy") {
            console.log('died', target.group.login);
            target.userData.physicsBody.setCollisionFlags(5);//disable simulation - default 0
            ENGINE.MOTION.animateNoLoop(target.group.login, 'die', true, 1, 1);
            setTimeout(async () => {
                //target.visible = false;
                //target.bars.div.visible = false;
                target.userData.physicsBody.setCollisionFlags(0);
                ENGINE.PHYSIC.bodyTeleport(target, new THREE.Vector3(0, 800000, 0));
            }, 4000);
        } else { //player died
            ENGINE.PLAYER.updateServerData();
            ENGINE.HUD.showDied();            
            ENGINE.AUDIO.system.died.play();
            setTimeout(async () => {                
                ENGINE.clock.stop();
                $('#diedMenu').fadeIn(4000);
            }, 500);
        }
    }

}