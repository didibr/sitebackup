ENGINE.WALL = {
    focus: null, //mouse over
    selected: null, //mouse clicked
    datawall: class { //default data tile - onde salva 1 tile somente
        pos = { x: 0, y: 0, z: 0 };
        rot = { x: 0, y: 0, z: 0 };
        group = null;
    },
    dataEmpty: class { //default base tilemap - onde salva todos tiles
        base = [];
        name = "";
    },
    data: null, //stored all data

    loadMap: function(data,option) {
        ENGINE.WALL.data = new ENGINE.WALL.dataEmpty();
        for (var i = 0; i < data.base.length; i++) {
            var pos = new THREE.Vector3(data.base[i].pos.x, data.base[i].pos.y, data.base[i].pos.z);
            var rot = new THREE.Vector3(data.base[i].rot.x, data.base[i].rot.y, data.base[i].rot.z);
            var wall = ENGINE.WALL.createWall();
            wall.position.copy(pos);
            wall.rotation.y = THREE.Math.degToRad(0);
            wall.rotateX(rot.x); wall.rotateY(rot.y); wall.rotateZ(rot.z);
            wall.group = data.base[i].group;

            var dwall = new ENGINE.WALL.datawall();
            dwall.pos = { x: pos.x, y: pos.y, z: pos.z };
            dwall.rot = { x: rot.x, y: rot.y, z: rot.z };
            dwall.group = wall.group;
            wall.dwall = dwall;
            ENGINE.WALL.data.base.push(dwall);

            if (wall.group.type && wall.group.type != 'A') {
                ENGINE.WALL.change(wall, wall.group.type);
            }
            if (typeof (wall.group.texture)==_UN)wall.group.texture = [];
            for (var e = 0; e < 6; e++) {
                if (typeof (wall.group.texture[e]) == _UN) wall.group.texture[e] = new GLOBAL.baseTexture();
                wall.children[e].group.texture = wall.group.texture[e];
                HELPER.aplyTexture(wall.children[e], wall.group.texture[e].file);                
            }            
            if (option && option == "RELEASE") {
                ENGINE.PHYSIC.insert(wall);
                HELPER.makeRelease(wall);
            }
        }
        if (option && option == "RELEASE") ENGINE.GAME.loadcomplete.push('WALL');
    },



    change: function(wall, type) {
        /*
0 - canto superior esquerdo
1 - canto superior direito
2 - canto inferior esquerdo
3 - canto inferior direito
(0.5,0.5,0) __ (-0.5,0.5,0)
(0.5,-0.5,0)__(-0.5,-0.5,0)
         */
        if (typeof (wall) == _UN) return;
        function wallface(num) {
            for (var i = 0; i < wall.children.length; i++) {
                if (wall.children[i].group && wall.children[i].group.face == num) {
                    return wall.children[i];
                }
            }
        }        
        function extr(num, array, left, top,holes) {
            var shapex = new THREE.Shape();
            var extrudeSettingsx = extrudeSettings = { depth: 0, bevelEnabled: false, bevelSegments: 0, steps: 1, bevelSize: 0, bevelThickness: 0 };
            for (var i = 0; i < array.length; i++) {
                if (i == 0) { shapex.moveTo(array[i][0], array[i][1]); }
                else { shapex.lineTo(array[i][0], array[i][1]);}
            }
            if (typeof (holes) != _UN) {
                var hole = new THREE.Shape()
                for (var i = 0; i < holes.length; i++) {
                    if (i == 0) { hole.moveTo(holes[i][0], holes[i][1]); }
                    else { hole.lineTo(holes[i][0], holes[i][1]); }
                }                
                shapex.holes.push(hole);
            } 
            wallface(num).geometry = new THREE.ExtrudeGeometry(shapex, extrudeSettingsx);
            wallface(num).position.z = left;
            wallface(num).position.y = top;
        }
        function resetWall() {
            wallface(4).visible = true;
            wallface(3).geometry.attributes.position.setZ(0, 0);
            wallface(3).geometry.attributes.position.setZ(1, 0);
            wallface(3).geometry.attributes.position.setY(0, 0.5);
            wallface(3).geometry.attributes.position.setY(1, 0.5);
            wallface(2).geometry.attributes.position.setZ(0, 0);
            wallface(2).geometry.attributes.position.setZ(1, 0);
            wallface(2).geometry.attributes.position.setY(0, 0.5);
            wallface(2).geometry.attributes.position.setY(1, 0.5);
            wallface(4).geometry.attributes.position.setZ(0, 0);
            wallface(4).geometry.attributes.position.setZ(1, 0);
            wallface(4).geometry.attributes.position.setZ(2, 0);
            wallface(4).geometry.attributes.position.setZ(3, 0);
        }
        //wall.clear();
        var steph = GLOBAL.conf.height / 2;
        var stepw = GLOBAL.conf.width;
        var extrudeSettings = extrudeSettings = { depth: 0, bevelEnabled: false, bevelSegments: 0, steps: 1, bevelSize: 0, bevelThickness: 0 };
        var shape;
        switch (type) {
            case 'A':
                resetWall();
                extr(0, [[1, 0], [1, 1], [0, 1], [0, 0], [1, 0]], -(stepw / 2), -steph);
                extr(1, [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], (stepw / 2), -steph);
                break;
            case 'B':
                resetWall();
                wallface(4).visible = true;                
                wallface(2).geometry.attributes.position.setY(0, 0);
                wallface(2).geometry.attributes.position.setY(1, 0);
                wallface(4).geometry.attributes.position.setZ(0, -steph);
                wallface(4).geometry.attributes.position.setZ(1, -steph);                
                extr(0, [[1, 0], [1, 1], [0, 0.5], [0, 0], [1, 0]], -(stepw / 2), -steph);                
                extr(1, [[0, 0], [0, 1], [1, 0.5], [1, 0], [0, 0]], (stepw / 2), -steph);
                break;
            case 'C':
                resetWall();
                wallface(4).visible = true;                                              
                wallface(3).geometry.attributes.position.setY(0, 0);
                wallface(3).geometry.attributes.position.setY(1, 0);
                wallface(4).geometry.attributes.position.setZ(2, -steph);
                wallface(4).geometry.attributes.position.setZ(3, -steph);
                extr(1, [[1, 0], [1, 1], [0, 0.5], [0, 0], [1, 0]], (stepw / 2), -steph);
                extr(0, [[0, 0], [0, 1], [1, 0.5], [1, 0], [0, 0]], -(stepw / 2), -steph);               
                break;
            case 'D':
                resetWall();
                wallface(4).visible = false;                  
                wallface(2).geometry.attributes.position.setZ(0, -stepw);
                wallface(2).geometry.attributes.position.setZ(1, -stepw);
                extr(0, [[1, 0], [1, 1], [0, 0], [1, 0]], -(stepw / 2), -steph);
                extr(1, [[0, 0], [0, 1], [1, 0], [0, 0]], (stepw / 2), -steph);
                break;
            case 'E':
                resetWall();
                wallface(4).visible = false;    
                wallface(3).geometry.attributes.position.setZ(0, -stepw);
                wallface(3).geometry.attributes.position.setZ(1, -stepw);
                extr(1, [[1, 0], [1, 1], [0, 0], [1, 0]], (stepw / 2), -steph);
                extr(0, [[0, 0], [0, 1], [1, 0], [0, 0]], -(stepw / 2), -steph);
                break;
            case 'F':
                resetWall();
                wallface(4).visible = false;                                            
                wallface(2).geometry.attributes.position.setZ(0, -stepw);
                wallface(2).geometry.attributes.position.setZ(1, -stepw);
                wallface(2).geometry.attributes.position.setY(0, 0);
                wallface(2).geometry.attributes.position.setY(1, 0);
                wallface(3).geometry.attributes.position.setY(0, 0);
                wallface(3).geometry.attributes.position.setY(1, 0);
                extr(0, [[1, 0], [1, 0.5], [0, 0], [1, 0]], -(stepw / 2), -steph);
                extr(1, [[0, 0], [0, 0.5], [1, 0], [0, 0]], (stepw / 2), -steph);

                break;
            case 'G':
                resetWall();
                wallface(4).visible = false;                                                                      
                wallface(3).geometry.attributes.position.setZ(0, -stepw);
                wallface(3).geometry.attributes.position.setZ(1, -stepw);
                wallface(3).geometry.attributes.position.setY(0, 0);
                wallface(3).geometry.attributes.position.setY(1, 0);
                wallface(2).geometry.attributes.position.setY(0, 0);
                wallface(2).geometry.attributes.position.setY(1, 0);
                extr(1, [[1, 0], [1, 0.5], [0, 0], [1, 0]], (stepw / 2), -steph);
                extr(0, [[0, 0], [0, 0.5], [1, 0], [0, 0]], -(stepw / 2), -steph);
                break;
            case 'H':
                resetWall();
                wallface(4).visible = true;               
                extr(0, [[1, 0],  [1, 1],    [0, 1],    [0, 0],  [1, 0]], -(stepw / 2), -steph,
                        [[0.75,0], [0.75,0.9], [0.25,0.9], [0.25,0], [0.75,0]]);
                extr(1, [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], (stepw / 2), -steph,
                        [[0.75, 0], [0.75, 0.9], [0.25, 0.9], [0.25, 0], [0.75, 0]]);
                break;
            case 'I':
                resetWall();
                wallface(4).visible = true;                
                extr(0, [[1, 0], [1, 1], [0, 1], [0, 0], [1, 0]], -(stepw / 2), -steph,
                    [[0.75, 0.4], [0.75, 0.8], [0.25, 0.8], [0.25, 0.4], [0.75, 0.4]]);
                extr(1, [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], (stepw / 2), -steph,
                    [[0.75, 0.4], [0.75, 0.8], [0.25, 0.8], [0.25, 0.4], [0.75, 0.4]]);
                break;
            case 'J':
                resetWall();
                wallface(4).visible = true;
                wallface(3).geometry.attributes.position.setY(0, 0);
                wallface(3).geometry.attributes.position.setY(1, 0);
                wallface(2).geometry.attributes.position.setY(0, 0);
                wallface(2).geometry.attributes.position.setY(1, 0);
                wallface(4).geometry.attributes.position.setZ(0, -steph);
                wallface(4).geometry.attributes.position.setZ(1, -steph);
                wallface(4).geometry.attributes.position.setZ(2, -steph);
                wallface(4).geometry.attributes.position.setZ(3, -steph);
                extr(0, [[1, 0], [1, 0.5], [0, 0.5], [0, 0], [1, 0]], -(stepw / 2), -steph);
                extr(1, [[0, 0], [0, 0.5], [1, 0.5], [1, 0], [0, 0]], (stepw / 2), -steph);
                break;
        }
        for (var i = 0; i < wall.children.length; i++)
            wallface(i).geometry.attributes.position.needsUpdate = true;
    },

    createWall: function(defaultTile, type) {
        const quat = new THREE.Quaternion();
        const tam = new THREE.Vector3();
        quat.set(0, 0, 0, 1);
        tam.set(GLOBAL.conf.thickness, GLOBAL.conf.height, GLOBAL.conf.width);
        var basebox = new THREE.Group();
        if (typeof (type) == _UN) type = "A";
        basebox.group = { name: "Wall", side: "A", type: type }
        for (var i = 0; i < 6; i++) {
            var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1, 1, 1), HELPER.materials(i));
            plane.castShadow = true;
            plane.receiveShadow = true;
            basebox.add(plane);
            plane.group = { name: "Wall", face: i, id: plane.id };
            if (defaultTile == true) HELPER.setTexture(plane, GLOBAL.conf.tilepath + ENGINE.TILE.defaulttexture);
            plane.material.side = 0;
            if (i == 0) { //face 1
                plane.scale.set(tam.z, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(-90);
                plane.position.x -= tam.x / 2;
            }
            if (i == 1) { //face 2
                plane.scale.set(tam.z, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(90);
                plane.position.x = tam.x / 2;
            }
            if (i == 2) { //borda esq
                plane.scale.set(tam.x, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(180);
                plane.position.z -= tam.z / 2;
            }
            if (i == 3) { //borda dir
                plane.scale.set(tam.x, tam.y, 1);
                plane.position.z = tam.z / 2;
            }
            if (i == 4) { //borda sup
                plane.scale.set(tam.x, tam.z, 1);
                plane.rotation.x = THREE.Math.degToRad(-90);
                plane.position.y = tam.y / 2;
            }
            if (i == 5) { //borda inf
                plane.scale.set(tam.x, tam.z, 1);
                plane.rotation.x = THREE.Math.degToRad(90);
                plane.position.y -= tam.y / 2;
            }

        }
        basebox.rotation.y = THREE.Math.degToRad(90);
        ENGINE.scene.add(basebox);
        return basebox;
    },



   


}