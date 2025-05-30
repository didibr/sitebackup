ENGINE.EDITOR.TILE = {
    active: false,
    boxSelector:null,
    boxMaterial:null,

    close: function () {
        ENGINE.EDITOR.TILE.active = false;
        ENGINE._onCanvasClick = function (event) { };
        ENGINE.clear();
    },

    create: function () {
        ENGINE.clear();       
    },

    update: function (delta) {
        if (ENGINE.EDITOR.TILE.active == false) return;
    },

    boxOnSelected: function () {
        var stepsize = (GLOBAL.conf.height / 2);
        if (ENGINE.TILE.selected == null) {
            ENGINE.EDITOR.TILE.boxSelector.visible = false;
        } else {
            if (ENGINE.EDITOR.TILE.boxSelector == null) ENGINE.EDITOR.TILE.createBoxSelector();
            ENGINE.scene.add(ENGINE.EDITOR.TILE.boxSelector);
            var tile = ENGINE.EDITOR.TILE.boxSelector;
            tile.visible = true;           
            tile.position.copy(ENGINE.TILE.selected.parent.position);
            switch (ENGINE.TILE.selected.parent.group.type) {
                case 'B':
                    tile.position.y -= stepsize / 2;
                    break
                case 'C':
                    tile.position.y -= stepsize ;
                    break;
                case 'D':
                    tile.position.y += stepsize / 2;
                    break;
                case 'E':
                    tile.position.y += stepsize ;
                    break;                
            }
        }
        
    },

    _onCanvasClick: function (event) {
        console.log("click");
        if (ENGINE.EDITOR.TILE.active == false || ENGINE.TILE.focus == null) return;
        if (HELPER.isOnRay(ENGINE.TILE.focus) == true) {
            ENGINE.TILE.selected = ENGINE.TILE.focus;
            HELPER.blinkObject(ENGINE.TILE.selected);            
            ENGINE.EDITOR.TILE.boxOnSelected();
            //ENGINE.EDITOR.TILE.boxSelector.position.y -= 0.5;              
            GLOBAL.sendCOM('TILEEDITOR', 'TILECLICK', 
                JSON.stringify({group:ENGINE.TILE.selected.group}));
        }                
    },

    createBoxSelector:function(){
        if(ENGINE.EDITOR.TILE.boxMaterial==null){
            ENGINE.EDITOR.TILE.boxMaterial=new THREE.MeshBasicMaterial(
            { color: "Lime", side: 2, transparent: true, opacity: 0.5, wireframe: true });
            HELPER.addMaterial(ENGINE.EDITOR.TILE.boxMaterial);
        }        
        if(ENGINE.EDITOR.TILE.boxSelector==null){        
            ENGINE.EDITOR.TILE.boxSelector = new THREE.Mesh(new THREE.BoxGeometry(GLOBAL.conf.width,GLOBAL.conf.thickness, GLOBAL.conf.width, 1, 1), ENGINE.EDITOR.TILE.boxMaterial);
            HELPER.addObject(ENGINE.EDITOR.TILE.boxSelector);
            ENGINE.EDITOR.TILE.boxSelector.layers.enableAll();
        }        
    },

    add:function (data) {
        data = JSON.parse(data);
        var tile=ENGINE.scene.getObjectById(parseInt(data.id));
        if(typeof(tile)==_UN || typeof(tile.parent)==_UN || tile==null){
            GLOBAL.showMessage("Error","No Tile Selected");
            return;
        }        
        var elevation = parseInt(data.e);
        var pos=tile.parent.position;
        ENGINE.TILE.add(pos.x, pos.z, elevation);
        ENGINE.EDITOR.TILE.boxOnSelected();
    },

    remove: function () {
        if (ENGINE.TILE.selected == null) return;
        var tile = ENGINE.TILE.selected.parent;
        if (ENGINE.TILE.baseelevation == tile.group.elevation) {
            GLOBAL.showMessage("Error", "Can't remove base tile");
            return;
        }
        var dtile = tile.dtile;
        for (var i = 0; i < ENGINE.TILE.data.base.length; i++) {            
            if (ENGINE.TILE.data.base[i].group.id === tile.group.id) {
                ENGINE.TILE.data.base.splice(i, 1);
            }
        }
        if (tile.parent) {
            tile.parent.remove(tile);
        }
        ENGINE.TILE.selected = null;
        ENGINE.EDITOR.TILE.boxOnSelected();
    },

    change: function () {
        if (ENGINE.TILE.selected == null) return;
        var tile = ENGINE.TILE.selected.parent;
        var face = ENGINE.TILE.selected.group.face;
        var stepsize = (GLOBAL.conf.height / 2); // - (GLOBAL.conf.wallspessure / 4);

        var hyp = Math.sqrt(Math.pow(GLOBAL.conf.width, 2) + Math.pow(GLOBAL.conf.height, 2));
        var angle = (Math.pow(hyp, 2) + Math.pow(GLOBAL.conf.width, 2) - Math.pow(GLOBAL.conf.height, 2)) / (2 * hyp * GLOBAL.conf.width);
        var angledg = Math.acos(angle) / (Math.PI / 180);

        var hyp2 = Math.sqrt(Math.pow(GLOBAL.conf.width, 2) + Math.pow(GLOBAL.conf.height/2, 2));        
        var angle2 = (Math.pow(hyp2, 2) + Math.pow(GLOBAL.conf.width, 2) - Math.pow(GLOBAL.conf.height/2, 2)) / (2 * hyp2 * GLOBAL.conf.width);        
        var angledg2 = Math.acos(angle2) / (Math.PI / 180);

        var oldtile = tile;        
        switch (tile.group.type) {
            case 'A':
                ENGINE.scene.remove(tile);
                tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp2));                
                //tile.position.set(oldtile.dtile.pos.x, oldtile.dtile.pos.y, oldtile.dtile.pos.z);
                tile.position.set(oldtile.position.x, oldtile.position.y, oldtile.position.z);
                tile.position.y += stepsize / 2;                
                tile.rotation.x = THREE.Math.degToRad(angledg2);
                //tile.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), angledg2 * (Math.PI / 180));                
                tile.group = oldtile.group;
                tile.group.type = 'b';                
                for (var e = 0; e < oldtile.children.length; e++)                    
                    HELPER.updateTextureData(tile.children[e]);                
                ENGINE.TILE.selected = tile.children[face];                
                break
            case 'B':
                ENGINE.scene.remove(tile);
                tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp));
                tile.position.set(oldtile.position.x, oldtile.position.y, oldtile.position.z);
                tile.position.y += stepsize/2;                
                tile.rotation.x = THREE.Math.degToRad(angledg);                
                //tile.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), angledg * (Math.PI / 180));                
                tile.group = oldtile.group;
                tile.group.type = 'c';
                for (var e = 0; e < oldtile.children.length; e++)
                    HELPER.updateTextureData(tile.children[e]);
                ENGINE.TILE.selected = tile.children[face];
                break;
            case 'C':
                //tile.position.add(new THREE.Vector3(0, 0, stepsize));
                ENGINE.scene.remove(tile);
                tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp2));
                //tile.position.set(oldtile.dtile.pos.x, oldtile.dtile.pos.y, oldtile.dtile.pos.z);
                tile.position.set(oldtile.position.x, oldtile.position.y, oldtile.position.z);
                tile.position.y -= stepsize+(stepsize/2);
                tile.rotation.x = THREE.Math.degToRad(-angledg2);
                //tile.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -angledg2 * (Math.PI / 180));
                tile.group = oldtile.group;
                tile.group.type = 'd';
                for (var e = 0; e < oldtile.children.length; e++)
                    HELPER.updateTextureData(tile.children[e]);
                ENGINE.TILE.selected = tile.children[face];
                break;
            case 'D':
                //tile.position.sub(new THREE.Vector3(stepsize, 0, 0));
                ENGINE.scene.remove(tile);
                tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp));
                tile.position.set(oldtile.position.x, oldtile.position.y, oldtile.position.z);
                tile.position.y -= stepsize / 2;
                tile.rotation.x = THREE.Math.degToRad(-angledg);
                //tile.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -angledg * (Math.PI / 180));
                tile.group = oldtile.group;
                tile.group.type = 'e';
                for (var e = 0; e < oldtile.children.length; e++)
                    HELPER.updateTextureData(tile.children[e]);
                ENGINE.TILE.selected = tile.children[face];
                break;
            case 'E':
                //tile.position.sub(new THREE.Vector3(stepsize, 0, 0));
                ENGINE.scene.remove(tile);
                tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, GLOBAL.conf.width));
                tile.position.set(oldtile.position.x, oldtile.position.y, oldtile.position.z);
                tile.position.y += stepsize;
                tile.group = oldtile.group;
                tile.group.type = 'a';
                for (var e = 0; e < oldtile.children.length; e++)
                    HELPER.updateTextureData(tile.children[e]);
                ENGINE.TILE.selected = tile.children[face];
                break;
        }

        tile.dtile = oldtile.dtile;
        tile.group.type = tile.group.type.toUpperCase();
        tile.group.id = tile.id;

        var rotations = 0;
        if (tile.group.side == 'B') rotations = 1;
        if (tile.group.side == 'C') rotations = 2;
        if (tile.group.side == 'D') rotations = 3;
        for (var i = 0; i < rotations; i++)
            tile.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

        tile.dtile.group = tile.group;
        tile.dtile.pos = { x: tile.position.x, y: tile.position.y, z: tile.position.z };
        tile.dtile.rot = { x: tile.rotation.x, y: tile.rotation.y, z: tile.rotation.z };
    },

    rotate: function () {
        if (ENGINE.TILE.selected == null) return;
        var tile = ENGINE.TILE.selected.parent;
        //var stepsize = (GLOBAL.conf.width / 2);// - (GLOBAL.conf.wallspessure / 4);
        switch (tile.group.side) {
            case 'A':                                
                tile.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                tile.group.side = 'b';
                break
            case 'B':
                //tile.position.add(new THREE.Vector3(stepsize, 0, 0));
                tile.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                tile.group.side = 'c';
                break;
            case 'C':
                //tile.position.add(new THREE.Vector3(0, 0, stepsize));
                tile.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                tile.group.side = 'd';
                break;
            case 'D':
                //tile.position.sub(new THREE.Vector3(stepsize, 0, 0));
                tile.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                tile.group.side = 'a';
                break;
        }
        tile.group.side = tile.group.side.toUpperCase();         
        tile.dtile.group = tile.group;
        tile.dtile.pos = { x: tile.position.x, y: tile.position.y, z: tile.position.z };
        tile.dtile.rot = { x: tile.rotation.x, y: tile.rotation.y, z: tile.rotation.z };
        ENGINE.EDITOR.TILE.boxOnSelected();
    },

    createTiles: function (data) {
        data = JSON.parse(data);
        var tilex = parseInt(data.x);
        var tiley = parseInt(data.y);
        var elevation = parseInt(data.e);
        
        var camstepbackZ = (10 * tilex) / 2;
        var camstepbackX = (10 * tiley) / 2;
        var camelevation = (elevation * GLOBAL.conf.height);

        ENGINE.clear();
        ENGINE.TILE.data = new ENGINE.TILE.dataEmpty();
        ENGINE.WALL.data = new ENGINE.WALL.dataEmpty();
        ENGINE.debug.selection = true;
        ENGINE.LIGHT.addbaseLight();        
        ENGINE.renderer.setClearColor('black');
        ENGINE.EDITOR.TILE.active = true;
        ENGINE.TILE.data = new ENGINE.TILE.dataEmpty();
        ENGINE.WALL.data = new ENGINE.WALL.dataEmpty();
        ENGINE.OBJ.data = new ENGINE.OBJ.dataEmpty();
        ENGINE.TILE.createTiles(tilex, tiley, elevation);

        ENGINE.CAM.change(ENGINE.CAM.MODEL.ORBIT,
            new THREE.Vector3(camstepbackX - 5, 10+camelevation, camstepbackZ - 10),
            new THREE.Vector3(camstepbackX - 5, 0+camelevation, camstepbackZ - 5));
     
        $(ENGINE.canvObj).off("click").on("click", ENGINE.EDITOR.TILE._onCanvasClick);
        ENGINE.EDITOR.TILE.createBoxSelector();
    },

    
    

}