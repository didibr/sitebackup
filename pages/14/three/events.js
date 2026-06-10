var EVENTS = {
    THREE:null,
    cssRender:undefined,
    _keyMap: {},//Keyboard Map Pressed
    _mouseBtMap: { left: 0, midle: 0, right: 0 },//Mouse buttons Map Pressed
    mousePos: null,
    mouseHPos: null,    
    onClick: null,
    onKeyUp: null,
    onKeyDown: null,
    arrows:[{inc:Math.PI},{inc:Math.PI},10],//used to joystick lerp (left right up dow)

    create: function (three,cssRender) {          
        this.THREE=three;  
        this.cssRender=cssRender;    
        EVENTS.mousePos = new this.THREE.Vector2();
        EVENTS.mouseHPos = new this.THREE.Vector2();
        EVENTS._bindEvents();
        EVENTS._startMouseCapture(true);
    },

    _bindEvents: function () {
        // Remove eventos anteriores (equivalente ao .off())
        window.removeEventListener('mousemove', EVENTS._onMouseMove);
        window.removeEventListener('keydown', EVENTS._onKeyDown);
        window.removeEventListener('keyup', EVENTS._onKeyUp);    
        // Adiciona eventos novamente
        window.addEventListener('mousemove', EVENTS._onMouseMove);
        window.addEventListener('keydown', EVENTS._onKeyDown);
        window.addEventListener('keyup', EVENTS._onKeyUp);
        // Função auxiliar para repassar eventos para o orbitCamera
        /*
        function eveBind(func, ev) {
            if (control.orbitCamera.events && control.orbitCamera.events[func]) {
                control.orbitCamera.events[func](ev);
            }
        }   
        */ 
       if(typeof(this.cssRender)!=="undefined"){
        const dom = this.cssRender.domElement;    
        dom.addEventListener('wheel', e => eveBind('onMouseWheel', e));
        dom.addEventListener('contextmenu', e => eveBind('onContextMenu', e));
        dom.addEventListener('pointerdown', e => eveBind('onPointerDown', e));
        dom.addEventListener('pointermove', e => eveBind('onPointerMove', e));
        dom.addEventListener('pointercancel', e => eveBind('onPointerCancel', e));
        dom.addEventListener('pointerup', e => eveBind('onPointerUp', e));
        dom.addEventListener('keydown', e => eveBind('onKeyDown', e));
       }
    },
    

    _unbindEvents: function () {        
        window.removeEventListener('mousemove', EVENTS._onMouseMove);
        window.removeEventListener('keydown', EVENTS._onKeyDown);
        window.removeEventListener('keyup', EVENTS._onKeyUp);
        // Redireciona o evento de ganho/perda de foco
        renderer.domElement.onmouseover = EVENTS._gainLostFocus;
        renderer2.domElement.onmouseover = EVENTS._gainLostFocus;
    }
    ,

    _onLostFocus: function (event) {
        EVENTS._unbindEvents();
        EVENTS.unpressKeys();
        EVENTS._mouseBtMap = { left: 0, midle: 0, right: 0, event: EVENTS._mouseBtMap.event };
    },

    _gainLostFocus: function (event) {
        EVENTS._bindEvents();
    },

    _onMouseMove: function (event) {
        // calculate mouse position in normalized device coordinates    
        var cbound = renderer.domElement.getBoundingClientRect();
        EVENTS.mousePos.x =
            ((event.clientX - cbound.left) / (cbound.right - cbound.left)) * 2 - 1;
        EVENTS.mousePos.y =
            -((event.clientY - cbound.top) / (cbound.bottom - cbound.top)) * 2 + 1;
        //used in playerlook        
        EVENTS.mouseHPos.x = (event.clientX - (window.innerWidth / 2));
        EVENTS.mouseHPos.y = (event.clientY - (window.innerHeight / 2));
        //-->ENGINE.GAME._onMouseMove(event);        
    },

    _onCanvasClick: function (event) {
        //Global Use
    },

    _onKeyDown: function (event) {
        event.preventDefault();
        EVENTS._keyMap[event.code] = true;        
        //---> ENGINE.GAME._onKeyDown(ENGINE._keyMap);
        if (typeof (EVENTS.onKeyDown) == 'function') EVENTS.onKeyDown(event.code);
    },

    _onKeyUp: function (event) {
        event.preventDefault();
        EVENTS._keyMap[event.code] = false;
        //ENGINE.GAME._onKeyUp(ENGINE._keyMap);
        if (typeof (EVENTS.onKeyUp) == 'function') EVENTS.onKeyUp(event.code);
    },

    _mouseButtonEvent: function (button, down) {//from transformcontrols pointer
        //original - event.button
        if (typeof (button) == _UN) return;
        if (button == 2)
            EVENTS._mouseBtMap.right = down == 1 ? 1 : 0;
        if (button == 1)
            EVENTS._mouseBtMap.midle = down == 1 ? 1 : 0;
        if (button == 0)
            EVENTS._mouseBtMap.left = down == 1 ? 1 : 0;
        //ENGINE._mouseBtMap.event = event;
        //---> EVENTS.GAME._mouseButtonEvent(ENGINE._mouseBtMap);
        if (typeof (EVENTS.onClick) == 'function') EVENTS.onClick(EVENTS._mouseBtMap);
    },

    _startMouseCapture: function (enabled) {
        const onMouseDown = function (e) {
            if (e.which === 1) {
                EVENTS._mouseButtonEvent(0, 1); // Botão esquerdo
            } else if (e.which === 3) {
                EVENTS._mouseButtonEvent(2, 1); // Botão direito
            }
        };
    
        const onMouseUp = function (e) {
            if (e.which === 1) {
                EVENTS._mouseButtonEvent(0, 0); // Botão esquerdo
            } else if (e.which === 3) {
                EVENTS._mouseButtonEvent(2, 0); // Botão direito
            }
        };
    
        if (enabled === true) {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
    
            document.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mouseup', onMouseUp);
        } else {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
    ,
}

export { EVENTS };