class IPHYSICS {
    constructor() {
        this.rigidBodies = [];
        this.softBodies = [];
        this.physicsWorld = null;
        this.gravityConstant = -9.8;
        this.collide = {
            collisionConfiguration: null,
            dispatcher: null,
            broadphase: null,
            solver: null,
            softBodySolver: null
        };
        this.loadedObjects = [];
        this.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        this.conf = {
            margim: 0.05, //espessura
            //-- world configuration to friction and bounce ---//
            //friction - rolling friction - bounce restoration - dampl - dampx
            frictionbody: 0.5, frictionrbody: 0, restbody: 0, damplbody: 0.5, dampabody: 0.5,
            frictiontile: 0.8, frictionrtile: 0.1, resttile: 0.8, dampltile: 0, dampatile: 0,
            frictionwall: 1, frictionrwall: 1, restwall: 1, damplwall: 0, dampawall: 0,
            frictionobj: 0.4, frictionrobj: 0, restobj: 0.5, damlpobj: 0, dampaobj: 1,
        };
        this.paused = false;
        this.ray = new THREE.Ray();
        this.debug = false;
    }

    async create() {
        window.Ammo = await this.AmmoLoader();
        while (typeof Ammo.btVector3 === 'undefined') {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        /*
        this.collide.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.collide.dispatcher = new Ammo.btCollisionDispatcher(this.collide.collisionConfiguration);
        this.collide.broadphase = new Ammo.btDbvtBroadphase();
        this.collide.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.collide.dispatcher,
            this.collide.broadphase,
            this.collide.solver,
            this.collide.collisionConfiguration
        );
        this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
        */
        this.collide.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        this.collide.dispatcher = new Ammo.btCollisionDispatcher(this.collide.collisionConfiguration);
        this.collide.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
            this.collide.dispatcher,
            this.collide.broadphase,
            this.solver,
            this.collide.collisionConfiguration,
            this.softBodySolver
        );
        this.softBodyHelpers = new Ammo.btSoftBodyHelpers();
        this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, this.gravityConstant, 0));

        Ammo.btGImpactCollisionAlgorithm.prototype.registerAlgorithm(this.physicsWorld.getDispatcher());
        this.transformAux1 = new Ammo.btTransform();
        //global release memory
        this.reusaBleShapes = [];
        this.vecA = new Ammo.btVector3(0, 0, 0);
        this.vecB = new Ammo.btVector3(0, 0, 0);
        this.vecC = new Ammo.btVector3(0, 0, 0);
        this.quatA = new Ammo.btQuaternion(0, 0, 0);
        this.quatB = new Ammo.btQuaternion(0, 0, 0);
        this.quatC = new Ammo.btQuaternion(0, 0, 0);
        this.transformA = new Ammo.btTransform();
        this.transformB = new Ammo.btTransform();
        this.transformC = new Ammo.btTransform();
        return this;
    }


    async createJoint(obj1, point1, obj2, point2, type, extra) {
        let pivot1 = new Ammo.btVector3(point1.x, point1.y, point1.z);
        let pivot2 = new Ammo.btVector3(point2.x, point2.y, point2.z);
        var body1 = obj1.userData.physicsBody;
        var body2 = obj2.userData.physicsBody;
        let p2p;
        if (type == 'line') { //linha amarrada
            p2p = new Ammo.btPoint2PointConstraint(body1, body2, pivot1, pivot2);
        }
        if (type == 'slider') {//slider

            var quat1 = new Ammo.btQuaternion(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            var frame1 = new Ammo.btTransform(quat1, pivot1);

            var quat2 = new Ammo.btQuaternion(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            var frame2 = new Ammo.btTransform(quat2, pivot2);

            p2p = new Ammo.btSliderConstraint(body1, body2, frame1, frame2, false);
            window.PX = p2p;
            /*
            const d = r.transformB.getRotation();
                d.setEulerZYX(a.x || 0, a.y || 0, a.z || 0),
                r.transformB.setRotation(d);
                */


            //PM.setTargetLinMotorVelocity(-1);
        }
        if (type == 'hinge') {//dobradiça         
            var quat1;
            var quat2;
            quat1 = new Ammo.btQuaternion(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            quat2 = new Ammo.btQuaternion(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            var frame1 = new Ammo.btTransform(quat1, pivot1);
            var frame2 = new Ammo.btTransform(quat2, pivot2);
            if (extra && typeof (extra.x) != _UN) {
                var relative = new Ammo.btVector3(extra.x, extra.y, extra.z);
                p2p = new Ammo.btHingeConstraint(body1, body2, pivot1, pivot2, relative, relative, false);
            } else {
                p2p = new Ammo.btHingeConstraint(body1, body2, frame1, frame2, false);
            }
            p2p.setLimit(-Math.PI / 2, Math.PI, 1);
            Ammo.destroy(frame2);
            Ammo.destroy(frame2);
        }
        Ammo.destroy(pivot1);
        Ammo.destroy(pivot2);
        this.physicsWorld.addConstraint(p2p, false);
        return p2p;
    }


    //obj - 3d object
    //mass - massa do objecto
    //tam - vector3 to default box / ignored if use shape
    //pos - position of object and mass
    //poscenter - position of mass in obj / or 0 default
    //qua - quaternion of object
    //shape = predefinide ammo shape
    createRigidBody(obj, mass, tam, pos, quat, shape) {
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
        //ENGINE.scene.add(obj);

        if (mass > 0) {
            this.rigidBodies.push(obj);
            // Disable deactivation
            body.setActivationState(ACTSTATE.DISABLE_DEACTIVATION);
            body.setCollisionFlags(0);
        }

        this.physicsWorld.addRigidBody(body);
        return body;
    }

    async createJoint(obj1, point1, obj2, point2, type, extra) {
        let pivot1 = new Ammo.btVector3(point1.x, point1.y, point1.z);
        let pivot2 = new Ammo.btVector3(point2.x, point2.y, point2.z);
        var body1 = obj1.userData.physicsBody;
        var body2 = obj2.userData.physicsBody;
        let p2p;
        if (type == 'line') { //linha amarrada
            p2p = new Ammo.btPoint2PointConstraint(body1, body2, pivot1, pivot2);
        }
        if (type == 'slider') {//slider

            var quat1 = new Ammo.btQuaternion(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            var frame1 = new Ammo.btTransform(quat1, pivot1);

            var quat2 = new Ammo.btQuaternion(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            var frame2 = new Ammo.btTransform(quat2, pivot2);

            p2p = new Ammo.btSliderConstraint(body1, body2, frame1, frame2, false);
            window.PX = p2p;
            /*
            const d = r.transformB.getRotation();
                d.setEulerZYX(a.x || 0, a.y || 0, a.z || 0),
                r.transformB.setRotation(d);
                */


            //PM.setTargetLinMotorVelocity(-1);
        }
        if (type == 'hinge') {//dobradiça         
            var quat1;
            var quat2;
            quat1 = new Ammo.btQuaternion(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            quat2 = new Ammo.btQuaternion(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            var frame1 = new Ammo.btTransform(quat1, pivot1);
            var frame2 = new Ammo.btTransform(quat2, pivot2);
            if (extra && typeof (extra.x) != _UN) {
                var relative = new Ammo.btVector3(extra.x, extra.y, extra.z);
                p2p = new Ammo.btHingeConstraint(body1, body2, pivot1, pivot2, relative, relative, false);
            } else {
                p2p = new Ammo.btHingeConstraint(body1, body2, frame1, frame2, false);
            }
            p2p.setLimit(-Math.PI / 2, Math.PI, 1);
            Ammo.destroy(frame2);
            Ammo.destroy(frame2);
        }
        Ammo.destroy(pivot1);
        Ammo.destroy(pivot2);
        this.physicsWorld.addConstraint(p2p, false);
        return p2p;
    }

    async groupObj(nophisicObj, fisicObjs, mass) {
        var cpshape = new Ammo.btCompoundShape(true, fisicObjs.length - 1);
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 0, 0));
        nophisicObj.CONTACT = new THREE.Group();
        for (var i = 0; i < fisicObjs.length; i++) {
            var pshape = fisicObjs[i].userData.physicsShape;
            if (fisicObjs[i].contact && fisicObjs[i].contact.isMesh) {
                nophisicObj.add(fisicObjs[i].contact);
            }
            this.removeObj(fisicObjs[i]);
            if (fisicObjs[i].parent && fisicObjs[i].parent != null) fisicObjs[i].parent.remove(fisicObjs[i]);
            cpshape.addChildShape(transform, pshape);
        }
        const localInertia = new Ammo.btVector3(1, 1, 1);
        cpshape.calculateLocalInertia(mass, localInertia);

        var pos = new THREE.Vector3();
        nophisicObj.getWorldPosition(pos);
        var quat = new THREE.Quaternion();
        nophisicObj.getWorldQuaternion(quat);
        var body = await this.createRigidBody(nophisicObj, mass, 0, pos, quat, cpshape);

        body.setRollingFriction(this.conf.frictionrobj);
        body.setFriction(this.conf.frictionobj);
        body.setRestitution(this.conf.restobj);
        return nophisicObj;
    }

    async createObj(
        obj,
        type,//box - cylinder -sphere
        model,//obj - tile - wall
        tam, //vector3 size
        mass, //0=static
        contactS,//extra contact size
        extra
    ) {

        var pos = new THREE.Vector3();
        obj.getWorldPosition(pos);
        var quat = new THREE.Quaternion();
        obj.getWorldQuaternion(quat);

        if (tam == null) {
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                tam = new THREE.Vector3().subVectors(obj.geometry.boundingBox.max, obj.geometry.boundingBox.min);
            } else {
                var bb = new THREE.Box3().setFromObject(obj);
                tam = new THREE.Vector3();
                bb.getSize(tam);
            }
        }
        if (typeof (contactS) != _UN && contactS != null) {
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
            case 'hull':
                meshmodel = new THREE.BufferGeometry();
                shape = new Ammo.btConvexHullShape();
                //new ammo triangles
                var triangle_mesh = new Ammo.btTriangleMesh;
                //declare triangles position vectors
                var vectA = new Ammo.btVector3(0, 0, 0);
                var vectB = new Ammo.btVector3(0, 0, 0);
                var vectC = new Ammo.btVector3(0, 0, 0);
                //retrieve vertices positions from object
                var verticesPos = obj.geometry.attributes.position.array;
                var verticesPosNegate = null;
                //obj.getAttribute('position').array;
                meshmodel.setAttribute('position', new THREE.BufferAttribute(verticesPos, 3));
                var triangles = [];
                for (let i = 0; i < verticesPos.length; i += 3) {
                    var trianglevalues = { x: verticesPos[i], y: verticesPos[i + 1], z: verticesPos[i + 2] };
                    triangles.push(trianglevalues);
                }
                //use triangles data to draw ammo shape
                for (let i = 0; i < triangles.length - 3; i += 3) {

                    //ammo triangles get xpoint
                    vectA.setX(triangles[i].x);
                    vectA.setY(triangles[i].y);
                    vectA.setZ(triangles[i].z);
                    shape.addPoint(vectA, true);
                    //get y point
                    vectB.setX(triangles[i + 1].x);
                    vectB.setY(triangles[i + 1].y);
                    vectB.setZ(triangles[i + 1].z);
                    shape.addPoint(vectB, true);
                    //get z point
                    vectC.setX(triangles[i + 2].x);
                    vectC.setY(triangles[i + 2].y);
                    vectC.setZ(triangles[i + 2].z);
                    shape.addPoint(vectC, true);
                    //make triangle
                    triangle_mesh.addTriangle(vectA, vectB, vectC, true);
                }
                Ammo.destroy(vectA);
                Ammo.destroy(vectB);
                Ammo.destroy(vectC);
                shape.setMargin(0);
                break;
            case 'mesh':
                meshmodel = new THREE.BufferGeometry();
                shape = new Ammo.btCompoundShape();
                var vertices = obj.geometry.attributes.position.array;
                meshmodel.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                let myshape = new Ammo.btConvexHullShape();
                let transform;
                let count = 0;
                vertices.forEach(vertice => {
                    count++;
                    myshape.addPoint(new Ammo.btVector3(vertice.x, vertice.y, vertice.z));
                    if (count === 8) {
                        transform = new Ammo.btTransform();
                        transform.setIdentity();
                        transform.setOrigin(new Ammo.btVector3(0, 0, 0));
                        shape.addChildShape(transform, myshape);
                        myshape = new Ammo.btConvexHullShape();
                    }
                });
                transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(obj.position.x, obj.position.y, obj.position.z));
                transform.setRotation(new Ammo.btQuaternion(
                    obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w
                ));

                shape.setMargin(0);



                break;
            case 'triangle':
                meshmodel = new THREE.BufferGeometry();
                var triangle, triangle_mesh = new Ammo.btTriangleMesh();
                //declare triangles position vectors
                var vectA = new Ammo.btVector3(0, 0, 0);
                var vectB = new Ammo.btVector3(0, 0, 0);
                var vectC = new Ammo.btVector3(0, 0, 0);
                //retrieve vertices positions from object
                var verticesPos = obj.geometry.attributes.position.array;
                meshmodel.setAttribute('position', new THREE.BufferAttribute(verticesPos, 3));
                var triangles = [];
                for (let i = 0; i < verticesPos.length; i += 3) {
                    triangles.push({
                        x: verticesPos[i],
                        y: verticesPos[i + 1],
                        z: verticesPos[i + 2]
                    })
                }

                //use triangles data to draw ammo shape
                for (let i = 0; i < triangles.length - 3; i += 3) {

                    vectA.setX(triangles[i].x);
                    vectA.setY(triangles[i].y);
                    vectA.setZ(triangles[i].z);

                    vectB.setX(triangles[i + 1].x);
                    vectB.setY(triangles[i + 1].y);
                    vectB.setZ(triangles[i + 1].z);

                    vectC.setX(triangles[i + 2].x);
                    vectC.setY(triangles[i + 2].y);
                    vectC.setZ(triangles[i + 2].z);

                    triangle_mesh.addTriangle(vectA, vectB, vectC); //true
                }
                Ammo.destroy(vectA);
                Ammo.destroy(vectB);
                Ammo.destroy(vectC);
                //var shape = new AmmoLib.btBvhTriangleMeshShape(triangle_mesh, true);			
                shape = new Ammo.btConvexTriangleMeshShape(triangle_mesh, true);

                break;
            default:
                console.warn('Type not Exist', type);
        }
        var contact = new THREE.Mesh(meshmodel, this.material);
        contact.name = 'CONTACT';
        //var conq = obj.quaternion.clone();
        obj.contact = contact;
        obj.add(contact);

        var body = await this.createRigidBody(obj, mass, 0, pos, quat, shape);
        //contact.material.visible = false;
        //contact.material.opacity = 0;

        if (model == 'obj') {
            body.setRollingFriction(this.conf.frictionrobj);
            body.setFriction(this.conf.frictionobj);
            body.setRestitution(this.conf.restobj);
        }
        if (model == 'tile') {
            body.setRollingFriction(this.conf.frictionrtile);
            body.setFriction(this.conf.frictiontile);
            body.setRestitution(this.conf.resttile);
            body.setDamping(this.conf.dampltile, this.conf.dampatile);
        }
        if (model == 'wall') {
            body.setRollingFriction(this.conf.frictionrwall);
            body.setFriction(this.conf.frictionwall);
            body.setRestitution(this.conf.restwall);
            body.setDamping(this.conf.damplwall, this.conf.dampawall);
        }

        return obj;
    }

    update(delta) {
        if (typeof (this.physicsWorld) == _UN || this.physicsWorld == null || this.paused == true) return;
        if (this.transformAux1 == null) return;

        const deltaTime = delta;
        //this.physicsWorld.stepSimulation(deltaTime, 4, 1 / 60)
        this.physicsWorld.stepSimulation(deltaTime, 4, 1 / 30);

        for (let i = 0; i < this.rigidBodies.length; i++) {
            const objThree = this.rigidBodies[i];
            const userData = objThree.userData;
            if (userData != null && userData.physicsBody) {
                const objPhys = userData.physicsBody;
                const ms = objPhys.getMotionState();
                if (ms) {
                    ms.getWorldTransform(this.transformAux1);
                    var objPhys_position = this.transformAux1.getOrigin();
                    var objPhys_quaternion = this.transformAux1.getRotation();
                    //SET THREE OBJECT position/ROTATION
                    var pos = { x: objPhys_position.x(), y: objPhys_position.y(), z: objPhys_position.z() };
                    var quat = { x: objPhys_quaternion.x(), y: objPhys_quaternion.y(), z: objPhys_quaternion.z(), w: objPhys_quaternion.w() };

                    objThree.position.set(pos.x, pos.y, pos.z);
                    objThree.quaternion.set(quat.x, quat.y, quat.z, quat.w);

                    if (pos.y > 700000) {//remove object
                        //objThree.userData.physicsBody.setCollisionFlags(5); 
                        //objThree.userData.physicsBody = undefined;
                    }

                }

            }
        }
    }

    removeObj(oject) {
        if (typeof (oject) == _UN || oject == null) return;
        if (typeof (oject.userData) == _UN) return false;
        if (typeof (oject.userData.physicsBody) == _UN) return false;
        oject.userData.physicsBody.setCollisionFlags(4);
        scene.remove(oject);
        this.physicsWorld.removeRigidBody(oject.userData.physicsBody);
        return true;
    }

    clear() {
        for (var i = 0; i < this.rigidBodies.length; i++) {
            const objThree = this.rigidBodies[i];
            const objPhys = objThree.userData.physicsBody;
            if (typeof (objPhys) != _UN) {
                objPhys.setCollisionFlags(4);
                this.physicsWorld.removeRigidBody(objPhys);
                if (objThree.parent) objThree.parent.remove(objThree);
            }
        }
        this.rigidBodies = [];
    }

    bodyRotateQuaternion(object, quaternion) {
        var quat = quaternion;
        var body = object.userData.physicsBody;
        if (typeof (quat.quaternion) != _UN) quat = quat.quaternion;
        if (typeof (quat.x) == _UN) { console.error("Invalid Quaternion"); return; }
        if (typeof (body) == _UN || typeof (body) == _UN) return;
        quat = new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
        //object.quaternion.copy(quat);              
        this.transformAux1.setIdentity();
        //console.log(quat);
        this.transformAux1.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        body.setWorldTransform(this.transformAux1);
        //object.quaternion.copy(quaternion);
    }

    bodyRotateXYZ(object, xyz) {
        var quat = new THREE.Quaternion();
        var body = object.userData.physicsBody;
        // if (typeof (xyz.isVector3) != _UN) quat = quat.quaternion;
        if (typeof (xyz.x) == _UN) { console.error("Invalid Rotation"); return; }
        if (typeof (body) == _UN || typeof (body) == _UN) { console.error("Invalid Body"); return; }
        var obx = new THREE.Object3D();
        obx.quaternion.copy(object);
        obx.rotation.set(xyz.x, xyz.y, xyz.z, 'XYZ');
        quat.copy(obx.quaternion);
        //quat=new THREE.Quaternion(quat.x,quat.y,quat.z,quat.w);
        //object.quaternion.copy(quat);              
        this.transformAux1.setIdentity();
        //console.log(quat);
        this.transformAux1.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        body.setWorldTransform(this.transformAux1);
        //object.quaternion.copy(quaternion);
    }

    bodyTeleport(object, position) {
        var p = position;
        var body = object.userData.physicsBody;
        if (typeof (p) == _UN || typeof (p.x) == _UN) p = p.position;
        if (typeof (p.x) == _UN) { console.error("Invalid Position"); return; }
        if (typeof (body) == _UN || typeof (body) == _UN) return;
        this.transformAux1.setIdentity();
        this.transformAux1.setOrigin(new Ammo.btVector3(p.x, p.y, p.z));
        body.setWorldTransform(this.transformAux1);
        object.position.set(p.x, p.y, p.z);
        /*var world = body.getWorldTransform();
        var origin = world.getOrigin();
        origin.setValue(p.x, p.y, p.z);
        object.position.set(p.x, p.y, p.z);
        */
    }

    bodyMove(object, position) {
        var p = position;
        var body = object.userData.physicsBody;
        if (typeof (p) == _UN || typeof (p.x) == _UN) p = p.position;
        if (typeof (p.x) == _UN) { console.error("Invalid Position"); return; }
        if (typeof (body) == _UN || typeof (body) == _UN) return;
        body.applyCentralImpulse(new Ammo.btVector3(p.x, p.y, p.z));
    }

    bodyJump(object, size) {
        var objThree = object;
        var body = objThree.userData.physicsBody;
        var jumpdirection = new Ammo.btVector3(size.x, size.y, size.z);
        body.setLinearVelocity(jumpdirection);
        //body.applyCentralImpulse(jumpdirection);
        //body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));        
    }

}

export { IPHYSICS };