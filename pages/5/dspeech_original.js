window.dspeech = (function () {
    let siteName= "didisoftwares.ddns.net";
    let ws = null;
    let alreadyConnected=0;
    let clossing=false;
    const AudioManager = (function () {
        let audio = null;        
      
        function cleanup() {
          if (audio) {
            audio.pause();
            audio.remove();
            audio = null;
          }
        }
      
        function create(src) {
          cleanup(); // Garante que não haja instâncias antigas
      
          audio = new Audio(src);
          audio.controls = false;
          audio.style.display = 'none';
          audio.preload = 'auto';
      
          // Adiciona ao DOM
          document.body.appendChild(audio);
      
          // Remove automaticamente ao finalizar a reprodução
          audio.onended = () => {
            cleanup();
          };
      
          return {
            play: () => audio?.play(),
            pause: () => audio?.pause(),
            stop: () => {
              if (audio) {
                audio.pause();
                audio.currentTime = 0;
                cleanup();
              }
            },
            setVolume: (v) => {
              if (audio) audio.volume = Math.max(0, Math.min(1, v));
            },
            isPlaying: () => !!audio && !audio.paused,
            getElement: () => audio
          };
        }
      
        return { create };
      })();
      
    var API = function () {
        let processing=0;        
        async function say(frase,lang,type,rate,pitch,volume){
            if (typeof(type) == "undefined" || (type != 0 && type != 1)) {
                type = 0;  // Ajusta o tipo para 0 se for indefinido ou inválido
            }            
            if (typeof(rate) == "undefined" || rate < -10 || rate > 10) {
                rate = 0;  // Ajusta rate para 0 se for indefinido ou fora do intervalo [-10, 10]
            }            
            if (typeof(pitch) == "undefined" || pitch < -10 || pitch > 10) {
                pitch = 0;  // Ajusta rate para 0 se for indefinido ou fora do intervalo [-10, 10]
            }            
            if (typeof(volume) == "undefined" || volume < 0 || volume > 100) {
                volume = 100;  // Ajusta volume para 100 se for indefinido ou fora do intervalo [0, 100]
            }            
            if(processing!=0){
                console.warn('Processing previous request');
                return;
            }
            processing=1;
            const data = { speech: frase, lang:lang, type:type,rate:rate,pitch:pitch,volume:volume };  
            if (!ws && alreadyConnected == 0) {
                alreadyConnected = 1;
                connectWebSocket(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ KEY: "PROJ05#SPEECH", DATA: data }));
                    }
                });
            }
            
        }

        function connectWebSocket(onReady) {
            ws = new WebSocket("wss://" + siteName, siteName);
        
            ws.onopen = () => {                
                alreadyConnected = 2;
                //ws.send(JSON.stringify({ KEY: "PROJ05#CONNECTED", DATA: {} }));
                if (typeof onReady === 'function') onReady();
            };
        
            ws.onmessage = event => {                
                if (clossing) return;
                try {                    
                    const msg = JSON.parse(event.data);
                    if (msg.CMD === "AUDIO_READY") {
                        const audioUrl = `https://${siteName}/5/audio/${msg.URL}`;
                        const player = AudioManager.create(audioUrl);
                        XAPI.player = player;
                        player.play();
                        processing = 0;
                        ws.close();
                    }
                    if (msg.CMD === "ERROR") {
                        console.warn(msg.MSG);
                    }
                } catch (e) {
                    console.warn("Mensagem inválida:", event.data, e);
                }
            };
        
            ws.onclose = () => {
                processing = 0;
                alreadyConnected = 0;
                ws = null;
            };
        
            ws.onerror = err => {
                processing = 0;
                alreadyConnected = 0;
                ws = null;
            };
        }
        
        async function pause(){  
            if(typeof(this.player)=="undefined" || this.player==null)return;
            this.player.pause();          
        }
        async function stop(){ 
            if(typeof(this.player)=="undefined" || this.player==null)return;
            this.player.stop();           
        }
        async function play(){    
            if(typeof(this.player)=="undefined" || this.player==null)return;
            this.player.play();        
        }
        const api = {
            say,
            pause,
            stop,
            play
        };
        return api;
    }
    let XAPI = null;
    const APIRET = {
        say: (frase, lang,type,rate,pitch,volume)=>{
            let ready = false;
            let queue = [];        
            const runQueue = () => {
                queue.forEach(fn => fn());
                queue = [];
            };        
            (async () => {
                if (XAPI == null) {
                    XAPI = new API();
                }                                
                await XAPI.say(frase,lang,type,rate,pitch,volume);
                //await waitUntilFinishedReady();
                ready = true;
                runQueue();
            })();
        
            const proxy = {
                start: () => {
                    if (!ready) {
                        queue.push(() => XAPI.start());
                    } else {
                        XAPI.start();
                    }
                },
                stop: () => {
                    if (!ready) {
                        queue.push(() => XAPI.stop());
                    } else {
                        XAPI.stop();
                    }
                },
                play: () => {
                    if (!ready) {
                        queue.push(() => XAPI.play());
                    } else {
                        XAPI.play();
                    }
                }
            };
        
            return proxy;
        },
        pause: async () => {            
            if (XAPI != null) { await XAPI.pause(); }
            return XAPI;
        },
        stop: async () => {
            if (XAPI != null) { await XAPI.stop(); }
            return XAPI;
        },       
        play: async () => {
            if (XAPI != null) { await XAPI.play(); }
            return XAPI;
        }
    }

    return APIRET;
})();