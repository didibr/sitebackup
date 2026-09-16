

import {
	Line,
	Line3,
	Mesh,
	Plane,
	Triangle,
	Vector3,
	BufferGeometry,
	Float32BufferAttribute,
	ConvexGeometry,
} from 'https://didisoftwares.ddns.net/24/three/three.module.js';

const _v1 = new Vector3();

class ConvexObjectBreaker {
	constructor(minSizeForBreak = 1.4, smallDelta = 0.0001) {
		this.minSizeForBreak = minSizeForBreak;
		this.smallDelta = smallDelta;
		this.tempLine1 = new Line3();
		this.tempPlane1 = new Plane();
		this.tempPlane2 = new Plane();
		this.tempPlane_Cut = new Plane();
		this.tempCM1 = new Vector3();
		this.tempCM2 = new Vector3();
		this.tempVector3 = new Vector3();
		this.tempVector3_2 = new Vector3();
		this.tempVector3_3 = new Vector3();
		this.tempVector3_P0 = new Vector3();
		this.tempVector3_P1 = new Vector3();
		this.tempVector3_P2 = new Vector3();
		this.tempVector3_N0 = new Vector3();
		this.tempVector3_N1 = new Vector3();
		this.tempVector3_AB = new Vector3();
		this.tempVector3_CB = new Vector3();
		this.tempResultObjects = { object1: null, object2: null };
		this.segments = [];
		const n = 30 * 30;
		for (let i = 0; i < n; i++) this.segments[i] = false;
	}
	prepareBreakableObject(object, mass, velocity, angularVelocity, breakable) {
		const userData = object.userData;
		userData.mass = mass;
		userData.velocity = velocity.clone();
		userData.angularVelocity = angularVelocity.clone();
		userData.breakable = breakable;
	}
	subdivideByImpact(object, pointOfImpact, normal, maxRadialIterations, maxRandomIterations) {
		const debris = [];
		const tempPlane1 = this.tempPlane1;
		const tempPlane2 = this.tempPlane2;
		//this.tempVector3.addVectors( pointOfImpact, normal );
		//tempPlane1.setFromCoplanarPoints( pointOfImpact, object.position, this.tempVector3 );
		// cria base ortogonal estável
		const up = new Vector3(0, 1, 0);
		// evita paralelo com normal
		let tangent = new Vector3().crossVectors(normal, up);
		if (tangent.lengthSq() < 0.0001) {
			// normal é paralelo ao eixo Y → usa outro eixo
			tangent = new Vector3().crossVectors(normal, new Vector3(1, 0, 0));
		}
		tangent.normalize();
		// cria pontos válidos para o plano
		const p1 = pointOfImpact;
		const p2 = pointOfImpact.clone().add(normal);
		const p3 = pointOfImpact.clone().add(tangent);
		// define plano estável
		tempPlane1.setFromCoplanarPoints(p1, p2, p3);


		const maxTotalIterations = maxRandomIterations + maxRadialIterations;
		const scope = this;
		function subdivideRadial(subObject, startAngle, endAngle, numIterations) {
			if (Math.random() < numIterations * 0.05 || numIterations > maxTotalIterations) {
				debris.push(subObject);
				return;
			}
			let angle = Math.PI;
			if (numIterations === 0) {
				tempPlane2.normal.copy(tempPlane1.normal);
				tempPlane2.constant = tempPlane1.constant;
			} else {
				if (numIterations <= maxRadialIterations) {

					angle = (endAngle - startAngle) * (0.2 + 0.6 * Math.random()) + startAngle;

					scope.tempVector3_2
						.copy(object.position)
						.sub(pointOfImpact)
						.applyAxisAngle(normal, angle)
						.add(pointOfImpact);

					// ✅ base estável
					const base = scope.tempVector3_2.clone().sub(pointOfImpact).normalize();

					// ✅ cria vetor ortogonal seguro
					let ortho = new Vector3().crossVectors(normal, base);

					if (ortho.lengthSq() < 0.0001) {
						ortho = new Vector3(1, 0, 0);
					}

					ortho.normalize();

					// ✅ plano correto (NÃO use tempVector3)
					tempPlane2.setFromCoplanarPoints(
						pointOfImpact,
						pointOfImpact.clone().add(base),
						pointOfImpact.clone().add(ortho)
					);

				} else {

					angle = ((0.5 * (numIterations & 1)) + 0.2 * (2 - Math.random())) * Math.PI;

					scope.tempVector3_2
						.copy(pointOfImpact)
						.sub(subObject.position)
						.applyAxisAngle(normal, angle)
						.add(subObject.position);

					// ✅ base segura
					const base = scope.tempVector3_2.clone().sub(subObject.position).normalize();

					let ortho = new Vector3().crossVectors(normal, base);

					if (ortho.lengthSq() < 0.0001) {
						ortho = new Vector3(1, 0, 0);
					}

					ortho.normalize();

					tempPlane2.setFromCoplanarPoints(
						subObject.position,
						subObject.position.clone().add(base),
						subObject.position.clone().add(ortho)
					);
				}
			}


			if (
				!subObject ||
				!subObject.geometry ||
				!subObject.geometry.attributes ||
				!subObject.geometry.attributes.position
			) {
				return;
			}

			subObject.geometry.computeBoundingSphere();

			if (subObject.geometry.boundingSphere.radius < 0.2) {
				return;
			}

			scope.cutByPlane(subObject, tempPlane2, scope.tempResultObjects);
			const obj1 = scope.tempResultObjects.object1;
			const obj2 = scope.tempResultObjects.object2;
			if (obj1) {
				subdivideRadial(obj1, startAngle, angle, numIterations + 1);
			}
			if (obj2) {
				subdivideRadial(obj2, angle, endAngle, numIterations + 1);
			}
		}
		subdivideRadial(object, 0, 2 * Math.PI, 0);
		return debris;
	}
	cutByPlane(object, plane, output) {
		const geometry = object.geometry;

		if (!geometry || !geometry.attributes || !geometry.attributes.position) {
			return 0;
		}

		const coords = geometry.attributes.position.array;

		const normalsAttr = geometry.attributes.normal;

		if (!normalsAttr || !normalsAttr.array) {
			return 0;
		}

		const normals = normalsAttr.array;


		const numPoints = coords.length / 3;
		let numFaces = numPoints / 3;
		let indices = geometry.getIndex();
		if (indices) {
			indices = indices.array;
			numFaces = indices.length / 3;
		}
		function getVertexIndex(faceIdx, vert) {
			const idx = faceIdx * 3 + vert;
			return indices ? indices[idx] : idx;
		}
		const points1 = [];
		const points2 = [];
		const delta = this.smallDelta;
		const numPointPairs = numPoints * numPoints;
		for (let i = 0; i < numPointPairs; i++) this.segments[i] = false;
		const p0 = this.tempVector3_P0;
		const p1 = this.tempVector3_P1;
		const n0 = this.tempVector3_N0;
		const n1 = this.tempVector3_N1;
		for (let i = 0; i < numFaces - 1; i++) {
			const a1 = getVertexIndex(i, 0);
			const b1 = getVertexIndex(i, 1);
			const c1 = getVertexIndex(i, 2);
			n0.set(
				normals[a1 * 3],
				normals[a1 * 3 + 1],
				normals[a1 * 3 + 2]
			);
			for (let j = i + 1; j < numFaces; j++) {
				const a2 = getVertexIndex(j, 0);
				const b2 = getVertexIndex(j, 1);
				const c2 = getVertexIndex(j, 2);
				n1.set(
					normals[a2 * 3],
					normals[a2 * 3 + 1],
					normals[a2 * 3 + 2]
				);
				const coplanar = 1 - n0.dot(n1) < delta;
				if (coplanar) {
					if (a1 === a2 || a1 === b2 || a1 === c2) {
						if (b1 === a2 || b1 === b2 || b1 === c2) {
							this.segments[a1 * numPoints + b1] = true;
							this.segments[b1 * numPoints + a1] = true;
						} else {
							this.segments[c1 * numPoints + a1] = true;
							this.segments[a1 * numPoints + c1] = true;
						}
					} else if (b1 === a2 || b1 === b2 || b1 === c2) {
						this.segments[c1 * numPoints + b1] = true;
						this.segments[b1 * numPoints + c1] = true;
					}
				}
			}
		}
		const localPlane = this.tempPlane_Cut;
		object.updateMatrixWorld(true);
		object.updateMatrix();
		ConvexObjectBreaker.transformPlaneToLocalSpace(plane, object.matrix, localPlane);
		for (let i = 0; i < numFaces; i++) {
			const va = getVertexIndex(i, 0);
			const vb = getVertexIndex(i, 1);
			const vc = getVertexIndex(i, 2);
			for (let segment = 0; segment < 3; segment++) {
				const i0 = segment === 0 ? va : (segment === 1 ? vb : vc);
				const i1 = segment === 0 ? vb : (segment === 1 ? vc : va);
				const segmentState = this.segments[i0 * numPoints + i1];
				if (segmentState) continue;
				this.segments[i0 * numPoints + i1] = true;
				this.segments[i1 * numPoints + i0] = true;
				p0.set(coords[3 * i0], coords[3 * i0 + 1], coords[3 * i0 + 2]);
				p1.set(coords[3 * i1], coords[3 * i1 + 1], coords[3 * i1 + 2]);
				let mark0 = 0;
				let d = localPlane.distanceToPoint(p0);
				if (d > delta) {
					mark0 = 2;
					points2.push(p0.clone());
				} else if (d < - delta) {
					mark0 = 1;
					points1.push(p0.clone());
				} else {
					mark0 = 3;
					points1.push(p0.clone());
					points2.push(p0.clone());
				}
				let mark1 = 0;
				d = localPlane.distanceToPoint(p1);
				if (d > delta) {
					mark1 = 2;
					points2.push(p1.clone());
				} else if (d < - delta) {
					mark1 = 1;
					points1.push(p1.clone());
				} else {
					mark1 = 3;
					points1.push(p1.clone());
					points2.push(p1.clone());
				}
				if ((mark0 === 1 && mark1 === 2) || (mark0 === 2 && mark1 === 1)) {
					this.tempLine1.start.copy(p0);
					this.tempLine1.end.copy(p1);
					let intersection = new Vector3();
					intersection = localPlane.intersectLine(this.tempLine1, intersection);
					if (intersection === null) {
						console.error('Internal error: segment does not intersect plane.');
						output.segmentedObject1 = null;
						output.segmentedObject2 = null;
						return 0;
					}
					points1.push(intersection);
					points2.push(intersection.clone());
				}
			}
		}
		const newMass = object.userData.mass * 0.5;
		this.tempCM1.set(0, 0, 0);
		let radius1 = 0;
		const numPoints1 = points1.length;
		if (numPoints1 > 0) {
			for (let i = 0; i < numPoints1; i++) this.tempCM1.add(points1[i]);
			this.tempCM1.divideScalar(numPoints1);
			for (let i = 0; i < numPoints1; i++) {
				const p = points1[i];
				p.sub(this.tempCM1);
				radius1 = Math.max(radius1, p.length());
			}
			this.tempCM1.add(object.position);
		}
		this.tempCM2.set(0, 0, 0);
		let radius2 = 0;
		const numPoints2 = points2.length;
		if (numPoints2 > 0) {
			for (let i = 0; i < numPoints2; i++) this.tempCM2.add(points2[i]);
			this.tempCM2.divideScalar(numPoints2);
			for (let i = 0; i < numPoints2; i++) {
				const p = points2[i];
				p.sub(this.tempCM2);
				radius2 = Math.max(radius2, p.length());
			}
			this.tempCM2.add(object.position);
		}
		let object1 = null;
		let object2 = null;
		let numObjects = 0;
		if (numPoints1 >= 6) {

			const geo1 = new ConvexGeometry(points1);

			if (geo1 && geo1.attributes && geo1.attributes.position) {

				object1 = new Mesh(geo1, object.material);

				object1.position.copy(this.tempCM1);
				object1.quaternion.copy(object.quaternion);

				this.prepareBreakableObject(
					object1,
					newMass,
					object.userData.velocity,
					object.userData.angularVelocity,
					2 * radius1 > this.minSizeForBreak
				);

				numObjects++;
			}
		}
		if (numPoints2 >= 6) {

			const geo2 = new ConvexGeometry(points2);

			if (geo2 && geo2.attributes && geo2.attributes.position) {

				object2 = new Mesh(geo2, object.material);

				object2.position.copy(this.tempCM2);
				object2.quaternion.copy(object.quaternion);

				this.prepareBreakableObject(
					object2,
					newMass,
					object.userData.velocity,
					object.userData.angularVelocity,
					2 * radius2 > this.minSizeForBreak
				);

				numObjects++;
			}
		}
		output.object1 = object1;
		output.object2 = object2;
		return numObjects;
	}
	static transformFreeVector(v, m) {
		const x = v.x, y = v.y, z = v.z;
		const e = m.elements;
		v.x = e[0] * x + e[4] * y + e[8] * z;
		v.y = e[1] * x + e[5] * y + e[9] * z;
		v.z = e[2] * x + e[6] * y + e[10] * z;
		return v;
	}
	static transformFreeVectorInverse(v, m) {
		const x = v.x, y = v.y, z = v.z;
		const e = m.elements;
		v.x = e[0] * x + e[1] * y + e[2] * z;
		v.y = e[4] * x + e[5] * y + e[6] * z;
		v.z = e[8] * x + e[9] * y + e[10] * z;
		return v;
	}
	static transformTiedVectorInverse(v, m) {
		const x = v.x, y = v.y, z = v.z;
		const e = m.elements;
		v.x = e[0] * x + e[1] * y + e[2] * z - e[12];
		v.y = e[4] * x + e[5] * y + e[6] * z - e[13];
		v.z = e[8] * x + e[9] * y + e[10] * z - e[14];
		return v;
	}
	static transformPlaneToLocalSpace(plane, m, resultPlane) {
		resultPlane.normal.copy(plane.normal);
		resultPlane.constant = plane.constant;
		const referencePoint = ConvexObjectBreaker.transformTiedVectorInverse(plane.coplanarPoint(_v1), m);
		ConvexObjectBreaker.transformFreeVectorInverse(resultPlane.normal, m);
		resultPlane.constant = - referencePoint.dot(resultPlane.normal);
	}
}
export { ConvexObjectBreaker };