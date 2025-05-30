window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

window.dcommand = (function () {
    var API = function () {
        context = null;// web audio context    
        audio = null;// audio data
        audio0 = null;
        instance = null;
        model_whisper = null;
        Module = typeof Module != "undefined" ? Module : {};
        // fetch models
        dbVersion = 1;
        dbName = 'whisper';
        indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        // microphone
        kSampleRate = 16000;
        kRestartRecording_s = 120;
        kIntervalAudio_ms = 250; // pass the recorded audio to the C++ instance at this rate
        mediaRecorder = null;
        doRecording = false;
        startTime = 0;
        // main
        nLines = 0;
        intervalUpdate = null;
        transcribedAll = '';
        finishedReady = false;

        function onCOMMAND(text, percent) {
            console.log('CMD', text, percent);
        }

        function onSTATUS(text) {
            console.log('ST', text);
        }
        //COMMAND.applyMdule(Module);


        function printTextarea(text) {
            //return function (text) {
                if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                if (text.startsWith("js: audio recorded, size:")) return;
                if (text.trim() === "js: Initialized successfully!") { finishedReady = true; }
                //if(typeof(COMMAND.onSTATUS)=='function')COMMAND.onStart(text);
                if (onSTATUS && typeof (onSTATUS) == 'function') onSTATUS(text);
            //};
        }

        function applyMdule(mymodule) {
            Module = mymodule;
            mymodule.print = printTextarea;
            mymodule.printErr = printTextarea;

            mymodule.setStatus = (text) => {
                mymodule.print('js: ' + text);
            };

            mymodule.monitorRunDependencies = (left) => { };

            mymodule.preRun = () => {
                mymodule.print('js: Preparing ...');
            };

            mymodule.postRun = () => {
                mymodule.print('js: Initialized successfully!');
            };

            window.err = printTextarea;
            //window._comandUpdate = this;

            requestAnimationFrame(update); // também precisa bindar aqui
        }


        function update() {
            if (typeof Module.cmd_detected == 'function') {
                var cmd = Module.cmd_detected();
                if (cmd && cmd.trim().length > 1) {
                    cmd = cmd.split(":");
                    if (cmd.length == 3 && typeof onCOMMAND == 'function') {
                        onCOMMAND(cmd[1], parseFloat(cmd[2]));
                    }
                }
            }
            requestAnimationFrame(update);
        }


        function changeLang(lang) {
            Module.set_language(lang);
        }

        function addcommand(valcmd) {
            Module.cmd_add(valcmd);
        }


        function storeFS(fname, buf, cbPrint) {
            // write to WASM file using FS_createDataFile
            // if the file exists, delete it
            try {
                Module.FS_unlink(fname);
            } catch (e) {
                // ignore
            }

            Module.FS_createDataFile("/", fname, buf, true, true);

            cbPrint('storeFS: stored model: ' + fname + ' size: ' + buf.length);

            //document.getElementById('model-whisper-status').innerHTML = 'loaded "' + model_whisper + '"!';

            if (model_whisper != null) {
                //document.getElementById('start').disabled = false;
                //document.getElementById('stop' ).disabled = true;
            }
        }

        

        function onCancel() {
        }

        function onProgress(p) {
            //let el = document.getElementById('fetch-whisper-progress');
            console.log( Math.round(100*p) + '%');
        }


        function stopRecording() {
            Module.set_status("paused");
            doRecording = false;
            audio0 = null;
            audio = null;
            context = null;
        }

        async function startRecording() {
            if (!context) {
                context = new AudioContext({
                    sampleRate: API.kSampleRate,
                    channelCount: 1,
                    echoCancellation: false,
                    autoGainControl: true,
                    noiseSuppression: true,
                });
            }
            Module.set_status("");
            //document.getElementById('start').disabled = true;
            //document.getElementById('stop').disabled = false;
            doRecording = true;
            startTime = Date.now();

            var chunks = [];
            var stream = null;
            var ignorenext = false;

            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then(function (s) {
                    stream = s;
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = function (e) {
                        chunks.push(e.data);
                        var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                        var reader = new FileReader();
                        reader.onload = async function (event) {
                            var buf = new Uint8Array(reader.result);

                            if (!context) {
                                return;
                            }
                            await context.decodeAudioData(buf.buffer, function (audioBuffer) {
                                var offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
                                var source = offlineContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(offlineContext.destination);
                                source.start(0);

                                offlineContext.startRendering().then(function (renderedBuffer) {
                                    audio = renderedBuffer.getChannelData(0);
                                    printTextarea('js: audio recorded, size: ' + audio.length + ', old size: ' + (audio0 == null ? 0 : audio0.length));
                                    if (audio.length < 1000000) {

                                        var audioAll = new Float32Array(audio0 == null ? audio.length : audio0.length + audio.length);
                                        if (audio0 != null) {
                                            audioAll.set(audio0, 0);
                                        }
                                        audioAll.set(audio,audio0 == null ? 0 : audio0.length);

                                        if (instance) {
                                            Module.set_audio(instance, audioAll);
                                        }
                                    } else {
                                        ignorenext = true;
                                    }
                                });
                            }, function (e) {
                                audio = null;
                            });
                        }
                        if (ignorenext == true) {
                            mediaRecorder.stop();
                            reader.abort();
                        } else {
                            reader.readAsArrayBuffer(blob);
                        }
                    };

                    mediaRecorder.onstop = function (e) {
                        if (doRecording) {
                            setTimeout(function () {
                                startRecording();
                            });
                        }
                    };

                    mediaRecorder.start(kIntervalAudio_ms);
                })
                .catch(function (err) {
                    printTextarea('js: error getting audio stream: ' + err);
                });

            var interval = setInterval(function () {
                if (!doRecording) {
                    clearInterval(interval);
                    if (mediaRecorder != null) mediaRecorder.stop();
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    //document.getElementById('start').disabled = false;
                    //document.getElementById('stop').disabled  = true;
                    mediaRecorder = null;
                }

                // if audio length is more than kRestartRecording_s seconds, restart recording
                if (audio != null && audio.length > kSampleRate * kRestartRecording_s) {
                    if (doRecording) {
                        //printTextarea('js: restarting recording');

                        clearInterval(interval);
                        audio0 = audio;
                        audio = null;
                        mediaRecorder.stop();
                        stream.getTracks().forEach(function (track) {
                            track.stop();
                        });
                    }
                }
            }, 100);
        }



        function onStart() {
            if (!instance) {
                instance = Module.init('whisper.bin');

                if (instance) {
                    printTextarea("js: whisper initialized, instance: " + instance);
                }
            }

            if (!instance) {
                printTextarea("js: failed to initialize whisper");
                return;
            }

            startRecording();
            var transcribedAll = transcribedAll;
            var nLines = nLines;
            var module = Module;
            intervalUpdate = setInterval(function () {
                var transcribed = module.get_transcribed();

                if (transcribed != null && transcribed.length > 1) {
                    transcribedAll += transcribed + '<br>';
                    nLines++;

                    // if more than 10 lines, remove the first line
                    if (nLines > 10) {
                        var i = transcribedAll.indexOf('<br>');
                        if (i > 0) {
                            transcribedAll = transcribedAll.substring(i + 4);
                            nLines--;
                        }
                    }
                }

                //document.getElementById('state-status').innerHTML = Module.get_status();
                //document.getElementById('state-transcribed').innerHTML = transcribedAll;
                if (typeof (transcribedAll) != 'undefined' && transcribedAll && transcribedAll.length && transcribedAll.trim().length > 1)
                    console.log(transcribedAll);
            }, 100);
        }

        function stop() {
            stopRecording();
        }
        //################################# HELPERS ###$$$$$$$$$$$$$$$$$$

        function convertTypedArray(src, type) {
            var buffer = new ArrayBuffer(src.byteLength);
            var baseView = new src.constructor(buffer).set(src);
            return new type(buffer);
        }



        async function clearCache() {
            //if (confirm('Are you sure you want to clear the cache?\nAll the models will be downloaded again.')) {
            await indexedDB.deleteDatabase(dbName);
            //location.reload();
            //}
        }


        function loadWhisper(model) {
            var urls = {
                'tiny.en': 'tinyen.glb',
                'tiny': 'tiny.glb',
                'medium': 'medium.glb',
                'tiny-en-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin',
                'base-en-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin',
            };

            var sizes = {
                'tiny.en': 75,
                'tiny': 75,
                'medium': 144,
                'base.en': 142,
                'tiny-en-q5_1': 31,
                'base-en-q5_1': 57,
            };

            var url = urls[model];
            var dst = 'whisper.bin';
            var size_mb = sizes[model];

            model_whisper = model;

            /*document.getElementById('fetch-whisper-tiny-en').style.display = 'none';
            document.getElementById('fetch-whisper-base-en').style.display = 'none';
    
            document.getElementById('fetch-whisper-tiny-en-q5_1').style.display = 'none';
            document.getElementById('fetch-whisper-base-en-q5_1').style.display = 'none';
    
            document.getElementById('model-whisper-status').innerHTML = 'loading "' + model + '" ... ';
            */


            loadRemote(url, dst, size_mb, onProgress, storeFS, onCancel, printTextarea);
        }
        // fetch a remote file from remote URL using the Fetch API
        async function fetchRemote(url, cbProgress, cbPrint) {
            try {
                cbPrint('fetchRemote: downloading with fetch()...');
        
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/octet-stream' },
                });
        
                if (!response.ok) {
                    cbPrint('fetchRemote: failed to fetch ' + url + ' - status: ' + response.status);
                    return null;
                }
        
                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : null;
                const reader = response.body.getReader();
        
                let receivedLength = 0;
                const chunks = [];
        
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
        
                    chunks.push(value);
                    receivedLength += value.length;
        
                    if (cbProgress && total) {
                        cbProgress(receivedLength / total);
                    } else if (cbProgress) {
                        // Progresso aproximado sem content-length (por blocos lidos)
                        cbProgress(null); // ou use alguma heurística, se quiser
                    }
                }
        
                let chunksAll = new Uint8Array(receivedLength);
                let position = 0;
                for (let chunk of chunks) {
                    chunksAll.set(chunk, position);
                    position += chunk.length;
                }
        
                cbPrint('fetchRemote: downloaded ' + receivedLength + ' bytes');
                return chunksAll;
            } catch (e) {
                cbPrint('fetchRemote: error: ' + e.message);
                return null;
            }
        }
        
        
        

        function loadRemote(url, dst, size_mb, cbProgress, cbReady, cbCancel, cbPrint) {
            if (!navigator.storage || !navigator.storage.estimate) {
                cbPrint('loadRemote: navigator.storage.estimate() is not supported');
            } else {
                // query the storage quota and print it
                navigator.storage.estimate().then(function (estimate) {
                    cbPrint('loadRemote: storage quota: ' + estimate.quota + ' bytes');
                    cbPrint('loadRemote: storage usage: ' + estimate.usage + ' bytes');
                });
            }

            // check if the data is already in the IndexedDB
            var rq = indexedDB.open(dbName, dbVersion);
            //var fetchRemote = fetchRemote;
            //var indexedDB = indexedDB;
            //var dbName = dbName;
            //var dbVersion = dbVersion;

            rq.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (db.version == 1) {
                    var os = db.createObjectStore('models', { autoIncrement: false });
                    cbPrint('loadRemote: created IndexedDB ' + db.name + ' version ' + db.version);
                } else {
                    // clear the database
                    var os = event.currentTarget.transaction.objectStore('models');
                    os.clear();
                    cbPrint('loadRemote: cleared IndexedDB ' + db.name + ' version ' + db.version);
                }
            };

            rq.onsuccess = function (event) {
                var db = event.target.result;
                var tx = db.transaction(['models'], 'readonly');
                var os = tx.objectStore('models');
                var rq = os.get(url);

                rq.onsuccess = function (event) {
                    if (rq.result) {
                        cbPrint('loadRemote: "' + url + '" is already in the IndexedDB');
                        cbReady(dst, rq.result, cbPrint);
                    } else {
                        // data is not in the IndexedDB
                        cbPrint('loadRemote: "' + url + '" is not in the IndexedDB');

                        // alert and ask the user to confirm
                        /*if (!confirm(
                            'You are about to download ' + size_mb + ' MB of data.\n' +
                            'The model data will be cached in the browser for future use.\n\n' +
                            'Press OK to continue.')) {
                            cbCancel();
                            return;
                        }*/

                        fetchRemote(url, cbProgress, cbPrint).then(function (data) {
                            if (data) {
                                // store the data in the IndexedDB
                                var rq = indexedDB.open(dbName, dbVersion);
                                rq.onsuccess = function (event) {
                                    var db = event.target.result;
                                    var tx = db.transaction(['models'], 'readwrite');
                                    var os = tx.objectStore('models');

                                    var rq = null;
                                    try {
                                        var rq = os.put(data, url);
                                    } catch (e) {
                                        cbPrint('loadRemote: failed to store "' + url + '" in the IndexedDB: \n' + e);
                                        cbCancel();
                                        return;
                                    }

                                    rq.onsuccess = function (event) {
                                        cbPrint('loadRemote: "' + url + '" stored in the IndexedDB');
                                        cbReady(dst, data, cbPrint);
                                    };

                                    rq.onerror = function (event) {
                                        cbPrint('loadRemote: failed to store "' + url + '" in the IndexedDB');
                                        cbCancel();
                                    };
                                };
                            }
                        });
                    }
                };

                rq.onerror = function (event) {
                    cbPrint('loadRemote: failed to get data from the IndexedDB');
                    cbCancel();
                };
            };

            rq.onerror = function (event) {
                cbPrint('loadRemote: failed to open IndexedDB');
                cbCancel();
            };

            rq.onblocked = function (event) {
                cbPrint('loadRemote: failed to open IndexedDB: blocked');
                cbCancel();
            };

            rq.onabort = function (event) {
                cbPrint('loadRemote: failed to open IndexedDB: abort');
                cbCancel();
            };
        }
        
        var api={
            applyMdule,
            stop,
            clearCache,
            loadWhisper,
            changeLang,
            get finishedReady() { return finishedReady; }
        }
        return api;
    }    

    let XAPI = null;

    function waitUntilFinishedReady() {
        return new Promise(resolve => {
            const check = () => {
                if (XAPI && XAPI.finishedReady==true) {
                    console.log('rd');
                    resolve();
                } else {                    
                    setTimeout(check, 50); // ou use requestAnimationFrame(check) se preferir
                }
            };
            check();
        });
    }

    XAPI = null;

    const APIRET = {
        create: (lang, dict) => {
            let ready = false;
            let queue = [];
            const runQueue = () => {
                queue.forEach(fn => fn());
                queue = [];
            };
            (async () => {
                if (XAPI != null) {
                    await XAPI.stop();
                    await XAPI.clearCache();
                }
                XAPI = new API();
                XAPI.applyMdule(CommandModule);                
                await XAPI.loadWhisper(dict);
                await waitUntilFinishedReady();
                await XAPI.changeLang(lang);
                ready = true;
                runQueue();
            })();

            const proxy = {
                start: () => {
                    if (!ready) {
                        queue.push(() => XAPI.startCapture());
                    } else {
                        XAPI.startCapture();
                    }
                },
                stop: () => {
                    if (!ready) {
                        queue.push(() => XAPI.stopCapture());
                    } else {
                        XAPI.stopCapture();
                    }
                }
            };

            return proxy;
        },
        start: async () => {
            await waitUntilFinishedReady();
            if (XAPI != null) { await XAPI.startCapture(); }
            return XAPI;
        },
        stop: async () => {
            if (XAPI != null) { await XAPI.stopCapture(); }
            return XAPI;
        }
    }
    
    return APIRET;
})();
