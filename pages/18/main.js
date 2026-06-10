var hided = false;
let statusDiv = "";
const homesite = "https://didisoftwares.ddns.net";
const initialPlaylist = "dance";
const initialMusicID = 2;

let audioCtx = null;

const unlockOverlay = document.getElementById("audioUnlock");
const unlockBtn = document.getElementById("unlockBtn");

const player = document.getElementById('player');
const playlistDiv = document.getElementById('playlist');
let select = document.getElementById('playlistSelect');

let playlist = [];
let currentIndex = 0;
let currentPlaylist = "";
let firsttime = true;
let shader = null;

let playbackStartedAt = 0;
let audioReady = false;
let silenceStart = null;
let silenceThreshold = 0.01; // sensibilidade (0.005 mais sensível)
let silenceDelay = 3000; // 3 segundos de silêncio antes de pular
/* ========================= */
/* UNLOCK AUDIO */
/* ========================= */

function checkAudioUnlocked() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;

        if (!audioCtx) audioCtx = new AudioCtx();

        if (audioCtx.state === "running") {
            unlockOverlay.style.display = "none";
            startPlayer();
            return true;
        }

        unlockBtn.onclick = async () => {
            await audioCtx.resume();
            unlockOverlay.style.display = "none";
            startPlayer();
        };

        return false;
    } catch (e) {
        console.log("AudioContext não disponível", e);
        return false;
    }
}

checkAudioUnlocked();

/* ========================= */
/* START PLAYER */
/* ========================= */

function startPlayer() {
    fetch(homesite + '/gerar-mp3youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "PLAYLIST" })
    })
        .then(res => res.json())
        .then(files => {
            playlist = files;
            renderList();


            if (firsttime) {
                setTimeout(() => changePlaylist(initialPlaylist), 400);
            }
        });

    player.addEventListener("play", async () => {
        playbackStartedAt = Date.now();
        audioReady = false;
        // aguarda realmente começar a sair som
        setTimeout(() => {
            audioReady = true;
        }, 1200); // 🔥 tempo de "warmup"                    
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
        silenceStart = null;
        updateProgress();
        setupAudioAnalysis();
        setTimeout(() => {
            detectSilence();            
        }, 1000);
    });

    player.addEventListener("ended", nextTrack);


}

/* ========================= */
/* LOAD TRACK */
/* ========================= */

function loadTrack(index) {
    if (!playlist.length) return;


    currentIndex = index;

    const name = playlist[index].slice(0, -18).replaceAll("_", " ");
    document.getElementById("textPath").textContent = name;

    player.src = homesite + "/15/downloads/" + currentPlaylist + "/" + playlist[index];
    player.play().catch(() => { });

    highlight();
    updateMediaSession();


}

/* ========================= */
/* CONTROLES */
/* ========================= */

function fncPlay() {
    if (!playlist.length) return;


    if (player.src && player.paused) {
        player.play();
    } else {
        loadTrack(currentIndex || 0);
    }


}

function fncStop() {
    player.pause();
    player.currentTime = 0;
}

function fncNext() {
    nextTrack();
}

function nextTrack() {
    currentIndex++;
    if (currentIndex >= playlist.length) currentIndex = 0;
    loadTrack(currentIndex);
}

/* ========================= */
/* PLAYLIST */
/* ========================= */

function renderList() {
    select.innerHTML = "";
    playlist.forEach((p, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = p;
        select.appendChild(opt);
    });
}

function changePlaylist(id) {
    currentPlaylist = isNaN(id) ? id : select[id].text;


    fetch(homesite + '/gerar-mp3youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "LIST:" + currentPlaylist })
    })
        .then(res => res.json())
        .then(files => {
            playlist = files;
            renderPlaylist();

            if (firsttime) {
                firsttime = false;
                loadTrack(initialMusicID);
            } else {
                loadTrack(0);
            }
        });


}

function renderPlaylist() {
    playlistDiv.innerHTML = "";


    playlist.forEach((music, index) => {
        const div = document.createElement("div");
        div.className = "music-item";
        div.textContent = music.slice(0, -18).replaceAll("_", " ");
        div.onclick = () => loadTrack(index);
        playlistDiv.appendChild(div);
    });

    highlight();


}

function highlight() {
    const items = playlistDiv.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle("active", i === currentIndex);
    }
}

/* ========================= */
/* PROGRESSO CIRCULAR */
/* ========================= */

function updateProgress() {
    if (player.duration) {
        const progress = (player.currentTime / player.duration) * 100;
        const disc = document.querySelector(".center-disc");
        if (disc) {
            disc.style.setProperty("--progress", progress + "%");
        }
    }
    requestAnimationFrame(updateProgress);
}

/* ========================= */
/* AUDIO ANALYSIS (SEM BARS) */
/* ========================= */

let source,analyser, dataArray;

function setupAudioAnalysis() {
    if (source) return;
    //audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(player);

    shader.createAudioFFT(source, audioCtx, 0);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    animateEnergy();


}

let smoothEnergy = 0;

function animateEnergy() {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    let energy = 0;
    for (let i = 0; i < dataArray.length; i++) {
        energy += dataArray[i] / 255;
    }
    energy /= dataArray.length;

    // suavização (importantíssimo)
    smoothEnergy += (energy - smoothEnergy) * 0.15;

    document.documentElement.style.setProperty("--energy", smoothEnergy);
    document.documentElement.style.setProperty("--time", performance.now() * 0.01);



    requestAnimationFrame(animateEnergy);
}

/* ========================= */
/* DETECTAR SILÊNCIO */
/* ========================= */


function detectSilence() {
    if (!analyser) return;
    if (player.paused || player.ended) {
        requestAnimationFrame(detectSilence);
        return;
    }
    if (!audioReady) {
        requestAnimationFrame(detectSilence);
        return;
    }
    if (player.readyState < 3) {
        requestAnimationFrame(detectSilence);
        return;
    }
    if (Date.now() - playbackStartedAt < 1500) {
        requestAnimationFrame(detectSilence);
        return;
    }
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        let val = (dataArray[i] - 128) / 128;
        sum += val * val;
    }
    let rms = Math.sqrt(sum / dataArray.length);
    if (rms < silenceThreshold) {
        if (!playBtn.classList.contains('btn-active')) {
            silenceStart = null;
            return;
        }
        if (!silenceStart) silenceStart = Date.now();
        if (Date.now() - silenceStart > silenceDelay) {
            console.log("Silêncio detectado → Próxima");
            silenceStart = null;
            nextTrack();
            return;
        }
    } else {
        silenceStart = null;
    }
    requestAnimationFrame(detectSilence);
}

/* ========================= */
/* MEDIA SESSION */
/* ========================= */

function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;


    const name = playlist[currentIndex]
        ? playlist[currentIndex].slice(0, -18)
        : "Sem música";

    navigator.mediaSession.metadata = new MediaMetadata({
        title: name,
        artist: currentPlaylist || "Playlist",
    });


}

/* ========================= */
/* CANVAS (SHADER BASE) */
/* ========================= */

const canvas = document.getElementById("circularFX");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* LOOP (placeholder até você plugar GLSL) */
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //const e = window.__energy || 0;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,100,155,0.01)`;
    ctx.lineWidth = 0;
    ctx.stroke();
    requestAnimationFrame(render);
}

const fragmentCode = `
//Main    
    const float FREQ_RANGE = 64.0;
    const float PI = 3.1415;
    const float RADIUS = 0.6;
    const float BRIGHTNESS = 0.4;
    const float SPEED = 0.2;

    float getfrequencyAudio(float x) {
        float maxFreq = 0.66;
        float uv = x * maxFreq;        
        return getfrequency(uv,iAudio0);
    }

    //convert HSV to RGB
    vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    float luma(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
    }

    float getfrequency_smooth(float x) {
        float index = floor(x * FREQ_RANGE) / FREQ_RANGE;
        float next = floor(x * FREQ_RANGE + 1.0) / FREQ_RANGE;
        return mix(getfrequencyAudio(index), getfrequencyAudio(next), smoothstep(0.0, 1.0, fract(x * FREQ_RANGE)));
    }

    float getfrequency_blend(float x) {
        return mix(getfrequencyAudio(x), getfrequency_smooth(x), 0.5);
    }

    vec3 doHalo(vec2 fragment, float radius) {
        float dist = length(fragment);
        float ring = 1.0 / (abs(dist - radius) + 0.005);    
        float b = dist < radius ? BRIGHTNESS * 0.6 : BRIGHTNESS;        
        vec3 col = vec3(0.0);        
        float angle = atan(fragment.x, fragment.y);        
        float hue = fract((angle / (2.0 * -PI)) + iTime * 0.2);
        col += hsv2rgb(vec3(hue, 0.6, 0.5)) * ring * b;        
        float frequency = max(getfrequencyAudio(abs(angle / PI)) - 0.02, 0.0);
        col *= frequency * 0.5;        
        col *= smoothstep(radius * 0.86, radius, dist);        
        float d = max(dist - radius, 0.0);
        float falloff = exp(-d * 2.0) * (1.0 / (1.0 + d * 3.0)); // queda suave (principal)        
        col *= falloff;// aplica no brilho    
        return col;
    }

    vec3 doLine(vec2 fragment, float radius, float x) {
        vec3 col = hsv2rgb(vec3(x * 0.23 + iTime * 0.12, 1.0, 1.0));        
        float freq = abs(fragment.x * 0.5);        
        col *= (1.0 / abs(fragment.y)) * BRIGHTNESS * getfrequencyAudio(freq);	
        col = col * smoothstep(radius, radius * 1.8, abs(fragment.x));        
        return col;
    }

    float getBass() {
        float sum = 0.0;
        sum += getfrequencyAudio(0.02);
        sum += getfrequencyAudio(0.04);
        sum += getfrequencyAudio(0.06);
        sum += getfrequencyAudio(0.08);
        return sum * 0.25; // média
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 fragPos = fragCoord / iResolution.xy;
        fragPos = (fragPos - 0.5) * 2.0;
        fragPos.x *= iResolution.x / iResolution.y;        
        vec3 color = vec3(0.0); //sem fundo
        float pulse = pow(getBass(), 2.0);
        float dynamicRadius = RADIUS + pulse * 0.1;
        color += doHalo(fragPos, dynamicRadius);
        float c = cos(iTime * SPEED);
        float s = sin(iTime * SPEED);
        vec2 rot = mat2(c,s,-s,c) * fragPos;
        color += max(luma(color) - 1.0, 0.0);    
        float alpha = clamp(luma(color) * 2.0, 0.0, 1.0);
        fragColor = vec4(color, alpha);
    }`;

render();

window.startShader = (myshader) => {
    shader = myshader;
    //return;
    shader.setResolution(200,200);
    shader.Shader(
        'paa',
        `attribute vec2 position;\nvoid main() {\ngl_Position = vec4(position, 0, 1);\n}`,
        fragmentCode, { frameSkip: 0, alpha: true, glyph: false });

}
