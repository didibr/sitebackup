
class IPHYSICS {

    //https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
    constructor(three) {
        this.THREE = three;
        this.dummy = new this.THREE.Object3D();
        this.rigidBodies = []
        this.physicsWorld = null
        this.gravityConstant = -9.8
        this.transformAux1 = null

        // GLOBAL AMMO OBJECTS TO REUSE
        this._vt1 = new this.THREE.Vector3();
        this._vt2 = new this.THREE.Vector3();
        this._qt1 = new this.THREE.Quaternion();
        this._v1 = new Ammo.btVector3(0, 0, 0);
        this._v2 = new Ammo.btVector3(0, 0, 0);
        this._v3 = new Ammo.btVector3(0, 0, 0);
        this._q1 = new Ammo.btQuaternion(0, 0, 0, 1);
        this.transformAux1 = new Ammo.btTransform();
        this.transformAux2 = new Ammo.btTransform();
        this.debug = false;
        this.paused = false;
        

        this.collide = {
            collisionConfiguration: new Ammo.btDefaultCollisionConfiguration(),
            dispatcher: null,
            broadphase: null,
            solver: null,
            softBodySolver: null
        }

        this.loadedobjcts = []
        this.material = new this.THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.conf = {
            separator: 0.5,
            thickness: 0.3,
            frictionbody: 0.5, frictionrbody: 0.5, restbody: 0, damplbody: 0.5, dampabody: 0.5,
            frictiontile: 1, frictionrtile: 1, resttile: 1, dampltile: 0, dampatile: 0,
            frictionwall: 1, frictionrwall: 1, restwall: 1, damplwall: 0, dampawall: 0,
            frictionobj: 0.5, frictionrobj: 0.5, restobj: 0.1, damlpobj: 1, dampaobj: 1
        }


        this.collide.dispatcher = new Ammo.btCollisionDispatcher(this.collide.collisionConfiguration);
        this.collide.broadphase = new Ammo.btDbvtBroadphase();
        this.collide.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.collide.softBodySolver = new Ammo.btDefaultSoftBodySolver();

        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.collide.dispatcher,
            this.collide.broadphase,
            this.collide.solver,
            this.collide.collisionConfiguration);

        this._v1.setValue(0, this.gravityConstant, 0);
        this.physicsWorld.setGravity(this._v1);

    }

    getObjectByID(scene,id, callback) {
        scene.traverse((obj) => {
            if (obj && obj.userData && obj.userData.physicsBody && obj.userData.physicsBody.a)
                if (obj.userData.physicsBody.kB == id && typeof (callback)) callback(obj);
        });
    }

    removeObj(oject) {
        if (typeof (oject) == _UN || oject == null) return;
        if (typeof (oject.userData) == _UN) return false;
        if (typeof (oject.userData.physicsBody) == _UN) return false;
        oject.userData.physicsBody.setCollisionFlags(4);
        //scene.remove(oject);
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
        this._qt1.set(quat.x, quat.y, quat.z, quat.w);
        quat = this._qt1;
        //object.quaternion.copy(quat);              
        this.transformAux1.setIdentity();
        //console.log(quat);
        this._q1.setValue(quat.x, quat.y, quat.z, quat.w);
        this.transformAux1.setRotation(this._q1);
        body.setWorldTransform(this.transformAux1);
        //object.quaternion.copy(quaternion);
    }

    bodyRotateXYZ(object, xyz) {
        var quat = this._qt1;
        var body = object.userData.physicsBody;
        // if (typeof (xyz.isVector3) != _UN) quat = quat.quaternion;
        if (typeof (xyz.x) == _UN) { console.error("Invalid Rotation"); return; }
        if (typeof (body) == _UN || typeof (body) == _UN) { console.error("Invalid Body"); return; }
        var obx = this.dummy;
        obx.quaternion.copy(object);
        obx.rotation.set(xyz.x, xyz.y, xyz.z, 'XYZ');
        quat.copy(obx.quaternion);
        //quat=new THREE.Quaternion(quat.x,quat.y,quat.z,quat.w);
        //object.quaternion.copy(quat);              
        this.transformAux1.setIdentity();
        //console.log(quat);
        this._q1.setValue(quat.x, quat.y, quat.z, quat.w);
        this.transformAux1.setRotation(this._q1);
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
        this._v1.setValue(p.x, p.y, p.z);
        this.transformAux1.setOrigin(this._v1);
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
        this._v1.setValue(p.x, p.y, p.z);
        body.applyCentralImpulse(this._v1);
    }

    bodyJump(object, size) {
        var objThree = object;
        var body = objThree.userData.physicsBody;
        var jumpdirection = this._v1;
        jumpdirection.setValue(size.x, size.y, size.z);
        body.setLinearVelocity(jumpdirection);
        //body.applyCentralImpulse(jumpdirection);
        //body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));        
    }



    update(delta) {
        if (typeof (this.physicsWorld) == _UN || this.physicsWorld == null || this.paused == true) return;
        if (this.transformAux1 == null) return;
    
        const deltaTime = delta;
        this.physicsWorld.stepSimulation(deltaTime, 4, 1 / 30);
    
        // Atualiza posições dos objetos
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const objThree = this.rigidBodies[i];
            const userData = objThree.userData;
            if (userData != null && userData.physicsBody) {
                const objPhys = userData.physicsBody;
                const ms = objPhys.getMotionState();
                if (ms) {
                    ms.getWorldTransform(this.transformAux1);
                    const p = this.transformAux1.getOrigin();
                    const q = this.transformAux1.getRotation();
    
                    objThree.position.set(p.x(), p.y(), p.z());
                    objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }
            }
        }
    
       
    }



    /*cube = null;
    async createCubeTest(xpos) {
        if (typeof (xpos) == _UN) xpos = new THREE.Vector3(0, 25, 0);
        const quat = new THREE.Quaternion();
        const tam = new THREE.Vector3();
        quat.set(0, 0, 0, 1);
        tam.set(50, 50, 50);
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.position.copy(xpos);
        scene.add(this.cube);
        await this.createObj(this.cube, 'box', 'obj', null, 0.001);
        return this.cube;
    }

    async createCylinderTest(xpos,quat) {
        if (typeof (xpos) == _UN) xpos = new THREE.Vector3(0, 25, 0);
        if(typeof(quat)==_UN){ quat= new THREE.Quaternion(); quat.set(0, 0, 0, 1); }
        const tam = new THREE.Vector3();        
        tam.set(1, 1, 10);
        const geometry = new THREE.CylinderGeometry( tam.x/2, tam.x/2, tam.y, 30 ); 
        //meshmodel = new THREE.CylinderGeometry(tam.x / 2, tam.x / 2, tam.y, 8);
        var shape = new Ammo.btCylinderShape(new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.x * 0.5))
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var cil= new THREE.Mesh(geometry, material);
        cil.position.copy(xpos);
        
        scene.add(cil);
        
        var body = await this.createRigidBody(cil, 0.001, tam, xpos, quat, shape);
        //contact.material.visible = false;
        //contact.material.opacity = 0;

            body.setRollingFriction(this.conf.frictionrobj);
            body.setFriction(this.conf.frictionobj);
            body.setRestitution(this.conf.restobj);

        return cil;
    }

    async createJointer(obj, xpos) {
        if (typeof (xpos) == _UN) {
            xpos = this._vt1;
            xpos.set(0,0,0);
        }
        if (typeof (xpos.x) != _UN) {
            xpos = this._vt1;
            xpos.set(xpos.x, xpos.y, xpos.z);
        }
        const quat = this._qt1;
        const tam = this._vt2;
        quat.set(0, 0, 0, 1);
        tam.set(10, 10, 10);
        const geometry = new THREE.SphereGeometry();
        const material = this.material;
        var jointer = new THREE.Mesh(geometry, material);
        jointer.position.copy(xpos);
        obj.add(jointer);
        return jointer;
    }
    */


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
            this._v1.setValue(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5);
            ammoShape = new Ammo.btBoxShape(this._v1);
        } else {
            ammoShape = shape;
        }
        //ammoShape.setMargin(0.5);
        const transform = this.transformAux1;
        transform.setIdentity();
        this._v2.setValue(pos.x, pos.y, pos.z);
        transform.setOrigin(this._v2);
        this._q1.setValue(quat._x, quat._y, quat._z, quat._w);
        transform.setRotation(this._q1);
        const motionState = new Ammo.btDefaultMotionState(transform);

        this._v1.setValue(0, 0, 0);
        const localInertia = this._v1;
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
        this._v1.setValue(point1.x, point1.y, point1.z);
        this._v2.setValue(point2.x, point2.y, point2.z);
        const pivot1 = this._v1;
        const pivot2 = this._v2;

        const body1 = obj1.userData.physicsBody;
        const body2 = obj2.userData.physicsBody;
        let p2p;

        if (type === 'line') {
            p2p = new Ammo.btPoint2PointConstraint(body1, body2, pivot1, pivot2);
        }

        if (type === 'slider') {
            this._q1.setValue(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            const frame1 = this.transformAux1;
            frame1.setIdentity();
            frame1.setOrigin(pivot1);
            frame1.setRotation(this._q1);

            this._q1.setValue(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            const frame2 = this.transformAux2;
            frame2.setIdentity();
            frame2.setOrigin(pivot2);
            frame2.setRotation(this._q1);

            p2p = new Ammo.btSliderConstraint(body1, body2, frame1, frame2, false);
        }

        if (type === 'hinge') {
            this._q1.setValue(obj1.quaternion.x, obj1.quaternion.y, obj1.quaternion.z, obj1.quaternion.w);
            const frame1 = this.transformAux1;
            frame1.setIdentity();
            frame1.setOrigin(pivot1);
            frame1.setRotation(this._q1);

            this._q1.setValue(obj2.quaternion.x, obj2.quaternion.y, obj2.quaternion.z, obj2.quaternion.w);
            const frame2 = this.transformAux2;
            frame2.setIdentity();
            frame2.setOrigin(pivot2);
            frame2.setRotation(this._q1);

            if (extra && typeof (extra.x) !== _UN) {
                this._v1.setValue(extra.x, extra.y, extra.z);
                p2p = new Ammo.btHingeConstraint(body1, body2, pivot1, pivot2, this._v1, this._v1, false);
            } else {
                p2p = new Ammo.btHingeConstraint(body1, body2, frame1, frame2, false);
            }

            p2p.setLimit(-Math.PI / 2, Math.PI, 1);

            //Ammo.destroy(frame1);
            //Ammo.destroy(frame2);
        }

        this.physicsWorld.addConstraint(p2p, false);
        return p2p;
    }


    async groupObj(nophisicObj, fisicObjs, mass) {
        const cpshape = new Ammo.btCompoundShape(true, fisicObjs.length - 1);
        this.transformAux1.setIdentity();
        this._v1.setValue(0, 0, 0);
        this.transformAux1.setOrigin(this._v1);

        nophisicObj.CONTACT = new this.THREE.Group();

        for (let i = 0; i < fisicObjs.length; i++) {
            const pshape = fisicObjs[i].userData.physicsShape;
            if (fisicObjs[i].contact && fisicObjs[i].contact.isMesh) {
                nophisicObj.add(fisicObjs[i].contact);
            }
            this.removeObj(fisicObjs[i]);
            if (fisicObjs[i].parent) fisicObjs[i].parent.remove(fisicObjs[i]);
            cpshape.addChildShape(this.transformAux1, pshape);
        }

        const localInertia = this._v2;
        localInertia.setValue(1, 1, 1);
        cpshape.calculateLocalInertia(mass, localInertia);

        const pos = this._vt1;
        const quat = this._qt1;
        nophisicObj.getWorldPosition(pos);
        nophisicObj.getWorldQuaternion(quat);

        const body = await this.createRigidBody(nophisicObj, mass, 0, pos, quat, cpshape);

        body.setRollingFriction(this.conf.frictionrobj);
        body.setFriction(this.conf.frictionobj);
        body.setRestitution(this.conf.restobj);

        return nophisicObj;
    }



    //obj - 3d object
    //type - box | cylinder | sphere | hull | triangle | mesh
    //model - obj | tile | wall (define o tipo de material físico)
    //tam - THREE.Vector3 tamanho (opcional, se não passar calcula automaticamente)
    //mass - massa do objeto (0 = estático)
    //contactS - tamanho extra no contato (opcional)
    //extra - parâmetros adicionais para casos específicos
    async createObj(obj, type, model, tam, mass, contactS, extra) {
        function Float32Concat(a, b) { var c = a.length, d = new Float32Array(c + b.length); return d.set(a), d.set(b, c), d };
        const pos = this._vt1;
        const quat = this._qt1;
        obj.getWorldPosition(pos);
        obj.getWorldQuaternion(quat);

        if (tam == null) {
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                tam = new this.THREE.Vector3().subVectors(obj.geometry.boundingBox.max, obj.geometry.boundingBox.min);
            } else {
                const bb = new this.THREE.Box3().setFromObject(obj);
                tam = new this.THREE.Vector3();
                bb.getSize(tam);
            }
        }
        if (contactS) tam.add(contactS);
        const objScale = (extra && extra.scale) ? extra.scale : obj.scale;
        let meshmodel=new this.THREE.BufferGeometry();
        let shape;
        let triangle_mesh;
        let verticesPos;
        let geom;

        switch (type) {
            case 'box':
                if (this.debug || extra?.debug) {
                    meshmodel = new this.THREE.BoxGeometry(tam.x * objScale.x, tam.y * objScale.y, tam.z * objScale.z);
                }
                this._v1.setValue((tam.x * objScale.x) * 0.5, (tam.y * objScale.y) * 0.5, (tam.z * objScale.z) * 0.5);
                shape = new Ammo.btBoxShape(this._v1);
                break;
            
            case 'cylinder':
                if (this.debug || extra?.debug) {
                    meshmodel = new this.THREE.CylinderGeometry((tam.x * objScale.x) / 2, (tam.x * objScale.x) / 2, tam.y * objScale.y, 8);
                }
                this._v1.setValue((tam.x * objScale.x) * 0.5, (tam.y * objScale.y) * 0.5, (tam.x * objScale.x) * 0.5);
                shape = new Ammo.btCylinderShape(this._v1);
                break;
            
            case 'sphere':
                if (this.debug || extra?.debug) {
                    meshmodel = new this.THREE.SphereGeometry((tam.x * objScale.x) / 2, 8, 8);
                }
                shape = new Ammo.btSphereShape((tam.x * objScale.x) * 0.5);
                break;
            
            case 'hull':
                shape = new Ammo.btConvexHullShape();
                geom = obj.geometry.index !== null
                    ? obj.geometry.toNonIndexed()
                    : obj.geometry;
                verticesPos = geom.attributes.position.array;
                const points = [];
                for (let i = 0; i < verticesPos.length; i += 3) {
                    points.push(new this.THREE.Vector3(
                        verticesPos[i],
                        verticesPos[i + 1],
                        verticesPos[i + 2]
                    ));
                }
                if (this.debug || extra?.debug) {
                    meshmodel = new this.THREE.ConvexGeometry(points);
                }                
                points.forEach(p => {
                    this._v1.setValue(
                        p.x * objScale.x,
                        p.y * objScale.y,
                        p.z * objScale.z
                    );
                    shape.addPoint(this._v1, true);
                });
                shape.setMargin(this.conf.margim || 0);
                break;
            case 'triangle':
                triangle_mesh = new Ammo.btTriangleMesh();
                geom = obj.geometry.index !== null
                    ? obj.geometry.toNonIndexed()
                    : obj.geometry;
            
                verticesPos = geom.attributes.position.array;                            
                if (this.debug || extra?.debug) {
                    const vertexCount = verticesPos.length / 3;
                    const indices = [];
                    for (let i = 0; i < vertexCount; i += 3) {
                        indices.push(i, i + 1, i + 2);
                    }            
                    meshmodel = new this.THREE.BufferGeometry();
                    meshmodel.setAttribute('position', new this.THREE.Float32BufferAttribute(verticesPos, 3));
                    meshmodel.setIndex(indices);
                    meshmodel.computeVertexNormals();
                }                            
                for (let i = 0; i < verticesPos.length; i += 9) {
                    this._v1.setValue(
                        verticesPos[i] * objScale.x,
                        verticesPos[i + 1] * objScale.y,
                        verticesPos[i + 2] * objScale.z
                    );
                    this._v2.setValue(
                        verticesPos[i + 3] * objScale.x,
                        verticesPos[i + 4] * objScale.y,
                        verticesPos[i + 5] * objScale.z
                    );
                    this._v3.setValue(
                        verticesPos[i + 6] * objScale.x,
                        verticesPos[i + 7] * objScale.y,
                        verticesPos[i + 8] * objScale.z
                    );            
                    triangle_mesh.addTriangle(this._v1, this._v2, this._v3, true);
                }            
                shape = new Ammo.btConvexTriangleMeshShape(triangle_mesh, true);
                shape.setMargin(this.conf.margim || 0);
                break;
            case 'mesh':
                triangle_mesh = new Ammo.btTriangleMesh();
                verticesPos = new Float32Array();
                obj.traverse(child => {
                    if (child.isMesh && child.geometry && !child.isDebugPhysics) {
                        geom = child.geometry.index !== null
                            ? child.geometry.toNonIndexed()
                            : child.geometry;

                        const pos = geom.attributes.position.array;
                        verticesPos = Float32Concat(verticesPos, pos);
                    }
                });
                if (verticesPos.length === 0) {
                    console.warn('No vertices found in object for mesh collider');
                    break;
                }
                //create debug mesh
                if (this.debug || extra?.debug) {
                    meshmodel = new this.THREE.BufferGeometry();
                    meshmodel.setAttribute('position', new this.THREE.BufferAttribute(verticesPos, 3));
                    const vertexCount = verticesPos.length / 3;
                    const indices = [];
                    for (let i = 0; i < vertexCount; i += 3) {
                        indices.push(i, i + 1, i + 2);
                    }
                    meshmodel.setIndex(indices);
                    meshmodel.computeVertexNormals();
                }
                const centroidMesh = new this.THREE.Vector3(0, 0, 0);
                for (let i = 0; i < verticesPos.length; i += 3) {
                    centroidMesh.add(new this.THREE.Vector3(
                        verticesPos[i],
                        verticesPos[i + 1],
                        verticesPos[i + 2]
                    ));
                }
                centroidMesh.divideScalar(verticesPos.length / 3);
                if (extra && extra.ignoreCentroid) centroidMesh.set(0, 0, 0);
                for (let i = 0; i < verticesPos.length; i += 9) {
                    this._v1.setValue(
                        (verticesPos[i] - centroidMesh.x) * objScale.x,
                        (verticesPos[i + 1] - centroidMesh.y) * objScale.y,
                        (verticesPos[i + 2] - centroidMesh.z) * objScale.z
                    );
                    this._v2.setValue(
                        (verticesPos[i + 3] - centroidMesh.x) * objScale.x,
                        (verticesPos[i + 4] - centroidMesh.y) * objScale.y,
                        (verticesPos[i + 5] - centroidMesh.z) * objScale.z
                    );
                    this._v3.setValue(
                        (verticesPos[i + 6] - centroidMesh.x) * objScale.x,
                        (verticesPos[i + 7] - centroidMesh.y) * objScale.y,
                        (verticesPos[i + 8] - centroidMesh.z) * objScale.z
                    );
                    triangle_mesh.addTriangle(this._v1, this._v2, this._v3, true);
                }
                shape = new Ammo.btConvexTriangleMeshShape(triangle_mesh, true);
                shape.setMargin(this.conf.margim || 0);
                break;
            default:
                console.warn('Type not exist', type);
                break;
        }

        const contact = new this.THREE.Mesh(meshmodel, this.material);
        contact.name = 'CONTACT';
        obj.contact = contact;
        obj.add(contact);

        const body = await this.createRigidBody(obj, mass, 0, pos, quat, shape);

        if (model === 'obj') {
            body.setRollingFriction(this.conf.frictionrobj);
            body.setFriction(this.conf.frictionobj);
            body.setRestitution(this.conf.restobj);
        }
        if (model === 'tile') {
            body.setRollingFriction(this.conf.frictionrtile);
            body.setFriction(this.conf.frictiontile);
            body.setRestitution(this.conf.resttile);
            body.setDamping(this.conf.dampltile, this.conf.dampatile);
        }
        if (model === 'wall') {
            body.setRollingFriction(this.conf.frictionrwall);
            body.setFriction(this.conf.frictionwall);
            body.setRestitution(this.conf.restwall);
            body.setDamping(this.conf.damplwall, this.conf.dampawall);
        }

        return obj;
    }




}

export { IPHYSICS };