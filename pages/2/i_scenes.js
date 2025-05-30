window.jt = {};
window.CTRLV = 0.3; //ATARI AUDIO 	
window.CTRAC = null; //ATARI AUDIO CONTEXT
jt.atariloaded = false;
jt.ataripower = false;
jt.atariglitch = false;

var JavatariFullScreenSetup = { apply: function fullScreenSetup() { /* Setup Basic full-screen CSS*/ if (!this.cssApplied) { var style = document.createElement('style'); style.type = 'text/css'; style.innerHTML = this.css; document.head.appendChild(style); this.cssApplied = true; } /* Apply Standalone mode full-screen basic styles to html and body immediately if needed*/ document.documentElement.classList.toggle("jt-full-screen", this.shouldStartInFullScreen()); }, shouldStartInFullScreen: function () { return window.Javatari ? Javatari.SCREEN_FULLSCREEN_MODE === 1 || (Javatari.SCREEN_FULLSCREEN_MODE === -1 && this.isBrowserStandaloneMode()) : this.isBrowserStandaloneMode(); }, isBrowserStandaloneMode: function () { return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches; }, css: '' + 'html.jt-full-screen, html.jt-full-screen body {' + '   background: black;' + '}' + 'html.jt-full-screen .jt-full-screen-hidden {' + '   display: none;' + '}' + 'html:not(.jt-full-screen) .jt-full-screen-only {' + '   display: none;' + '}' }; JavatariFullScreenSetup.apply();

class ISCENE {

    audioFromMedia = null;
    addAudio = null;
    createObject = null;
    scene = null;
    waitforaudiotimes;
    creating = false;
    iplayer = null;
    ihud = null;

    waiforaudio = function () {
        if (navigator.userActivation.hasBeenActive) {
            clearTimeout(this.waitforaudiotimes);
            var t = document.createElement("script"); t.async = false;
            t.src = './_atari.js', document.getElementsByTagName("head")[0].appendChild(t)
        } else {
            this.waitforaudiotimes = setTimeout(() => { this.waiforaudio(); }, 500);
        }
    }

    update() {
        if (jt.atariloaded == false && typeof (Javatari) != _UN && typeof (Javatari.start) != _UN) {
            Javatari.SCREEN_RESIZE_DISABLED = true;
            Javatari.SCREEN_FULLSCREEN_MODE = -2;
            Javatari.AUTO_POWER_ON_DELAY = -1;
            //Javatari.SCREEN_CRT_MODE=1;
            //SCREEN_CONTROL_BAR=0;            
            //Javatari.CARTRIDGE_URL = "rom/pacman.zip";
            Javatari.start();
            //CTRL(jt.ConsoleControls.POWER_OFF,true);
            jt.atariloaded = true;
        }
    }

    init(audio, audiofr, cobject, sc, pl, ih) {
        this.waiforaudio();
        this.addAudio = audio;
        this.audioFromMedia = audiofr;
        this.createObject = cobject;
        this.scene = sc;
        this.iplayer = pl;
        this.ihud = ih;
    }

    async clearObjTree(obj) {
        if (obj && obj != null && obj.children) {
            while (obj.children.length > 0) {
                await this.clearObjTree(obj.children[0]);
                obj.remove(obj.children[0]);
            }
        }
        if (obj && obj != null && obj.material) {
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(obj.material).forEach(prop => {
                if (!obj.material[prop]) return;
                if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
                    if (materials.includes(obj.material[prop]) == false) obj.material[prop].dispose();
            })
            if (obj.material !== null && typeof obj.material.dispose === 'function')
                if (materials.includes(obj.material) == false) obj.material.dispose();
        }
        if (obj && obj != null && obj.texture) {
            if (obj.texture !== null && typeof obj.texture.dispose === 'function')
                obj.texture.dispose();
        }
        if (obj && obj != null && obj.geometry) {
            if (obj.geometry !== null && typeof obj.geometry.dispose === 'function')
                obj.geometry.dispose();
        }
    }


    async clean() {
        this.creating = true;
        $('#btCenter').show();
        audios.forEach((audio) => {
            if (audio.isPlaying) audio.stop();
            /*if(audio.ismediaElement)audio.disconnect();
            const index = audios.indexOf(audio);
            audios.splice(index, 1);*/
        });
        $("video").each(function () {
            $(this).get(0).muted = true;
        });
        //clear player data
        for (var i = 0; i < Object.keys(this.iplayer.players).length; i++) {
            var id = Object.keys(this.iplayer.players)[i];
            var contact = this.iplayer.players[id];
            var model = contact.model;
            await this.clearObjTree(model.pdata.bones);
            await this.clearObjTree(model);
            await this.clearObjTree(contact);
        }
        this.iplayer.players = [];
        objects = [];
        objectbyNames = {};
        AUDIOlistener = null;
        if (camera.parent != null) camera.parent.remove(camera);
        await this.clearObjTree(this.scene);
        scene.clear();
    }

    async createScene(value, execute) {
        var loadingdObjt = 0;
        var create3DObject = this.createObject;
        var iplayer = this.iplayer;
        var me = this;
        this.ihud.clean();
        await this.clean();
        async function icreateObject(name, iobject) {
            loadingdObjt += 1;
            create3DObject(name, async (object) => {
                iobject(object);
                loadingdObjt -= 1;
                //console.log('Wainting for', loadingdObjt);
                if (loadingdObjt <= 0) {
                    $('#btCenter').hide();
                    me.creating = false;
                    await iplayer.updateFloor();
                    if (typeof (execute) == 'function') execute();
                }
            });
        }

        //############################################################
        //## SCENE 01                  ###############################
        //############################################################
        if (value == 1) {
            const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0.7);
            pointLight2.position.set(0, 800, 0);
            //pointLight2.shadow.bias = -0.0015;            
            scene.add(pointLight2);
            GAME.materials[91].envMapRotation.y = 0;////Rotate Window EnvMap    

            LOADER.textureLoader.load('./models/envROOM1.jpg', (texture) => {
                materials[90].envMap = texture;
                materials[90].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[90].envMap.needsUpdate = true;
            });

            this.iplayer.create('player', 0, (object) => {
                this.scene.add(object);
                object.position.y = -12.5;
            });

            control.toggle(2);


            icreateObject('room1', async (object) => {
                this.scene.add(object);
                object.position.y = -39.2;
                icreateObject('door1', (object2) => {
                    object2.isSceneObj = true;
                    this.scene.getObjectByName('room_wall1').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(34, -9, 0.1);
                    getOByName('door1_box').rotation.x = Math.PI;
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=2;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('window1', (object2) => {
                    object2.isSceneObj = true;
                    object2.sceneSca = { x: 0.1, y: 1, z: 1 };
                    this.scene.getObjectByName('room_wall3').add(object2);
                    object2.position.set(0, 0, 0.4);
                    var wlight = object2.getObjectByName('window1_light');
                    var wpos = new THREE.Vector3();
                    wlight.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                    icreateObject('curtain', (object3) => {
                        this.scene.getObjectByName('room_wall3').add(object3);
                        object3.position.set(0, -20, 5);
                        object3.frame = [object2.getObjectByName('frame2'), object2.getObjectByName('glass2')];
                        object3.framelight = wlight;
                    });
                });
                icreateObject('paint3', (object2) => {
                    this.scene.getObjectByName('room_wall2').add(object2);
                    object2.position.set(40, 12, -0.2);
                });
                icreateObject('paint0', (object2) => {
                    this.scene.getObjectByName('room_wall4').add(object2);
                    object2.position.set(20, 12, 0);
                });

            });

            icreateObject('carpet', (object) => {
                this.scene.add(object);
                object.position.set(0, -38.2, 0);
            });
            icreateObject('chair', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 0.65, y: 1, z: 0.75 };
                object.scenePosFix = { x: 0, y: 0, z: 2 };
                object.scenePos = { x: 0, y: 0, z: -20 };
                this.scene.add(object);
                object.position.set(0, -38, -15);
                object.rotation.y = Math.PI;
            });
            icreateObject('desk2', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 0.6, y: 1, z: 1.6 };
                this.scene.add(object);
                object.position.set(58, -26.6, -30);
                object.rotation.y = Math.PI / 2;
            });
            icreateObject('aquarium', (object) => {
                this.scene.add(object);
                object.position.set(59, -12.5, -30);
                //object.rotation.y = Math.PI/2;               
            });
            icreateObject('bed', (object) => {
                object.isSceneObj = true;
                object.scenePosFix = { x: -10, y: 0, z: 0 };//fix contact grid position                                          
                this.scene.add(object);
                object.position.set(-6, -39, 49);
                object.rotation.y = -Math.PI;
            });
            icreateObject('cart_single3', (object) => {
                this.scene.add(object);
                object.position.set(-32 + (3.5 * 2), -0.65, -47);
            })
            icreateObject('musicbox', (object) => {
                this.addAudio('./audio/mmbox.mp3', 0.05, true, true, object, 10);                
                object.scale.multiplyScalar(0.2);
                object.position.set(25, -0.1, -51);
                this.scene.add(object);
            });
            icreateObject('tlamp', (object) => {
                this.scene.add(object);
                object.position.set(18, -1.2, -52);
                object.rotation.y = 1.3;
            });
            icreateObject('joy', (object2) => {
                this.scene.add(object2);
                object2.position.set(-9.305604848224483, -0.9, -48);
                this.addAudio('./audio/joy_b1_press.mp3', 1, false, false, object2, 10);
                this.addAudio('./audio/joy_b2_press.mp3', 1, false, false, object2, 10);
                this.addAudio('./audio/joy_b3_press.mp3', 1, false, false, object2, 10);
            });
            icreateObject('cart_single1', (object) => {
                this.scene.add(object);
                object.position.set(-32, -0.65, -47);
            });
            icreateObject('cart_single2', (object) => {
                this.scene.add(object);
                object.position.set(-32 + (3.5 * 1), -0.65, -47);
            });
            icreateObject('atari', (object) => {
                this.scene.add(object);
                object.position.set(-20, -1, -56);
                this.addAudio('./audio/atari_switch.mp3', 0.7, false, false, object, 20);
                this.addAudio('./audio/insert_cart.mp3', 0.7, false, false, object, 20);
                this.addAudio('./audio/remove_cart.mp3', 0.9, false, false, object, 20);
                icreateObject('cart_inserted', (object2) => {
                    object2.position.copy(object.position);
                    this.scene.add(object2);
                });
            });
            icreateObject('desk', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 13, y: 1, z: 10 };
                object.scenePos = { x: 0, y: 0, z: 22 };
                this.addAudio('./audio/draw_open.mp3', 0.8, false, false, object, 20);
                this.scene.add(object);
                object.position.set(0, -20, -60);
                for (var i = 4; i < 18; i++)//put carts in drawner1
                    icreateObject('cart_single' + i, (object2) => {
                        var cartn = parseInt(object2.name.substr(11));
                        cartn -= 4;
                        object.getObjectByName('drawn1').add(object2);
                        object2.scale.divideScalar(0.08);
                        var surflez = Math.floor(Math.random() * 3 + 1);
                        object2.position.set(-357 + (cartn * 10.2), 142, 284 + surflez);
                        object2.rotation.y = 0;
                        object2.rotation.z = (Math.PI / 2) - 0.3;
                    });
                icreateObject('atarimanual', (object2) => {
                    object.getObjectByName('drawn1').add(object2);
                    object2.position.set(-272, 125, 200);
                    object2.rotation.set(-(Math.PI / 2), 0, 0.2);
                });
            });
            icreateObject('tv', async (object) => {
                object.position.set(0, -1.05, -56);
                this.addAudio('./audio/power_tv.mp3', 0.6, false, false, object.getObjectByName('polySurface13'), 20);
                this.addAudio('./audio/tv_noise1.mp3', 0.7, true, false, object, 20);
                this.audioFromMedia(materials[4].video, 0.8, object, 20, 'materials4');
                this.audioFromMedia(materials[12].video, 0.8, object, 20, 'materials12');
                this.audioFromMedia(materials[13].video, 0.8, object, 20, 'materials13');

                this.scene.add(object);
                icreateObject('tv_channel', (object2) => { //channel buttons
                    object.add(object2);
                    object2.layers.toggle(10);
                    object2.position.set(10.674021858574147, 14.900873202940454, -0.23085023024902096);
                    this.addAudio('./audio/channelchange.mp3', 0.6, false, false, object2, 20);
                });
            });

        }

        //############################################################
        //## SCENE 02                  ###############################
        //############################################################
        if (value == 2) {
            const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0.7);
            pointLight2.position.set(0, 800, 0);
            //pointLight2.shadow.bias = -0.0015;            
            scene.add(pointLight2);
            GAME.materials[91].envMapRotation.y = 0;////Rotate Window EnvMap    

            LOADER.textureLoader.load('./models/sink/envROOM1.jpg', (texture) => {
                materials[90].envMap = texture;
                materials[90].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[90].envMap.needsUpdate = true;
                materials[92].envMap = texture;
                materials[92].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[92].envMap.needsUpdate = true;
            });

            this.iplayer.create('player', 0, (object) => {
                this.scene.add(object);
                object.position.y = -12.5;
            });

            control.toggle(2);

            //BALL TEST        
            icreateObject('room2', async (object) => {
                this.scene.add(object);
                object.position.y = -39.2;
                icreateObject('door1', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: 18, y: 0, z: 0 }; //contact point                                        
                    this.scene.getObjectByName('room_wall3').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(-58, -9, 0.1);
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=1;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('door2', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: 18, y: 0, z: 0 }; //contact point                                         
                    this.scene.getObjectByName('room_wall3').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(70, -9, 0.1);
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=3;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('door3', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: 0, y: 0, z: 16 }; //contact point
                    object2.sceneSca = { x: 1, y: 1, z: 0.1 };
                    this.scene.getObjectByName('room_wall2').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(0, -9, 0.1);
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=4;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('window3', (object2) => {
                    this.scene.getObjectByName('room_wall4').add(object2);
                    object2.position.set(30, 0, 0.7);
                    var wlight = object2.getObjectByName('window3_light');
                    var wpos = new THREE.Vector3();
                    object2.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                });
                icreateObject('window4', (object2) => {
                    this.scene.getObjectByName('room_wall4').add(object2);
                    object2.position.set(-30, 0, 0.7);
                    var wlight = object2.getObjectByName('window4_light');
                    var wpos = new THREE.Vector3();
                    object2.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                });
                //getOByName('cab1DoorOpen').position.set(60,0,6);
                //getOByName('cab1DoorClose').position.set(60,0,6);
                icreateObject('cabinet1', async (object2) => {
                    this.scene.getObjectByName('room_wall1').add(object2);
                    object2.isSceneObj = true;
                    object2.scenePos = { x: -17, y: 0, z: 0 }; //contact point 
                    object2.position.set(80, 0, 10);
                    object2.rotation.y = Math.PI / 2;
                    this.addAudio('./audio/door1_open.mp3', 0.8, false, false, object2, 20, 'cab1DoorOpen');
                    this.addAudio('./audio/door1_close.mp3', 0.8, false, false, object2, 20, 'cab1DoorClose');
                });
                icreateObject('cabinet2', (object3) => {
                    object3.isSceneObj = true;
                    object3.scenePos = { x: -17, y: 0, z: 0 }; //contact point                                                            
                    this.scene.getObjectByName('room_wall1').add(object3);
                    object3.position.set(42, 0, 10);
                    object3.rotation.y = Math.PI / 2;
                });
            });
            icreateObject('sink', (object) => {
                object.isSceneObj = true;
                object.scenePos = { x: 0, y: 0, z: -20 };
                this.scene.add(object);
                object.position.set(0, -22, 86);
                object.rotation.y = Math.PI;
                this.addAudio('./audio/draw_open.mp3', 0.8, false, false, object, 20);
                this.addAudio('./audio/door1_open.mp3', 0.8, false, false, object, 20, 'sinkDoorOpen');
                this.addAudio('./audio/door1_close.mp3', 0.8, false, false, object, 20, 'sinkDoorClose');
            });
            icreateObject('stove', (object) => {
                object.isSceneObj = true;
                object.scenePos = { x: -20, y: 0, z: 0 };
                this.scene.add(object);
                object.position.set(72, -18.6, -4);
                object.rotation.y = -Math.PI / 2;
                this.addAudio('./audio/metalclose.mp3', 0.8, false, false, object, 20, 'stoveMainClose');
            });
            icreateObject('fridge', (object) => {
                object.isSceneObj = true;
                object.scenePos = { x: -22, y: 0, z: 0 };
                this.scene.add(object);
                object.position.set(72, -4, -68);
                object.rotation.y = -Math.PI / 2;
                this.addAudio('./audio/fridge_run.mp3', 0.5, true, true, object, 10);
                this.addAudio('./audio/fridge_open.mp3', 0.8, false, false, object, 20, 'fridgeDoorOpen');
                this.addAudio('./audio/frige_close.mp3', 0.8, false, false, object, 20, 'fridgeDoorClose');
            });
            icreateObject('table1', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 0.4, y: 1, z: 0.8 };
                this.scene.add(object);
                object.position.set(-70, -20, -5);
                object.rotation.y = -Math.PI / 2;
            });
            icreateObject('chair2', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 0.6, y: 1, z: 0.6 };
                this.scene.add(object);
                object.position.set(-50, -20, -5);
                object.rotation.y = -Math.PI / 2;
            });
        }
        //############################################################
        //## SCENE 03                  ###############################
        //############################################################
        if (value == 3) {
            const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0.9);
            pointLight2.position.set(0, 800, 0);
            //pointLight2.shadow.bias = -0.0015;
            scene.add(pointLight2);

            LOADER.textureLoader.load('./models/sink/envROOM1.jpg', (texture) => {
                materials[90].envMap = texture;
                materials[90].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[90].envMap.needsUpdate = true;
                materials[92].envMap = texture;
                materials[92].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[92].envMap.needsUpdate = true;
            });

            this.iplayer.create('player', 0, (object) => {
                this.scene.add(object);
                object.position.y = -12.5;
            });

            control.toggle(2);

            icreateObject('room3', (object) => {
                this.scene.add(object);
                object.position.y = -39.2;
                icreateObject('door1', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: -8, y: 0, z: 0 }; //contact point                                        
                    this.scene.getObjectByName('room_wall1').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(10, -9, 0.1);                    
                    getOByName('door1_box').rotation.x = Math.PI;
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=2;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('window1', (object2) => {
                    object2.scale.multiplyScalar(0.8);
                    object2.isSceneObj = true;
                    object2.sceneSca = { x: 0.1, y: 1, z: 1 };
                    this.scene.getObjectByName('room_wall3').add(object2);
                    object2.position.set(20, 10, 0.4);
                    var wlight = object2.getObjectByName('window1_light');
                    var wpos = new THREE.Vector3();
                    wlight.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                    object2.getObjectByName('glass2').atachedCurtain = {//fake courtain
                        frame: [object2.getObjectByName('frame2'), object2.getObjectByName('glass2')],
                        framelight: wlight
                    }

                });
            });

            icreateObject('sink_bath', (object) => {
                object.isSceneObj = true;
                object.sceneSca = { x: 1, y: 1, z: 2 };
                object.scenePos = { x: 0, y: 0, z: 24 }; //contact point 
                this.scene.add(object);
                object.position.set(30, 0, -50);
                //object.rotation.y = -Math.PI/2;                   
            });
            icreateObject('toilet', (object) => {
                object.isSceneObj = true;
                object.scenePos = { x: 15, y: 0, z: 10 };
                this.scene.add(object);
                object.position.set(-45, -39.72, -29.6);
                //object.rotation.y = -Math.PI/2;                   
            });
            icreateObject('toilet_trash', (object) => {
                object.isSceneObj = true;
                this.scene.add(object);
                object.position.set(-28.51196, -39.58033, -40.78392);
                //object.rotation.y = -Math.PI/2;                   
            });
            icreateObject('shower_box', (object) => {
                object.isSceneObj = true;
                object.isSceneObjEmpty = true;
                object.scenePosFix = { x: -5, y: 0, z: 5 };
                object.getObjectByName('door').gridWalk = [{ x: 17, y: 9 }, { x: 16, y: 9 }, { x: 15, y: 9 }, { x: 14, y: 9 }, { x: 13, y: 9 }];
                this.scene.add(object);
                object.position.set(-43.0397, -39.1344, 22.51474);
                //object.rotation.y = -Math.PI/2;                   
            });

        }
        //############################################################
        //## SCENE 04                 ###############################
        //############################################################
        if (value == 4) {
            const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0.9);
            pointLight2.position.set(0, 800, 0);
            //pointLight2.shadow.bias = -0.0015;
            scene.add(pointLight2);

            //materials[90].envMap=LOADER.textureLoader.load('./models/gray.jpg'); //metal env map

            this.iplayer.create('player', 0, (object) => {
                this.scene.add(object);
                object.position.y = -12.5;
            });

            control.toggle(2);

            //control.toggle(0);

            icreateObject('room4', (object) => {
                this.scene.add(object);
                object.position.y = -39.2;
                icreateObject('door1', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: 0, y: 0, z: -10 };
                    object2.sceneSca = { x: 1, y: 1, z: 0.2 };
                    this.scene.getObjectByName('room_wall4').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(-65, -9, 0.1);
                    getOByName('door1_box').rotation.x = Math.PI;
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=2;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
                icreateObject('window1', (object2) => {
                    object2.scale.multiplyScalar(0.8);
                    object2.isSceneObj = true;
                    object2.sceneSca = { x: 0.1, y: 1, z: 1 };
                    this.scene.getObjectByName('room_wall3').add(object2);
                    object2.position.set(0, 10, 0.4);
                    var wlight = object2.getObjectByName('window1_light');
                    var wpos = new THREE.Vector3();
                    wlight.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                    object2.getObjectByName('glass2').atachedCurtain = {//fake courtain
                        frame: [object2.getObjectByName('frame2'), object2.getObjectByName('glass2')],
                        framelight: wlight
                    }
                });
                icreateObject('window2', (object2) => {
                    object2.scale.multiplyScalar(0.8);
                    object2.isSceneObj = true;
                    object2.sceneSca = { x: 0.1, y: 1, z: 1 };
                    this.scene.getObjectByName('room_wall1').add(object2);
                    object2.position.set(0, 10, 0.4);
                    var wlight = object2.getObjectByName('window2_light');
                    var wpos = new THREE.Vector3();
                    wlight.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                    object2.getObjectByName('glass2').atachedCurtain = {//fake courtain
                        frame: [object2.getObjectByName('frame2'), object2.getObjectByName('glass2')],
                        framelight: wlight
                    }
                });
            });

            icreateObject('stair', (object) => {
                object.isSceneObj = true;
                object.scenePosFix = { x: 0, y: 0, z: 60 };
                object.scenePos = { x: 0, y: 0, z: -75 };
                object.sceneSca = { x: 0.45, y: 1, z: 2.1 };
                this.scene.add(object);
                object.position.set(126.916, -40.5565, -24.6624);
                object.getObjectByName('stair_box').newscene = 5;
            });
        }

        //############################################################
        //## SCENE 05                 ###############################
        //############################################################
        if (value == 5) {
            const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x000000, 0.9);
            pointLight2.position.set(0, 800, 0);
            //pointLight2.shadow.bias = -0.0015;
            scene.add(pointLight2);

            LOADER.textureLoader.load('./models/sink/envROOM1.jpg', (texture) => {
                materials[90].envMap = texture;
                materials[90].envMap.mapping = THREE.EquirectangularReflectionMapping;
                materials[90].envMap.needsUpdate = true;
            });


            this.iplayer.create('player', 0, (object) => {
                this.scene.add(object);
                object.position.y = -12.5;
            });

            control.toggle(2);

            icreateObject('room5', (object) => {
                this.scene.add(object);
                object.position.y = -39.2;
                icreateObject('door1', (object2) => {
                    object2.isSceneObj = true;
                    object2.scenePos = { x: 0, y: 0, z: -16 }; //contact point
                    object2.sceneSca = { x: 1, y: 1, z: 0.1 };
                    this.scene.getObjectByName('room_wall2').add(object2);
                    object2.rotation.y = Math.PI / 2;
                    object2.position.set(40, -9, 0.1);
                    //Load Next Scene
                    object2.getObjectByName('holder_2').SCENE=4;
                    object2.getObjectByName('holder_2').onClick = () => {
                        var wpos = new THREE.Vector3();
                        object2.getWorldPosition(wpos);
                        ihud.showMenu(null, 'door_open', wpos, { SCENE: object2.getObjectByName('holder_2').SCENE });
                    }
                });
            });


        }


        /*
        camera.position.set(-180.22529745683502,  144.74731627392924,154.4075816650073);
        camera.rotation.set(-0.7531175296331171, -0.7053911426427659,  -0.5461130363734521,'XYZ');
        control.maxTargetRadius=40;
        control.maxPolarAngle=1.4;
        control.minPolarAngle=0.4;
        control.maxDistance=300;
        */
    }
}
export { ISCENE };