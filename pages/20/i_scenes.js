window.jt = {};
window.CTRLV = 0.3; //ATARI AUDIO 	
window.CTRAC = null; //ATARI AUDIO CONTEXT
jt.atariloaded = false;
jt.ataripower = false;
jt.atariglitch = false;
var JavatariFullScreenSetup = { apply: function fullScreenSetup() { /* Setup Basic full-screen CSS*/ if (!this.cssApplied) { var style = document.createElement('style'); style.type = 'text/css'; style.innerHTML = this.css; document.head.appendChild(style); this.cssApplied = true; } /* Apply Standalone mode full-screen basic styles to html and body immediately if needed*/ document.documentElement.classList.toggle("jt-full-screen", this.shouldStartInFullScreen()); }, shouldStartInFullScreen: function () { return window.Javatari ? Javatari.SCREEN_FULLSCREEN_MODE === 1 || (Javatari.SCREEN_FULLSCREEN_MODE === -1 && this.isBrowserStandaloneMode()) : this.isBrowserStandaloneMode(); }, isBrowserStandaloneMode: function () { return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches; }, css: '' + 'html.jt-full-screen, html.jt-full-screen body {' + '   background: black;' + '}' + 'html.jt-full-screen .jt-full-screen-hidden {' + '   display: none;' + '}' + 'html:not(.jt-full-screen) .jt-full-screen-only {' + '   display: none;' + '}' }; 
JavatariFullScreenSetup.apply();

class ISCENE {

    audioFromMedia = null;
    addAudio = null;
    createObject = null;
    scene = null;
    waitforaudiotimes;
    creating = false;

    waiforaudio = function () {
        if (navigator.userActivation.isActive) {
            clearTimeout(this.waitforaudiotimes);
            var t = document.createElement("script"); t.async = false;
            t.src = HOMESITE+'_atari.js', document.getElementsByTagName("head")[0].appendChild(t)
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

    init(audio, audiofr, cobject, sc) {
        this.waiforaudio();
        this.addAudio = audio;
        this.audioFromMedia = audiofr;
        this.createObject = cobject;
        this.scene = sc;
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
        objects = [];
        objectbyNames = {};
        AUDIOlistener = null;
        if (camera.parent != null) camera.parent.remove(camera);
        await this.clearObjTree(this.scene);
        scene.clear();
    }

    async createScene(value, execute) {
        const DEGUG = false;
        var loadingdObjt = 0;
        var pendingObjects = new Set();

        var create3DObject = this.createObject;
        var me = this;

        await this.clean();

        async function icreateObject(name, iobject) {
            loadingdObjt += 1;
            pendingObjects.add(name);
            if (DEGUG) console.log('START LOAD:', name);
            create3DObject(name, async (object) => {
                try {
                    iobject(object);
                } catch (err) {
                    console.error('ERROR INSIDE:', name, err);
                } finally {
                    loadingdObjt -= 1;
                    pendingObjects.delete(name);
                    if (DEGUG) console.log(
                        'FINISHED:',
                        name,
                        '| waiting:',
                        loadingdObjt,
                        '| pending:',
                        [...pendingObjects]
                    );
                    if (loadingdObjt <= 0) {
                        $('#btCenter').hide();
                        me.creating = false;
                        if (DEGUG) console.log('ALL LOADED');
                        if (typeof execute == 'function') {
                            execute();
                        }
                    }
                }
            });
        }



        //############################################################
        //## SCENE 02                  ###############################
        //############################################################   
        if (value == 2) {

            //camera.position.set(-26.385699105143356, 7.078860068355202, -50.53553893294378);
            //camera.position.set(-15.586, 16.958,  -28.988);
            camera.position.set(1.229, 16.958, 33.998);

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


            control.toggle(1);


            icreateObject('room1', async (object) => {
                this.scene.add(object);
                object.position.y = -39.2;


                icreateObject('door1', (door1) => {
                    door1.isSceneObj = true;
                    this.scene.getObjectByName('room_wall1').add(door1);
                    door1.rotation.y = Math.PI / 2;
                    door1.position.set(34, -9, 0.1);
                    getOByName('door1_box').rotation.x = Math.PI;
                });


                icreateObject('window1', (janela) => {
                    janela.isSceneObj = true;
                    janela.sceneSca = { x: 0.1, y: 1, z: 1 };
                    this.scene.getObjectByName('room_wall3').add(janela);
                    janela.position.set(0, 0, 0.4);
                    var wlight = janela.getObjectByName('window1_light');
                    var wpos = new THREE.Vector3();
                    wlight.getWorldPosition(wpos);
                    this.scene.add(wlight);
                    wlight.position.copy(wpos);
                    icreateObject('curtain', (curtina) => {
                        this.scene.getObjectByName('room_wall3').add(curtina);
                        curtina.position.set(0, -20, 5);
                        curtina.frame = [janela.getObjectByName('frame2'), janela.getObjectByName('glass2')];
                        curtina.framelight = wlight;
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
            }); //END ROOM items

            icreateObject('carpet', (object) => {
                this.scene.add(object);
                object.position.set(0, -38.2, 0);
            });

            icreateObject('desk_simple', (object) => {
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

            icreateObject('cart_single3', (object) => {
                this.scene.add(object);
                object.position.set(-32 + (3.5 * 2), -0.65, -47);
            })

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
                this.addAudio('./audio/power_tv.mp3', 0.6, false, false, object.getObjectByName('tv_power'), 20);
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

        } //end scene 2




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