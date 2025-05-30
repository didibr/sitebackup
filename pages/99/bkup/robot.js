export default class Robot {
    constructor(type) {      
        this.sensor={detected:false,data:null};
        this.robotsensor=new RobotSensors();
        this.robotcontroller=new RobotController(this);
        this.robotbrain=new RobotBrain(this);
        this.previousKeyStates = {};
        this.type = type;
        this.moveable;
        
        this.config = {
            aceleration: 0.2,
            max_speed: 4,
            current_speed_l: 0,
            current_speed_r: 0,
            wheel_torque: 100
        }
    }
    async create(options) {        
        window.BB=this.robotbrain;
        await new Promise((resolve) => { //wait tensorflow
            this.robotbrain.tf.setBackend('wasm').then(()=>{resolve(true)});
        });
        return await new Promise((resolve) => {            
            const currentClass = this;
            FUNCTION.glbLoader.load('./models/' + this.type + '.glb', (obj) => {
                obj = obj.scene;
                //scene.add(obj);
                var texturedir = './img/textures/' + this.type + '/';
                FUNCTION.createMaterial('physical', 1,
                    {
                        map: texturedir + 'basecolor.png',
                        normal: texturedir + 'normal.png',
                        roughnessMap: texturedir + 'roughness.png',
                        metalnessMap: texturedir + 'metallic.png',
                        //emissiveMap:texturedir+'roughness.png', emissive:0x006600,
                        repeat: new THREE.Vector2(1, 1),
                        flipY: false
                    }, (materials) => {
                        FUNCTION.getmeshes(obj, (mesh) => {
                            mesh.material = materials[0];
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                        });
                        resolve(currentClass.continueCreate(options, currentClass, obj));
                    }
                );
            });
        });
    }

    async continueCreate(options, currentClass, object) {
        //variables
        if (!options.startAt) options.startAt = { x: 0, y: 0, z: 0 };
        var fisicParts = [];
        var frustumObj = [];
        var moveable = { whells: { left: [], right: [] } };
        var part;
        var p2Group = 1;

        //construct mesh body
        var body = new THREE.Group();
        scene.add(body);
        body.position.set(options.startAt.x, options.startAt.y, options.startAt.z)
        for (var i = 1; i < 10; i++) { //construct by all BODY contact blocks
            part = object.getObjectByName('body' + i);
            if (part) {
                body.add(part);
                frustumObj.push(part);
            }
        }


        part = object.getObjectByName('display');
        part.material = part.material.clone();
        body.add(part);

        if (this.type == 'robot01') {//extra parts
            part = object.getObjectByName('anten_light_r');
            part.material = part.material.clone();
            body.add(part);
            part = object.getObjectByName('anten_light_l');
            part.material = part.material.clone();
            body.add(part);
            part = object.getObjectByName('display_border');
            part.material = part.material.clone();
            body.add(part);
            body.add(object.getObjectByName('anten'));
        }

        //construct Physic body contact
        for (var i = 1; i < 10; i++) {
            part = object.getObjectByName('body_ct' + i);
            if (part) {
                //scene.add(part);
                //console.log(part);
                //frustumObj.push(part);
                part.position.copy(body.position);
                await physics.createObj(part, 'geometry', 'obj', null, 0, null);
                fisicParts.push(part);
            }
        }
        body = await physics.groupObj(body, fisicParts, 0.1);
        moveable.body = body;

        //hover base
        var hoverBase = object.getObjectByName('hover_base');
        scene.add(hoverBase);
        hoverBase.position.copy(body.position);
        await physics.createObj(hoverBase, 'geometry', 'obj', null, 0.5);
        hoverBase.userData.physicsBody.setAngularFactor(new Ammo.btVector3(0, 1, 0));
        moveable.hover = hoverBase;


        //joint body to hover                       
        var jointcabin = await physics.createJoint(
            body, { x: 0, y: 1.1, z: 0.5 }, //atach hover to cabin
            hoverBase, { x: 0, y: 0, z: 0 },
            'hinge',
            { x: 1, y: 0, z: 0 }//relative rotation
        );
        jointcabin.setLimit(-3.2, 3.2, 1);
        hoverBase.JOINTCABIN = jointcabin;
        hoverBase.JOINTCABIN.angle = -0.022; //EXTRA value to maintain robot standup


        //WHEELLS
        //var angularWell=new Ammo.btVector3(0.5, 0.5, 0.5);
        //options.startAt.x,options.startAt.y,options.startAt.z
        var wellFriction = 4;
        var wellRestutition = 0.8;
        var whells = [];
        var jwhells = [];
        var wheelobj = object.getObjectByName('whell');
        var wheelobj2 = object.getObjectByName('whell2');
        wheelobj.parent.remove(wheelobj);
        wheelobj2.parent.remove(wheelobj2);
        //if(1==2)
        for (var i = 0; i < 2; i++) {
            whells.push(wheelobj.clone());
            whells[i].position.set(options.startAt.x - 1.85, options.startAt.y - 2, options.startAt.z - (i * 1.5));
            scene.add(whells[i]);
            //frustumObj.push(whells[i]);
            //whells[i].material = _Function.materials.transparent;
            var whelly = -0.7;
            var whellx = -1.85;
            var whellmass = 1;
            await physics.createObj(whells[i], 'geometry', 'obj', null, whellmass);
            //whells[i].userData.physicsBody.setRollingFriction(this.conf.frictionRObj);
            whells[i].userData.physicsBody.setFriction(wellFriction);
            whells[i].userData.physicsBody.setRestitution(wellRestutition);
            whells[i].userData.physicsBody.setDamping(0.7, 0.0);
            moveable.whells.left.push(whells[i]);
            var wjoint = await physics.createJoint(
                hoverBase, { x: whellx, y: whelly, z: options.startAt.z - (i * 1.8) + 0.5 }, //atach wheel to hover
                whells[i], { x: 0, y: 0, z: 0 },
                'hinge',
                { x: -1, y: 0, z: 0 }//relative rotation
            );
            wjoint.setLimit(-3.2, 3.2, 1);
            wjoint.enableAngularMotor(true, 0, 100);
            jwhells.push(wjoint);
        }
        //if(1==2)                
        for (var i = 0; i < 2; i++) {
            whells.push(wheelobj2.clone());
            whells[i + 2].position.set(options.startAt.x + 1.85, options.startAt.y - 2, options.startAt.z - (i * 1.5));
            scene.add(whells[i + 2]);
            //frustumObj.push(whells[i + 8]);
            //whells[i + 8].material = _Function.materials.transparent;
            var whelly = -0.7;
            var whellx = 1.85;
            var whellmass = 1;
            await physics.createObj(whells[i + 2], 'geometry', 'obj', null, whellmass);
            whells[i + 2].userData.physicsBody.setFriction(wellFriction);
            whells[i + 2].userData.physicsBody.setRestitution(wellRestutition);
            whells[i + 2].userData.physicsBody.setDamping(0.7, 0.0);
            moveable.whells.right.push(whells[i + 2]);
            var wjoint = await physics.createJoint(
                hoverBase, { x: whellx, y: whelly, z: options.startAt.z - (i * 1.8) + 0.5 }, //atach wheel to hover
                whells[i + 2], { x: 0, y: 0, z: 0 },
                'hinge',
                { x: -1, y: 0, z: 0 }//relative rotation
            );
            wjoint.setLimit(-3.2, 3.2, 1);
            wjoint.enableAngularMotor(true, 0, 100);
            jwhells.push(wjoint);
        }
        hoverBase.JOINTWHEELS = jwhells;


        hoverBase.CHAINMESH_LEFT = {
            //first: true,
            active: 0,
            //t: tangents, // tangents
            //n: normals, // normals
            //b: binormals, // binormals                        
            //iShuttle: 0,
            //lss: ls + 1,
            //points: points
        }
        hoverBase.CHAINMESH_RIGHT = { //use data from LEFT
            //first: true,
            active: 0,
            //t: tangents, // tangents
            //n: normals, // normals
            //b: binormals, // binormals                       
            //iShuttle: 0,
            //lss: ls + 1,
            //points: points
        }

        currentClass.moveable = moveable;



        currentClass.robotsensor=currentClass.robotsensor.create(scene,currentClass); 
        currentClass.robotsensor.onDetect(currentClass.sensorDetect);

        
        return currentClass;
    }