
import * as THREE from 'three';
import Stats from 'three/stats.module.js';
import PHYSICS from 'engine/physics.js';
import MODELS from 'engine/models.js';
import TrackEditor from './editor.js';

window.THREE = THREE;
let physics = new PHYSICS();
let models = new MODELS();
let editor = new TrackEditor();
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;


let container, stats;
let scene, renderer;
let camera;
let car, map;

const keys = {};
const frustumSize = 100;
let timer;
let accumulator = 0;
const fixedTimeStep = 1 / 60;

let lastTime = 0;
const maxFPS = 60;
const frameTime = 1 / maxFPS;

const startMapString = "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";

init();

async function init() {
	container = document.createElement('div');
	document.body.appendChild(container);
	scene = new THREE.Scene();


	if (typeof (THREE.Timer) === 'undefined') {
		timer = new THREE.Clock();
		timer.update = () => { };
	} else {
		timer = new THREE.Timer();
	}

	camera = new THREE.OrthographicCamera(
		(frustumSize * aspect) / -2,
		(frustumSize * aspect) / 2,
		frustumSize / 2,
		frustumSize / -2,
		0.1,
		2000
	);

	camera.position.set(0, 0, 100);
	camera.lookAt(0, 0, 0);
	scene.add(camera);

	try {
		renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "low-power"
		});
	} catch (e) {
		console.warn("WebGL2 falhou, tentando WebGL1...");
		return;
	}

	renderer.setPixelRatio(1);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.setAnimationLoop(animate);
	container.appendChild(renderer.domElement);
	renderer.setClearColor(0xFFFFFF, 1);


	const data = editor.decodeBase64(startMapString);
	const newpath = editor.loadPathsFromData(data);
	map = await models.createMap(scene, renderer, physics, { paths: newpath, scale: 2.5, suavizarCurva: true });
	//map = await models.createMap(scene, renderer, physics, { model: 1, scale: 1.5, suavizarCurva: true });
	car = models.createCar(scene, physics, map, { follow: true, model: 1, x: -720, y: 140, driveable: true, collider: true, collor: "#FFFFFF" });
	setTimeout(() => {
		restart();
	}, 500);


	/*DEBUG TOOLS
	window.MM = models;
	window.CC = scene;
	window.PP = physics;
	window.CAM = camera;
	window.EE = editor;
	window.CA = car;
	window.MA = map;
	*/


	let onCreate = async (result) => {
		car.options = {};
		physics.removeBody(car.body);
		map.map.dispose(scene, physics);
		map.parallax.dispose();
		map = await models.createMap(scene, renderer, physics, { paths: result.paths, scale: 2.5, suavizarCurva: true });
		car = models.createCar(scene, physics, map, { follow: true, model: 1, x: 0, y: 0, driveable: true, collider: true, collor: "#FFFFFF" });
		let moveto = map.map.getClosestPoint(-10000, -1000);
		car.body.setLinearVelocity({ x: 0, y: 0 });
		car.body.setAngularVelocity(0);
		physics.teleportCar(car, moveto.x, moveto.y + 15);
		restart();		
	}

	editor.create = () => {
		editor.data = null;
		editor.open(async (result) => {
			onCreate(result);
		});
	}
	editor.change = () => {
		editor.edit(async (result) => {
			onCreate(result);
		});
	}

	stats = new Stats();
	container.appendChild(stats.dom);


	// botão Editor
	const editorBtn = document.createElement("button");
	editorBtn.innerText = "Editor";
	editorBtn.style.position = "absolute";
	editorBtn.style.top = "0px";
	editorBtn.style.left = "80px"; // ao lado do Stats
	editorBtn.style.width = "70px";
	editorBtn.style.height = "48px";
	editorBtn.style.background = "#cfef00";
	editorBtn.style.color = "#000";
	editorBtn.style.border = "1px solid #555";
	editorBtn.style.cursor = "pointer";
	editorBtn.style.fontSize = "12px";
	editorBtn.style.zIndex = "1000";
	// hover simples
	editorBtn.onmouseenter = () => editorBtn.style.background = "#c4e201";
	editorBtn.onmouseleave = () => editorBtn.style.background = "#cfef00";
	// ação do botão
	editorBtn.onclick = () => {
		editor.create(); // abre seu editor
	};
	container.appendChild(editorBtn);

	//RESTART BTN
	const restartBtn = document.createElement("button");
	restartBtn.innerText = "Restart";
	restartBtn.style.position = "absolute";
	restartBtn.style.top = "0px";
	restartBtn.style.left = "150px"; // ao lado do Editor
	restartBtn.style.width = "70px";
	restartBtn.style.height = "48px";
	restartBtn.style.background = "#222";
	restartBtn.style.color = "#fff";
	restartBtn.style.border = "1px solid #555";
	restartBtn.style.cursor = "pointer";
	restartBtn.style.fontSize = "12px";
	restartBtn.style.zIndex = "1000";
	// hover
	restartBtn.onmouseenter = () => restartBtn.style.background = "#444";
	restartBtn.onmouseleave = () => restartBtn.style.background = "#222";
	// ação do botão
	restartBtn.onclick = () => {
		if (!map || !car) return;
		let start = map.map.getClosestPoint(-10000, -1000, 15);
		car.body.setLinearVelocity({ x: 0, y: 0 });
		car.body.setAngularVelocity(0);
		physics.teleportCar(car, start.x, start.y + 15);
		if (map?.map?.race) {
			map.map.race.started = false;
			map.map.race.finished = false;
		}

		if (window.RACE_UI) {
			window.RACE_UI.innerText = "READY";
		}
		setTimeout(() => {
			physics.forcePause = true;
			physics.pause();
		}, 500);
	};
	window.restart=restartBtn.onclick;
	container.appendChild(restartBtn);

	//HUD
	const raceUI = document.createElement("div");
	raceUI.style.position = "absolute";
	raceUI.style.top = "10px";
	raceUI.style.left = "50%";
	raceUI.style.transform = "translateX(-50%)";
	raceUI.style.padding = "6px 14px";
	raceUI.style.background = "rgba(0,0,0,0.6)";
	raceUI.style.color = "#fff";
	raceUI.style.fontSize = "18px";
	raceUI.style.fontFamily = "monospace";
	raceUI.style.borderRadius = "6px";
	raceUI.style.zIndex = "1000";
	raceUI.innerText = "READY";
	container.appendChild(raceUI);
	// 🔥 deixa global
	window.RACE_UI = raceUI;



	window.addEventListener('resize', onWindowResize);
	// tecla pressionada
	window.addEventListener("keydown", (e) => {
		keys[e.code] = true;
	});

	// tecla solta
	window.addEventListener("keyup", (e) => {
		keys[e.code] = false;
	});
}


function onWindowResize() {
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	const frustumSize = 100;
	camera.left = (-frustumSize * aspect) / 2;
	camera.right = (frustumSize * aspect) / 2;
	camera.top = frustumSize / 2;
	camera.bottom = -frustumSize / 2;
	camera.updateProjectionMatrix();
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
}


function animate(time) {
	const now = time * 0.001;
	const delta = now - lastTime;
	if (delta < frameTime) return;
	lastTime = now;


	if (stats && stats.update) stats.update();

	if (map && map.map.race && map.map.race.finished) {
		if (physics.enabled) physics.pause();
		return;
	}
	if (!physics.enabled) physics.resume();
	if ((keys["ArrowRight"] || keys["ArrowLeft"]) && physics.forcePause) physics.forcePause = false;
	render();

}



function render() {
	timer.update();
	let delta = timer.getDelta() * 2;
	// evita bugs quando trava
	if (delta > 0.1) delta = 0.1;
	accumulator += delta;
	while (accumulator >= fixedTimeStep) {
		physics.update(fixedTimeStep);
		accumulator -= fixedTimeStep;
	}
	models.updateCar(keys, delta, camera);
	renderer.render(scene, camera);
}
