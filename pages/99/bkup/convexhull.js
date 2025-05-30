import { Plane, Vector3 } from 'three';

const Visible = 0;
const Deleted = 1;
const _plane = new Plane();
const _v1 = new Vector3();

class VertexNode {
	constructor(point) {
		this.point = point;
		this.face = null;
		this.next = null;
		this.prev = null;
	}
}

class VertexList {
	constructor() {
		this.head = null;
		this.tail = null;
	}

	first() {
		return this.head;
	}

	isEmpty() {
		return this.head === null;
	}

	append(vertex) {
		if (!this.head) {
			this.head = vertex;
		} else {
			this.tail.next = vertex;
			vertex.prev = this.tail;
		}
		this.tail = vertex;
		vertex.next = null;
	}

	remove(vertex) {
		if (vertex.prev) vertex.prev.next = vertex.next;
		else this.head = vertex.next;

		if (vertex.next) vertex.next.prev = vertex.prev;
		else this.tail = vertex.prev;

		vertex.next = null;
		vertex.prev = null;
	}

	clear() {
		this.head = null;
		this.tail = null;
	}
}

class HalfEdge {
	constructor(vertex, face) {
		this.vertex = vertex;
		this.face = face;
		this.next = null;
		this.prev = null;
		this.opposite = null;
	}
	
	head() {
		return this.vertex;
	}

	tail() {
		return this.prev ? this.prev.vertex : null;
	}

	setTwin(edge) {
		this.opposite = edge;
		edge.opposite = this;
		return this;
	}
}

class Face {
	constructor() {
		this.normal = new Vector3();
		this.midpoint = new Vector3();
		this.area = 0;
		this.constant = 0;
		this.outside = null;
		this.mark = Visible;
		this.edge = null;
	}

	static create(v0, v1, v2) {
		const face = new Face();
		const e0 = new HalfEdge(v0, face);
		const e1 = new HalfEdge(v1, face);
		const e2 = new HalfEdge(v2, face);

		e0.next = e2.prev = e1;
		e1.next = e0.prev = e2;
		e2.next = e1.prev = e0;

		face.edge = e0;
		face.compute();
		return face;
	}

	compute() {
		const a = this.edge.head().point;
		const b = this.edge.next.head().point;
		const c = this.edge.prev.head().point;

		this.normal.subVectors(c, b).cross(_v1.subVectors(a, b)).normalize();
		this.midpoint.addVectors(a, b).add(c).divideScalar(3);
		this.area = _v1.crossVectors(_v1.subVectors(c, b), _v1.subVectors(a, b)).length() / 2;
		this.constant = this.normal.dot(this.midpoint);

		return this;
	}

	distanceToPoint(point) {
		return this.normal.dot(point) - this.constant;
	}
}

class ConvexHull {
	constructor() {
		this.tolerance = -1;
		this.faces = [];
		this.vertices = [];
		this.assigned = new VertexList();
		this.unassigned = new VertexList();
	}

	setFromPoints(points) {
		if (points.length >= 4) {
			this.reset();
			points.forEach(point => this.vertices.push(new VertexNode(point)));
			this.compute();
		}
		return this;
	}

	reset() {
		this.faces = [];
		this.vertices = [];
		return this;
	}

	addVertexToFace(vertex, face) {
		vertex.face = face;
		if (face.outside === null) {
			this.assigned.append(vertex);
		} else {
			this.assigned.insertBefore(face.outside, vertex);
		}
		face.outside = vertex;
		return this;
	}

	computeInitialHull() {
		const extremes = this.computeExtremes();
		const [v0, v1] = [extremes.min[0], extremes.max[0]];

		let maxDistance = 0;
		const v2 = this.findThirdPoint(v0, v1, maxDistance);
		const v3 = this.findFourthPoint(v0, v1, v2, maxDistance);

		const faces = this.createFacesFromVertices([v0, v1, v2, v3]);
		this.faces.push(...faces);
		this.assignVerticesToFaces([v0, v1, v2, v3]);
		return this;
	}

	createFacesFromVertices([v0, v1, v2, v3]) {
		return _plane.distanceToPoint(v3.point) < 0
			? [Face.create(v0, v1, v2), Face.create(v3, v1, v0), Face.create(v3, v2, v1), Face.create(v3, v0, v2)]
			: [Face.create(v0, v2, v1), Face.create(v3, v0, v1), Face.create(v3, v1, v2), Face.create(v3, v2, v0)];
	}

	assignVerticesToFaces(excludeVertices) {
		this.vertices.forEach(vertex => {
			if (!excludeVertices.includes(vertex)) {
				let maxFace = null, maxDist = this.tolerance;
				this.faces.forEach(face => {
					const dist = face.distanceToPoint(vertex.point);
					if (dist > maxDist) maxFace = face, maxDist = dist;
				});
				if (maxFace) this.addVertexToFace(vertex, maxFace);
			}
		});
	}

	computeExtremes() {
		const min = new Vector3(), max = new Vector3();
		const minVertices = Array(3).fill(this.vertices[0]), maxVertices = Array(3).fill(this.vertices[0]);

		this.vertices.forEach(vertex => {
			const point = vertex.point;
			[0, 1, 2].forEach(i => {
				if (point.getComponent(i) < min.getComponent(i)) {
					min.setComponent(i, point.getComponent(i));
					minVertices[i] = vertex;
				}
				if (point.getComponent(i) > max.getComponent(i)) {
					max.setComponent(i, point.getComponent(i));
					maxVertices[i] = vertex;
				}
			});
		});

		this.tolerance = 3 * Number.EPSILON * (Math.max(...min.toArray()) + Math.max(...max.toArray()));
		return { min: minVertices, max: maxVertices };
	}

	findThirdPoint(v0, v1, maxDistance) {
		return this.vertices.reduce((maxV, vertex) => {
			if (vertex !== v0 && vertex !== v1) {
				const dist = v0.point.distanceToSquared(vertex.point);
				return dist > maxDistance ? (maxDistance = dist, vertex) : maxV;
			}
			return maxV;
		}, null);
	}

	findFourthPoint(v0, v1, v2, maxDistance) {
		_plane.setFromCoplanarPoints(v0.point, v1.point, v2.point);
		return this.vertices.reduce((maxV, vertex) => {
			if (vertex !== v0 && vertex !== v1 && vertex !== v2) {
				const dist = Math.abs(_plane.distanceToPoint(vertex.point));
				return dist > maxDistance ? (maxDistance = dist, vertex) : maxV;
			}
			return maxV;
		}, null);
	}

	compute() {
		this.computeInitialHull();
		let vertex;
		while ((vertex = this.nextVertexToAdd()) !== undefined) this.addVertexToHull(vertex);
		this.reindexFaces().cleanup();
		return this;
	}

	nextVertexToAdd() {
		if (!this.assigned.isEmpty()) {
			const eyeFace = this.assigned.first().face;
			let maxVertex = null, maxDist = this.tolerance;
			let vertex = eyeFace.outside;
			do {
				const dist = eyeFace.distanceToPoint(vertex.point);
				if (dist > maxDist) maxVertex = vertex, maxDist = dist;
				vertex = vertex.next;
			} while (vertex !== null && vertex.face === eyeFace);
			return maxVertex;
		}
	}
}

export { ConvexHull };
