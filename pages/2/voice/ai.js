window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;


var COMMAND = {
    context: null,// web audio context    
    audio: null,// audio data
    audio0: null,
    instance: null,
    model_whisper: null,
    Module:typeof Module!="undefined"?Module:{},
    // fetch models
    dbVersion: 1,
    dbName: 'whisper',
    indexedDB: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    // microphone
    kSampleRate: 16000,
    kRestartRecording_s: 120,
    kIntervalAudio_ms: 250, // pass the recorded audio to the C++ instance at this rate
    mediaRecorder: null,
    doRecording: false,
    startTime: 0,
    // main
    nLines: 0,
    intervalUpdate: null,
    transcribedAll: '',
    onCOMMAND: (text, percent) => {
        console.log('CMD', text, percent);
    },
    onSTATUS:(text)=>{
    },

    applyMdule(module) {
        COMMAND.Module = module;
        COMMAND.Module.print = COMMAND.printTextarea;
        COMMAND.Module.printErr = COMMAND.printTextarea;
        COMMAND.Module.setStatus = function (text) {
            COMMAND.printTextarea('js: ' + text);
        }
        COMMAND.Module.monitorRunDependencies = function (left) {
        }
        COMMAND.Module.preRun = function () {
            COMMAND.printTextarea('js: Preparing ...');
        }
        COMMAND.Module.postRun = function () {
            COMMAND.printTextarea('js: Initialized successfully!');
        }
        window.err = COMMAND.printTextarea;
        requestAnimationFrame(this.update);
    },

    update() {
        if (typeof (COMMAND.Module.cmd_detected) == 'function') {
            var cmd = COMMAND.Module.cmd_detected();
            if (cmd && cmd.trim().length > 1) {
                cmd = cmd.split(":");
                if (cmd.length == 3) {
                    if (typeof (COMMAND.onCOMMAND) == 'function') {
                        COMMAND.onCOMMAND(cmd[1], parseFloat(cmd[2]));
                    }
                }
            }
        }
        requestAnimationFrame(COMMAND.update);
    },


    changeLang() {
        var lang = document.getElementById('language').value;
        Module.set_language(lang);
    },

    addcommand() {
        var valcmd = document.getElementById('mycommand').value;
        Module.cmd_add(valcmd);
    },


    storeFS(fname, buf, cbPrint) {
        // write to WASM file using FS_createDataFile
        // if the file exists, delete it
        try {
            this.Module.FS_unlink(fname);
        } catch (e) {
            // ignore
        }

        this.Module.FS_createDataFile("/", fname, buf, true, true);

        cbPrint('storeFS: stored model: ' + fname + ' size: ' + buf.length);

        //document.getElementById('model-whisper-status').innerHTML = 'loaded "' + model_whisper + '"!';

        if (this.model_whisper != null) {
            //document.getElementById('start').disabled = false;
            //document.getElementById('stop' ).disabled = true;
        }
    },

    loadWhisper(model) {
        var urls = {
            'tiny.en': './voice/tinyen.glb',
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

        this.model_whisper = model;

        /*document.getElementById('fetch-whisper-tiny-en').style.display = 'none';
        document.getElementById('fetch-whisper-base-en').style.display = 'none';

        document.getElementById('fetch-whisper-tiny-en-q5_1').style.display = 'none';
        document.getElementById('fetch-whisper-base-en-q5_1').style.display = 'none';

        document.getElementById('model-whisper-status').innerHTML = 'loading "' + model + '" ... ';
        */
        cbProgress = function (p) {
            //let el = document.getElementById('fetch-whisper-progress');
            //el.innerHTML = Math.round(100*p) + '%';
        };

        cbCancel = function () {
            /* var el;
             el = document.getElementById('fetch-whisper-tiny-en'); if (el) el.style.display = 'inline-block';
             el = document.getElementById('fetch-whisper-base-en'); if (el) el.style.display = 'inline-block';
 
             el = document.getElementById('fetch-whisper-tiny-en-q5_1'); if (el) el.style.display = 'inline-block';
             el = document.getElementById('fetch-whisper-base-en-q5_1'); if (el) el.style.display = 'inline-block';
 
             el = document.getElementById('model-whisper-status');  if (el) el.innerHTML = '';
             */
        };
        this.loadRemote(url, dst, size_mb, this.cbProgress, this.storeFS, this.cbCancel, this.printTextarea);
    },



    stopRecording() {
        this.Module.set_status("paused");
        this.doRecording = false;
        this.audio0 = null;
        this.audio = null;
        this.context = null;
    },

    async startRecording() {
        if (!COMMAND.context) {
            COMMAND.context = new AudioContext({
                sampleRate: COMMAND.kSampleRate,
                channelCount: 1,
                echoCancellation: false,
                autoGainControl: true,
                noiseSuppression: true,
            });
        }
        COMMAND.Module.set_status("");
        //document.getElementById('start').disabled = true;
        //document.getElementById('stop').disabled = false;
        COMMAND.doRecording = true;
        COMMAND.startTime = Date.now();

        var chunks = [];
        var stream = null;
        var ignorenext = false;

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function (s) {
                stream = s;
                COMMAND.mediaRecorder = new MediaRecorder(stream);
                COMMAND.mediaRecorder.ondataavailable = function (e) {
                    chunks.push(e.data);
                    var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                    var reader = new FileReader();
                    reader.onload = async function (event) {
                        var buf = new Uint8Array(reader.result);

                        if (!COMMAND.context) {
                            return;
                        }
                        await COMMAND.context.decodeAudioData(buf.buffer, function (audioBuffer) {
                            var offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
                            var source = offlineContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(offlineContext.destination);
                            source.start(0);

                            offlineContext.startRendering().then(function (renderedBuffer) {
                                COMMAND.audio = renderedBuffer.getChannelData(0);
                                COMMAND.printTextarea('js: audio recorded, size: ' + COMMAND.audio.length + ', old size: ' + (COMMAND.audio0 == null ? 0 : COMMAND.audio0.length));
                                if (COMMAND.audio.length < 1000000) {

                                    var audioAll = new Float32Array(COMMAND.audio0 == null ? COMMAND.audio.length : COMMAND.audio0.length + COMMAND.audio.length);
                                    if (COMMAND.audio0 != null) {
                                        audioAll.set(COMMAND.audio0, 0);
                                    }
                                    audioAll.set(COMMAND.audio, COMMAND.audio0 == null ? 0 : COMMAND.audio0.length);

                                    if (COMMAND.instance) {
                                        COMMAND.Module.set_audio(COMMAND.instance, audioAll);
                                    }
                                } else {
                                    ignorenext = true;
                                }
                            });
                        }, function (e) {
                            COMMAND.audio = null;
                        });
                    }
                    if (ignorenext == true) {
                        COMMAND.mediaRecorder.stop();
                        reader.abort();
                    } else {
                        reader.readAsArrayBuffer(blob);
                    }
                };

                COMMAND.mediaRecorder.onstop = function (e) {
                    if (COMMAND.doRecording) {
                        setTimeout(function () {
                            COMMAND.startRecording();
                        });
                    }
                };

                COMMAND.mediaRecorder.start(COMMAND.kIntervalAudio_ms);
            })
            .catch(function (err) {
                COMMAND.printTextarea('js: error getting audio stream: ' + err);
            });

        var interval = setInterval(function () {
            if (!COMMAND.doRecording) {
                clearInterval(interval);
                if (COMMAND.mediaRecorder != null) COMMAND.mediaRecorder.stop();
                stream.getTracks().forEach(function (track) {
                    track.stop();
                });
                //document.getElementById('start').disabled = false;
                //document.getElementById('stop').disabled  = true;
                COMMAND.mediaRecorder = null;
            }

            // if audio length is more than kRestartRecording_s seconds, restart recording
            if (COMMAND.audio != null && COMMAND.audio.length > COMMAND.kSampleRate * COMMAND.kRestartRecording_s) {
                if (COMMAND.doRecording) {
                    //printTextarea('js: restarting recording');

                    clearInterval(interval);
                    COMMAND.audio0 = audio;
                    COMMAND.audio = null;
                    COMMAND.mediaRecorder.stop();
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });
                }
            }
        }, 100);
    },



    onStart() {
        if (!this.instance) {
            this.instance = this.Module.init('whisper.bin');

            if (this.instance) {
                this.printTextarea("js: whisper initialized, instance: " + this.instance);
            }
        }

        if (!this.instance) {
            this.printTextarea("js: failed to initialize whisper");
            return;
        }

        this.startRecording();
        var transcribedAll = this.transcribedAll;
        var nLines = this.nLines;
        var module = this.Module;
        this.intervalUpdate = setInterval(function () {
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
    },

    onStop() {
        this.stopRecording();
    },
    //################################# HELPERS ###$$$$$$$$$$$$$$$$$$

    convertTypedArray(src, type) {
        var buffer = new ArrayBuffer(src.byteLength);
        var baseView = new src.constructor(buffer).set(src);
        return new type(buffer);
    },

    printTextarea: (function () {
        //var element = document.getElementById('output');
        //if (element) element.value = ''; // clear browser cache
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            if (text.startsWith("js: audio recorded, size:")) return;
            //if(typeof(COMMAND.onSTATUS)=='function')COMMAND.onStart(text);
            if(COMMAND && COMMAND.onSTATUS && typeof(COMMAND.onSTATUS)=='function') COMMAND.onSTATUS(text);          
            //console.log(text);
           // if (element) {
           //     element.value += text + "\n";
           //     element.scrollTop = element.scrollHeight; // focus on bottom
           // }
        };
    })(),

    async clearCache() {
        //if (confirm('Are you sure you want to clear the cache?\nAll the models will be downloaded again.')) {
        this.indexedDB.deleteDatabase(this.dbName);
        location.reload();
        //}
    },

    // fetch a remote file from remote URL using the Fetch API
    async fetchRemote(url, cbProgress, cbPrint) {
        cbPrint('fetchRemote: downloading with fetch()...');

        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            }
        );

        if (!response.ok) {
            cbPrint('fetchRemote: failed to fetch ' + url);
            return;
        }

        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength, 10);
        const reader = response.body.getReader();

        var chunks = [];
        var receivedLength = 0;
        var progressLast = -1;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            chunks.push(value);
            receivedLength += value.length;

            if (contentLength) {
                cbProgress(receivedLength / total);

                var progressCur = Math.round((receivedLength / total) * 10);
                if (progressCur != progressLast) {
                    cbPrint('fetchRemote: fetching ' + 10 * progressCur + '% ...');
                    progressLast = progressCur;
                }
            }
        }

        var position = 0;
        var chunksAll = new Uint8Array(receivedLength);

        for (var chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        return chunksAll;
    },

    // load remote data
    // - check if the data is already in the IndexedDB
    // - if not, fetch it from the remote URL and store it in the IndexedDB
    loadRemote(url, dst, size_mb, cbProgress, cbReady, cbCancel, cbPrint) {
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
        var rq = this.indexedDB.open(this.dbName, this.dbVersion);
        var fetchRemote = this.fetchRemote;
        var indexedDB = this.indexedDB;
        var dbName = this.dbName;
        var dbVersion = this.dbVersion;

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
}

COMMAND.applyMdule(Module);