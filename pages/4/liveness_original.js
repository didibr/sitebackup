window.dlive = (function () {
    var API = function () {
        const translations = {
            pt: {
                info_positionFace: "posicione o rosto",
                info_keepPosition: "mantenha posicao",
                info_moveCloser: "aproxime-se",
                info_moveAway: "afaste-se",
                info_MaintainCenter: "Mantenha o rosto centralizado",
                info_finished: "Verificação OK",
                error_videoProcessing: "Erro no processamento de vídeo:",
                error_camera: "Erro na câmera:",
                error_FailLiveness: "Falha no<br>Reconhecimento",
                error_challengeFail: "Falha no<br>Desafio",
                loading: "Carregando...",
                challengeSide_Left: "ESQUERDA",
                challengeSide_Right: "DIREITA",
                challengeSide_Top: "CIMA",
                challengeSide_Bottom: "BAIXO",
                challengeInfo: "Olhe para",
                challengeStay:"Fique olhando"
            },
            en: {
                info_positionFace: "position your face",
                info_keepPosition: "keep position",
                info_moveCloser: "move closer",
                info_moveAway: "move away",
                info_MaintainCenter: "Keep face centered",
                info_finished: "Verification OK",
                error_videoProcessing: "Video processing error:",
                error_camera: "Camera error:",
                error_FailLiveness: "Recognition<br>Failed",
                error_challengeFail: "Challenge<br>Failed",
                loading: "Loading...",
                challengeSide_Left: "LEFT",
                challengeSide_Right: "RIGHT",
                challengeSide_Top: "UP",
                challengeSide_Bottom: "DOWN",
                challengeInfo: "Look to",
                challengeStay: "Keep looking"
            }
        };

        const captions = {
            //ENTRY TRANSLATION        
            //NOT CHANGE STRING AT BOTTOM
            siteName: "didisoftwares.ddns.net",
            scriptFile: "opencv.js",
            faceCascadeFile: "haarcascade_frontalface_default.xml",
            faceCascadeProfileFile: "haarcascade_profileface.xml",
            containerId: "didilive-ctn",
            videoId: "didilive-video",
            canvasId: "didilive-canvas",
            imageContainerId: "didilive-imgCont",
            imageContainerId2: "didilive-imgCont2",
            //"//didisoftwares.ddns.net/4/opencv/cont.png",
            //"//didisoftwares.ddns.net/4/opencv/cont2.png",        
            siteOcLPrefix() {
                return '//' + this.siteName + '/4/opencv/';
            },//Server Response (NOTRANSLATE)
            infoId: "didilive-info",
            return_facenotFound: "Rosto nao encontrada ou invalido",
            return_multipleFaceFound: "Mais de um rosto detectado",
            return_nolive: "Nao foi possivel determinar liveness",
            return_live: "Liveness check passed",
            return_faillive: "Liveness check failed",
            challenge_Passed: "Challenge passed",

        }
        const frameMax = 20;//server based
        const siteName = captions.siteName;
        const siteOcL = captions.siteOcLPrefix();
        const resolution = { width: { ideal: 480 }, height: { ideal: 360 } };
        const maxCameraAttempts = 3;
        const timeFaceinfront = 5000; //10s olhando para iniciar
        const videoInvert = true;

        let EMAIL = "iandidi123@gmail.com";
        let TOKEN = null;
        let container, messageOverlay, video, canvas, ctx, canvasOutput, canvasOutputCtx, info;
        let cameraAttempts = 0;
        let imgCont, imgCont2, imgHead = [];
        let stream = null, ws = null;
        let videoWidth, videoHeight;
        let lastFaceTime = 0;
        let faceActive = false, challengeActive = false;
        let sendTimer = null;
        let faceClassifier = null;
        let srcMat = null, grayMat = null;
        let streaming = false;
        let animationIsrunning = true;
        let messageTimeout = null;
        let validFaceStartTime = 0;
        let hasConnected = false;
        let sendingBurst = false;
        let challengestartTimer = null;
        let challengeretryTimer = null;
        let startcameraTimer = null;
        let clossing = false;
        let finishedReady = false;


        function setLanguage(lang) {
            const selected = translations[lang] || translations["pt"]; // padrão: português
            Object.keys(selected).forEach(key => {
                captions[key] = selected[key];
            });
        }

        function loadScript(url) {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            document.head.appendChild(script);
        }

        function stopLoadingAnimation() {
            if (container) {
                container.style.background = '#444'; // ou qualquer cor fixa
                container.style.animation = 'none';
                imgCont.style.display = "block";
                imgCont2.style.display = "block";
                effectOff();
            }
        }

        function createElements() {
            // Insere a animação no estilo do documento (caso ainda não exista)
            if (!document.getElementById('bgAnimationStyle')) {
                const style = document.createElement('style');
                style.id = 'bgAnimationStyle';
                style.textContent = `
                        @keyframes bgAnimation {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                    `;
                document.head.appendChild(style);
            }
            container = document.createElement('div');
            container.id = captions.containerId;
            Object.assign(container.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: 'min(80vw, 60vh * 0.75)',
                aspectRatio: '3 / 4',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(-90deg, #111, #444, #888, #444)',
                backgroundSize: '400% 400%',
                animation: 'bgAnimation 2s ease infinite',
                zIndex: '9999',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 0 15px rgba(0,0,0,0.7)',
            });

            video = document.createElement('video');
            video.id = captions.videoId;
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            Object.assign(video.style, {
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: '0',
                left: '0',
                objectFit: 'cover'
            });
            if (videoInvert) Object.assign(video.style, { transform: 'scaleX(-1)' });

            canvas = document.createElement('canvas');
            canvas.id = captions.canvasId;
            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none'
            });

            ctx = canvas.getContext('2d', { willReadFrequently: true });

            imgCont = document.createElement('img');
            imgCont.id = captions.imageContainerId;
            Object.assign(imgCont.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                display: 'none',
                opacity: '0',
            });


            imgCont2 = document.createElement('img');
            imgCont2.id = captions.imageContainerId2;
            Object.assign(imgCont2.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                display: 'none',
                opacity: '0',
            });


            info = document.createElement('div');
            info.id = captions.infoId;
            Object.assign(info.style, {
                position: 'absolute',
                bottom: '0px',
                left: '0',
                right: '0',
                color: '#FFFFFF',//'#9326FF',
                fontSize: '12px',
                textAlign: 'center',
                backgroundColor: '#000',
                padding: '0.5em 0',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
                zIndex: '99',
            });


            container.appendChild(video);
            container.appendChild(canvas);
            container.appendChild(imgCont);
            container.appendChild(imgCont2);
            container.appendChild(info);
            document.body.appendChild(container);



            messageOverlay = document.createElement('div');
            messageOverlay.id = 'messageOverlay';
            Object.assign(messageOverlay.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '100vw', // ou width: '100vw'
                minWidth: '200px',
                padding: '16px 24px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#fff',
                opacity: "0.85",
                // fontSize: 'clamp(20px, 6vw, 42px)',
                borderRadius: '10px',
                zIndex: '10000',
                textAlign: 'center',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                display: 'none',
                whiteSpace: 'nowrap', // <- impede quebra de linha
                //wordWrap: 'break-word',
                //overflowWrap: 'break-word',
                overflow: 'hidden',
                textOverflow: 'ellipsis' // opcional: mostra "..." se ultrapassar
            });

            document.body.appendChild(messageOverlay);

            // Eventos para redimensionamento
            window.addEventListener("resize", ajustarFonteInfo);
            window.addEventListener("load", ajustarFonteInfo);

            // Resto da função (canvasOutput, ctx, etc.)
            canvasOutput = canvas;
            canvasOutputCtx = canvas.getContext('2d', { willReadFrequently: true });
            info.innerText = captions.loading;
            loadScript(siteOcL + captions.scriptFile);
        }

        function removeElements() {
            const containerEl = document.getElementById(captions.containerId);
            if (containerEl) containerEl.remove();
            const overlay = document.getElementById('messageOverlay');
            if (overlay) overlay.remove();
            const styleEl = document.getElementById('bgAnimationStyle');
            if (styleEl) styleEl.remove();
            window.removeEventListener("resize", ajustarFonteInfo);
            window.removeEventListener("load", ajustarFonteInfo);
        }



        function showMessage(mensagem, bgcolor = 'rgba(0, 0, 0, 0.85)', ftColor = '#000000', timeout = 3000) {
            const overlay = messageOverlay;
            if (!overlay) return;

            // Cancela timeout anterior
            if (messageTimeout) {
                clearTimeout(messageTimeout);
                messageTimeout = null;
            }

            overlay.innerHTML = mensagem;
            overlay.style.display = 'block';
            overlay.style.backgroundColor = bgcolor;
            overlay.style.color = ftColor;

            if (timeout > 0) {
                messageTimeout = setTimeout(() => {
                    overlay.style.display = 'none';
                    messageTimeout = null;
                }, timeout);
            }
        }



        let showingFirst = true;
        let animationFrameId = null;
        let lastSwitchTime = 0;

        function effectON() {
            if (animationFrameId) return;  // Evita ativar mais de uma vez
            imgCont.style.display = 'block';
            imgCont2.style.display = 'block';
            imgCont.style.opacity = '1';
            imgCont2.style.opacity = '0';
            lastSwitchTime = performance.now();
            animateOverlay();
        }

        function animateOverlay(timestamp) {
            if (clossing == true) return;
            animationFrameId = requestAnimationFrame(animateOverlay);
            const now = performance.now();
            if (now - lastSwitchTime >= 300) {
                if (showingFirst) {
                    imgCont.style.opacity = '0';
                    imgCont2.style.opacity = '1';
                } else {
                    imgCont.style.opacity = '1';
                    imgCont2.style.opacity = '0';
                }
                showingFirst = !showingFirst;
                lastSwitchTime = now;
            }
        }

        function effectOff() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            imgCont.style.opacity = '1';
            imgCont2.style.opacity = '0';
        }

        function effectCHALLENGE() {
            effectOff();
            imgCont.style.opacity = '0';
            imgCont2.style.opacity = '1';
        }



        function startCamera() {
            if (streaming) return;
            if (clossing == true) return;

            navigator.mediaDevices.getUserMedia({ video: resolution, audio: false })
                .then(s => {
                    if (clossing == true) return;
                    stream = s;
                    video.srcObject = s;
                    video.play();
                    cameraAttempts = 0; // sucesso, zera o contador
                })
                .catch(err => {
                    console.error(captions.error_camera, err);

                    cameraAttempts++;
                    if (cameraAttempts < maxCameraAttempts) {
                        console.warn(`Tentando novamente... (${cameraAttempts}/${maxCameraAttempts})`);
                        if (startcameraTimer != null) clearTimeout(startcameraTimer);
                        startcameraTimer = setTimeout(startCamera, 1000); // tenta de novo em 1 segundo
                    } else {
                        removeElements();
                        setTimeout(() => {
                            alert(captions.error_camera + "\n\n" + err.name + ": " + err.message);
                            cameraAttempts = 0; // reseta para futuras chamadas                        
                        }, 500);                        
                    }
                });

            if (clossing == true) return;
            video.addEventListener("canplay", () => {
                if (!streaming) {
                    videoWidth = video.videoWidth;
                    videoHeight = video.videoHeight;
                    video.setAttribute("width", videoWidth);
                    video.setAttribute("height", videoHeight);
                    canvasOutput.width = videoWidth;
                    canvasOutput.height = videoHeight;
                    streaming = true;
                }
                startVideoProcessing();
            }, false);
        }


        function startVideoProcessing() {
            if (clossing == true) return;
            canvasOutput.width = videoWidth;
            canvasOutput.height = videoHeight;

            srcMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
            grayMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);
            faceClassifier = new cv.CascadeClassifier();
            faceClassifier.load(captions.faceCascadeFile);

            requestAnimationFrame(processVideo);
        }


        let downsampled = null;
        let faceVect = null;

        function processVideo() {
            if (clossing == true) return;
            if (sendingBurst) {
                requestAnimationFrame(processVideo);
                return;
            }
            try {
                if (!streaming) return;
                canvasOutputCtx.clearRect(0, 0, videoWidth, videoHeight);
                if (videoInvert) {
                    canvasOutputCtx.save();
                    canvasOutputCtx.scale(-1, 1);
                    canvasOutputCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
                    canvasOutputCtx.restore();
                } else {
                    canvasOutputCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
                }

                if (challengeActive == true) {
                    requestAnimationFrame(processVideo);
                    return;
                }

                let imageData = canvasOutputCtx.getImageData(0, 0, videoWidth, videoHeight);
                srcMat.data.set(imageData.data);
                cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
                if (downsampled == null) {
                    downsampled = new cv.Mat();
                    faceVect = new cv.RectVector();
                }
                cv.pyrDown(grayMat, downsampled);
                faceClassifier.detectMultiScale(downsampled, faceVect);

                if (faceVect.size() === 1) {
                    if (!faceActive) {
                        faceActive = true;
                    }
                    lastFaceTime = Date.now();
                } else {
                    faceActive = false;
                }

                canvasOutputCtx.strokeStyle = 'red';
                canvasOutputCtx.lineWidth = 2;
                drawOverlay(faceVect);

                checkFaceTimers();

                requestAnimationFrame(processVideo);

            } catch (err) {
                console.error(captions.error_videoProcessing, err);
            }
        }

        let faceRectMode = 1; // 1 - posição inicial | 2 - long focus
        let faceRectValid = false;

        function drawOverlay(faceVect) {
            var debugDraw = false;
            if (animationIsrunning) {
                stopLoadingAnimation();
                animationIsrunning = false;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const drawParams = calculateDrawParams(video, canvas);
            const { drawX, drawY, drawWidth, drawHeight } = drawParams;
            const squares = getReferenceSquares(drawParams);
            const { squareSize1, squareSize2, centerX1, centerY1, centerX2, centerY2 } = squares;
            const scaleX = drawWidth / video.videoWidth;
            const scaleY = drawHeight / video.videoHeight;
            let mensagem = captions.info_MaintainCenter;
            if (debugDraw) {
                drawReferenceSquares(centerX1, centerY1, squareSize1, centerX2, centerY2, squareSize2);
            }
            for (let i = 0; i < faceVect.size(); i++) {
                let face = faceVect.get(i);
                const faceRect = {
                    x: drawX + face.x * 2 * scaleX,
                    y: drawY + face.y * 2 * scaleY,
                    width: face.width * 2 * scaleX,
                    height: face.height * 2 * scaleY
                };
                if (debugDraw) {
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
                }
                mensagem = evaluateFacePosition(faceRect, squares, drawParams);
            }
            info.innerHTML = mensagem;
        }

        //Calcula a área de desenho proporcional ao vídeo
        function calculateDrawParams(video, canvas) {
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            let drawWidth, drawHeight, drawX, drawY;
            if (canvasAspect > videoAspect) {
                drawHeight = canvas.height;
                drawWidth = canvas.height * videoAspect;
                drawX = (canvas.width - drawWidth) / 2;
                drawY = 0;
            } else {
                drawWidth = canvas.width;
                drawHeight = canvas.width / videoAspect;
                drawX = 0;
                drawY = (canvas.height - drawHeight) / 2;
            }
            return { drawX, drawY, drawWidth, drawHeight };
        }

        //Calcula os dois quadrados de referência verdes
        function getReferenceSquares({ drawX, drawY, drawWidth, drawHeight }) {
            let squareSizeRatio1 = 0.5;
            let squareSizeRatio2 = 0.7;
            if (faceRectMode == 2) squareSizeRatio1 = 0.4;
            if (video.videoWidth < video.videoHeight) {
                squareSizeRatio1 = 0.65;
                squareSizeRatio2 = 0.95;
                if (faceRectMode == 2) squareSizeRatio1 = 0.55;
            }
            const squareSize1 = Math.min(drawWidth, drawHeight) * squareSizeRatio1;
            const squareSize2 = Math.min(drawWidth, drawHeight) * squareSizeRatio2;
            const centerX1 = drawX + (drawWidth - squareSize1) / 2;
            const centerY1 = drawY + (drawHeight - squareSize1) / 2;
            const centerX2 = drawX + (drawWidth - squareSize2) / 2;
            const centerY2 = drawY + (drawHeight - squareSize2) / 2;
            return { squareSize1, centerX1, centerY1, squareSize2, centerX2, centerY2 };
        }

        // Desenha os dois quadrados verdes de referência
        function drawReferenceSquares(x1, y1, size1, x2, y2, size2) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(x1, y1, size1, size1);
            ctx.strokeRect(x2, y2, size2, size2);
        }

        //Avalia a posição do rosto e retorna a mensagem adequada
        function evaluateFacePosition(faceRect, squares, drawParams) {
            const { x, y, width: w, height: h } = faceRect;
            const { squareSize1, squareSize2 } = squares;
            const { drawX, drawY, drawWidth, drawHeight } = drawParams;
            const faceArea = w * h;
            const minArea = squareSize1 * squareSize1;
            const maxArea = squareSize2 * squareSize2;
            const greenCenterX = drawX + drawWidth / 2;
            const greenCenterY = drawY + drawHeight / 2;
            const faceCenterX = x + w / 2;
            const faceCenterY = y + h / 2;
            const marginX = squareSize1 * 0.1;
            const marginY = squareSize1 * 0.1;
            const isAreaOk = faceArea > minArea && faceArea < maxArea;
            const isCentered =
                faceCenterX > greenCenterX - marginX &&
                faceCenterX < greenCenterX + marginX &&
                faceCenterY > greenCenterY - marginY &&
                faceCenterY < greenCenterY + marginY;
            faceRectValid = false;
            let mess = "";
            if (isAreaOk && isCentered) {
                effectON();
                faceRectValid = true;
                mess = captions.info_keepPosition;
            } else if (faceArea <= minArea) {
                effectOff();
                mess = captions.info_moveCloser;
            } else if (faceArea >= maxArea) {
                effectOff();
                mess = captions.info_moveAway;
            } else {
                effectOff();
                mess = captions.info_positionFace;
            }
            if (faceRectValid) {
                if (validFaceStartTime === 0) validFaceStartTime = Date.now();
            } else {
                validFaceStartTime = 0;
            }
            return mess;
        }


        let alreadyConnected = 0;
        function checkFaceTimers() {
            let now = Date.now();
            //if (faceActive && (now - faceDetectedTime > 20000) && !ws) connectWebSocket();
            if (faceRectValid && (now - validFaceStartTime > timeFaceinfront) && !ws && alreadyConnected == 0) {
                alreadyConnected = 1;
                connectWebSocket();
            }
            //if (ws && now - lastFaceTime > 10000) stopCapture();
        }

        function connectWebSocket() {
            // === Constantes de comandos CMD ===
            const CMD_STOP = "STOP";
            const CMD_FINISHED = "FINISHED";
            const CMD_GETFRAME = "GETFRAME";
            const CMD_LIVENESS = "LIVNESS";
            const CMD_CHALLENGEFAIL = "CHALLENGEFAIL";
            const CMD_CHALLENGERETRY = "CHALLENGERETRY";
            const CMD_CHALLENGE = "CHALLENGE";
            const CMD_CHALLENGESTART = "CHALLENGESTART";
            const CMD_CHALLENGESTARTSEND = "CHALLENGESTARTSEND";
            const CMD_NEXTCHALLENGE = "NEXTCHALLENGE";
            const CMD_SCRIPTFAIL = "SCRIPTFAIL";
            // === Constantes de chaves enviadas (KEYs) ===
            const KEY_CONNECTED = "PROJ04#CONNECTED";
            const KEY_CHALLENGE = "PROJ04#CHALLENGE";
            const KEY_CHALLENGESTART = "PROJ04#CHALLENGESTART";
            // === Cores reutilizáveis ===
            const COLOR_SUCCESS = 'rgba(0, 255, 0, 0.85)';
            const COLOR_WARNING = 'rgba(255, 255, 0, 0.85)';
            const COLOR_ERROR = 'rgba(255, 0, 0, 0.85)';
            const TEXT_COLOR = "#000";

            ws = new WebSocket("wss://" + siteName, siteName);
            //console.log("🔌 Conectando WebSocket...");

            ws.onopen = () => {
                hasConnected = true;
                //console.log("🟢 Conectado ao servidor");
                ws.send(JSON.stringify({ KEY: KEY_CONNECTED, DATA: { EMAIL: EMAIL, TOKEN:TOKEN } }));
            };

            ws.onmessage = event => {
                if (clossing == true) return;
                try {
                    const msg = JSON.parse(event.data);
                    //console.log(msg);
                    if (msg.CMD === CMD_SCRIPTFAIL && msg.CODE) {
                        window.CMDSCRIPTFAIL = msg.CODE;
                    }

                    if (msg.CMD === CMD_STOP) {
                        info.innerText = "";
                        stopCapture();
                    }

                    if (msg.CMD === CMD_FINISHED && msg.CODE) {
                        window.CMDSCRIPTFAIL = null;                        
                        info.innerText = "";
                        //showMessage(captions.info_finished, COLOR_SUCCESS, TEXT_COLOR, 0);                        
                        removeElements();
                        clossing = true;
                        setTimeout(() => {
                            stopCapture();
                            eval(msg.CODE);
                        }, 1000);   
                        return;                                             
                    }

                    if (msg.CMD === CMD_GETFRAME && msg.CODE) {
                        sendImageBurst(msg.CODE);
                    }

                    if (msg.CMD === CMD_LIVENESS && msg.RESULT) {
                        if (msg.RESULT === captions.return_facenotFound) { }
                        if (msg.RESULT === captions.return_multipleFaceFound) { }
                        if (msg.RESULT === captions.return_nolive) { }
                        if (msg.RESULT === captions.return_faillive) { }

                        if (msg.RESULT === captions.return_live) {
                            challengeActive = true;
                            effectCHALLENGE();
                            ws.send(JSON.stringify({ KEY: KEY_CHALLENGE, DATA: {} }));
                            return;
                        }
                        showMessage(captions.error_FailLiveness, COLOR_ERROR, TEXT_COLOR, 0);
                        stopCapture();
                    }

                    if (msg.CMD === CMD_CHALLENGEFAIL) {
                        info.innerText = "";
                        showMessage(captions.error_challengeFail, COLOR_ERROR, TEXT_COLOR, 0);
                        stopCapture();
                    }

                    if (msg.CMD === CMD_CHALLENGERETRY && msg.N) {
                        showMessage(captions.error_challengeFail, COLOR_WARNING, TEXT_COLOR, 0);
                        if (challengeretryTimer != null) clearTimeout(challengeretryTimer);
                        challengeretryTimer = setTimeout(() => {
                            ws.send(JSON.stringify({ KEY: KEY_CHALLENGE, DATA: {} }));
                        }, 3000);
                    }

                    if (msg.CMD === CMD_CHALLENGE && msg.CODE && msg.NUMBER) {
                        let challengeFinal = captions.challengeInfo;
                        let challengeTxt = "";

                        switch (msg.NUMBER) {
                            case 1: challengeTxt = captions.challengeSide_Left; break;
                            case 2: challengeTxt = captions.challengeSide_Right; break;
                            case 3: challengeTxt = captions.challengeSide_Top; break;
                            case 4: challengeTxt = captions.challengeSide_Bottom; break;
                        }

                        challengeFinal += '<br>' + challengeTxt + '<br>';
                        const imageH = imgHead[msg.NUMBER - 1];
                        showMessage(challengeFinal, '#fff', '#000', 0);
                        messageOverlay.appendChild(imageH);
                        info.innerText = captions.challengeStay+" "+challengeTxt;

                        if (challengestartTimer != null) clearTimeout(challengestartTimer);
                        challengestartTimer = setTimeout(() => {
                            sendNewFrame('0', msg.NUMBER, KEY_CHALLENGESTART);
                            challengestartTimer = null;
                        }, 3000);

                        imageH.style.display = 'block';
                        return;
                    }

                    if (msg.CMD === CMD_CHALLENGESTART && msg.NUMBER) {
                        if (challengestartTimer != null) clearTimeout(challengestartTimer);
                        challengestartTimer = setTimeout(() => {
                            sendNewFrame('0', msg.NUMBER, KEY_CHALLENGESTART);
                            challengestartTimer = null;
                        }, 3000);
                        return;
                    }

                    if (msg.CMD === CMD_CHALLENGESTARTSEND && msg.CODE) {
                        messageOverlay.style.display = 'none';
                        sendImageBurst(msg.CODE);
                        return;
                    }

                    if (msg.CMD === CMD_NEXTCHALLENGE && msg.RESULT) {
                        ws.send(JSON.stringify({ KEY: KEY_CHALLENGE, DATA: {} }));
                        return;
                    }
                } catch (e) {
                    console.warn("Mensagem inválida:", event.data, e);
                }
            };

            ws.onclose = () => {
                hasConnected = false;
                //console.log("🔴 Desconectado do servidor");
                stopCapture();
                ws = null;
            };

            ws.onerror = err => {
                hasConnected = false;
                //console.error("Erro WebSocket:", err);
                stopCapture();
                ws = null;
            };
        }


        async function stopCapture() {
            clossing = true;
            effectOff();
            if (srcMat) { srcMat.delete(); srcMat = null; }
            if (grayMat) { grayMat.delete(); grayMat = null; }
            if (ws) { ws.close(); ws = null; }
            if (sendTimer) { clearInterval(sendTimer); sendTimer = null; }
            if (messageTimeout) { clearTimeout(messageTimeout); messageTimeout = null; }
            if (startcameraTimer != null) clearTimeout(startcameraTimer);
            if (challengestartTimer != null) clearTimeout(challengestartTimer);
            if (challengeretryTimer != null) clearTimeout(challengeretryTimer);
            if (downsampled && !downsampled.isDeleted()) {
                downsampled.delete();
                downsampled = null;
            }
            if (faceVect && !faceVect.isDeleted()) {
                faceVect.delete();
                faceVect = null;
            }
            if (canvasOutputCtx && videoWidth && videoHeight) {
                canvasOutputCtx.clearRect(0, 0, videoWidth, videoHeight);
            }
            await video.pause(); // não é nativamente async, mas podemos forçar:
            await new Promise(r => setTimeout(r, 50));
            video.srcObject = null;
            if (stream && stream.getVideoTracks) {
                for (const track of stream.getVideoTracks()) {
                    await track.stop(); // não é async, mas é bom aguardar entre chamadas
                }
                stream = null;
            }
            streaming = false;
            //console.log("⛔ Captura parada.");
            removeElements();
            if (typeof (CMDSCRIPTFAIL) != 'undefined' && CMDSCRIPTFAIL!=null) {
                const CMDSCRIPTFAILEXEC = CMDSCRIPTFAIL;
                window.CMDSCRIPTFAIL = null;
                await eval(CMDSCRIPTFAILEXEC);
            }
        }

        function sendImageBurst(CODE) {
            sendingBurst = true;
            let count = 1;
            sendTimer = setInterval(() => {
                if (count > frameMax) {
                    clearInterval(sendTimer);
                    sendTimer = null;
                    sendingBurst = false;
                    return;
                }
                sendNewFrame(CODE, count++);
            }, 200);
        }

        function sendNewFrame(CODE, count, KEY = "PROJ04#IMAGE") {
            if (!streaming || !ws) return;
            if (clossing == true) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            if (videoInvert) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(video, -video.videoWidth, 0);
                ctx.restore();
            } else {
                ctx.drawImage(video, 0, 0);
            }
            canvas.toBlob(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (clossing == true) return;
                    const base64data = reader.result.split(',')[1];
                    ws.send(JSON.stringify({
                        KEY: KEY,
                        DATA: {
                            IMG: base64data,
                            FRAME: count,
                            CODE: CODE
                        }
                    }));
                };
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.7);
        }


        function ajustarFonteInfo() {
            const largura = container.offsetWidth;
            //const altura = container.offsetHeight;    
            //const menorLado = Math.min(largura, altura);            
            info.style.fontSize = (largura * 0.05) + "px";
            messageOverlay.style.fontSize = (largura * 0.1) + "px";
            messageOverlay.style.minWidth = largura + "px";
            //continuebuttom.style.fontSize = (largura * 0.1) + "px"; // Ajustado aqui
        }

        function opencvIsReady() {
            //console.log('ready');
            startCamera();
            imgCont.setAttribute("src", cv.image.img1); //cont.png
            imgCont2.setAttribute("src", cv.image.img2);//cont2.png
            for (var i = 1; i < 5; i++) { //h1 - h4
                var imgx = new Image();
                imgx.src = cv.image['img' + (i + 2)];
                imgx.style.display = 'none';
                imgx.style.margin = '10px auto';
                imgx.style.width = '20vh';
                document.body.appendChild(imgx);
                imgHead.push(imgx);
            }
        }

        async function create(email = "iandidi123@gmail.com",token) {
            if (window.location.protocol === 'https:') {
                EMAIL = email;
                TOKEN= token;
                // Carregar OpenCV Module        
                window.Module = {
                    preRun: [function () {
                        //Module.FS_createPreloadedFile('/', captions.faceCascadeFile, siteOcL + captions.faceCascadeFile, true, false);
                        //Module.FS_createPreloadedFile('/', captions.faceCascadeProfileFile, siteOcL + captions.faceCascadeProfileFile, true, false);                        
                        /*const emscriptenFs = cv.FS;
                        const virtualMountFolder = "/local";
                        emscriptenFs.mkdir(virtualMountFolder);
                        emscriptenFs.mount(emscriptenFs.filesystems.NODEFS, { root: cv.FS.cwd() }, virtualMountFolder);
                        emscriptenFs.chdir(virtualMountFolder);*/
                        const xmlData1 = new TextEncoder().encode(cv.xml.xml1);
                        Module.FS_createDataFile('/', captions.faceCascadeFile, xmlData1, true, true);
                        const xmlData2 = new TextEncoder().encode(cv.xml.xml2);
                        Module.FS_createDataFile('/', captions.faceCascadeProfileFile, xmlData2, true, true);
                    }],
                    _main: () => {
                        isReady();
                    }
                };
                // Inicializa
                createElements();
                return API;
            } else {
                alert("Need HTTPS Secure");
            }
        }

        let isReadyCallback = () => { };
        function isReady() {            
            if (clossing == true) return;
            finishedReady = true;            
            isReadyCallback();
        }

        function startCapture() {
            if (clossing == true) return;            
            opencvIsReady();
        }

        const api = {
            onReady: (callback) => {
                isReadyCallback = callback;
                return api; // <- Encadeável
            },
            startCapture,
            stopCapture,
            setLanguage,
            //get setLanguage() { return setLanguage; },
            create,
            get finishedReady() { return finishedReady; }
        };
        return api;
    }


    let XAPI = null;

    function waitUntilFinishedReady() {
        return new Promise(resolve => {
            const check = () => {
                if (XAPI.finishedReady) {                    
                    resolve();
                } else {
                    setTimeout(check, 50); // ou use requestAnimationFrame(check) se preferir
                }
            };
            check();
        });
    }

    const APIRET = {
        create: (lang, email, token) => {
            let ready = false;
            let queue = [];        
            const runQueue = () => {
                queue.forEach(fn => fn());
                queue = [];
            };        
            (async () => {
                if (XAPI != null) {
                    await XAPI.stopCapture();
                }
                XAPI = new API();
                await XAPI.setLanguage(lang);
                await XAPI.create(email,token);
                await waitUntilFinishedReady();
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
