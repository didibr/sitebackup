globalThis.HOMESITE ??= 'https://didisoftwares.ddns.net/21/';
globalThis.world ??= document.getElementById('world');
globalThis.ui ??= document.getElementById('ui');
globalThis.atari ??= document.getElementById('atari');
globalThis.tvPopup ??= document.getElementById('tvPopup');
globalThis.tvCanvas ??= document.getElementById('tvCanvas');
globalThis.tvHeader ??= document.getElementById('tvHeader');
globalThis.tvClose ??= document.getElementById('tvClose');
globalThis.worldScale ??= 1;
globalThis.scale ??= .9;
globalThis.tvScale ??= 1;
globalThis.rx ??= 62;
globalThis.rz ??= -34;
globalThis.dragging ??= false;
globalThis.dragX ??= 0;
globalThis.dragY ??= 0;
globalThis.popupX ??= window.innerWidth / 2;
globalThis.popupY ??= window.innerHeight / 2;
tvPopup.style.left = popupX + 'px';
tvPopup.style.top = popupY + 'px';
atari.style.pointerEvents = 'none';
world.style.pointerEvents = 'none';

function createTrapezoid(t, e, n, a, s, l) { const r = document.createElement("div"); r.className = "rect", r.style.width = Math.max(n, a) + "px", r.style.height = s + "px", r.style.position = "absolute"; const o = (n - a) / 2; return r.style.clipPath = n > a ? `\n                    polygon(\n                        0% 0%,\n                        100% 0%,\n                        ${100 - o / n * 100}% 100%,\n                        ${o / n * 100}% 100%\n                    )\n                    ` : `\n                polygon(\n                    ${o / a * 100 * -1}% 0%,\n                    ${100 + o / a * 100}% 0%,\n                    100% 100%,\n                    0% 100%\n                )\n                `, r.style.transform = `translateX(${e.x}px) translateY(${e.y}px) translateZ(${e.z}px) rotateX(${l.x || 0}deg) rotateY(${l.y || 0}deg) rotateZ(${l.z || 0}deg)`, t.appendChild(r), r }
function createRectangle(t, e, n, a, s) { const l = document.createElement("div"); return l.className = "rect", l.style.width = n + "px", l.style.height = a + "px", l.style.transform = `\n                translateX(${e.x}px)\n                translateY(${e.y}px)\n                translateZ(${e.z}px)\n                rotateX(${s.x || 0}deg)\n                rotateY(${s.y || 0}deg)\n                rotateZ(${s.z || 0}deg)\n                `, t.appendChild(l), l }
function createLabel(t, e, n, a) { const s = document.createElement("div"); return s.className = "label", s.innerText = e, s.style.left = n + "px", s.style.top = a + "px", t.appendChild(s), s }
function createTriangle(t, e, n, r, a = "50%", l = {}) { const s = document.createElement("div"); return s.style.position = "absolute", s.style.width = n + "px", s.style.height = r + "px", s.style.clipPath = `\n    polygon(\n        ${a} 0%,\n        0% 100%,\n        100% 100%\n    )\n    `, s.style.transform = `\n    translateX(${e.x || 0}px)\n    translateY(${e.y || 0}px)\n    translateZ(${e.z || 0}px)\n    rotateX(${l.rx || l.x || 0}deg)\n    rotateY(${l.ry || l.y || 0}deg)\n    rotateZ(${l.rz || l.z || 0}deg)\n    `, s.style.transformStyle = "preserve-3d", t.appendChild(s), s }
function createSwitch(t,e,n,a){const s=document.createElement("div");s.className="switch "+a,s.style.position="absolute",s.style.left=e+"px",s.style.top=n+"px",s.style.width="20px",s.style.height="42px",s.style.pointerEvents="auto";const l=document.createElement("div");l.style.position="absolute",l.style.left="0px",l.style.top="8px",l.style.width="20px",l.style.height="28px",l.style.borderRadius="8px",l.style.background="linear-gradient(to right,#4a4a4a,#1a1a1a)",l.style.border="2px solid #000";const r=document.createElement("div");return r.className="cap",r.setAttribute("data-cap","1"),r.style.position="absolute",r.style.left="-2px",r.style.top="0px",r.style.width="20px",r.style.height="14px",r.style.borderRadius="50%",r.style.background="radial-gradient(ellipse at 30% 30%,#ffffff,#d0d0d0 30%,#7a7a7a 60%,#2a2a2a 100%)",r.style.border="2px solid #000",r.style.transition=".08s",r.style.boxShadow="inset 0 2px 2px rgba(255,255,255,.4),inset 0 -3px 4px rgba(0,0,0,.7),0 3px 5px rgba(0,0,0,.6)",s.appendChild(l),s.appendChild(r),t.appendChild(s),s}

/* BODY */
const bodyTop = createRectangle(atari, { x: 80, y: 120, z: 0 }, 604, 340, {});
bodyTop.style.background = `repeating-linear-gradient(90deg,#0e0e0e 0px,#0e0e0e 8px,#2a2a2a 8px,#2a2a2a 12px)`;
bodyTop.style.border = '4px solid #000';
bodyTop.style.borderRadius = '8px';
bodyTop.style.boxShadow = `inset 0 0 40px rgba(255,255,255,.03),inset 0 -40px 60px rgba(0,0,0,.7)`;


const bodyFront = createTrapezoid(atari, { x: 80, y: 460, z: 0 }, 604, 510, 90, { x: -90 });
bodyFront.style.transformOrigin = 'top';
bodyFront.style.background = `linear-gradient(to bottom,#161616,#050505)`;
bodyFront.style.border = '4px solid #000';


const bodyLeft = createRectangle(atari, { x: 126, y: 120, z: -90 }, 340, 100, { y: 62, z: 90 });
bodyLeft.style.transformOrigin = 'left top';
bodyLeft.style.background = `linear-gradient(to bottom,#1b1b1b,#070707)`;
bodyLeft.style.border = '4px solid #000';


const bodyBottom = createRectangle(atari, { x: 128, y: 120, z: -90 }, 510, 340, {});
bodyBottom.style.background = '#050505';
bodyBottom.style.borderRadius = '8px';

/* PANEL */
const panelMain = createTrapezoid(atari, { x: 90, y: 80, z: 30 }, 526, 588, 118, { x: -30 });
//panelMain.style.background = '#990';
panelMain.style.padding = "0px";
panelMain.style.margin = "0px";

const panel = createTrapezoid(panelMain, { x: 1, y: 1, z: 1 }, 524, 586, 116, {});
panel.style.background = `linear-gradient(to bottom,#242424,#0e0e0e)`;
panel.style.borderRadius = '6px';
panel.style.boxShadow = `inset 0 0 20px rgba(255,255,255,.03)`;

const panelInner = createRectangle(panel, { x: 42, y: 12, z: 2 }, 492, 92, {});
panelInner.style.background = `linear-gradient(to bottom,#1d1d1d,#090909)`;
panelInner.style.border = '2px solid #990';
//panelInner.style.border = '2px solid #2e2e2e';


const panelTri = createTriangle(atari, { x: 80, y: 100, z: 30 }, 98, 70, '100%', {});
panelTri.style.background = `linear-gradient(to bottom,#1d1d1d,#090909)`;
//manual change rotation in z after
panelTri.style.transform = 'translateX(58px) translateY(102px) translateZ(30px) rotateX(-90deg) rotateY(90deg) rotateX(-26deg)'


/* SLOT */
const slot = createRectangle(panelInner, { x: 180, y: 26, z: 5 }, 150, 42, {});
slot.style.background = `linear-gradient(to bottom,#050505,#151515)`;
slot.style.border = '4px solid #000';
slot.style.borderRadius = '4px';
slot.style.boxShadow = `inset 0 8px 10px rgba(255,255,255,.03),
                inset 0 -10px 12px rgba(0,0,0,.9)`;

const hole = createRectangle(slot, { x: 10, y: 10, z: 1 }, 122, 12, {});
hole.style.background = '#020202';
hole.style.borderRadius = '2px';

/* SWITCHES */

var power = createSwitch(panelInner, 46, 28, 'toggle');
power.id = 'bt1';
var bt2 = createSwitch(panelInner, 92, 28, 'toggle');
bt2.id = 'bt2';
var dificult = createSwitch(panelInner, 380, 28, 'push');
dificult.id = 'bt3';
var reset = createSwitch(panelInner, 430, 28, 'push');
reset.style.zIndex = 999999;
reset.id = 'bt4';

/* LABELS */
createLabel(panelInner, 'POWER', 26, 8);
createLabel(panelInner, 'COLOR', 88, 8);
createLabel(panelInner, 'SELECT', 356, 8);
createLabel(panelInner, 'START', 424, 8);

/* LOGO */

const logo = document.createElement('div');
logo.className = 'logo';
logo.innerText = 'ATARI 2600';
logo.style.left = '340px';
logo.style.top = '10px';
bodyFront.appendChild(logo);


//sidescrool
var sideScroll = document.createElement('div');
sideScroll.id = 'sideScroll';

const IMGDIR = "https://didisoftwares.ddns.net/21/card/"
const romNames=[
    "PAC-MAN", //0
    "MEGAMANIA", //1
    "ADVENTURE", //2
    "DIG DUG", //3
    "DONKEY KONG", //4
    "ENDURO", //5
    "FROGGER", //6
    "HALLOWEEN", //7
    "HERO", //8
    "JUNGLE HUNT", //9
    "MISSILE COMMAND", //10
    "MS.PAC-MAN", //11
    "PIT FALL", //12
    "Q-BERT", //13
    "RIVER RAID", //14
    "ROBOT TANK", //15
    "SPACE INVADER"
];
document.body.appendChild(sideScroll);
for (let i = 0; i < romNames.length; i++) {
    const item = document.createElement('div');
    item.className = 'sideItem';
    item.innerHTML = romNames[i];
    item.style.background = `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),
        url('${IMGDIR+i}.jpg') center/cover no-repeat`;    
    sideScroll.appendChild(item);    
}