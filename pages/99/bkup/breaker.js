import * as THREE from 'three';
import { ConvexObjectBreaker } from 'three/addons/misc/ConvexObjectBreaker.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

class Breaker {
    constructor(scene, ammo, gravityConstant) {
        this.scene = scene;
        this.ammo = ammo;
        this.gravityConstant = gravityConstant;
        this.convexBreaker = new ConvexObjectBreaker();
        this.rigidBodies = [];
        this.objectsToRemove = [];
        this.numObjectsToRemove = 0;
        this.margin = 0.05;
        this.transformAux1 = new this.ammo.btTransform();
        this.tempBtVec3_1 = new this.ammo.btVector3(0, 0, 0);
    }

    createObject(mass, halfExtents, pos, quat, material) {
        // Create a mesh with the specified geometry and material
        const object = new THREE.Mesh(
            new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2),
            material
        );

        object.position.copy(pos);
        object.quaternion.copy(quat);
        this.convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
        this.createDebrisFromBreakableObject(object);
    }

    createDebrisFromBreakableObject(object) {
        object.castShadow = true;
        object.receiveShadow = true;

        const shape = this.createConvexHullPhysicsShape(object.geometry.attributes.position.array);
        shape.setMargin(this.margin);

        const body = this.createRigidBody(object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity);
        
        const btVecUserData = new this.ammo.btVector3(0, 0, 0);
        btVecUserData.threeObject = object;
        body.setUserPointer(btVecUserData);
    }

    createConvexHullPhysicsShape(coords) {
        const shape = new this.ammo.btConvexHullShape();
        for (let i = 0, il = coords.length; i < il; i += 3) {
            this.tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
            const lastOne = (i >= (il - 3));
            shape.addPoint(this.tempBtVec3_1, lastOne);
        }
        return shape;
    }

    createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
        if (pos) {
            object.position.copy(pos);
        } else {
            pos = object.position;
        }
        if (quat) {
            object.quaternion.copy(quat);
        } else {
            quat = object.quaternion;
        }

        const transform = new this.ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new this.ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        
        const motionState = new this.ammo.btDefaultMotionState(transform);
        const localInertia = new this.ammo.btVector3(0, 0, 0);
        physicsShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new this.ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
        const body = new this.ammo.btRigidBody(rbInfo);
        body.setFriction(0.5);

        if (vel) {
            body.setLinearVelocity(new this.ammo.btVector3(vel.x, vel.y, vel.z));
        }
        if (angVel) {
            body.setAngularVelocity(new this.ammo.btVector3(angVel.x, angVel.y, angVel.z));
        }

        object.userData.physicsBody = body;
        object.userData.collided = false;
        
        this.scene.add(object);
        if (mass > 0) {
            this.rigidBodies.push(object);
            body.setActivationState(4);
        }
        this.ammoWorld.addRigidBody(body);
        return body;
    }

    // Outras funções como removeDebris, updatePhysics e onCollision podem ser implementadas aqui
}
