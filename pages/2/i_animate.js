window.usefullChannels = {
    //0=channel1
    clips: { channel: 3, material: 4 },
    atari: { channel: 4, material: 5 },
    shows: { channel: 5, material: 12 },
    serie: { channel: 7, material: 13 },
}
var lumen_monitor = 10;
class ANIMATE {

    //used to CART manipulation
    flowcurve = null;
    flowtime = 0;
    flowaction = null;
    //global variable to calculate tv monitor light
    lgcolortime = 0;


    constructor() {
    }

    adjustMonitorLight(elementsrc) {
        var canvas = document.getElementById("tv_canvasmonitor"); //canvas test
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(elementsrc, 0, 0, 256, 256);
        var arr = ctx.getImageData(0, 0, 256, 256).data;
        var blockSize = 5;
        var arrLength = arr.length;
        var count = 0;
        var rgb = { r: 0, g: 0, b: 0 };
        var i = -4;
        while ((i += blockSize * 4) < arrLength) {
            ++count;
            rgb.r += arr[i];
            rgb.g += arr[i + 1];
            rgb.b += arr[i + 2];
        }
        rgb.r = ~~((rgb.r / count));
        rgb.g = ~~((rgb.g / count));
        rgb.b = ~~((rgb.b / count));
        var trgb = tinycolor("rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")");
        var luma = 0.2126 * trgb._r + 0.7152 * trgb._g + 0.0722 * trgb._b; // per ITU-R BT.709
        var lumatry = 0;
        while (luma < lumen_monitor) {
            trgb.brighten(5);
            luma = 0.2126 * trgb._r + 0.7152 * trgb._g + 0.0722 * trgb._b; // per ITU-R BT.709                    
            lumatry++;
            if (lumatry > 4) break;
        }
        var bright = 6;
        rgb.r = rgb.r * 1.0 / bright;
        rgb.g = rgb.g * 1.0 / bright;
        rgb.b = rgb.b * 1.0 / bright;
        MONITORLIGHT.color.setRGB(rgb.r, rgb.g, rgb.b);
    }

    cartPutOrEject(action, cartnumber) {
        var cart = getOByName('cart_single' + cartnumber);
        var cartInserted = getOByName('cart_inserted_box');
        var audioeject = getOByName('./audio/remove_cart.mp3');
        var audioinsert = getOByName('./audio/insert_cart.mp3');
        var xpos = new THREE.Vector3(0, -1, 6);
        if (typeof (cartInserted.inserted) == _UN) cartInserted.inserted = null;
        if (cartnumber < 4) {
            xpos.x = -13.85 + (3.5 * cartnumber);
            xpos.y = -2;
        }
        if (cartnumber >= 4) {
            xpos.x = -6 + (0.7 * cartnumber - 4);
            xpos.y = -10;
            xpos.z = 18;
        }

        if (action == 0 && this.flowaction == null && cartInserted.inserted == cartnumber) {//eject from ATARi
            if (cartnumber >= 4) {
                var drawn1 = getOByName('drawn1');
                if (drawn1.state == 0 && drawn1.push == 0) { //open drawn if > 4
                    var audioswt = getOByName('./audio/draw_open.mp3');
                    if (audioswt.isPlaying) audioswt.stop(); audioswt.play();
                    drawn1.push = 1;
                }
            }
            if (audioinsert.isPlaying) audioinsert.stop();
            audioeject.play();
            this.flowcurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 5, 2),
                new THREE.Vector3(xpos.x, xpos.y, xpos.z),
            ]);
            this.flowtime = 0;
            this.flowaction = { action: action, cartnumber: cartnumber }
            this.flowcurve.closed = false;
            this.flowcurve.getPoints(32);
            if (jt.ataripower == true) {
                CTRL(jt.ConsoleControls.DEBUG, true);
                CTRL(jt.ConsoleControls.DEBUG, true);
                CTRL(jt.ConsoleControls.DEBUG, true);
                CTRL(jt.ConsoleControls.DEBUG, true);
                jt.atariglitch = true;
                setTimeout(() => { CTRL(jt.ConsoleControls.PAUSE, true); }, 500);
            }
        } else if (action == 1 && this.flowaction == null && cartInserted.inserted == null) {//inserting in ATARI
            this.flowcurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(xpos.x, xpos.y, xpos.z),
                new THREE.Vector3(0, 5, 2),
                new THREE.Vector3(0, 0, 0)
            ]);
            this.flowtime = 0;
            this.flowaction = { action: action, cartnumber: cartnumber }
            this.flowcurve.closed = false;
            this.flowcurve.getPoints(32);
            cartInserted.children[0].material = cart.children[0].material;
            cart.visible = cart.children[0].visible = false;
            cartInserted.visible = cartInserted.children[0].visible = true;
        }
        switch (action) {
            case 2: //eject end            
                cart.permit = null;
                cart.visible = cart.children[0].visible = true;
                cartInserted.visible = cartInserted.children[0].visible = false;
                cartInserted.inserted = null;
                window.xx = cart;
                window.yy = cartInserted;
                break;
            case 3: //insert end
                audioinsert.play();
                if (jt.atariglitch == true) {
                    jt.atariglitch = false;
                    CTRL(jt.ConsoleControls.DEBUG, true);
                }
                cartInserted.inserted = cartnumber;
                cart.permit = 0;
                CTRLR(cart.rom);
                jt.ataripower = false;
                break;
        }
        if (action == 2 || action == 3) this.flowaction = null;
        /*
        const line = new THREE.LineLoop( new THREE.BufferGeometry( ).setFromPoints( flowpoints ), new THREE.LineBasicMaterial( { color: 0xffffaa } ) );    
        var cpos=new THREE.Vector3();    
        scene.add(line);                
        */
    }

    //called before every render
    animateObjects(delta, timer) {
        if (scene == null) return;
        //usefull variables
        var audio_tv_noise = getOByName('./audio/tv_noise1.mp3');
        var audio_tv_power = getOByName('./audio/power_tv.mp3');
        var audio_tv_channelchange = getOByName('./audio/channelchange.mp3');
        var tv_monitor = getOByName('tv_monitor');
        var tv_channel = getOByName('tv_channel_box');
        var tvpower = getOByName('polySurface13', getOByName('tv_box'));
        var channel_light = getOByName('polySurface7', getOByName('tv_box'));
        var joyobj = getOByName('joy_bone');

        //update aquarium bubles
        if (1 == 1) for (var i = 0; i < bublesUpdate.length; i++) {
            var bypos = 7;
            var bxpos = 7;
            var bzpos = 12;
            var buble = bublesUpdate[i];
            if (typeof (buble.status) == _UN) buble.status = 0
            buble.position.y += (delta * 20) * buble.scale.x;
            if (buble.position.y > bypos) {
                buble.position.y = -bypos;
                buble.position.x = (Math.random() * ((bxpos * 2) - 1) + 1) - bxpos;
                buble.position.z = (Math.random() * ((bzpos * 2) - 1) + 1) - bzpos;
                var ss = (Math.random() * 100);
                if (ss < 30) ss = 30;
                ss = ss / 100;
                buble.scale.set(ss, ss, ss);
            }
        }

        //fish animation
        if (typeof (FISH) != _UN && FISH.animate) FISH.animate(delta);

        //AQUARIUM WaterCube ondulatiom / trasmission
        if (typeof (AQUARIUM) != _UN && AQUARIUM.material && AQUARIUM.material.transmission) {
            if (AQUARIUM.status == 0) {
                AQUARIUM.material.thickness += (delta / 20);
                if (AQUARIUM.material.thickness > 0.5) AQUARIUM.status = 1;
            } else {
                AQUARIUM.material.thickness -= (delta / 20);
                if (AQUARIUM.material.thickness < 0.01) AQUARIUM.status = 0;
            }
        }

        //Hide cart_inserted if not inserted
        var cartInserted = getOByName('cart_inserted_box');
        if (typeof (cartInserted) != _UN && typeof (cartInserted.visible) != _UN &&
            typeof (cartInserted.inserted) == _UN) cartInserted.visible = false;


        //CART Insert Remove Animation
        if (this.flowcurve != null && this.flowaction != null && (this.flowaction.action == 0 || this.flowaction.action == 1)) {
            this.flowtime += 0.05;
            const t = Math.min(this.flowtime, 1);
            if (t === 1) this.flowtime = 0;
            if (this.flowaction.action == 0) cartInserted.rotation.x = t;
            if (this.flowaction.action == 1) cartInserted.rotation.x = 1 - t;
            if (t >= 1) {
                switch (this.flowaction.action) {
                    case 0: this.cartPutOrEject(2, this.flowaction.cartnumber); break;
                    case 1: this.cartPutOrEject(3, this.flowaction.cartnumber); break;
                }
            }
            this.flowcurve.getPointAt(t, cartInserted.position); // animating
        }

        //joystick moves    
        var joymove = 0.16;
        var lfpressed = false;
        var backpos = 30;
        if (joyobj != null) {
            if (EVENTS._keyMap.ArrowLeft && EVENTS._keyMap.ArrowLeft == true) {
                if (EVENTS.arrows[0].inc < Math.PI + joymove) {
                    EVENTS.arrows[0].inc += 0.05;
                    joyobj.rotation.x = EVENTS.arrows[0].inc;
                } else EVENTS.arrows[0].inc -= 0.05;
                lfpressed = true;
                EVENTS.arrows[2] = backpos;
            }
            if (EVENTS._keyMap.ArrowRight && EVENTS._keyMap.ArrowRight == true) {
                if (EVENTS.arrows[0].inc > Math.PI - joymove) {
                    EVENTS.arrows[0].inc -= 0.05;
                    joyobj.rotation.x = EVENTS.arrows[0].inc;
                } else EVENTS.arrows[0].inc += 0.05;
                lfpressed = true;
                EVENTS.arrows[2] = backpos;
            }
            if (EVENTS._keyMap.ArrowDown && EVENTS._keyMap.ArrowDown == true) {
                if (EVENTS.arrows[1].inc < Math.PI + joymove) {
                    EVENTS.arrows[1].inc += 0.05;
                    joyobj.rotation.z = EVENTS.arrows[1].inc;
                } else EVENTS.arrows[1].inc -= 0.05;
                lfpressed = true;
                EVENTS.arrows[2] = backpos;
            }
            if (EVENTS._keyMap.ArrowUp && EVENTS._keyMap.ArrowUp == true) {
                if (EVENTS.arrows[1].inc > Math.PI - joymove) {
                    EVENTS.arrows[1].inc -= 0.05;
                    joyobj.rotation.z = EVENTS.arrows[1].inc;
                } else EVENTS.arrows[1].inc += 0.05;
                lfpressed = true;
                EVENTS.arrows[2] = backpos;
            }
            if (lfpressed == false && (EVENTS.arrows[0].inc != Math.PI || EVENTS.arrows[1].inc != Math.PI)) {
                if (EVENTS.arrows[2] > 1) {
                    EVENTS.arrows[2] -= 1;
                } else {
                    EVENTS.arrows[0].inc = EVENTS.arrows[1].inc = Math.PI;
                    joyobj.rotation.x = EVENTS.arrows[0].inc;
                    joyobj.rotation.z = EVENTS.arrows[1].inc;
                }
            }
        }

        //Music Box Open / Close
        if (objects['musicbox']) {
            var musicboxrolo = getOByName('musicbox_rolo', getOByName('musicbox_box'));
            var musicboxcord = getOByName('musicbox_cord', getOByName('musicbox_box'));
            var tampa = getOByName('musicbox_tampa', getOByName('musicbox_box'));
            if (typeof (musicboxrolo) != _UN) {
                musicboxrolo.rotation.x = timer * -0.001;
            }
            if (typeof (musicboxcord) != _UN) {
                musicboxcord.rotation.x = timer * -0.002;
            }
            if (typeof (tampa) != _UN) {
                if (tampa.abrindo == 1) { //cmd open
                    tampa.abrindo = 2; //opening                    
                }
                if (tampa.abrindo == 0) { //cmd close
                    tampa.abrindo = 3; //closing                    
                }
                if (tampa.abrindo == 2) {//opening                    
                    var audio = getOByName('./audio/mmbox.mp3');
                    if (!audio || !audio.setVolume) return; //audio not atached;                    
                    tampa.rotation.x = Math.max(tampa.rotation.x - 0.04, -1.6);
                    audio.setVolume(Math.min(audio.getVolume() + 0.04, 0.5));
                    if (tampa.rotation.x <= -1.6 && audio.getVolume() >= 0.5) tampa.abrindo = 4;//aberto                
                }
                if (tampa.abrindo == 3) {//closing                    
                    var audio = getOByName('./audio/mmbox.mp3');
                    if (!audio || !audio.setVolume) return; //audio not atached;
                    tampa.rotation.x = Math.min(tampa.rotation.x + 0.04, 0);
                    audio.setVolume(Math.max(audio.getVolume() - 0.03, 0.03));
                    if (tampa.rotation.x >= 0 && audio.getVolume() <= 0.03) tampa.abrindo = 5;//aberto                     
                }

            }
        }


        //create ATARI TEXTURE if not created
        var ataricanvas = document.getElementById('jt-screen-canvas');
        if (materials[usefullChannels.atari.material].map == null && ataricanvas != null) {
            materials[usefullChannels.atari.material].map = new THREE.CanvasTexture(ataricanvas);
            materials[usefullChannels.atari.material].map.flipY = false;
            materials[usefullChannels.atari.material].video = ataricanvas;
            materials[usefullChannels.atari.material].map.repeat.set(2.15, 2.64); //used on cart gen        
            materials[usefullChannels.atari.material].map.center.set(0.13, 0.12); //used on cart gen
        }
        var atarimap = materials[usefullChannels.atari.material];
        if (atarimap.map != null && ataricanvas != null) {
            if (tvpower == null || typeof (tvpower.power) == _UN || typeof (tvpower.lastState) == _UN ||
                tv_monitor == null || tv_channel == null) { } else {
                if (typeof (cartInserted) != _UN && cartInserted.inserted != null) {
                    var cartObj = getOByName('cart_single' + cartInserted.inserted);
                    if (typeof (cartObj.center) != _UN) {
                        if (cartObj.center.equals(atarimap.map.center) == false)
                            atarimap.map.center.copy(cartObj.center);
                    }
                    if (typeof (cartObj.repeat) != _UN) {
                        if (cartObj.repeat.equals(atarimap.map.repeat) == false)
                            atarimap.map.repeat.copy(cartObj.repeat);
                    }
                    atarimap.map.needsUpdate = true;
                }
            }
        }


        //atari switchs functions    
        var switchspeed = 20; //switch button speed
        if (typeof (getOByName('atari_switch1')) != _UN) {//if one exist all exist
            if (typeof (getOByName('atari_switch1').push) == _UN) {//first act set all states
                for (var i = 1; i < 7; i++) {
                    getOByName('atari_switch' + i).push = 0;
                    getOByName('atari_switch' + i).state = 1;
                    getOByName('atari_switch' + i).model = 0; //swith var
                    if (i == 5 || i == 6) getOByName('atari_switch' + i).model = 1;//push
                }
                getOByName('atari_switch1').state = 0;//power down
                //console.log('zerado');
            }
            for (var i = 1; i < 7; i++) {
                var currswitch = getOByName('atari_switch' + i);
                if (currswitch.push == 1) {
                    switch (currswitch.state) {
                        case 0:
                            if (currswitch.rotation.y < 0) currswitch.rotation.y += (0.001 * switchspeed);
                            if (currswitch.position.y > 0) currswitch.position.y -= (0.018 * switchspeed);
                            if (currswitch.rotation.y >= 0 && currswitch.position.y <= 0) {
                                currswitch.rotation.y = 0; currswitch.position.y = 0;
                                currswitch.state = 1;
                                currswitch.push = 0;
                                //action ON   
                                if (i == 1) {
                                    CTRL(jt.ConsoleControls.POWER, true); jt.ataripower = true; tvChannelTunne()
                                    if (jt.atariglitch == true) CTRL(jt.ConsoleControls.PAUSE, true);
                                }
                                if (i == 2) CTRL(jt.ConsoleControls.BLACK_WHITE, true);
                                if (i == 3) CTRL(jt.ConsoleControls.DIFFICULTY0, true);
                                if (i == 4) CTRL(jt.ConsoleControls.DIFFICULTY1, true);
                                if (i == 5) CTRL(jt.ConsoleControls.SELECT, false);
                                if (i == 6) CTRL(jt.ConsoleControls.RESET, false);
                            }
                            break;
                        case 1:
                            if (currswitch.rotation.y > -0.075) currswitch.rotation.y -= (0.001 * switchspeed);
                            if (currswitch.position.y < 1.3) currswitch.position.y += (0.018 * switchspeed);
                            if (currswitch.rotation.y <= -0.075 && currswitch.position.y >= 1.3) {
                                currswitch.rotation.y = -0.075; currswitch.position.y = 1.3;
                                currswitch.state = 0;
                                //action off
                                if (currswitch.model == 0) {//switch button
                                    currswitch.push = 0;
                                    if (i == 1) { CTRL(jt.ConsoleControls.POWER_OFF, true); jt.ataripower = false; tvChannelTunne() }
                                    if (i == 2) CTRL(jt.ConsoleControls.BLACK_WHITE, true);
                                    if (i == 3) CTRL(jt.ConsoleControls.DIFFICULTY0, true);
                                    if (i == 4) CTRL(jt.ConsoleControls.DIFFICULTY1, true);
                                }
                                if (i == 5) CTRL(jt.ConsoleControls.SELECT, true);
                                if (i == 6) CTRL(jt.ConsoleControls.RESET, true);
                            }
                            break;
                    }
                }
            }
        }


        //calling by power and channel change
        //From https://discourse.threejs.org/t/consume-html5-media-element-audio-in-positionalaudio/27701
        //view-source:https://threejs.org/examples/webaudio_orientation
        function tvChannelTunne() {
            if (tvpower == null || typeof (tvpower.power) == _UN || typeof (tvpower.lastState) == _UN ||
                tv_monitor == null || tv_channel == null) return;
            if (typeof (tv_channel.lastChannel) == _UN) tv_channel.lastChannel = 0;
            if (tvpower.power == 1) {//powered on              
                materials[usefullChannels.clips.material].video.muted = true;
                materials[usefullChannels.shows.material].video.muted = true;
                materials[usefullChannels.serie.material].video.muted = true;
                CTRLV = 0;
                tv_monitor.material = materials[2];
                if (audio_tv_noise.isPlaying) audio_tv_noise.stop(); audio_tv_noise.play();
                switch (tv_channel.lastChannel + 2) {
                    case usefullChannels.clips.channel:
                        lumen_monitor = 10;
                        tv_monitor.material = materials[usefullChannels.clips.material];
                        materials[usefullChannels.clips.material].video.muted = false;
                        if (!materials[usefullChannels.clips.material].video.isPlaying) materials[usefullChannels.clips.material].video.play();
                        if (audio_tv_noise.isPlaying) audio_tv_noise.stop();
                        break;
                    case usefullChannels.shows.channel:
                        lumen_monitor = 10;
                        tv_monitor.material = materials[usefullChannels.shows.material];
                        materials[usefullChannels.shows.material].video.muted = false;
                        if (!materials[usefullChannels.shows.material].video.isPlaying) materials[usefullChannels.shows.material].video.play();
                        if (audio_tv_noise.isPlaying) audio_tv_noise.stop();
                        break;
                    case usefullChannels.atari.channel:
                        if (jt.ataripower == false) break;
                        lumen_monitor = 5;
                        CTRLV = 0.3;
                        tv_monitor.material = materials[5];
                        if (audio_tv_noise.isPlaying) audio_tv_noise.stop();
                        break;
                    case usefullChannels.serie.channel:
                        lumen_monitor = 10;
                        tv_monitor.material = materials[usefullChannels.serie.material];
                        materials[usefullChannels.serie.material].video.muted = false;
                        if (!materials[usefullChannels.serie.material].video.isPlaying) materials[usefullChannels.serie.material].video.play();
                        if (audio_tv_noise.isPlaying) audio_tv_noise.stop();
                        break;
                    case 12:
                        break;
                }
            } else {//powered off
                materials[usefullChannels.clips.material].video.muted = true;
                materials[usefullChannels.shows.material].video.muted = true;
                materials[usefullChannels.serie.material].video.muted = true;
                CTRLV = 0;
                tv_monitor.material = materials[3];
                if (audio_tv_noise.isPlaying) audio_tv_noise.stop();
            }
        }

        //TV events On / Off
        if (objects['tv']) {
            if (tvpower == null || !audio_tv_power || audio_tv_power == null || tv_monitor == null ||
                tv_channel == null || audio_tv_power.isPlaying || channel_light == null ||
                typeof (MONITORLIGHT) == _UN) { /*no continue*/ } else {
                if (typeof (tvpower.lastState) == _UN) tvpower.lastState = tvpower.power = 0;
                if (tvpower.lastState != tvpower.power) { //power ON-OFF
                    tvpower.lastState = tvpower.power;
                    if (tvpower.power == 1) { //on          
                        tv_monitor.layers.toggle(10);
                        tvpower.position.y = -0.08;
                        audio_tv_power.play();
                        channel_light.material.emissive.setRGB(0.08, 0.03, 0)
                        channel_light.layers.toggle(10);
                        MONITORLIGHT.intensity = MONITORLIGHT.lumen;
                        tvChannelTunne();
                    } else { //off
                        tv_monitor.layers.toggle(10);
                        tvpower.position.y = 0;
                        audio_tv_power.play();
                        channel_light.material.emissive.setRGB(0, 0, 0)
                        channel_light.layers.toggle(10);
                        MONITORLIGHT.intensity = 0;
                        tvChannelTunne();
                    }
                }
            }
        }

        //TV channel change
        if (objects['tv_channel']) {
            if (tvpower == null || tv_monitor == null || tv_channel == null || !audio_tv_power || audio_tv_power == null ||
                audio_tv_power.isPlaying || !audio_tv_channelchange || audio_tv_channelchange.isPlaying ||
                typeof (tv_channel.channelChanged) == _UN) { /*no continue*/ } else {
                if (tv_channel.channelChanged == 1) {
                    //console.log('change channel', tv_channel.lastChannel);
                    audio_tv_channelchange.play();
                    tv_channel.channelChanged = 0;
                    tv_channel.rotation.z = (tv_channel.lastChannel / 2.2) - 1;
                    tvChannelTunne();
                }
            }
        }

        //update TV Light color
        if (typeof (materials[3]) != _UN && typeof (tv_monitor) != _UN && typeof (tv_monitor.material) != _UN) {
            if (tv_monitor.material != materials[3] &&
                typeof (tv_monitor.material.map) != _UN
                && tv_monitor.material.map != null && typeof (tv_monitor.material.video) != _UN &&
                typeof (MONITORLIGHT) != _UN && typeof (tvpower.power) != _UN && tvpower.power != 0) {
                this.lgcolortime = this.lgcolortime + 0.1;
                if (this.lgcolortime >= 1) {
                    this.adjustMonitorLight(tv_monitor.material.video);
                    this.lgcolortime = 0;

                }
            }
        }


        //wallvisible hides wall on back view
        if (getOByName('room_wall1') != null && control != null) {
            var camdir = camera.position.clone().sub(control.target).normalize();
            for (var i = 1; i < 5; i++) {
                var wall = getOByName('room_wall' + i);
                if (typeof (wall) != _UN) {
                    var wallFacing = wall.getWorldDirection(new THREE.Vector3());
                    if (wallFacing.dot(camdir) <= -0.4) { //behind
                        if (wall.visible == true) {
                            wall.visible = false;
                            wall.layers.disable(0);
                            wall.traverse((child) => {
                                if (child.isMesh) {
                                    child.layers.disable(0);
                                }
                            });
                        }
                    } else {//notbehind
                        if (wall.visible == false) {
                            wall.visible = true;
                            wall.layers.enable(0);
                            wall.traverse((child) => {
                                if (child.isMesh) {
                                    child.layers.enable(0);
                                }
                            });
                        }
                    }
                }
            }
        }


        var drawspeed = 20; //pushpull speed


        //atari manual pages 
        for (var i = 1; i < 6; i++) {
            var page = getOByName('apage' + i);
            if (page != null) {
                if (page.push == 1) {
                    if (page.state == 0) { //closed
                        if (page.lerp < 1) page.lerp += (0.001 * drawspeed);
                        var uselerp = page.lerp;
                        var vr = new THREE.Vector3(0, page.parent.rotation.y, 0)
                        vr.lerp(new THREE.Vector3(0, -2.4, 0), uselerp);
                        page.parent.rotation.y = vr.y;
                        if (page.lerp >= 0.9) { page.lerp = 0; page.state = 1; page.push = 0; }
                    } else {
                        if (page.lerp < 1) page.lerp += (0.001 * drawspeed);
                        var uselerp = page.lerp;
                        var vr = new THREE.Vector3(0, page.parent.rotation.y, 0)
                        vr.lerp(new THREE.Vector3(0, 0, 0), uselerp);
                        page.parent.rotation.y = vr.y;
                        if (page.lerp >= 0.9) { page.lerp = 0; page.state = 0; page.push = 0; }
                    }
                }
            }
        }

        scene.traverse((child) => {
            this.traverseObjects(child, drawspeed,delta);
        });
    }



    traverseObjects(child, drawspeed,delta) {

        if (child.name.startsWith('drawn') && child.parent && child.name.endsWith('_box') == false && child.name.endsWith('x') == false) {//its drawner
            if (typeof (child.push) == _UN) {//first act set all states                  
                child.push = 0;
                child.state = 0;
                child.lerp = 0;
            }
            var currDoor = child;
            var currdrawx = currDoor.parent.getObjectByName(currDoor.name + 'x');
            if (currDoor && currDoor.push == 1) {
                switch (currDoor.state) {
                    case 0:
                        if (currDoor.lerp < 1) currDoor.lerp += (0.001 * drawspeed);
                        var uselerp = currDoor.lerp;
                        if (currDoor.lerp >= 0.9) { currDoor.lerp = 0; currDoor.state = 1; currDoor.push = 0; }
                        currDoor.position.lerp(currDoor.op, uselerp);
                        if (typeof (currdrawx) != _UN) currdrawx.position.lerp(currDoor.op, uselerp);
                        break;
                    case 1:
                        if (currDoor.lerp < 1) currDoor.lerp += (0.001 * drawspeed);
                        var uselerp = currDoor.lerp;
                        if (currDoor.lerp >= 0.9) { currDoor.lerp = 0; currDoor.state = 0; currDoor.push = 0; }
                        var drawclosedp = new THREE.Vector3(0, 0, 0);
                        if (currDoor.extra) drawclosedp.copy(currDoor.extra);
                        currDoor.position.lerp(drawclosedp, uselerp);
                        if (typeof (currdrawx) != _UN) currdrawx.position.lerp(drawclosedp, uselerp);
                        break;
                }
            }
        }
        //door openers           
        if (child.name.startsWith('door') && child.parent && child.name.endsWith('_box') == false) {//its drawner
            if (typeof (child.parent.op) == _UN && typeof (child.parent.parent) && child.parent.parent.op) {
                child = child.parent;
            }
            if (typeof (child.parent.push) == _UN) {//first act set all states                  
                child.parent.push = 0;
                child.parent.state = 0;
                child.parent.lerp = 0;
            }
            var currDoor = child.parent;
            if (typeof (currDoor.op) != _UN)
                if (currDoor.push == 1) {
                    switch (currDoor.state) {
                        case 0:
                            if (currDoor.lerp < 1) currDoor.lerp += (0.004 * drawspeed);
                            var uselerp = currDoor.lerp;
                            if (currDoor.lerp >= 0.9) {
                                currDoor.lerp = 0; currDoor.state = 1; currDoor.push = 0;
                                if (currDoor.autoReturn) currDoor.push = 1;
                                if (currDoor.gridWalk) {
                                    for (var i = 0; i < currDoor.gridWalk.length; i++)
                                        iplayer.grid.nodes[currDoor.gridWalk[i].x][currDoor.gridWalk[i].y].walkable = true;
                                }
                            }
                            var rotdoor = new THREE.Vector3(0, 0, 0);
                            rotdoor.lerp(currDoor.op, uselerp);
                            currDoor.rotation.set(rotdoor.x, rotdoor.y, rotdoor.z, 'XYZ');
                            break;
                        case 1:
                            if (currDoor.lerp < 1) currDoor.lerp += (0.001 * drawspeed);
                            var uselerp = currDoor.lerp;
                            if (currDoor.lerp >= 0.9) {
                                currDoor.lerp = 0; currDoor.state = 0; currDoor.push = 0;
                                if (currDoor.gridWalk) {
                                    for (var i = 0; i < currDoor.gridWalk.length; i++)
                                        iplayer.grid.nodes[currDoor.gridWalk[i].x][currDoor.gridWalk[i].y].walkable = false;
                                }
                            }
                            var rotdoor = new THREE.Vector3(currDoor.rotation.x, currDoor.rotation.y, currDoor.rotation.z);
                            rotdoor.lerp(new THREE.Vector3(0, 0, 0), uselerp)
                            currDoor.rotation.set(rotdoor.x, rotdoor.y, rotdoor.z, 'XYZ');
                            break;
                    }
                }
        }

        //curtain wind moviment
        if (child.name.startsWith('curtain') && child.name.endsWith('_box') == true &&
            typeof (child.getObjectByName('bone3')) != _UN) {
            var bone = child.getObjectByName('bone3');
            var framewindow = null;
            //console.log('aa');
            if (child.frame && child.frame.length) framewindow = child.frame;
            if (framewindow != null && typeof(bone)!=_UN) {
                for (var i = 0; i < framewindow.length; i++)
                    if (!framewindow[i].atachedCurtain) {
                        framewindow[i].atachedCurtain = child;
                    }
                function getlerp() {
                    bone.lerp = Math.random() / 300;
                    if (bone.lerp < 0.001) bone.lerp = 0.001;
                    if (bone.lerp > 0.08) bone.lerp = 0.08;
                    bone.lerpmax = (Math.random() * 8) / 100;
                    if (bone.lerpmax > 0.08) bone.lerpmax = 0.08;
                }
                if (typeof (bone.lerp) == _UN) getlerp();
                if (typeof (framewindow[0].state) != _UN && framewindow[0].state == 0) {
                    bone.rotation.x = 0;
                } else {
                    if (bone.status == 0) {
                        bone.rotation.x += bone.lerp;
                        if (bone.rotation.x > bone.lerpmax) {
                            bone.status = 1;
                            getlerp();
                        }
                    } else {
                        bone.rotation.x -= bone.lerp;
                        if (bone.rotation.x < -bone.lerpmax) {
                            bone.status = 0;
                            getlerp();
                        }
                    }
                }
            }
        }

        //window glass        
        var glasswindowspeed = 24; //pushpull speed
        //if (getOByName('window_box') && getOByName('glass2', getOByName('window_box')) != _UN) {
        if (child.name.startsWith('glass') && child.atachedCurtain ) {
            var framewindow = child.atachedCurtain.frame[0];
            var frawlight = child.atachedCurtain.framelight;
            if (typeof (framewindow.state) == _UN) framewindow.state = 0;
            if (typeof (framewindow.lerp) == _UN) framewindow.lerp = child.atachedCurtain.frame[0].position.y;
            for (var i = 0; i < child.atachedCurtain.frame.length; i++) {
                var windowPart = child.atachedCurtain.frame[i];
                if (framewindow.push == 1) {
                    if (framewindow.state == 0) { //open                        
                        if (framewindow.position.y - framewindow.lerp < 40) {
                            windowPart.position.y += (2 * glasswindowspeed * delta);
                            if (frawlight.intensity < 4) frawlight.intensity += 2.8 * delta;
                        } else { framewindow.state = 1; framewindow.push = 0; }
                    } else { //close                    
                        if (framewindow.position.y - framewindow.lerp > 0) {
                            windowPart.position.y -= (2 * glasswindowspeed * delta);
                            if (frawlight.intensity > 0.2) frawlight.intensity -= 2.8 * delta;
                        } else { framewindow.state = 0; framewindow.push = 0; }
                    }
                }
            }
        }
    }

}


export { ANIMATE };