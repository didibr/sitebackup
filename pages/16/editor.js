class Path {
    constructor() {
        this.segments = [];
        this.closed = false;
    }

    exportJSON() {
    return JSON.stringify([
        "Path",
        {
            segments: this.segments.map(s => [
                [s.point.x, s.point.y],
                s.handleIn ? [s.handleIn.x, s.handleIn.y] : null,
                s.handleOut ? [s.handleOut.x, s.handleOut.y] : null
            ]),
            closed: this.closed
        }
    ]);
}

    add(point, handleIn = null, handleOut = null) {
        this.segments.push({
            point,
            handleIn,
            handleOut
        });
    }

    getPoints() {
        return this.segments.map(s => s.point);
    }

    get length() {
        let len = 0;

        for (let i = 0; i < this.segments.length - 1; i++) {
            const a = this.segments[i].point;
            const b = this.segments[i + 1].point;

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            len += Math.hypot(dx, dy);
        }

        return len;
    }
}

class TrackEditor {
    constructor() {
        this.width = 600;
        this.height = 123;
        this.maxWidth = 3000;

        this.paths = [];
        this.currentPath = null;
        this.onSave = null;

        this.history = [];
        this.maxHistory = 150;
        this.data = null;

        this.mode = "draw";

        this.lineMode = 1; // 🔥 NOVO
    }

    debugCode(code) {
        try {
            // 🔥 1. decodifica
            const data = this.decodeBase64(code);

            // 🔥 2. cria canvas temporário
            const canvas = document.createElement("canvas");
            canvas.width = data.width;
            canvas.height = data.height;

            const ctx = canvas.getContext("2d");

            // fundo branco
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // 🔥 3. desenha paths manualmente
            data.paths.forEach(p => {
                const pathData = JSON.parse(p);

                ctx.beginPath();

                pathData[1].segments.forEach((seg, i) => {
                    let x, y;

                    if (Array.isArray(seg[0])) {
                        // formato normal [[x,y], handleIn, handleOut]
                        x = seg[0][0];
                        y = seg[0][1];
                    } else if (Array.isArray(seg)) {
                        // formato direto [x,y]
                        x = seg[0];
                        y = seg[1];
                    } else {
                        return; // ignora inválido
                    }

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });

                ctx.stroke();
            });

            // 🔥 4. cria overlay preview
            const overlay = document.createElement("div");
            Object.assign(overlay.style, {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000
            });

            // container
            const box = document.createElement("div");
            Object.assign(box.style, {
                background: "#222",
                padding: "10px",
                borderRadius: "8px",
                textAlign: "center"
            });

            // imagem
            const img = document.createElement("img");
            img.src = canvas.toDataURL();
            img.style.maxWidth = "90vw";
            img.style.maxHeight = "70vh";
            img.style.border = "1px solid #555";

            // botão fechar
            const close = document.createElement("button");
            close.innerText = "Close";
            close.style.marginTop = "10px";
            close.onclick = () => document.body.removeChild(overlay);

            box.appendChild(img);
            box.appendChild(close);
            overlay.appendChild(box);
            document.body.appendChild(overlay);

        } catch (e) {
            alert("Código inválido");
            console.error(e);
        }
    }

    open(onSaveCallback) {

        this.width = this.data?.width || 600;
        this.paths = [];
        this.history = [];
        this.mode = "draw";

        this.onSave = onSaveCallback;

        // =========================
        // 🔹 OVERLAY
        // =========================
        this.overlay = document.createElement("div");
        Object.assign(this.overlay.style, {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
        });

        // =========================
        // 🔹 POPUP
        // =========================
        const popup = document.createElement("div");
        Object.assign(popup.style, {
            background: "#222",
            padding: "10px",
            borderRadius: "8px",
            width: "80%",
            maxWidth: "620px",
            display: "flex",
            flexDirection: "column",
            overflow: "visible" // 🔥 IMPORTANTE (senão corta os botões)
        });

        // =========================
        // 🔹 TITLE
        // =========================
        this.title = document.createElement("div");
        this.title.innerText = "Track Editor";
        Object.assign(this.title.style, {
            color: "#fff",
            fontWeight: "bold",
            marginBottom: "8px"
        });

        // =========================
        // 🔹 SCROLL CONTAINER
        // =========================
        this.scrollContainer = document.createElement("div");
        Object.assign(this.scrollContainer.style, {
            overflowX: "auto",
            border: "1px solid #999",
            marginBottom: "10px",
            background: "#fff",
            position: "relative" // 🔥 NECESSÁRIO
        });

        // =========================
        // 🔹 TEXTAREA
        // =========================
        this.textArea = document.createElement("textarea");
        Object.assign(this.textArea.style, {
            width: "100%",
            height: this.height + "px",
            resize: "none",
            fontFamily: "monospace",
            fontSize: "12px",
            display: "none"
        });
        this.textArea.placeholder = "Past your Track Code";

        // =========================
        // 🔹 CANVAS
        // =========================
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // 🔥 WRAPPER (lado a lado)
        this.canvasArea = document.createElement("div");

        Object.assign(this.canvasArea.style, {
            display: "flex",
            alignItems: "flex-start",
            gap: "10px"
        });

        this.scrollContainer.appendChild(this.canvas);
        this.canvasArea.appendChild(this.createModeButtons()); // 🔥 BOTÕES
        this.canvasArea.appendChild(this.scrollContainer);

        // =========================
        // 🔹 PAPER INIT
        // =========================
        paper.setup(this.canvas);
        paper.project.clear();

        this.drawBackground();
        this.setupTool();
        this.saveHistory();

        // 🔥 BOTÕES MODE
        this.createModeButtons();

        // =========================
        // 🔥 RESTORE
        // =========================
        if (this.data && this.data.paths) {
            this.loadFromData(this.data);
        }

        // =========================
        // 🔹 BOTÕES
        // =========================
        const expandBtn = document.createElement("button");
        expandBtn.innerText = "Expand";
        expandBtn.classList.add("btn-expandir");
        expandBtn.onclick = () => this.expandCanvas();

        const undoBtn = document.createElement("button");
        undoBtn.innerText = "Undo";
        undoBtn.classList.add("btn-expandir");
        undoBtn.onclick = () => this.undo();

        const cancelBtn = document.createElement("button");
        cancelBtn.innerText = "Cancel";
        cancelBtn.classList.add("btn-expandir");
        cancelBtn.onclick = () => this.close();

        const loadBtn = document.createElement("button");
        loadBtn.innerText = "Load";
        loadBtn.classList.add("btn-expandir");
        loadBtn.onclick = () => this.enterLoadMode();

        const saveBtn = document.createElement("button");
        saveBtn.innerText = "Save";
        saveBtn.classList.add("btn-expandir");
        saveBtn.onclick = () => this.enterSaveMode();

        this.okBtn = document.createElement("button");
        this.okBtn.innerText = "OK";
        this.okBtn.classList.add("btn-expandir");
        this.okBtn.style.display = "none";
        this.okBtn.onclick = () => this.confirmJSON();

        // =========================
        // 🔹 FOOTER
        // =========================
        const footer = document.createElement("div");
        Object.assign(footer.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        });

        this.leftGroup = document.createElement("div");
        Object.assign(this.leftGroup.style, {
            display: "flex",
            gap: "10px"
        });
        this.leftGroup.appendChild(expandBtn);
        this.leftGroup.appendChild(undoBtn);

        this.rightGroup = document.createElement("div");
        Object.assign(this.rightGroup.style, {
            display: "flex",
            gap: "10px"
        });

        this.rightGroup.appendChild(cancelBtn);
        this.rightGroup.appendChild(loadBtn);
        this.rightGroup.appendChild(saveBtn);
        this.rightGroup.appendChild(this.okBtn);

        footer.appendChild(this.leftGroup);
        footer.appendChild(this.rightGroup);

        // =========================
        // 🔹 MONTAGEM
        // =========================
        popup.appendChild(this.title);
        popup.appendChild(this.canvasArea);
        popup.appendChild(this.textArea);
        popup.appendChild(footer);

        this.overlay.appendChild(popup);
        document.body.appendChild(this.overlay);

        this.saveHistory();
    }

    // =========================
    // 🔹 MODE BUTTONS
    // =========================
    createModeButtons() {

        const container = document.createElement("div");

        Object.assign(container.style, {
            display: "flex",
            flexDirection: "column",
            gap: "5px"
        });

        const createBtn = (label, mode) => {
            const btn = document.createElement("button");

            btn.innerText = label;

            Object.assign(btn.style, {
                width: "60px",
                height: "30px",
                background: "#222",
                color: "#fff",
                border: "1px solid #555",
                cursor: "pointer"
            });

            btn.onclick = () => {
                this.lineMode = mode;

                [...container.children].forEach(b => {
                    b.style.background = "#222";
                });

                btn.style.background = "#666";
            };

            return btn;
        };

        container.append(
            createBtn("Mode1", 1),
            createBtn("Mode2", 2),
            createBtn("Mode3", 3),
            createBtn("Mode4", 4)
        );

        container.children[0].style.background = "#666";

        this.modeContainer = container;

        return container;
    }

    applyLineMode(path) {
        switch (this.lineMode) {
            case 1:
                path.simplify(0.5);
                path.smooth({ type: "continuous" });
                path.simplify(1);
                break;

            case 2:
                path.simplify(2);
                path.smooth({ type: "continuous" });
                path.smooth({ type: "continuous" });
                break;

            case 3:
                path.simplify(10);
                break;

            case 4:
                path.simplify(10);
                path.smooth({ type: "continuous" });
                break;
        }
    }

    setupTool() {
        const tool = new paper.Tool();

        tool.onMouseDown = (event) => {
            this.currentPath = new paper.Path({
                strokeColor: "black",
                strokeWidth: 3,
                strokeCap: "round",
                strokeJoin: 'round',
                fullySelected: true
            });

            this.currentPath.add(event.point);
        };

        tool.onMouseDrag = (event) => {
            this.currentPath.add(event.point);
        };

        tool.onMouseUp = () => {
            if (!this.currentPath) return;

            this.applyLineMode(this.currentPath);

            // 🔥 evita path lixo
            if (this.currentPath.segments.length > 1) {
                this.paths.push(this.currentPath);
            } else {
                this.currentPath.remove();
            }

            this.currentPath = null;

            this.saveHistory();
        };
    }

    // =========================
    // 🔹 JSON MODE
    // =========================
    switchToJSON() {
        this.scrollContainer.style.display = "none";
        this.canvasArea.style.display = "none";
        this.textArea.style.display = "block";

        this.leftGroup.style.display = "none";

        //if (this.modeContainer)
        this.modeContainer.style.display = "none";

        [...this.rightGroup.children].forEach(btn => {
            btn.style.display = "none";
        });

        const cancelBtn = [...this.rightGroup.children].find(
            b => b.innerText === "Cancel"
        );

        if (cancelBtn) cancelBtn.style.display = "block";

        this.okBtn.style.display = "block";


    }

    // =========================
    // 🔹 RESTO ORIGINAL (SEM ALTERAÇÃO)
    // =========================

    encodeBase64(data) {
        return LZString.compressToBase64(JSON.stringify(data));
    }

    decodeBase64(str) {
        const json = LZString.decompressFromBase64(str);
        if (!json) throw new Error("invalid");
        return JSON.parse(json);
    }

    enterSaveMode() {
        this.title.innerText = "Track Editor - Code";
        this.mode = "save";

        const data = this.getData();
        this.textArea.value = this.encodeBase64(data);

        this.switchToJSON();
    }

    enterLoadMode() {
        this.title.innerText = "Track Editor - Code";
        this.mode = "load";
        this.textArea.value = "";

        this.switchToJSON();
    }

    confirmJSON() {
        if (this.mode === "save") {
            this.saveFinal();
            return;
        }

        if (this.mode === "load") {
            try {
                const data = this.decodeBase64(this.textArea.value);
                this.loadFromData(data);
                this.saveFinal();
            } catch (e) {
                alert("Invalid Code");
            }
        }
    }

    getData() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            paths: this.paths.map(p => p.exportJSON())
        };
    }

    loadFromData(data) {
        this.data = data;

        this.canvas.width = data.width;
        this.width = data.width;

        paper.setup(this.canvas);
        paper.project.clear();

        this.drawBackground();

        this.paths = [];

        data.paths.forEach(json => {
            const path = new paper.Path();
            path.importJSON(json);

            path.strokeColor = "black";
            path.strokeWidth = 3;
            path.strokeCap = "round";
            path.strokeJoin = "round";

            this.paths.push(path);
        });

        paper.view.update();
    }

    loadPathsFromData(data) {
    this.data = data;
    this.width = data.width;

    this.paths = [];

    for (const json of data.paths) {

        let parsed;

        if (typeof json === "string") {
            parsed = JSON.parse(json);
        } else {
            parsed = json;
        }

        const path = new Path();

        const info = parsed[1] || {};
        const segments = info.segments || [];

        path.closed = !!info.closed;

        for (const seg of segments) {

            const p = seg[0];
            const handleIn = seg[1] || null;
            const handleOut = seg[2] || null;

            if (!p) continue;

            path.add(
                { x: p[0], y: p[1] },
                handleIn ? { x: handleIn[0], y: handleIn[1] } : null,
                handleOut ? { x: handleOut[0], y: handleOut[1] } : null
            );
        }

        this.paths.push(path);
    }

    return this.paths;
}


convertPathsToPoints(paths) {
    const linhas = [];

    for (const path of paths) {

        if (!path.segments || path.segments.length < 2) continue;

        const points = path.segments.map(s => ({
            x: s.point.x,
            y: s.point.y
        }));

        linhas.push(points);
    }

    return linhas;
}

    saveFinal() {
        const data = this.getData();

        if (this.onSave) {
            this.onSave({
                canvas: this.canvas,
                paths: this.paths,
                data
            });
        }

        this.close();
    }

    saveHistory() {
        const data = paper.project.exportJSON({ asString: true });

        this.history.push(data);

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    drawBackground() {
        // remove qualquer fundo antigo
        const oldBg = paper.project.activeLayer.children.find(i => i.data?.isBackground);
        if (oldBg) oldBg.remove();

        const bg = new paper.Path.Rectangle({
            point: [0, 0],
            size: [this.canvas.width, this.canvas.height],
            fillColor: "white"
        });

        // 🔥 marca como background
        bg.data.isBackground = true;

        // 🔥 trava o item (não selecionável / editável)
        bg.locked = true;

        // 🔥 manda pra trás
        bg.sendToBack();
    }

    expandCanvas() {
        if (this.width >= this.maxWidth) return;

        const newWidth = Math.min(this.width + 200, this.maxWidth);

        // 🔥 pega direto do project (fonte real)
        const pathsData = paper.project.activeLayer.children
            .filter(item =>
                item instanceof paper.Path &&
                item.segments.length > 1 &&
                !item.data?.isBackground
            )
            .map(p => p.exportJSON());

        // resize
        this.canvas.width = newWidth;
        this.width = newWidth;

        // reset
        paper.setup(this.canvas);
        paper.project.clear();

        // fundo
        this.drawBackground();

        // recria paths
        this.paths = [];

        pathsData.forEach(json => {
            const path = new paper.Path();
            path.importJSON(json);

            path.strokeColor = "black";
            path.strokeWidth = 3;
            path.strokeCap = "round";
            path.strokeJoin = "round";

            // 🔥 segurança extra
            if (path.segments.length > 1) {
                this.paths.push(path);
            } else {
                path.remove();
            }
        });

        paper.view.update();

        this.saveHistory();
    }

    undo() {

        if (this.history.length <= 1) return;

        this.history.pop();
        const last = this.history[this.history.length - 1];

        paper.project.clear();
        paper.project.importJSON(last);

        // 🔥 reconstrói corretamente (ignorando fundo)
        this.paths = [];

        paper.project.activeLayer.children.forEach(item => {
            if (
                item instanceof paper.Path &&
                item.segments.length > 1 && // 🔥 evita lixo
                !item.data?.isBackground
            ) {
                this.paths.push(item);
            }
        });

        // 🔥 SEMPRE recria fundo por último
        this.drawBackground();

        paper.view.update();
    }

    close() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

export default TrackEditor;