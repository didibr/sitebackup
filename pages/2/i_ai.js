class IAI {
    constructor() {
        this.hudActItens = [];
        this.cmdActivated = false;
        this.cmdEnabled = true;
    }

    checkCMD() {
    }

    commandDetected(cmd, percent) {        
       
    }

    onSTATUS(text) {
    }

    update() {
        this.checkCMD();
    }

    getActObject(eid) {
        var instruction = this.hudActItens[eid];
        if (typeof (instruction.OBJID) == _UN) return null;
        var obj = scene.getObjectById(instruction.OBJID);
        if (typeof (obj) == _UN) obj = null;
        return obj;
    }

    getActPos(eid) {
        var instruction = this.hudActItens[eid];
        if (typeof (instruction.POS) == _UN) return null;
        var pos = instruction.POS;
        if (typeof (pos.x) == _UN || typeof (pos.y) == _UN || typeof (pos.z) == _UN) return null;
        pos = new THREE.Vector3(pos.x, pos.y, pos.z);
        return pos;
    }

    hudActAi(element) {
        var eid = parseInt(element);
        var instruction = this.hudActItens[eid];
        var object;
        var position;
        switch (instruction.ACT) {
            case 'OBJ_MOVE': //######## OBJECT WALK TO POSITION  ##############
                if (instruction.PAR.PLAYER_ACT) {//use player as object
                    object = iplayer.players[0];
                    if (typeof (object) == _UN) return;
                } else {
                    object = this.getActObject(eid);
                    if (object == null) return;
                    if (!object.moveTo) return;
                }
                position = this.getActPos(eid);
                if (position == null) return;
                object.moveTo(position);
                break;
            case 'LOAD_SCENE': //######## LOAD NEW SCENE ##############            
                if (typeof (instruction.PAR.SCENE) != _UN) {
                    object = iplayer.players[0];
                    position = this.getActPos(eid);
                    if (typeof (object) == _UN || position == null) {
                        iscene.createScene(instruction.PAR.SCENE);
                    } else {
                        if (instruction.PAR.NAME) {
                            object.moveTo(instruction.PAR.NAME, () => { iscene.createScene(instruction.PAR.SCENE); });
                        } else {
                            object.moveTo(position, () => { iscene.createScene(instruction.PAR.SCENE); });
                        }

                    }
                }
                break;
        }
    }

    addCMD(cmd){
        var cmlist=this.phrases(cmd);
        for(var i=0;i<cmlist.length;i++){
            var cmdstr=cmlist[i].toLowerCase();            
            COMMAND.Module.cmd_add(cmdstr);
        }
    }

    phrases(original, test) {
       
    }
}

export { IAI }