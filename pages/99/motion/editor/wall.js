ENGINE.EDITOR.WALL = {
    active: false,
    boxSelector: null,

    create: function () {
        ENGINE.EDITOR.WALL.createBoxSelector();
        $(ENGINE.canvObj).off("click").on("click", ENGINE.EDITOR.WALL._onCanvasClick);
    },

    boxOnSelected: function () {
        if (ENGINE.WALL.selected !== null) {
            ENGINE.scene.add(ENGINE.EDITOR.WALL.boxSelector);
            ENGINE.EDITOR.WALL.boxSelector.visible = true;
            ENGINE.EDITOR.WALL.boxSelector.position.copy(ENGINE.WALL.selected.parent.position);
            ENGINE.EDITOR.WALL.boxSelector.rotation.copy(ENGINE.WALL.selected.parent.rotation);
        } else {
            ENGINE.EDITOR.WALL.boxSelector.visible = false;
        }
    },

    _onCanvasClick: function (event) {
        if (ENGINE.EDITOR.WALL.active == false) return;
        if (HELPER.isOnRay(ENGINE.TILE.focus) == true) {
            ENGINE.TILE.selected = ENGINE.TILE.focus;
            ENGINE.scene.add(ENGINE.EDITOR.TILE.boxSelector);
            ENGINE.EDITOR.TILE.boxOnSelected();
        }
        if (ENGINE.WALL.focus == null) return;
        if (HELPER.isOnRay(ENGINE.WALL.focus) == true) {
            ENGINE.WALL.selected = ENGINE.WALL.focus;
            HELPER.blinkObject(ENGINE.WALL.selected);
            ENGINE.EDITOR.WALL.boxOnSelected();
            GLOBAL.sendCOM('WALLEDITOR', 'TILECLICK',
                JSON.stringify({ group: ENGINE.WALL.selected.group }));
        }
    },

    createWall: function () {
        if (ENGINE.TILE.selected == null || ENGINE.TILE.selected.parent == null) {
            GLOBAL.showMessage("Error", "No Tile Selected");
            return;
        }
        var group = ENGINE.TILE.selected.parent.group;
        var wall = ENGINE.WALL.createWall(true);
        wall.position.copy(ENGINE.TILE.selected.parent.position);
        var startpos = (GLOBAL.conf.width / 2);// - (GLOBAL.conf.wallspessure/4);
        wall.position.y = (group.elevation * GLOBAL.conf.height);
        wall.position.add(new THREE.Vector3(0, (GLOBAL.conf.height / 2), startpos));        
        wall.group.square = group.square;
        wall.group.elevation = group.elevation;
        wall.group.id = wall.id;
        var dwall = new ENGINE.WALL.datawall();
        dwall.pos = { x: wall.position.x, y: wall.position.y, z: wall.position.z };
        dwall.rot = { x: wall.rotation.x, y: wall.rotation.y, z: wall.rotation.z };
        dwall.group = wall.group;
        wall.dwall = dwall;
        if (ENGINE.WALL.data == null) ENGINE.WALL.data = new ENGINE.WALL.dataEmpty();
        ENGINE.WALL.data.base.push(dwall);

        ENGINE.WALL.selected = wall.children[4];
        ENGINE.EDITOR.WALL.boxOnSelected();        
    },

    createBoxSelector: function () {
        if (ENGINE.EDITOR.WALL.boxSelector == null) {
            var redmaterial = new THREE.MeshBasicMaterial(
                { color: "Red", side: 2, transparent: true, opacity: 0.5, wireframe: true });
            var boxgeo = new THREE.BoxGeometry(GLOBAL.conf.thickness, GLOBAL.conf.height, GLOBAL.conf.width, 1, 1, 1);
            ENGINE.EDITOR.WALL.boxSelector = new THREE.Mesh(boxgeo, redmaterial); //ENGINE.EDITOR.TILE.boxMaterial
            HELPER.addObject(ENGINE.EDITOR.WALL.boxSelector);
            ENGINE.EDITOR.WALL.boxSelector.layers.enableAll();
        }
    },

    rotate: function () {        
        if (ENGINE.WALL.selected == null) return;
        var wall = ENGINE.WALL.selected.parent;
        var stepsize = (GLOBAL.conf.width / 2);// - (GLOBAL.conf.wallspessure / 4);
        switch (wall.group.side) {
            case 'A':
                wall.position.sub(new THREE.Vector3(0, 0, stepsize));
                //wall.rotation.y = THREE.Math.degToRad(0);
                wall.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);                
                wall.group.side = 'b';
                break
            case 'B':
                wall.position.add(new THREE.Vector3(stepsize, 0, 0));
                //wall.rotation.y = THREE.Math.degToRad(-90);
                wall.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);                
                wall.group.side = 'c';
                break;
            case 'C':
                wall.position.add(new THREE.Vector3(0, 0, stepsize));
                //wall.rotation.y = THREE.Math.degToRad(180);
                wall.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                wall.group.side = 'd';
                break;
            case 'D':
                wall.position.sub(new THREE.Vector3(stepsize, 0, 0));
                //wall.rotation.y = THREE.Math.degToRad(90);
                wall.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                wall.group.side = 'a';
                break;
        }
        wall.group.side = wall.group.side.toUpperCase();
        switch (wall.group.side) {
            case 'A':
                wall.position.add(new THREE.Vector3(0, 0, stepsize));
                break
            case 'B':
                wall.position.sub(new THREE.Vector3(stepsize, 0, 0));
                break;
            case 'C':
                wall.position.sub(new THREE.Vector3(0, 0, stepsize));
                break;
            case 'D':
                wall.position.add(new THREE.Vector3(stepsize, 0, 0));
                break;
        }
        var dwall = wall.dwall;
        dwall.pos = { x: wall.position.x, y: wall.position.y, z: wall.position.z };
        dwall.rot = { x: wall.rotation.x, y: wall.rotation.y, z: wall.rotation.z };
        ENGINE.EDITOR.WALL.boxOnSelected();
    },

    change:function(){
       if (ENGINE.WALL.selected == null) return;
        var wall = ENGINE.WALL.selected.parent;
        var stepsize = (GLOBAL.conf.width / 2);// - (GLOBAL.conf.wallspessure / 4);
        function ifchange(wall,letra, proxima) {
            if (wall.group.type == letra) {
                ENGINE.WALL.change(wall, proxima);
                wall.group.type = proxima.toLowerCase();
            }
        }
        ifchange(wall, 'A', 'B');
        ifchange(wall, 'B', 'C');
        ifchange(wall, 'C', 'D');
        ifchange(wall, 'D', 'E');
        ifchange(wall, 'E', 'F');
        ifchange(wall, 'F', 'G');        
        ifchange(wall, 'G', 'H');
        ifchange(wall, 'H', 'I');
        ifchange(wall, 'I', 'J');
        ifchange(wall, 'J', 'A');
        wall.group.type = wall.group.type.toUpperCase();
    },

    remove: function () {
        if (ENGINE.WALL.selected == null) return;
        var wall = ENGINE.WALL.selected.parent;
        //var dwall=wall.dwall;        
        for (var i = 0; i < ENGINE.WALL.data.base.length; i++) {
            if (ENGINE.WALL.data.base[i].group.id === wall.group.id) {
                ENGINE.WALL.data.base.splice(i, 1);
            }
        }
        if (wall.parent) {
            wall.parent.remove(wall);
        }
        ENGINE.WALL.selected = null;
        ENGINE.EDITOR.WALL.boxOnSelected();
    },

}