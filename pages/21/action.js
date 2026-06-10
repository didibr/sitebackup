
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

function loadScript(src, isModule = false) {
    return new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = src;
        if (isModule) s.type = "module";
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
    });
}

function displayFocus() {
    const canvas = document.getElementById('jt-screen-canvas');
    canvas.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 50, bubbles: true }));
    canvas.dispatchEvent(new MouseEvent("mouseup", { clientX: 100, clientY: 50, bubbles: true }));
    canvas.dispatchEvent(new MouseEvent("click", { clientX: 100, clientY: 50, bubbles: true }));
}

async function loadStart() {    
    window.jt = {};
    window.CTRLV = 0.3; //ATARI AUDIO 	
    window.CTRAC = null; //ATARI AUDIO CONTEXT
    jt.atariloaded = false;
    jt.ataripower = false;
    jt.atariglitch = false;
    var JavatariFullScreenSetup = { apply: function fullScreenSetup() { /* Setup Basic full-screen CSS*/ if (!this.cssApplied) { var style = document.createElement('style'); style.type = 'text/css'; style.innerHTML = this.css; document.head.appendChild(style); this.cssApplied = true; } /* Apply Standalone mode full-screen basic styles to html and body immediately if needed*/ document.documentElement.classList.toggle("jt-full-screen", this.shouldStartInFullScreen()); }, shouldStartInFullScreen: function () { return window.Javatari ? Javatari.SCREEN_FULLSCREEN_MODE === 1 || (Javatari.SCREEN_FULLSCREEN_MODE === -1 && this.isBrowserStandaloneMode()) : this.isBrowserStandaloneMode(); }, isBrowserStandaloneMode: function () { return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches; }, css: '' + 'html.jt-full-screen, html.jt-full-screen body {' + '   background: black;' + '}' + 'html.jt-full-screen .jt-full-screen-hidden {' + '   display: none;' + '}' + 'html:not(.jt-full-screen) .jt-full-screen-only {' + '   display: none;' + '}' };
    JavatariFullScreenSetup.apply();
    await loadScript(HOMESITE + "atari.js");
    loadedGame();
}

function loadedGame() {    
    Javatari.SCREEN_RESIZE_DISABLED = true;
    Javatari.SCREEN_FULLSCREEN_MODE = -2;
    Javatari.AUTO_POWER_ON_DELAY = -1;
    //Javatari.SCREEN_CRT_MODE=1;
    //SCREEN_CONTROL_BAR=0;            
    //Javatari.CARTRIDGE_URL = "rom/pacman.zip";
    Javatari.start();
    //CTRL(jt.ConsoleControls.POWER_OFF,true);
    jt.atariloaded = true;
}

const ROMDIR = "https://didisoftwares.ddns.net/2/rom/";
function insertCart(action) {
    if (action == 0) { //eject
        if (jt.ataripower == true) { //glitch ON
            CTRL(jt.ConsoleControls.DEBUG, true);
            CTRL(jt.ConsoleControls.DEBUG, true);
            CTRL(jt.ConsoleControls.DEBUG, true);
            CTRL(jt.ConsoleControls.DEBUG, true);
            jt.atariglitch = true;
            setTimeout(() => { CTRL(jt.ConsoleControls.PAUSE, true); }, 500);
        }
    } else { //put        
        if (jt.atariglitch == true) {
            jt.atariglitch = false;
            CTRL(jt.ConsoleControls.DEBUG, true);
        }
        CTRLR(ROMDIR + currentCartridge.rom);
    }
}

function atariSwitch(number, state) {
    var i = number;
    switch (state) {
        case 0: //down to up (+x)                            
            //action ON
            if (i == 1) {
                if (!currentCartridge) return;
                CTRL(jt.ConsoleControls.POWER, true);
                jt.ataripower = true;
                if (jt.atariglitch == true)
                    CTRL(jt.ConsoleControls.PAUSE, true);
            }
            if (i == 2)
                CTRL(jt.ConsoleControls.BLACK_WHITE, true);
            if (i == 3)
                CTRL(jt.ConsoleControls.DIFFICULTY0, true);
            if (i == 4) CTRL(jt.ConsoleControls.DIFFICULTY1, true);
            if (i == 5) CTRL(jt.ConsoleControls.SELECT, false);
            if (i == 6) CTRL(jt.ConsoleControls.RESET, false);

            break;
        case 1: //up to down (-x)                        
            if (i == 1) {
                CTRL(jt.ConsoleControls.POWER_OFF, true);
                jt.ataripower = false;
            }
            if (i == 2)
                CTRL(jt.ConsoleControls.BLACK_WHITE, true);
            if (i == 3)
                CTRL(jt.ConsoleControls.DIFFICULTY0, true);
            if (i == 4) CTRL(jt.ConsoleControls.DIFFICULTY1, true);
            if (i == 5) CTRL(jt.ConsoleControls.SELECT, true);
            if (i == 6) //no togle back to top
                CTRL(jt.ConsoleControls.RESET, true);

            break;
    }
}
loadStart();


window.currentCartridge = null;
const button1 = document.getElementById('bt1');
const button2 = document.getElementById('bt2');
const button3 = document.getElementById('bt3');
const button4 = document.getElementById('bt4');
function updateTransform() { atari.style.transform = `scale(${scale}) rotateX(${rx}deg) rotateZ(${rz}deg)` }
function pushButton(t) { let e = t.querySelector(".cap"); e.style.transform = "translateY(20px)", e.style.filter = "brightness(.75)", e.style.boxShadow = "inset 0 1px 1px rgba(255,255,255,.15),inset 0 -1px 2px rgba(0,0,0,.9)", setTimeout(() => { e.style.transform = "translateY(0px)", e.style.filter = "brightness(1)", e.style.boxShadow = "inset 0 2px 2px rgba(255,255,255,.4),inset 0 -3px 4px rgba(0,0,0,.7),0 3px 5px rgba(0,0,0,.6)" }, 120) }
function createCartridge(t, e = {}) { const n = e.width || 120, l = e.height || 160, s = e.depth || 26, o = document.createElement("div"); o.style.position = "absolute", o.style.left = (e.x || 0) + "px", o.style.top = (e.y || 0) + "px", o.style.width = n + "px", o.style.height = l + "px", o.style.transformStyle = "preserve-3d", o.style.transform = `translateZ(${e.z || 0}px) translateY(-400px) rotateX(${e.rx || 0}deg) rotateY(${e.ry || 0}deg) rotateZ(${e.rz || 0}deg)`; const m = [o], g = (t, e = o) => (e.appendChild(t), m.push(t), t), r = document.createElement("div"); r.style.position = "absolute", r.style.width = n + "px", r.style.height = l + "px", r.style.background = "linear-gradient(to right,#1d1d1d,#050505)", r.style.border = "3px solid #000", r.style.borderRadius = "6px", r.style.transform = `translateZ(${s / 2}px)`, r.style.boxShadow = "inset 0 0 20px rgba(255,255,255,.03),0 10px 20px rgba(0,0,0,.7)", g(r); const d = document.createElement("div"); d.style.position = "absolute", d.style.width = n + "px", d.style.height = l + "px", d.style.background = "#111", d.style.border = "3px solid #000", d.style.borderRadius = "6px", d.style.transform = `rotateY(180deg) translateZ(${s / 2}px)`, g(d); const a = document.createElement("div"); a.style.position = "absolute", a.style.width = s + "px", a.style.height = l + "px", a.style.background = "linear-gradient(to right,#050505,#2a2a2a)", a.style.border = "2px solid #000", a.style.transform = `rotateY(-90deg) translateZ(${s / 2}px)`, g(a); const i = document.createElement("div"); i.style.position = "absolute", i.style.width = s + "px", i.style.height = l + "px", i.style.background = "linear-gradient(to right,#2a2a2a,#050505)", i.style.border = "2px solid #000", i.style.transform = `rotateY(90deg) translateZ(${n - s / 2}px)`, g(i); const p = document.createElement("div"); p.style.position = "absolute", p.style.width = n + "px", p.style.height = s + "px", p.style.background = "linear-gradient(to bottom,#2a2a2a,#080808)", p.style.border = "2px solid #000", p.style.transformOrigin = "top", p.style.transform = `rotateX(-90deg) translateY(-${s / 2}px) translateZ(0px)`, window.TT = p, g(p); const y = document.createElement("div"); y.style.position = "absolute", y.style.left = "12px", y.style.top = "28px", y.style.width = "94px", y.style.height = "82px", y.style.border = "2px solid #000", y.style.borderRadius = "4px", y.style.overflow = "hidden", y.style.background = "#222", g(y, r); const x = document.createElement("div"); x.style.position = "absolute", x.style.width = "100%", x.style.height = "100%", x.style.backgroundImage = `url(${e.image || ""})`, x.style.backgroundSize = "cover", x.style.backgroundPosition = "center", g(x, y); const c = document.createElement("div"); c.innerText = e.title || "ATARI", c.style.position = "absolute", c.style.left = "0px", c.style.bottom = "0px", c.style.width = "100%", c.style.padding = "4px", c.style.background = "rgba(0,0,0,.7)", c.style.color = "#fff", c.style.fontSize = "10px", c.style.fontWeight = "bold", c.style.textAlign = "center", g(c, y), t.appendChild(o), o.animate([{ transform: `translateZ(${e.z || 0}px) translateY(-400px) rotateX(${e.rx || 0}deg) rotateY(${e.ry || 0}deg) rotateZ(${e.rz || 0}deg)` }, { transform: `translateZ(${e.z || 0}px) translateY(0px) rotateX(${e.rx || 0}deg) rotateY(${e.ry || 0}deg) rotateZ(${e.rz || 0}deg)` }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }), currentCartridge = { root: o, elements: m, onClick(t) { o.style.pointerEvents = "auto", o.onclick = e => t({ event: e, element: e.target, root: o, cartridge: currentCartridge }) } }, currentCartridge.rom = e.rom, currentCartridge }
function removeCartridge() { null != currentCartridge && (currentCartridge.root.animate([{ transform: "translateZ(40px) translateY(0px)" }, { transform: "translateZ(400px) translateY(0px)" }], { duration: 210, easing: "ease-out", fill: "forwards" }), setTimeout(() => { currentCartridge.root.remove(), currentCartridge = null }, 250)) }
function openTV() { tvPopup.classList.add('on'); let w = 2600, h = 820, s = tvScale, x = (window.innerWidth / worldScale - w * s) / 2, y = (window.innerHeight / worldScale - h * s) / 2; x < 0 && (x = 0), y < 0 && (y = 0), (x + w * s > window.innerWidth / worldScale || y + h * s > window.innerHeight / worldScale) && (s = Math.min((window.innerWidth / worldScale) / w, (window.innerHeight / worldScale) / h) * .98, x = Math.max(0, (window.innerWidth / worldScale - w * s) / 2), y = Math.max(0, (window.innerHeight / worldScale - h * s) / 2)), popupX = x, popupY = y, tvPopup.style.left = x + 'px', tvPopup.style.top = y + 'px', tvPopup.style.transform = `translate(0,0) scale(${s})` }
function closeTV() { tvPopup.classList.remove('on'); }
function resizeTV() { /*tvCanvas.width = tvCanvas.offsetWidth; tvCanvas.height = tvCanvas.offsetHeight;*/ }
function resizeWorld() { worldScale = Math.min(window.innerWidth / 1366, window.innerHeight / 768), world.style.transform = `    translate(-50%,-50%)    scale(${worldScale})    `, ui.style.transform = `    scale(${worldScale})    ` }

//EVENTS//
tvClose.onclick = () => { button1.onclick(); };
tvHeader.addEventListener('mousedown', e => { dragging = true; dragX = e.clientX / worldScale - popupX; dragY = e.clientY / worldScale - popupY; });
window.addEventListener('mouseup', () => { dragging = false; });
function mouseMoveAll(e) {
    const mx = (e.clientX / window.innerWidth - .5); const my = (e.clientY / window.innerHeight - .5);
    rz = -24 + mx * 24; //14
    rx = 42 - my * 18; //8
    updateTransform(); if (!dragging) { return; } popupX = e.clientX / worldScale - dragX; popupY = e.clientY / worldScale - dragY; tvPopup.style.left = popupX + 'px'; tvPopup.style.top = popupY + 'px';
};
function resizeAll() { resizeWorld(); resizeTV(); }
window.addEventListener('resize', resizeAll);
resizeAll();
window.addEventListener('mousemove', mouseMoveAll);
updateTransform();

//ACTIONS//
window.CD = (element) => {   
    if(currentCartridge)return; 
    var roms={
        0:{title:"PAC-MAN",file:"pacman"},
        1:{title:"MEGAMANIA",file:"megamania"},
        2:{title:"ADVENTURE",file:"adventure"},
        3:{title:"DIG DUG",file:"digdug"},
        4:{title:"DONKEY KONG",file:"donkong"},
        5:{title:"ENDURO",file:"enduro"},
        6:{title:"FROGGER",file:"frog"},
        7:{title:"HALLOWEEN",file:"halloi"},
        8:{title:"HERO",file:"hero"},
        9:{title:"JUNGLE HUNT",file:"junglehunt"},
        10:{title:"MISSILE COMMAND",file:"missile"},
        11:{title:"MS.PAC-MAN",file:"mspacman"},
        12:{title:"PIT FALL",file:"pitifal"},
        13:{title:"Q-BERT",file:"qbert"},
        14:{title:"RIVER RAID",file:"riverraid"},
        15:{title:"ROBOT TANK",file:"robotank"},
        16:{title:"SPACE INVADER",file:"spacei"},
    };     
    var romkey=Object.keys(roms).find(k=>roms[k].title===element.innerText);
    var rom=roms[romkey];        
    if(!rom){
        alert('invalid rom '+ element.innerText);
        return;
    }
    createCartridge(atari, {
        title: rom.title,
        topText: rom.title,
        image: HOMESITE + 'card/'+romkey+'.jpg',
        rom: rom.file+'.zip',
        x: 330,
        y: 70,
        z: 60,
        rx: -90
    });
    insertCart(1);
    currentCartridge.onClick(e => {
        removeCartridge();
        insertCart(0);
    })
}



//POWER
button1.onclick = () => {
    let cap = button1.querySelector('[data-cap="1"]');
    button1.on = !button1.on;
    if (button1.on) {
        cap.style.transform = 'translateY(20px)'; cap.style.filter = 'brightness(.75)';
        openTV();
        displayFocus();
        atariSwitch(1, 0);
    } else {
        cap.style.transform = 'translateY(0px)'; cap.style.filter = 'brightness(1)';
        closeTV();
        atariSwitch(1, 1);
    }
};

//COLOR
button2.onclick = () => {
    let cap = button2.querySelector('[data-cap="1"]');
    button2.on = !button2.on;
    if (button2.on) {
        cap.style.transform = 'translateY(20px)'; cap.style.filter = 'brightness(.75)';
        atariSwitch(2, 0);
    } else {
        cap.style.transform = 'translateY(0px)'; cap.style.filter = 'brightness(1)';
        atariSwitch(2, 1);
    }
};


//SELECT
button3.onclick = () => {
    pushButton(button3);
    atariSwitch(5, 1);
    setTimeout(() => {
        atariSwitch(5, 0);
    }, 500);
};

//RESET
button4.onclick = () => {
    pushButton(button4);
    atariSwitch(6, 1);
    setTimeout(() => {
        atariSwitch(6, 0);
    }, 500);
};

document.addEventListener('keyup', function (event) {
    event.preventDefault();
    if (typeof (CTRL) !== 'undefined') {
        switch (event.code) {
            case 'ArrowLeft': CTRL(jt.ConsoleControls.JOY0_LEFT, false); break;
            case 'ArrowRight': CTRL(jt.ConsoleControls.JOY0_RIGHT, false); break;
            case 'ArrowUp': CTRL(jt.ConsoleControls.JOY0_UP, false); break;
            case 'ArrowDown': CTRL(jt.ConsoleControls.JOY0_DOWN, false); break;
            case 'Space': CTRL(jt.ConsoleControls.JOY0_BUTTON, false); break;
        }
    }
});


document.addEventListener('keydown', function (event) {
    event.preventDefault();
    if (typeof (CTRL) !== 'undefined') {
        switch (event.code) {
            case 'ArrowLeft': CTRL(jt.ConsoleControls.JOY0_LEFT, true); break;
            case 'ArrowRight': CTRL(jt.ConsoleControls.JOY0_RIGHT, true); break;
            case 'ArrowUp': CTRL(jt.ConsoleControls.JOY0_UP, true); break;
            case 'ArrowDown': CTRL(jt.ConsoleControls.JOY0_DOWN, true); break;
            case 'Space': CTRL(jt.ConsoleControls.JOY0_BUTTON, true); break;
        }
    }
});


//SIDESCROLL
const items=[...document.querySelectorAll('.sideItem')];
var sideScroll=document.getElementById('sideScroll');
let scrollY=0,speed=0,inside=!1,mouseY=innerHeight*.5;
addEventListener('mousemove',e=>{mouseY=e.clientY;const r=sideScroll.getBoundingClientRect();
    inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom});
    items.forEach(el=>el.onclick=e=>CD(e.currentTarget));
    !function loop(){const h=innerHeight,itemH=Math.max(150,Math.min(h*.18,210)),spacing=itemH+18,totalH=spacing*items.length,center=h*.5,dead=h*.18,dist=mouseY-center;inside?Math.abs(dist)<dead?speed*=.85:(speed+=(dist>0?-1:1)*((Math.abs(dist)-dead)/(center-dead))*1.5,speed*=.92):speed*=.82,scrollY+=speed,items.forEach((el,i)=>{let y=i*spacing+scrollY;for(;y<-spacing;)y+=totalH;for(;y>totalH-spacing;)y-=totalH;const d=Math.abs(y+itemH*.5-center),scale=Math.max(.72,1-d/h);el.style.height=itemH+'px',el.style.transform=`translateY(${y}px) scale(${scale})`,el.style.opacity=scale}),
    requestAnimationFrame(loop)
}();
