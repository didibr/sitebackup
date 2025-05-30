ENGINE.TILE = {
    defaulttexture: "ground.png",
    baseelevation: 0,
    focus: null, //mouse over
    selected: null, //mouse clicked
    datatile: class { //default data tile - onde salva 1 tile somente
        pos = { x: 0, y: 0, z: 0 };
        rot = { x: 0, y: 0, z: 0 };
        group = null;
    },
    dataEmpty: class { //default base tilemap - onde salva todos tiles
        base = [];
        name = "";
        baseelevation = 0;
    },
    data: null, //stored all data
    instanceBase: null,

    loadMap: function (data,option) {
        //data.name = map name        
        ENGINE.TILE.data = new ENGINE.TILE.dataEmpty();
        ENGINE.TILE.baseelevation = data.baseelevation;
        for (var i = 0; i < data.base.length; i++) {
            /*
            var group = data.base[i].group;
            var pos = new THREE.Vector3();
            var square = group.square.split('x');
            
            pos.y = (group.elevation * GLOBAL.conf.height);
            pos.x = (GLOBAL.conf.width * parseInt(square[0])) + GLOBAL.conf.separator;
            pos.z = (GLOBAL.conf.width * parseInt(square[1])) + GLOBAL.conf.separator;

            var tile = ENGINE.TILE.createTile(true);
            tile.position.copy(pos);
            tile.group = group;

            var dtile = new ENGINE.TILE.datatile();
            dtile.pos = data.base[i].pos;
            dtile.rot = data.base[i].rot;
            dtile.group = tile.group;
            tile.dtile = dtile;
            */

            var hyp = Math.sqrt(Math.pow(GLOBAL.conf.width, 2) + Math.pow(GLOBAL.conf.height, 2));
            var hyp2 = Math.sqrt(Math.pow(GLOBAL.conf.width, 2) + Math.pow(GLOBAL.conf.height / 2, 2));
            var group = data.base[i].group;
            var pos = new THREE.Vector3(data.base[i].pos.x, data.base[i].pos.y, data.base[i].pos.z);
            var rot = new THREE.Vector3(data.base[i].rot.x, data.base[i].rot.y, data.base[i].rot.z);
            var tile = null;
            switch (group.type) {
                case 'B':
                case 'D':
                    tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp2));
                    break;
                case 'C':
                case 'E':
                    tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, hyp));
                    break;
                case 'A':
                    tile = ENGINE.TILE.createTile(true, new THREE.Vector3(GLOBAL.conf.width, GLOBAL.conf.thickness, GLOBAL.conf.width));
                    break;
            }
            //tile = ENGINE.TILE.createTile(true);
            tile.position.copy(pos);
            tile.rotateX(rot.x);tile.rotateY(rot.y);tile.rotateZ(rot.z);
            //tile.rotation.setFromVector3(rot.x,rot.y,rot.z,'XYZ');
            tile.group = group;
            var dtile = new ENGINE.TILE.datatile();
            dtile.pos = data.base[i].pos;
            dtile.rot = data.base[i].rot;
            dtile.group = tile.group;
            tile.dtile = dtile;
            

            //clear
            ENGINE.TILE.data.base.push(dtile);

            for (var e = 0; e < 6; e++) {
                HELPER.updateTextureData(tile.children[e]);                
            }
            if (option && option == "RELEASE") {
                ENGINE.PHYSIC.insert(tile);
                HELPER.makeRelease(tile);
            }
        }
        if(option && option == "RELEASE")ENGINE.GAME.loadcomplete.push('TILE');
    },

    createTile: function (defaultTile, tam) {
        var basebox = new THREE.Group();
        basebox.group = { name: "Tile", type: "A", side: "A" }

       /* if (ENGINE.TILE.instanceBase !== null) {
            ENGINE.TILE.instanceBase.traverse(function (child) {
                if (child.isMesh) {
                    var plane = new THREE.InstancedMesh(child.geometry, child.material, 1);
                    plane.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                    basebox.add(plane);
                    plane.group = { name: "Tile", face: child.group.face, id: plane.id };
                    if (defaultTile == true) ENGINE.TILE.setTextureInstance(plane, GLOBAL.conf.tilepath + ENGINE.TILE.defaulttexture);
                }
            });            
            ENGINE.scene.add(basebox);
            return basebox;
        }*/

        const quat = new THREE.Quaternion();
        quat.set(0, 0, 0, 1);
        if (typeof (tam) == _UN) {
            tam = new THREE.Vector3();
            tam.set(GLOBAL.conf.width, GLOBAL.conf.thickness, GLOBAL.conf.width);
        }                        
        for (var i = 0; i < 6; i++) {            
            if (ENGINE.TILE.instanceBase == null) {                
                ENGINE.TILE.instanceBase = new THREE.PlaneGeometry(1, 1, 1, 1);
                ENGINE.TILE.instanceBase.computeVertexNormals();
            }
            var plane = new THREE.Mesh(ENGINE.TILE.instanceBase, HELPER.materials(i));
            //var plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), HELPER.materials(i));
            basebox.add(plane);
            plane.group = { name: "Tile", face: i, id: plane.id };
            plane.castShadow = true;
            plane.receiveShadow = true;
            if (defaultTile == true)HELPER.setTexture(plane, GLOBAL.conf.tilepath + ENGINE.TILE.defaulttexture);
            plane.material.side = 0;
            if (i == 0) {
                plane.scale.set(tam.x, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(180);
                plane.position.z -= tam.z / 2;
            }
            if (i == 1) {
                plane.scale.set(tam.x, tam.y, 1);
                plane.position.z = tam.z / 2;
            }
            if (i == 2) {
                plane.scale.set(tam.z, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(-90);
                plane.position.x -= tam.x / 2;
            }
            if (i == 3) {
                plane.scale.set(tam.z, tam.y, 1);
                plane.rotation.y = THREE.Math.degToRad(90);
                plane.position.x = tam.x / 2;
            }
            if (i == 4) {
                plane.scale.set(tam.x, tam.z, 1);
                plane.rotation.x = THREE.Math.degToRad(-90);
                plane.position.y = tam.y / 2;
            }
            if (i == 5) {
                plane.scale.set(tam.x, tam.z, 1);
                plane.rotation.x = THREE.Math.degToRad(90);
                plane.position.y -= tam.y / 2;
            }

        }
        
        ENGINE.scene.add(basebox);
        return basebox;
    },

    createTile2: function () {
        const quat = new THREE.Quaternion();
        const tam = new THREE.Vector3();
        quat.set(0, 0, 0, 1);
        tam.set(GLOBAL.conf.width, GLOBAL.conf.thickness, GLOBAL.conf.width);
        //var material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        //ENGINE.colectorMaterial.push(material);
        //material.transparent = true;
        //const texture = LOADER.textureLoader.load(ENGINE.url + "images/ground.png");
        //ENGINE.colectorTexture.push(texture);
        var basebox = new THREE.BoxBufferGeometry(1, 1, 1);

        var materials = [
            new THREE.MeshStandardMaterial({ color: "blue" }),
            new THREE.MeshStandardMaterial({ color: "red" }),
            new THREE.MeshStandardMaterial({ color: "yellow" }),//2
            new THREE.MeshStandardMaterial({ color: "lime" }),//3
            new THREE.MeshStandardMaterial({ color: "purple" }),
            new THREE.MeshStandardMaterial({ color: "gray" })
        ];

        //new THREE.PlaneGeometry(tam.x, tam.z, 1, 1);
        //new THREE.BoxGeometry(tam.x, tam.y, tam.z, 1, 1, 1);
        //var ammosize = new Ammo.btVector3(tam.x * 0.5, tam.y * 0.5, tam.z * 0.5);
        var tile = new THREE.Mesh(basebox, materials);
        HELPER.addObject(tile);
        tile.scale.set(tam.x, tam.y, tam.z);
        //var shape = new Ammo.btBoxShape(ammosize);    
        //shape.setMargin(0.5);
        //ENGINE.Physic.createRigidBody(tile, shape, 0, pos, quat);    
        tile.castShadow = false;
        tile.receiveShadow = true;
        //texture.wrapS = THREE.RepeatWrapping;
        //texture.wrapT = THREE.RepeatWrapping;
        //texture.repeat.set(40, 40);
        //tile.material.map = texture;
        //tile.material.needsUpdate = true;
        tile.group = { name: "Tile" };
        //tile.rotation.x = THREE.Math.degToRad(-90);
        HELPER.setTexture(tile, 2, GLOBAL.conf.tilepath + ENGINE.TILE.defaulttexture);
        HELPER.setTexture(tile, 3, GLOBAL.conf.tilepath + ENGINE.TILE.defaulttexture);
        ENGINE.scene.add(tile);
        return tile;
    },

    createTiles: function (cells, rows, elevation, startPosition) {
        var pos = new THREE.Vector3();
        if (typeof (startPosition) == _UN) {
            startPosition = new THREE.Vector3();
            startPosition.y = (elevation * GLOBAL.conf.height);
        }
        pos.y = startPosition.y;
        ENGINE.TILE.baseelevation = elevation;
        //var baseData = Array.from(Array(cells), () => new Array(rows));
        for (var i = 0; i < cells; i++) {
            for (var e = 0; e < rows; e++) {
                pos.x = (GLOBAL.conf.width * i) + GLOBAL.conf.separator + startPosition.x;
                pos.z = (GLOBAL.conf.width * e) + GLOBAL.conf.separator + startPosition.z;
                var tile = ENGINE.TILE.createTile(true);
                tile.group.square = i + 'x' + e;
                tile.group.id = tile.id;
                tile.group.elevation = elevation;
                tile.position.copy(pos);
                //texture.wrapS = THREE.RepeatWrapping;
                //texture.wrapT = THREE.RepeatWrapping;
                //texture.repeat.set(40, 40);
                //baseData[i][e] = tile;
                var dtile = new ENGINE.TILE.datatile();
                dtile.pos = { x: pos.x, y: pos.y, z: pos.z };
                dtile.rot = { x: tile.rotation.x, y: tile.rotation.y, z: tile.rotation.z };
                dtile.group = tile.group;
                tile.dtile = dtile;
                if (ENGINE.TILE.data == null) ENGINE.TILE.data = new ENGINE.TILE.dataEmpty();
                ENGINE.TILE.data.base.push(dtile);
            }
        }
        //ENGINE.base.data = baseTile;
    },

    add: function (x, z, elevation, pos) {
        if (typeof (pos) == _UN) {
            pos = new THREE.Vector3();
            pos.y = (elevation * GLOBAL.conf.height);
            pos.x = x;
            pos.z = z;
        } else {
            elevation = parseInt((pos / GLOBAL.conf.height));
        }

        var square = parseInt(pos.x / GLOBAL.conf.width) + 'x' + parseInt(pos.z / GLOBAL.conf.width);

        for (var i = 0; i < ENGINE.TILE.data.base.length; i++) {
            if (ENGINE.TILE.data.base[i].group.square == square &&
                ENGINE.TILE.data.base[i].group.elevation == elevation) {
                GLOBAL.showMessage("Error", "Tile already exists in this position");
                return;
            }
        }

        var tile = ENGINE.TILE.createTile(true);
        tile.group.square = square;
        tile.group.id = tile.id;
        tile.group.elevation = elevation;
        tile.position.copy(pos);
        //texture.wrapS = THREE.RepeatWrapping;
        //texture.wrapT = THREE.RepeatWrapping;
        //texture.repeat.set(40, 40);
        //baseData[i][e] = tile;
        var dtile = new ENGINE.TILE.datatile();
        dtile.pos = { x: pos.x, y: pos.y, z: pos.z };
        dtile.rot = { x: tile.rotation.x, y: tile.rotation.y, z: tile.rotation.z };
        dtile.group = tile.group;
        tile.dtile = dtile;
        if (ENGINE.TILE.data == null) ENGINE.TILE.data = new ENGINE.TILE.dataEmpty();
        ENGINE.TILE.data.base.push(dtile);
        ENGINE.TILE.selected = null;

    },

    


}