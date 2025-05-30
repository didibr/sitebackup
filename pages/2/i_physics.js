//V2 - Examples
/*
            var ball1=new THREE.Mesh(new THREE.SphereGeometry(8, 8, 8), materials[1]);
            this.scene.add(ball1);
            ball1.position.y=20;
            PHYSIC.createObj(ball1,'sphere','obj',null,2,{x:0,y:0,z:0});
            ball1.userData.physicsBody.setRestitution(0.98);

                            PHYSIC.createObj(object.getObjectByName('room_floor'),'box','tile',null,0);
                PHYSIC.createObj(object.getObjectByName('room_wall1'),'box','tile',null,0);
                PHYSIC.createObj(object.getObjectByName('room_wall2'),'box','tile',null,0);
                PHYSIC.createObj(object.getObjectByName('room_wall3'),'box','tile',null,0);
                PHYSIC.createObj(object.getObjectByName('room_wall4'),'box','tile',null,0);

                $(document).ready(function () {
    new AmmoW().then((AmmoLib)=>{
        window.Ammo = AmmoLib; //Ammo Loaded
        PHYSIC.initPhysics();
        initUserWait();
    });
});



*/

window.PHYSIC = {
    enabled:false,
    rigidBodies: [],
    physicsWorld: null,
    gravityConstant: - 9.8,
    transformAux1: null,
    material:null,
    collide: {
        collisionConfiguration: null,
        dispatcher: null,
        broadphase: null,
        solver: null,
        softBodySolver: null
    },
    loadedobjcts: [],
    debugWall: false,
    conf: {
        separator: 0.5, //default        
        thickness: 0.3, //espessura
        frictionbody: 0.5,    frictionrbody: 0.5,  restbody: 0,     damplbody: 0.5, dampabody: 0.5,
        frictiontile: 1,      frictionrtile: 1,    resttile: 1,     dampltile: 0, dampatile: 0,
        frictionwall: 1,      frictionrwall: 1,    restwall: 1,     damplwall: 0, dampawall: 0,
        frictionobj: 0.5,     frictionrobj: 0.5,   restobj: 0.1,    damlpobj: 1, dampaobj: 1,
    },

    initPhysics: function () {
        // Physics configuration
        //var ME = Physic.avar;
        PHYSIC.collide.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        //const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        PHYSIC.collide.dispatcher = new Ammo.btCollisionDispatcher(PHYSIC.collide.collisionConfiguration);
        PHYSIC.collide.broadphase = new Ammo.btDbvtBroadphase();
        PHYSIC.collide.solver = new Ammo.btSequentialImpulseConstraintSolver();
        PHYSIC.collide.softBodySolver = new Ammo.btDefaultSoftBodySolver();
        //this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
        PHYSIC.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        PHYSIC.collide.dispatcher, PHYSIC.collide.broadphase, PHYSIC.collide.solver, PHYSIC.collide.collisionConfiguration);
        PHYSIC.physicsWorld.setGravity(new Ammo.btVector3(0, PHYSIC.gravityConstant, 0));
        //this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, this.gravityConstant, 0));
        PHYSIC.transformAux1 = new Ammo.btTransform();
        /*
        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        var overlappingPairCache = new Ammo.btDbvtBroadphase();
        //var overlappingPairCache = new Ammo.btAxisSweep3(new Ammo.btVector3(-10,-10,-10),new Ammo.btVector3(10,10,10));
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        //this.m_dynamicsWorld.getSolverInfo().set_m_numIterations(10);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
        */
    },

    getObjectByID: function (id, callback) {
        scene.traverse((obj) => {
            if (obj && obj.userData && obj.userData.physicsBody && obj.userData.physicsBody.a)
                if (obj.userData.physicsBody.a == id && typeof (callback)) callback(obj);
        });
    },

    removeObj: function (oject) {
        if (typeof (oject) == _UN || oject == null) return;
        if (typeof (oject.userData) == _UN) return false;
        if (typeof (oject.userData.physicsBody) == _UN) return false;
        oject.userData.physicsBody.setCollisionFlags(4);
        scene.remove(oject);
        PHYSIC.physicsWorld.removeRigidBody(oject.userData.physicsBody);
        return true;
    },

    clear: function () {
        for (var i = 0; i < PHYSIC.rigidBodies.length; i++) {
            const objThree = PHYSIC.rigidBodies[i];
            const objPhys = objThree.userData.physicsBody;
            if (typeof (objPhys) != _UN) {
                objPhys.setCollisionFlags(4);
                PHYSIC.physicsWorld.removeRigidBody(objPhys);
                if (objThree.parent)objThree.parent.remove(objThree);
            }                        
        }
        PHYSIC.rigidBodies = [];
    },

    bodyRotateQuaternion:function(object, quaternion) {
        var objThree = object;
        var quat = quaternion;
        if (typeof (quat) == _UN || typeof (quat.x) == _UN) quat = quat.quaternion;
        if (typeof (quat.x) == _UN) { console.error("Invalid Quaternion"); return; }        
        var pobject = MOTION.bodyList[objThree.group.login];
        if (typeof (pobject) == _UN || typeof (pobject.object) == _UN) return;
        pobject.object.quaternion.copy(quat);        
        //var body = objThree.userData.physicsBody;
        //var world = body.getWorldTransform();
        //var newRotation = new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w);
        //world.setRotation(newRotation);   
        //objThree.quaternion.set(quat.x, quat.y, quat.z, quat.w);                
    },

    bodyTeleport: function (object, position) {
        var objThree = object;
        var p = position;
        if (typeof (p) == _UN || typeof (p.x) == _UN) p = p.position;
        if (typeof (p.x) == _UN) { console.error("Invalid Position"); return; }
        var body = objThree.userData.physicsBody;
        var world = body.getWorldTransform();
        var origin = world.getOrigin();
        origin.setValue(p.x, p.y, p.z);
        object.position.set(p.x, p.y, p.z);
    },

    bodyMove: function (object, position) {
        var objThree = object;
        var p = position;
        if (typeof (p) == _UN || typeof (p.x) == _UN) p = p.position;
        if (typeof (p.x) == _UN) { console.error("Invalid Position"); return; }
        var body = objThree.userData.physicsBody;
        body.applyCentralImpulse(new Ammo.btVector3(p.x, p.y, p.z));
    },

    bodyJump: function (object, size) {
        var objThree = object;
        var body = objThree.userData.physicsBody;
        var jumpdirection = new Ammo.btVector3(size.x, size.y, size.z);
        body.setLinearVelocity(jumpdirection);
        //body.applyCentralImpulse(jumpdirection);
        //body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));        
    },


    update: function (delta) {
        if(PHYSIC.enabled==false)return;
        if (typeof (PHYSIC.physicsWorld) == _UN || PHYSIC.physicsWorld == null) return;
        if (PHYSIC.transformAux1 == null) return;
        const deltaTime = delta;
        //this.physicsWorld.stepSimulation(deltaTime, 4, 1 / 60)
        PHYSIC.physicsWorld.stepSimulation(deltaTime, 4, 1 / 30);

        for (let i = 0; i < PHYSIC.rigidBodies.length; i++) {
            const objThree = PHYSIC.rigidBodies[i];
            if (objThree.userData != null && objThree.userData.physicsBody) {
                const objPhys = objThree.userData.physicsBody;
                const ms = objPhys.getMotionState();
                if (ms) {
                    ms.getWorldTransform(PHYSIC.transformAux1);
                    var p = PHYSIC.transformAux1.getOrigin();
                    var q = PHYSIC.transformAux1.getRotation();
                    //var transformAux2 = PHYSIC.transformAux1.getCenterOfMassTransform();

                    //part of movimentation
                    //TODO - anthack moves HERE

                    //SET THREE OBJECT position/ROTATION
                    var pos = { x: p.x(), y: p.y(), z: p.z() };
                    var quat = { x:q.x(), y:q.y(), z:q.z(), w:q.w() };
                    
                    if (objThree.group && objThree.group.type == "Human") {
                        if (quat.x != 0 || quat.z != 0) {
                            quat.x = 0; quat.z = 0;
                        }
                    }
                    objThree.position.set(pos.x, pos.y, pos.z);
                    objThree.quaternion.set(quat.x, quat.y, quat.z, quat.w);

                    //round position
                    //objThree.position.set(HELPER.roundS(p.x(), 3), p.y(), HELPER.roundS(p.z(),3));

                    //ERROR TREATMENT OUT OF MAP
                    var safepos;
                    if (pos.y < -30 && objThree.group) {
                        if (objThree.group.type == "Human") {
                            LOGIN.reload();
                        } else if (objThree.group.type == "Enemy") {
                            safepos = new THREE.Vector3(
                                objThree.userData.spawn.pos.x, objThree.userData.spawn.pos.y, objThree.userData.spawn.pos.z
                            );
                            objThree.userData.chaseLastPos = safepos.clone();
                            objThree.userData.newpos = safepos.clone();
                            PHYSIC.bodyTeleport(objThree, safepos);
                        } else {
                            //no more physics for object
                            objThree.userData.physicsBody = undefined;
                        }
                    }//END ERROR TREATMENT OUT OF MAP

                    if (pos.y > 700000 && objThree.group) {//remove object
                        objThree.userData.physicsBody.setCollisionFlags(5); 
                        objThree.userData.physicsBody = undefined;
                    }

                }

            }
        }
    },

    cube: null,
    createCubeTest: function (xpos) {
        var pos = new THREE.Vector3(0, 25, 0);
        if (typeof (xpos) != _UN) pos = xpos;
        const quat = new THREE.Quaternion();
        const tam = new THREE.Vector3();
        quat.set(0, 0, 0, 1);
        tam.set(1, 1, 1);
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });        
        PHYSIC.cube = new THREE.Mesh(geometry, material);
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5));
        shape.setMargin(0.5);
        //Physic.createRigidBody(cube, shape, 0.1, pos, quat);
        PHYSIC.cube.position.copy(pos);
        PHYSIC.createRigidBody(PHYSIC.cube, 0.1, tam, PHYSIC.cube.position, PHYSIC.cube.quaternion);
        PHYSIC.cube.castShadow = true;
        PHYSIC.cube.receiveShadow = true;
        return PHYSIC.cube;
    },


    //obj - 3d object
    //mass - massa do objecto
    //tam - vector3 to default box / ignored if use shape
    //pos - position of object and mass
    //poscenter - position of mass in obj / or 0 default
    //qua - quaternion of object
    //shape = predefinide ammo shape
    createRigidBody: function (obj, mass, tam, pos, quat, shape) {
        var ammoShape;
        if (typeof (shape) == _UN) {
            ammoShape = new Ammo.btBoxShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5));
        } else {
            ammoShape = shape;
        }
        //ammoShape.setMargin(0.5);
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat._x, quat._y, quat._z, quat._w));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        ammoShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, ammoShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);


        obj.userData.physicsBody = body;
        obj.userData.physicsShape = ammoShape;
        var ACTSTATE = {
            ACTIVE: 1,
            ISLAND_SLEEPING: 2,
            WANTS_DEACTIVATION: 3,
            DISABLE_DEACTIVATION: 4,
            DISABLE_SIMULATION: 5
        }
        var KINECTSTA = {
            CF_STATIC_OBJECT: 1,
            CF_KINEMATIC_OBJECT: 2,
            CF_NO_CONTACT_RESPONSE: 4,
            CF_CUSTOM_MATERIAL_CALLBACK: 8,//this allows per-triangle material (friction/restitution)
            CF_CHARACTER_OBJECT: 16,
            CF_DISABLE_VISUALIZE_OBJECT: 32, //disable debug drawing
            CF_DISABLE_SPU_COLLISION_PROCESSING: 64//disable parallel/SPU processing
        }
        var bodytype = '';
        if (mass == 0 || mass == 0.001) { bodytype = 'static'; } else { bodytype = 'moveable'; }
        //obj.group = { name: "PhysicBody", type: bodytype };
        //scene.add(obj);

        if (mass > 0) {
            PHYSIC.rigidBodies.push(obj);
            // Disable deactivation
            body.setActivationState(ACTSTATE.DISABLE_DEACTIVATION);
            body.setCollisionFlags(0);
        }

        PHYSIC.physicsWorld.addRigidBody(body);
        return body;
    },


    createObj: async function (
        obj,
        type,//box - cylinder -sphere
        model,//obj - tile - wall
        tam, //vector3 size
        mass, //0=static
        contactS,//extra contact size
        contactR) {
        if(PHYSIC.material==null){
            PHYSIC.material=new THREE.MeshBasicMaterial({ color: 0xff0000 });
            PHYSIC.material.wireframe=true;
            //PHYSIC.material.visible=false;
        }
        //var contact = HELPER.getObjectById(obj.group.contact);
        //contact.geometry.computeBoundingBox();
        if(tam==null){
            if(obj.geometry){
                obj.geometry.computeBoundingBox();
                tam = new THREE.Vector3().subVectors(obj.geometry.boundingBox.max, obj.geometry.boundingBox.min);
            }else{
                var bb = new THREE.Box3().setFromObject(obj);
                tam=new THREE.Vector3();
                bb.getSize(tam);            
            }
        }
        if(typeof(contactS)!=_UN){
            tam.add(contactS);                        
        }
        var meshmodel;
        var shape;
        switch (type) {
            case 'box':
                meshmodel = new THREE.BoxBufferGeometry(tam.x, tam.y, tam.z, 4, 4, 4);
                shape = new Ammo.btBoxShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5))
                break;
            case 'cylinder':
                meshmodel = new THREE.CylinderGeometry(tam.x / 2, tam.x / 2, tam.y, 8);
                shape = new Ammo.btCylinderShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.x * 0.5))
                break;
            /*case 'capsule':
                meshmodel = HELPER.createShapeCapsule(dimensions.x / 2, dimensions.y);
                shape = new Ammo.btCapsuleShape(tam.x * 0.5, tam.y * 0.5);
                //tam.y -= PHYSIC.conf.thickness;
                //shape.setMargin(-0.5);
                //tam.y = tam.y * 0.5;
                break;*/
            case 'sphere':
                meshmodel = new THREE.SphereGeometry(tam.x / 2, 8, 8);
                shape = new Ammo.btSphereShape(tam.x * 0.5)
                //tam.y -= PHYSIC.conf.thickness;
                break;
            default:
                console.warn('Type not Exist',type);
        }
        var contact=new THREE.Mesh(meshmodel, PHYSIC.material);
        contact.name='CONTACT';
        var conq = obj.quaternion.clone();

        //var conq = contact.quaternion.clone();        
        //obj.rotation.set(0, 0, 0, 'XYZ');
        //obj.rotation.set(0, 0, 0, 'XYZ');
        //obj.rotation.y = Math.PI;
        //obj.children[0].rotation.set(0, 0, 0, 'XYZ');
        //obj.children[0].rotateY(90);
        //window.AA = obj;

        //var mass = 2;
        //if (obj.dobj && obj.dobj.item && obj.dobj.item.mass)
        //    mass = obj.dobj.item.mass;

        //contact.add(obj);
        //obj.position.set(0, -tam.y * 0.5, 0);
        var objpos=new THREE.Vector3();
        obj.getWorldPosition(objpos); 
        obj.contact=contact;           
        obj.add(contact);        

        


        var body = PHYSIC.createRigidBody(obj, mass, 0, objpos, conq, shape);
        //contact.material.visible = false;
        //contact.material.opacity = 0;
        
        if(model=='obj'){
        body.setRollingFriction(PHYSIC.conf.frictionrobj);
        body.setFriction(PHYSIC.conf.frictionobj);
        body.setRestitution(PHYSIC.conf.restobj);
        }
        if(model=='tile'){
        body.setRollingFriction(PHYSIC.conf.frictionrtile);
        body.setFriction(PHYSIC.conf.frictiontile);
        body.setRestitution(PHYSIC.conf.resttile);
        body.setDamping(PHYSIC.conf.dampltile, PHYSIC.conf.dampatile);
        }
        if(model=='wall'){
        body.setRollingFriction(PHYSIC.conf.frictionrwall);
        body.setFriction(PHYSIC.conf.frictionwall);
        body.setRestitution(PHYSIC.conf.restwall);
        body.setDamping(PHYSIC.conf.damplwall, PHYSIC.conf.dampawall);
        }
        
    },

    createPlayer: async function (obj) {
        var contact = obj;
        contact.geometry.computeBoundingBox();
        var tam = new THREE.Vector3().subVectors(contact.geometry.boundingBox.max, contact.geometry.boundingBox.min);
        var shape = new Ammo.btCylinderShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.x * 0.5))
        var conq = contact.quaternion.clone();
        contact.rotation.set(0, 0, 0, 'XYZ');
        //obj.rotation.y = Math.PI;

        var body = PHYSIC.createRigidBody(contact, 2, 0, contact.position, conq, shape);
        body.setAngularFactor(Ammo.btVector3(1, 0, 1));
        body.setRollingFriction(PHYSIC.conf.frictionrbody);
        body.setFriction(PHYSIC.conf.frictionbody);
        body.setRestitution(PHYSIC.conf.restbody);
        body.setDamping(PHYSIC.conf.damplbody, PHYSIC.conf.dampabody);
        //contact.userData.physicsBody.setLinearFactor(Ammo.btVector3(1, 0, 1));
        //contact.material.visible = false;
        //contact.userData.physicsBody.setFriction(1);
        // contact.userData.physicsBody.(0.8);
        //body->setLinearFactor(btVector3(0,1,0));
        //body -> setAngularFactor(btVector3(0, 1, 0));

    },

}