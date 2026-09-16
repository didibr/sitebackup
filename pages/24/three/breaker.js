import { ConvexObjectBreaker } from 'https://didisoftwares.ddns.net/24/three/ConvexObjectBreaker.js';

class Breaker {
    constructor(physics) {
        this.physics = physics;
        this.physics.breaker=this;
        this.convexBreaker = new ConvexObjectBreaker();
        this.objects = [];
        this.cooldown = 250;
        this.defaultOptions = {
            hardness: 20,
            breakLevel: 0,
            maxLevel: 2,
            radialIterations: 2,
            randomIterations: 2,
            mass: 1,
            physicsType: "hull",
            physicsModel: "obj",
            explosion: 0.8,
            removeOriginal: true,
            recursive: true
        };
    }

    add(mesh, options = {}) {
        const opt = {
            ...this.defaultOptions,
            ...options
        };
        mesh.userData.breakable = true;
        mesh.userData.breakData = opt;
        mesh.userData.lastBreak = 0;
        this.convexBreaker.prepareBreakableObject(
            mesh,
            opt.mass,
            new THREE.Vector3(),
            new THREE.Vector3(),
            true
        );
        this.objects.push(mesh);
        return mesh;
    }

    remove(mesh) {
        const i = this.objects.indexOf(mesh);
        if (i != -1) this.objects.splice(i, 1);
    }

    impact(
        mesh,
        impulse,
        point,
        normal
    ) {
        if (!mesh) return;
        if (!mesh.userData.breakable) return;
        const data = mesh.userData.breakData;
        if (!data) return;
        if (mesh.userData.broken) return;
        if (performance.now() - mesh.userData.lastBreak < this.cooldown)
            return;        
        if (impulse < data.hardness)
            return;
        this.break(
            mesh,
            point,
            normal,
            impulse
        );
    }

    async break(mesh, point, normal, impulse) {
        if (!mesh || mesh.userData.broken) return;
        mesh.userData.broken = true;
        mesh.userData.lastBreak = performance.now();
        const data = mesh.userData.breakData;
        mesh.geometry = mesh.geometry.clone(); // evita compartilhar buffer
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
mesh.geometry.applyMatrix4(mesh.matrixWorld);
mesh.position.set(0,0,0);
mesh.rotation.set(0,0,0);
mesh.scale.set(1,1,1);
mesh.updateMatrixWorld(true);
        
        
        const pieces = this.convexBreaker.subdivideByImpact(mesh, point, normal, data.radialIterations, data.randomIterations);
        if (!pieces || pieces.length == 0) {
            mesh.userData.broken = false;
            return;
        }
        await this._createFragments(mesh, pieces, point, normal, impulse);
    }

    async _createFragments(original, pieces, point, normal, impulse) {
    const data = original.userData.breakData;
    const vel = this.physics.getBodyVelocity(original);
    const mass = data.mass / pieces.length;

    for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];

        p.material = Array.isArray(original.material)
            ? original.material.map(m => m.clone())
            : original.material.clone();

        p.castShadow = original.castShadow;
        p.receiveShadow = original.receiveShadow;

        p.position.copy(p.position);
        p.quaternion.copy(p.quaternion);
        p.scale.copy(p.scale);

        p.userData.breakable = false;

        if (data.recursive && data.breakLevel + 1 < data.maxLevel) {
            this.add(p, {
                ...data,
                breakLevel: data.breakLevel + 1,
                mass: mass
            });
        }

        await this.physics.createObj(
            p,
            data.physicsType,
            data.physicsModel,
            null,
            mass
        );

        // ✅ direção radial (base)
        const radial = new THREE.Vector3().subVectors(p.position, point);

        // ✅ turbulência aleatória
        const random = new THREE.Vector3(
            (Math.random() - 0.5),
            (Math.random() - 0.5),
            (Math.random() - 0.5)
        );

        // ✅ combina radial + random + leve influência do normal
        const dir = radial
            .add(random.multiplyScalar(0.5))
            .add(normal.clone().multiplyScalar(0.3));

        if (dir.lengthSq() < 0.0001) {
            dir.copy(normal);
        }

        dir.normalize();

        // ✅ força controlada (evita explosão exagerada)
        const strength = Math.min(impulse * 0.01, 0.4);

        // ✅ velocidade final (menos dependente da original)
        const finalVel = new THREE.Vector3()
            .copy(vel.linear)
            .multiplyScalar(0.3)
            .add(dir.multiplyScalar(strength));

        // ✅ rotação aleatória
        const angular = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );

        this.physics.setBodyVelocity(p, finalVel, angular);

        if (original.parent) {
            original.parent.add(p);
        } else {
            this.physics.scene.add(p);
        }
    }

    if (data.removeOriginal) {
        this._removeOriginal(original);
    }
}


    _removeOriginal(mesh) {
        this.remove(mesh);
        this.physics.removeObj(mesh);
        if (mesh.parent)
            mesh.parent.remove(mesh);
    }

    async explode(position, radius, force) {
        const list = [...this.objects];
        for (let i = 0; i < list.length; i++) {
            const mesh = list[i];
            const d = mesh.position.distanceTo(position);
            if (d > radius) continue;
            const n = new THREE.Vector3().subVectors(mesh.position, position).normalize();
            const impulse = force * (1 - (d / radius));
            await this.break(mesh, mesh.position.clone(), n, impulse);
        }
    }

    async breakAll() {
        const list = [...this.objects];
        for (let i = 0; i < list.length; i++) {
            const m = list[i];
            await this.break(
                m,
                m.position.clone(),
                new THREE.Vector3(0, 1, 0),
                9999
            );
        }
    }

    getBreakables() {
        return this.objects;
    }

    isBreakable(mesh) {
        return mesh && mesh.userData.breakable === true;
    }

    canBreak(mesh) {
        if (!mesh) return false;
        if (!mesh.userData.breakable) return false;
        if (mesh.userData.broken) return false;
        return true;
    }

    async hit(mesh, force, normal) {
        await this.impact(
            mesh,
            force,
            mesh.position.clone(),
            normal || new THREE.Vector3(0, 1, 0)
        );
    }

    async shot(mesh, point, direction, power) {
        await this.impact(
            mesh,
            power,
            point,
            direction
        );
    }

    async collision(mesh, other, impulse, point, normal) {
        await this.impact(
            mesh,
            impulse,
            point,
            normal
        );
    }

}

export { Breaker };