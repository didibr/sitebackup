var hided = false;
let statusDiv = "";
const homesite = "https://didisoftwares.ddns.net";
const initialPlaylist = "dance";
const initialMusicID = 7; //i was made for lovin you
var firsttime=true;
var playerStarted=false;
var dlaudio="";


//DETECT SILENCE
let audioContext;
let analyser;
let analizerEmpt=true;
let dataArray;
let silenceStart = null;
let silenceThreshold = 0.01; // sensibilidade (0.005 mais sensível)
let silenceDelay = 3000; // 3 segundos de silêncio antes de pular

//PLAYER FUNCTIONS
let playlists = [];   // names of playlists (folders)
let tracks = [];      // musics inside playlist
let progressrunning=false;
let currentIndex = 0;
let currentPlaylist = "";
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const nextBtn = document.getElementById("nextBtn");
const player = document.getElementById('player');
const addtopl= document.getElementById("addBtn");
player.crossOrigin = "anonymous";
const playlistDiv = document.getElementById('playlist');
let select = document.getElementById('playlistSelect');
let promptTxt = "PLAYLIST";
let playbackStartedAt = 0;
let audioReady = false;

const unlockOverlay = document.getElementById("audioUnlock");
const unlockBtn = document.getElementById("unlockBtn");

function detectCompactMode() {
    //const isIframe = window.self !== window.top;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    // 🔥 DETECÇÃO REAL
    const isFlat = height < 500; // aqui está o segredo    
    if (isFlat) {
        document.body.classList.add("compact-mode");
        if (height < 350) {
            document.body.classList.add("ultra-compact");
        } else {
            document.body.classList.remove("ultra-compact");
        }
    } else {
        document.body.classList.remove("compact-mode");
        document.body.classList.remove("ultra-compact");
    }
    
}
window.addEventListener("load", () => {detectCompactMode});
window.addEventListener("resize", () => {detectCompactMode();});


function setupAudioAnalysis() {
    if (!analizerEmpt) return;
    analizerEmpt=false;
    //audioContext = new(window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(player);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    dataArray = new Uint8Array(analyser.fftSize);
    drawVisualizer();
}

function checkAudioUnlocked() {
    try {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
        /*if (!audioContext) {
            audioContext = new(window.AudioContext || window.webkitAudioContext)();
        }*/
        if (audioContext.state === "running") {
            audioUnlocked = true;
            unlockOverlay.style.display = "none";
            if(!playerStarted){ startPlayer(); playerStarted=true; }
            //setupAudioAnalysis();
            return true;
        }
        unlockBtn.onclick = () => {
            audioUnlocked = true;
            unlockOverlay.style.display = "none";
            if(!playerStarted){ startPlayer(); playerStarted=true; }
        }
        return false;
    } catch (e) {
        console.log("AudioContext não disponível",e);
        return false;
    }
}

(() => {
    if (location.hash === "#iframe") {
        hided = true;
        const hide = () => document.querySelectorAll('.hideoniframe').forEach(el => el.style.setProperty('display', 'none', 'important'));
        document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", hide) : hide();
        document.onload=()=>{
            setTimeout(()=>{
                detectCompactMode();
                checkAudioUnlocked();                
            }, 500);
        }
    }else{
        setTimeout(()=>{            
            detectCompactMode();
            checkAudioUnlocked(); 
        }, 500);
    }
})();


function enviarPrompt() {
    const promptPL = document.getElementById('promptText').value.trim();
    statusDiv = document.getElementById('status');
    const button = document.getElementById('gerarBtn');
    const inputContainer = document.getElementById('inputContainer');
    const textarea = document.getElementById('promptText');
    const aboutdiv = document.getElementById('aboutdiv');
    popup.classList.add("hidden");
    if (!promptPL) {
        statusDiv.textContent = "Empty String.";
        return;
    }
    button.disabled = true;
    textarea.disabled = true;
    statusDiv.classList.add("loading");
    statusDiv.classList.add("status-pill");
    statusDiv.textContent = "Processing";
    fetch(homesite + '/gerar-mp3youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt:promptPL
        })
    }).then(res => res.json()).then(data => {
        statusDiv.classList.remove("status-pill");
        statusDiv.classList.remove("loading");
        const status = data.status || "";
        button.disabled = false;
        textarea.disabled = false;
        aboutdiv.style.display = "none";
        if (status.includes("#")) {
            const parts = status.split("#");
            const audioFile = parts[0];
            fncStop();
            // cria o player de áudio
            player.pause();
            player.src = homesite + "/15/downloads/" + audioFile;
            player.load();
            player.play().catch(() => {});
            //syncVisualizer(player);
            updateMediaSession();
            statusDiv.textContent = "";
            // botão de download
            addtopl.style.display="block";   
            dlaudio=audioFile.slice(0, -4); //remove .mp3           
            setTimeout(() => {
                addtopl.style.display="none";
            }, 30000);
            // limpa e insere
            inputContainer.innerHTML = "";
            inputContainer.appendChild(audio);
            inputContainer.appendChild(downloadBtn);
            //remove nome[blablabla].mp3
            //statusDiv.textContent = audioFile.slice(0, -4); //remove .mp3      
        } else {
            statusDiv.classList.remove("status-pill");
            statusDiv.classList.remove("loading");
            statusDiv.textContent = status;
        }
    }).catch(err => {
        statusDiv.classList.remove("status-pill");
        statusDiv.classList.remove("loading");
        if (err instanceof ReferenceError) {
            return;
        }
        button.disabled = false;
        statusDiv.textContent = "Error on Processing." + err;
    });
}


function startPlayer() {
    //if (hided == false) {
        fetch(homesite + '/gerar-mp3youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt:promptTxt
            })
        }).then(res => res.json()).then(files => {
            playlists = files;
            
            renderList();
            
            if (firsttime == true) {
                setTimeout(() => {
                    changePlaylist(initialPlaylist);
                }, 500);
            }
        });
        //player.addEventListener("play", () => {
        //  setPlayingUI(true);
        //});
        player.addEventListener("play", async () => {
            playbackStartedAt = Date.now();
            audioReady = false;
            // aguarda realmente começar a sair som
            setTimeout(() => {
                audioReady = true;
            }, 1200); // 🔥 tempo de "warmup"
            setPlayingUI(true);
            setupAudioAnalysis();
            updateProgressBar();
            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }
            silenceStart = null;
            setTimeout(() => {
                detectSilence();
            }, 1000);
        });
        player.addEventListener("pause", () => {
            if (!player.ended) setPlayingUI(false);
        });
        player.addEventListener("ended", () => {
            nextTrack();
        });
        //player.addEventListener("play", startWatcher);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden && !player.paused) {
                updateMediaSession();
            }
        });
    //}
}
// MEDIA SESSION SETUP
function updateMediaSession() {
    //if (('wakeLock' in navigator)) {
    //  navigator.wakeLock.request('screen');
    // }
    if (!('mediaSession' in navigator)) return;
    const musicName = tracks[currentIndex] ? tracks[currentIndex].slice(0, -18) : "Sem música";
    navigator.mediaSession.metadata = new MediaMetadata({
        title: musicName,
        artist: currentPlaylist || "Minha Playlist",
        album: "Player Web",
        artwork: [{
            src: homesite + "/15/album.jpg", // coloque uma imagem sua
            sizes: "512x512",
            type: "image/jpeg"
        }]
    });
    navigator.mediaSession.setActionHandler('play', () => {
        if(!progressrunning){updateProgressBar(); progressrunning=true;}
        player.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        player.pause();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (currentIndex > 0) {
            loadTrack(currentIndex - 1);
        }
    });
}

function setPlayingUI(isPlaying) {
    if (isPlaying) {
        playBtn.classList.add("btn-active");
    } else {
        playBtn.classList.remove("btn-active");
    }
}

function renderList() {
    select.innerHTML = "";

    playlists.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = name;
        select.appendChild(option);
    });
}

function changePlaylist(id) {
    // se vier número (índice)    
    if (!isNaN(id)) {
        currentPlaylist = select[id]?.text || "";
    }
    // se vier string (nome direto)
    else {
        currentPlaylist = id;
    }
    if (!currentPlaylist) return;
    select.onchange = () => {};
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text === currentPlaylist) {
            select.selectedIndex = i;
            break;
        }
    }
    select.onchange = () => {
        changePlaylist(select.value);
    }
    //console.log("Selected", currentPlaylist);
    promptTxt = "LIST:" + currentPlaylist;
    fetch(homesite + '/gerar-mp3youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt:promptTxt
        })
    }).then(res => res.json()).then(files => {
        tracks = files;
        renderPlaylist(); 
        if (firsttime == true) {
           //loadTrack(initialMusicID);
           createRender(document.getElementById('pContainer'));
        }
        firsttime=false;      
    });
}

function loadTrack(index) {    
    if (playlists.length <= 0) return;
    if(typeof(index)==='undefined')index=initialMusicID;
    currentIndex = index;
    const music = tracks[currentIndex];
    player.src = homesite + "/15/downloads/" + currentPlaylist + "/" + music;
    player.play().catch(err => console.log("Play bloqueado:", err));
    updateMediaSession(); // 👈 ADICIONE AQUI
    highlight();
}
globalThis.loadTrackPlayer=loadTrack;

function nextTrack() {
    currentIndex++;
    if (currentIndex >= tracks.length) {
        currentIndex = 0;
    }
    loadTrack(currentIndex);
}

function renderPlaylist() {
    playlistDiv.innerHTML = "";
    tracks.forEach((music, index) => {
        const container = document.createElement('div');
        container.className = "music-item";
        // Nome da música
        const title = document.createElement('span');
        title.textContent = music.slice(0, -18).replaceAll("_", " "); //remove .mp3
        title.className = "music-title";
        title.onclick = () => loadTrack(index);
        // Botão X
        const removeBtn = document.createElement('span');
        removeBtn.textContent = "✖";
        removeBtn.className = "remove-btn";
        removeBtn.onclick = (e) => {
            e.stopPropagation(); // impede de tocar a música
            removeTrack(index);
        };        
        container.appendChild(removeBtn);
        container.appendChild(title);
        playlistDiv.appendChild(container);
    });
    highlight();
}

function removeTrack(index) {
    const musicName = tracks[index];
    const confirmar = confirm(`Deseja remover a música?\n\n${musicName.slice(0, -18)}`);
    if (!confirmar) return; // usuário clicou em Cancelar
    const removedWasPlaying = index === currentIndex;
    // remove do backend
    removeToPlaylist(musicName);
    // remove da array
    tracks.splice(index, 1);
    // Ajustar índice atual
    if (tracks.length === 0) {
        player.pause();
        player.src = "";
        currentIndex = 0;
    } else {
        if (removedWasPlaying) {
            if (currentIndex >= tracks.length) {
                currentIndex = 0;
            }
            loadTrack(currentIndex);
        } else if (index < currentIndex) {
            currentIndex--;
        }
    }
    renderPlaylist();
}

function highlight() {
    const items = playlistDiv.querySelectorAll('div');
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });
}

function addToPlaylist() {
    //statusDiv
    if (statusDiv == "" || currentPlaylist == "") return;
    if (tracks.includes(dlaudio + ".mp3")) {
        alert("Alread Exists");
        return;
    }
    let passw=prompt("Password","13");
    promptTxt = "ADD:" + passw + ":" + currentPlaylist + ":" + dlaudio;
    console.log(promptTxt);
    fetch('/gerar-mp3youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt:promptTxt
        })
    }).then(res => res.json()).then(files => {
        if (files.ok) {
            tracks.push(files.ok);
        }
        if (files.error) {
            alert(files.error);
        }
    });
}

function removeToPlaylist(music) {
    let passw=prompt("Password","13");
    promptTxt = "DEL:" + passw + ":" + currentPlaylist + ":" + music;
    //console.log(prompt);
    fetch('/gerar-mp3youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt:promptTxt
        })
    })
}

function fncPlay() {
    if (!tracks || tracks.length === 0) return;
    // se já tem src, só dar play
    if (player.src && !player.paused) {
        return;
    }
    // se pausado
    if (player.src && player.paused) {
        player.play().catch(err => console.log("Autoplay bloqueado:", err));
        return;
    }
    loadTrack(currentIndex || 0);
}

function fncStop() {
    player.pause();
    player.currentTime = 0;
}

function fncNext() {
    if (!tracks || tracks.length === 0) return;
    nextTrack();
}






function updateProgressBar() {
    if (!player || !player.duration || isNaN(player.duration)) {
        requestAnimationFrame(updateProgressBar);
        return;
    }

    const progress = (player.currentTime / player.duration) * 100;

    const wrapper = document.querySelector(".select-wrapper");

    if (wrapper) {
        wrapper.style.setProperty("--progress", progress + "%");

        // 🔥 use your visual energy if available
        const hue = window.__energySmooth
            ? 200 + window.__energySmooth * 140
            : 200;

        wrapper.style.setProperty("--hue", hue);
    }

    requestAnimationFrame(updateProgressBar);
}

function drawVisualizer() {
    if (!analyser) return;
    let bufferLength = analyser.frequencyBinCount;
    let data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);
    globalThis.__fftData = data;
    /* ========================= */
    /* ENERGIA DO AUDIO → UI */
    /* ========================= */
    let energy = 0;
    let bass = 0;
    let bassLimit = Math.floor(bufferLength * 0.08);
    for (let i = 0; i < bufferLength; i++) {
        let v = data[i] / 255;
        energy += v;
        if (i < bassLimit) bass += v;
    }
    energy /= bufferLength;
    bass /= bassLimit;
    window.__bassEnergy = bass;
    globalThis.__bassEnergy = bass;
    /* mistura grave + geral */
    let finalEnergy = bass * 0.7 + energy * 0.3;
    /* suavização (MUITO IMPORTANTE) */
    if (!window.__energySmooth) window.__energySmooth = 0;
    window.__energySmooth = window.__energySmooth * 0.85 + finalEnergy * 0.15;  
    globalThis.__energySmooth = window.__energySmooth;
    /* valores finais */
    const e = window.__energySmooth;
    const hue = 200 + e * 140;
    /* aplica no player */
    let speed = 2 + e * 8; // varia com energia
    document.querySelectorAll(".glass3d, .controls-bar button").forEach(el => {
        el.style.setProperty("--energy", e.toFixed(3));
        el.style.setProperty("--hue", hue.toFixed(0));
        el.style.animationDuration = (4 / speed) + "s";
    });
  
    
    requestAnimationFrame(drawVisualizer);
}



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