import { IAI } from './i_ai.js';

class IHUD {
    constructor() {
        this.spriteArea = document.getElementById('spritearea');
        this.list = [];
        this.menuActive = false;
        this.ai = new IAI();
    }

    isHover() {
        return $('#menu.activated:hover').length == 0 ? false : true;
    }

    getParameters(parameters) {
        if (parameters === undefined) parameters = {};
        parameters["fontFamily"] = parameters.hasOwnProperty("fontFamily") ? parameters["fontFamily"] : "Courier New";
        parameters["fontsize"] = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
        parameters["backgroundColor"] = parameters.hasOwnProperty("backgroundColor") ? parameters["backgroundColor"] : '#00000000';
        parameters["textColor"] = parameters.hasOwnProperty("textColor") ? parameters["textColor"] : '#ffffffff';
        return parameters;
    }

    closeMenu(menu) {
        var index;
        var timed = true;
        if (menu == null && this.list.length == 1) {
            index = 0;
            menu = this.list[index];
            timed = true;
        } else {
            index = this.list.indexOf(menu);
        }
        if (index != -1) {
            this.list.splice(index, 1);
            if (menu.parent) menu.parent.remove(menu);
            if (timed == true) {
                setTimeout(() => {
                    this.menuActive = false;
                }, 100);
            } else {
                this.menuActive = false;
            }
        }
    }

    async showMenu(object, options, position, parameters) {
        var oid = null;
        if (object != null) oid = typeof (object.id) == _UN ? null : object.id;
        if (this.menuActive == true) {
            return;
        };
        var data = $(`<div class="divmenu"><ul id="menu">
            <a class="menu-button icon-plus" id="open-menu" title="Show navigation"></a>
            <a id="closeMenu" class="menu-button icon-minus" title="Hide navigation">
            <i class="fa-solid fa-circle-xmark" style="margin-left: 10%;margin-top: 10%;"></i>
            </a></ul></div>`);
        $(this.spriteArea).append(data);
        var actions = [];
        switch (options) {
            case 'floor_click':
                actions.push({ icon: 'fa-solid fa-shoe-prints', ai: 'OBJ_MOVE' }); //walk to position act              
                break;
            case 'door_open':
                actions.push({ icon: 'fa-solid fa-door-open', ai: 'LOAD_SCENE' }); //door open act              
                actions.push({ icon: 'fa-solid fa-door-open', ai: 'LOAD_SCENE' });
                actions.push({ icon: 'fa-solid fa-door-open', ai: 'LOAD_SCENE' });
                actions.push({ icon: 'fa-solid fa-door-open', ai: 'LOAD_SCENE' });
                break;
            case 'stair_click':
                actions.push({ icon: 'fa-solid fa-stairs', ai: 'LOAD_SCENE' }); //door open act              
                break;
        }

        var mouseScreem = EVENTS.mousePos.y;

        for (var i = 0; i < actions.length; i++) {
            var act = actions[i];
            ai.hudActItens[i] = {
                ACT: act.ai,
                OBJID: oid,
                POS: position,
                PAR: parameters
            };
            var li = $('<li id="li' + i + '" class="menu-item"></li>');
            var la = $('<a id="' + i + 'amenu"><span class="' + act.icon + '"></span></a>').click(function () {
                ai.hudActAi(this.id);
            });
            $(li).append(la);
            $("#menu").append(li);
        }



        var ss = document.styleSheets[0];
        var rules = ss.cssRules || ss.rules;
        var step = 46 * actions.length;
        if (mouseScreem > 0.65) step += 360;

        for (var i = 0; i < actions.length; i++) {
            var xstep = Math.round(((46 * i) - (step / 2)) + 23);
            var cssnum = i + 3;
            for (var e = 0; e < rules.length; e++) {
                var rule = rules[e];
                if (rule.selectorText == "#menu.activated > .menu-item:nth-child(" + cssnum + ")") {
                    rule.style.transform = 'rotate(' + xstep + 'deg) translateY(-60px) rotate(' + (-xstep) + 'deg)';
                    rule.style.transitionDelay = (0.08 * i) + 's';
                }
            }
        }

        this.menuActive = true;
        var menu = await this.addElement(data, position, parameters);
        //onclose        
        $(menu.divObject, '#closeMenu').click(() => {
            ihud.closeMenu(menu);
        });
        //onshow        
        menu.onShow = (item) => {
            setTimeout(() => {
                item.onShow = null;
                //window.location.replace('#menu');
                $('#menu').addClass('activated');
            }, 100);
        }
    }

    async addElement(elemId, position, parameters) {
        parameters = this.getParameters(parameters);
        const divObject = $(elemId)[0];
        //$(this.spriteArea).append(divObject);               
        $(divObject).css({ 'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden' });
        divObject.textWidth = $(divObject).width();
        divObject.style.marginLeft = Math.round(-divObject.textWidth / 2) + 'px';
        $(divObject).css({ 'position': '', 'float': '', 'white-space': '', 'visibility': '' });
        const css2dObject = new CSS2D.Object(divObject);
        css2dObject.position.set(position.x, position.y, position.z);
        css2dObject.center.set(0, 1);
        css2dObject.visible = false;
        css2dObject.firstTime = true;
        css2dObject.divObject = divObject;
        scene.add(css2dObject);
        css2dObject.layers.set(0);
        this.list.push(css2dObject);
        return css2dObject;
    }

    async addText(message, position, parameters) {
        parameters = this.getParameters(parameters);
        const divObject = document.createElement('div');
        $(this.spriteArea).append(divObject);
        //earthDiv.className = 'label';
        divObject.innerHTML = message;
        divObject.style.backgroundColor = 'transparent';
        divObject.style.font = "Bold " + parameters.fontsize + "px " + parameters.fontFamily;
        divObject.style.color = parameters.textColor;
        divObject.style.backgroundColor = parameters.backgroundColor;
        $(divObject).css({ 'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden' });

        $('body').append(divObject);
        divObject.textWidth = $(divObject).width();
        $('body').remove(divObject);
        divObject.style.marginLeft = Math.round(-divObject.textWidth / 2) + 'px';

        $(divObject).css({ 'position': '', 'float': '', 'white-space': '', 'visibility': '' });
        const css2dObject = new CSS2D.Object(divObject);
        css2dObject.position.set(position.x, position.y, position.z);
        css2dObject.center.set(0, 1);
        css2dObject.visible = false;
        css2dObject.firstTime = true;
        css2dObject.divObject = divObject;
        scene.add(css2dObject);
        css2dObject.layers.set(0);
        this.list.push(css2dObject);
        return css2dObject;
    }

    update() {
        for (var i = 0; i < this.list.length; i++) {
            var item = this.list[i];
            if (typeof (item) != _UN && item != null) {
                if (item.firstTime == true) {
                    item.firstTime = false;
                    item.visible = true;
                }
                if (typeof (item.onShow) == 'function') {
                    item.onShow(item);
                }
            }
        }
    }

    clean() {
        for (var i = 0; i < this.list.length; i++) {
            var item = this.list[i];
            if (typeof (item) != _UN && item != null && item.divObject && item.divObject != null) {
                if (item.parent) item.parent.remove(item);
                $(item.divObject).remove();
            }
        }
        this.list = [];
        this.menuActive = false;
    }

}
export { IHUD }