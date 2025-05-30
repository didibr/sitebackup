var PLAYERFN;

class PLAYER {
    constructor() {
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible:false });
        this.material2 = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.material3 = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        this.raycaster1 = new THREE.Raycaster(); //used in nearObjects
        //this.raycaster1 = new THREE.Raycaster(); //bottom
        //this.raycaster2 = new THREE.Raycaster(); //half bottom
        //this.raycaster3 = new THREE.Raycaster(); //half top
        //this.raycaster4 = new THREE.Raycaster(); //top
        this.players = [];
        this.motionList = null;
        this.gridsize = 5;
        this.gridheight = 58;
        this.grid = null;
        this.finder = new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true });        
        PLAYERFN = this;
        this.DEBUG=false;
    }

    async construct() {
        await fetch('./players/motions.json')
            .then(response => response.json())
            .then(json => this.motionList = json);
    }

    async updateFloor() {
        var floor = scene.getObjectByName('room_floor');
        if (typeof (floor) == _UN) {
            this.grid = null;
            return;
        }
        var floorsize = new THREE.Vector3();
        new THREE.Box3().setFromObject(floor).getSize(floorsize);
        var floorrealposition = new THREE.Vector3();
        floor.getWorldPosition(floorrealposition)
        var gridsize = this.gridsize;
        var gridheight = this.gridheight;
        var gridsteps = new THREE.Vector2(Math.round(floorsize.x / gridsize) + 1, Math.round(floorsize.z / gridsize) + 1);
        const geometry = new THREE.BoxGeometry(gridsize, gridheight, gridsize, 1);
        var boxgrid = new THREE.Mesh(geometry, this.material);        
        this.grid = new PF.Grid(gridsteps.x, gridsteps.y);
        

        scene.traverse((child) => {
            if (child && child.isSceneObj) {
                var boxObject = new THREE.Box3();
                boxObject.setFromObject(child);
                var tam = new THREE.Vector3();
                boxObject.applyMatrix4(child.matrixWorld);
                boxObject.getSize(tam);
                var pos = new THREE.Vector3();
                child.getWorldPosition(pos);
                var gg1 = new THREE.BoxGeometry(tam.x, tam.y, tam.z, 1);                
                var gg2 = new THREE.Mesh(gg1, this.material);                
                if(child.sceneSca){
                    gg2.scale.set(child.sceneSca.x,child.sceneSca.y,child.sceneSca.z);
                    gg2.updateMatrix();
                }
                if(child.scenePosFix){
                    pos.add(new THREE.Vector3(child.scenePosFix.x,child.scenePosFix.y,child.scenePosFix.z));
                }
                //scene.add(gg2);                
                gg2.position.copy(pos);                
                boxObject = new THREE.Box3();
                boxObject.setFromObject(gg2);

                if(this.DEBUG==true){
                var gg3 = new THREE.SphereGeometry(gridsize,10, 10);//entrance position 
                var pos2=pos.clone();
                if(child.scenePos){
                    pos2.x+=child.scenePos.x;
                    pos2.y+=child.scenePos.y;
                    pos2.z+=child.scenePos.z;
                }
                gg3=new THREE.Mesh(gg3, this.material3);
                scene.add(gg3);
                gg3.position.copy(pos2);   
                }

                var boxEmptObject=null;
                if(child.isSceneObjEmpty){ //empty objects
                    boxObject.getSize(tam);
                    gg1.dispose();
                    gg1 = new THREE.BoxGeometry(tam.x- (gridsize*2), tam.y, tam.z-(gridsize*2), 1);                
                    gg2 = new THREE.Mesh(gg1, this.material);  
                    gg2.position.copy(pos);
                    boxEmptObject= new THREE.Box3();
                    boxEmptObject.setFromObject(gg2);
                }
                
                for (var i = 0; i < gridsteps.x; i++) {
                    for (var e = 0; e < gridsteps.y; e++) {                     
                        var gridbox = boxgrid.clone();
                        gridbox.position.set(
                            (-floorsize.x / 2) + (gridsize * i) ,
                            floorrealposition.y + 4 + (gridheight / 2),
                            (-floorsize.z / 2) + (gridsize * e) ,
                        );
                        this.grid.nodes[e][i].position = { x: gridbox.position.x, y: gridbox.position.z };                        
                        //scene.add(gridbox);
                        gridbox.geometry.computeBoundingBox();
                        var boxGrid = new THREE.Box3();
                        boxGrid.setFromObject(gridbox);
                        gg1.dispose();
                        gridbox.geometry.dispose();
                        //box2.applyMatrix4( gridbox.matrixWorld );
                        if (boxGrid.intersectsBox(boxObject) || i == 0 || i == gridsteps.x - 1 || e == 0 || e == gridsteps.y - 1) {                            
                                if(boxEmptObject==null || !boxGrid.intersectsBox(boxEmptObject)){
                                    gridbox.material = this.material2;
                                    this.grid.nodes[e][i].walkable = false;
                                }                                                                                       
                        }

                    }
                }

            }
        });
        if (this.DEBUG==true) { //DEBUG PATHFINDER GRID
            const geometry2 = new THREE.BoxGeometry(this.gridsize, 0.5, this.gridsize, 1);
            boxgrid = new THREE.Mesh(geometry2, this.material);
            for (var i = 0; i < this.grid.width; i++) {
                for (var e = 0; e < this.grid.height; e++) {
                    var node = this.grid.nodes[e][i];
                    var gbox = boxgrid.clone();
                    scene.add(gbox);
                    gbox.position.y = -20;
                    gbox.position.x = node.position.x;
                    gbox.position.z = node.position.y;
                    gbox.name = 'GRIDBOX' + e + '-' + i;
                    if (node.walkable == false) gbox.material = this.material2;
                }
            }
        }
        geometry.dispose();
    }

    positiontoGridPoint(posXY) {
        if (typeof (posXY.x) != _UN) {
            posXY = { x: posXY.x, y: posXY.z };
        }
        var squarewidth = this.gridsize;
        var ipos = new THREE.Vector2();
        var fpos = new THREE.Vector2();
        for (var i = 0; i < this.grid.width; i++) {
            for (var e = 0; e < this.grid.height; e++) {
                var node = this.grid.nodes[e][i];
                ipos.x = node.position.x - (squarewidth / 2);
                ipos.y = node.position.y - (squarewidth / 2);
                fpos.x = node.position.x + (squarewidth / 2);
                fpos.y = node.position.y + (squarewidth / 2);
                if (posXY.x >= ipos.x && posXY.y >= ipos.y) {
                    if (posXY.x <= fpos.x && posXY.y <= fpos.y) {
                        return { x: i, y: e };
                        break;
                    }
                }
            }
        }
        console.log("Fail to get PATH.positionToCel", posXY);
        return null;
    }


    findPath(contact, targetPosition, nearValid) {
        var gridFrom = this.positiontoGridPoint(contact.position);
        var gridTo = this.positiontoGridPoint(targetPosition);
        var grid = this.grid.clone();
        var finder = this.finder;        
        function returnPath() {
            var gridClean=grid.clone();            
            var path = finder.findPath(gridFrom.x, gridFrom.y, gridTo.x, gridTo.y, gridClean);
            if(path.length==0){                
                gridClean=grid.clone(); //clean grid
                var gridWall=grid.clone();//blocked grid
                for (var i = 0; i < gridClean.width; i++) {//set all walkable
                    for (var e = 0; e < gridClean.height; e++) {
                        var node = gridClean.nodes[e][i];
                        node.walkable=true;
                    }
                }
                var ff1=false;
                var ff2=false;
                var clearpath = finder.findPath(gridFrom.x, gridFrom.y, gridTo.x, gridTo.y, gridClean);
                for (var i = 0; i < clearpath.length; i++) {
                    var chasenode = clearpath[i];
                    var node = gridWall.nodes[chasenode[1]][chasenode[0]];
                    if(node.walkable==true){
                        gridFrom={x:chasenode[0],y:chasenode[1]}; 
                        ff1=true; 
                        break;
                    }
                }
                for (var i = clearpath.length-1; i >= 0; i--) {
                    var chasenode = clearpath[i];
                    var node = gridWall.nodes[chasenode[1]][chasenode[0]];
                    if(node.walkable==true){
                        gridTo={x:chasenode[0],y:chasenode[1]};  
                        ff2=true;
                        break;
                    }
                }
                path = finder.findPath(gridFrom.x, gridFrom.y, gridTo.x, gridTo.y, gridWall);
            }
            return path;
        }
        if (gridFrom == null || gridTo == null) {
            if (typeof (nearValid) != _UN && nearValid == true) {
                var dummy = contact.model.pdata.dummy;
                var tries = 0;
                dummy.position.copy(contact.position);
                while (gridFrom == null && tries < 10) {
                    console.log('gfo',dummy.position);
                    dummy.lookAt(targetPosition.x, dummy.position.y, targetPosition.z);
                    dummy.translateZ(this.gridsize);
                    gridFrom = this.positiontoGridPoint(dummy.position);
                    tries++;
                }
                tries = 0;
                dummy.position.copy(targetPosition);
                while (gridTo == null && tries < 10) {
                    console.log('gto',dummy.position);
                    dummy.lookAt(contact.position.x, dummy.position.y, contact.position.z);
                    dummy.translateZ(this.gridsize);
                    gridTo = this.positiontoGridPoint(dummy.position);
                    tries++;
                }
                if (gridFrom == null || gridTo == null) {
                    console.log('positiontoGridPoint not found path');
                    return [];
                } else {
                    return returnPath();
                }
            }
        } else {
            return returnPath();
        }
    }

    contactChase(contact, target,named) {        
        if (typeof(target)!=_UN && typeof(target.isObject3D)!=_UN && target.isObject3D) {       
            var vtarg = new THREE.Vector3();            
            scene.updateMatrixWorld();
            //target.parent.updateMatrixWorld();
            target.getWorldPosition(vtarg);
            if(target.scenePos){
                vtarg.x+=target.scenePos.x;
                vtarg.y+=target.scenePos.y;
                vtarg.z+=target.scenePos.z;
                if(target.scenePosFix){
                    vtarg.add(new THREE.Vector3(target.scenePosFix.x,target.scenePosFix.y,target.scenePosFix.z));
                }
            }
            

            if(typeof(named)=='string'){
                contact.model.pdata.chaseTargetName=named;
            }else{
                contact.model.pdata.chaseTargetName='';
            }
            //scene.updateMatrixWorld();
            //target=target.parent.position.clone().setFromMatrixPosition( target.matrixWorld );
            target = vtarg;
        }else if(typeof(target)=='string'){
            var tname=target;            
            target=objects[tname];
            if(typeof(target)==_UN)target=getOByName(tname);            
            this.contactChase(contact,target,tname);
            return;            
        }else if(target && target.isVector3){
            //PASS without tests
        }else{
            console.warn('Invalid Target',target);
            return;
        }       
        target.y = contact.position.y;        
        contact.model.pdata.chasePath = this.findPath(contact, target, true);
        contact.model.pdata.isFolowPath=false;
    

        if (contact.model.pdata.chasePath.length > 0) {
            contact.model.pdata.chaseLerp=0;
            var gridpoints = [];
            gridpoints.push(contact.position);
            for (var i = 0; i < contact.model.pdata.chasePath.length; i++) {
                var chasenode = contact.model.pdata.chasePath[i];
                var node = this.grid.nodes[chasenode[1]][chasenode[0]];
                gridpoints.push(new THREE.Vector3(node.position.x, contact.position.y, node.position.y));
            }            
            contact.model.pdata.chaseSpline = new THREE.CatmullRomCurve3(gridpoints);
            contact.model.pdata.chaseSpline.closed = false;
            if (1 == 0) { //DEBUG VIEW
                const points = contact.model.pdata.chaseSpline.getPoints(4);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                scene.add(new THREE.Line(geometry, this.material));
            }
        }

        contact.model.pdata.isFolowPath = contact.model.pdata.chasePath.length > 0 ? true : false;
    }

    moveplayer(contact,delta){
        if(typeof(contact.model.pdata.chaseLerp)==_UN)contact.model.pdata.chaseLerp=0;
        
        if(contact.model.pdata.chaseLerp>=1){ //reach final point
            contact.model.pdata.isFolowPath=false;
            contact.model.pdata.chaseLerp=0;
            this.stopMoves(contact);
            if(typeof(contact.model.pdata.chaseExecute)=='function'){
                var named=contact.model.pdata.chaseTargetName;
                contact.model.pdata.chaseExecute(contact,named);
            }
            return;
        }
        
        if(contact.model.pdata.action.walk.isRunning()!=true)
        this.change(contact.model.pdata.id,'walk',1);

        var chasepoint;
        var chasepointAread;
        var chaselen;
        //var tangent;
        //var axis=new THREE.Vector3();
        //var xup=new THREE.Vector3(0,1,0);
        try{
            var chaseLerpAread=contact.model.pdata.chaseLerp+0.001;
            if(chaseLerpAread>1)chaseLerpAread=1;
            chasepoint=contact.model.pdata.chaseSpline.getPointAt(contact.model.pdata.chaseLerp);
            chasepointAread=contact.model.pdata.chaseSpline.getPointAt(chaseLerpAread);
            chaselen=contact.model.pdata.chaseSpline.getLength();
            //tangent = contact.model.pdata.chaseSpline.getTangent(contact.model.pdata.chaseLerp) 
            /*
            axis.crossVectors(xup, tangent).normalize();                
            var radians = Math.acos( xup.dot( tangent ) );                
            contact.model.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), radians );
            */
            contact.model.lookAt(chasepointAread);
            

            contact.position.copy(chasepoint);
            contact.model.pdata.chaseLerp+=delta / (chaselen * 0.026);              
            }catch(e){
                contact.model.pdata.chaseLerp=1;
              return;
            }                     
    }

    stopMoves(contact) {
        //contact.dtplayer.movemode = 0;
        contact.model.pdata.action.idle.togle();
    }


    loadZipGlb(directory, filename, execute) {
        function unzip(zip) {
            zip.filter(function (path, file) {
                var manager = new THREE.LoadingManager();
                manager.setURLModifier(function (url) {
                    var file = zip.files[url];
                    if (file) {
                        var blob = new Blob([file.asArrayBuffer()], { type: 'application/octet-stream' });
                        return URL.createObjectURL(blob);
                    }
                    return url;
                });
                var extension = file.name.split('.').pop().toLowerCase();
                switch (extension) {
                    case 'glb':
                        LOADER.glbloader.parse(file.asArrayBuffer(), '', function (result) {
                            if (typeof (execute) == 'function') execute(result);
                        });
                        break;
                }
            });
        }
        document.getElementById('loadingItens').innerText = 'Player: ' + filename;
        JSZipUtils.getBinaryContent(directory + filename, async function (err, data) {
            if (err) {
                throw err; // or handle err            
            }
            var myzip = new JSZip();
            unzip(myzip.load(data));
        });
    }

    create(name, id, execute) {
        const geometry = new THREE.CylinderGeometry(8, 8, 54, 6);
        var contact = new THREE.Mesh(geometry, this.material);
            contact.layers.toggle(10);
            //contact.isPlayer=true;
            contact.layers.set(2);

        var pdata = {
            id: id,
            isFolowPath: false,
            dummy: new THREE.Object3D(),
            rotate: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
            rotationMatrix: new THREE.Matrix4(),
            targetQuaternion: new THREE.Quaternion()
        }
        switch (name) {
            case "player":
                pdata.model = "player.zip"; pdata.scale = 31;
                break;
        }
        this.loadZipGlb('./players/', pdata.model, (object) => {
            object = object.scene;
            object.scale.multiplyScalar(pdata.scale);
            object.rotation.set(pdata.rotate.x, pdata.rotate.y, pdata.rotate.z);
            object.position.set(pdata.position.x, pdata.position.y, pdata.position.z);
            contact.model = object;
            contact.add(object);    
            object.layers.set(0);        
            object.pdata = pdata;
            object.pdata.mixer = new THREE.AnimationMixer(object);
            object.pdata.action = new Array();
            object.pdata.bones = new Array();
            var firstname = null;
            //fix shadows, materials and bone names
            object.traverse(function (child) {
                if (child.isMesh) {
                    if (child.material && child.material.map && child.material.map.format) {
                        child.material.map.format = THREE.RGBAFormat;
                        child.material.map.encoding = THREE.LinearEncoding;
                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                if (child.isBone && child.name) {
                    var boneName = child.name;
                    if (boneName.startsWith('mixamorig') == true) {
                        boneName = boneName.substr('mixamorig'.length, boneName.length);
                        //boneName = boneName.replace(/[0-9]/g, '');
                    }
                    object.pdata.bones[boneName] = child;
                }
            });
            //inject animation
            for (var i = 0; i < this.motionList.length; i++) {
                var anim = THREE.AnimationClip.parse(this.motionList[i]);
                var clipName = anim.name;
                clipName = clipName.split('|');
                clipName = clipName[clipName.length - 1];
                if (firstname == null || clipName == 'idle') firstname = clipName;
                var clipAnim = object.pdata.mixer.clipAction(anim);
                object.pdata.action[clipName] = clipAnim;
                object.pdata.action[clipName].togle = function () {
                    PLAYERFN.swap(id, this);
                }                
            }
            if (firstname !== null) object.pdata.action[firstname].play();
        });
        contact.moveTo=function(target,onReach){
            if(typeof(onReach)=='function'){
                this.model.pdata.chaseExecute=onReach;
            }else{
                this.model.pdata.chaseExecute=null;
            }
            PLAYERFN.contactChase(this,target);
        }
        contact.move=(axis,value,onReach)=>{
            PLAYERFN.move(contact,axis,value,onReach);
        }
        contact.openNearObject=()=>{
            PLAYERFN.openNearObject(contact);
        }
        this.players[id] = contact;
        if (typeof (execute) == 'function') execute(contact);
    }

    rotatePlayer(contact,delta){
        var model=contact.model;
        var nquart=model.pdata.targetQuaternion;    
        model.pdata.rotatingLerp+=delta;   
        if(model.pdata.rotatingLerp>0.9){            
            model.pdata.rotatingLerp=1;        
        }
        model.quaternion.slerp(nquart,model.pdata.rotatingLerp);
    }

    openNearObject(contact){
        var childPos=new THREE.Vector3();
        var childDistance=new THREE.Vector3();
        var nearObject={obj:null,action:null,dist:1000};
        scene.traverse((child)=>{            
            if(child.name && child.name!=''){                                
                child.getWorldPosition(childPos);
                childDistance.subVectors(contact.position,childPos);
                if(childDistance.length()<40 && childDistance.length()< nearObject.dist){
                    //DOORS
                    if(child.name.startsWith('door')){
                        if(child.getObjectByName('holder_2') && child.getObjectByName('holder_2').onClick){
                            nearObject.dist=childDistance.length();
                            nearObject.obj=child;
                            nearObject.action=()=>{
                                iscene.createScene(child.getObjectByName('holder_2').SCENE); 
                            }
                        }
                    }
                    //OTHER
                }               
            }
        })
        if(nearObject.obj!=null){
            if(nearObject.action!=null)nearObject.action();            
        }
    }

    move(contact,axis,value,onReach){
        var model=contact.model;
        var dummy=model.pdata.dummy;
        if(axis=='y'){//rotation                        
            dummy.position.copy(contact.position);
            dummy.rotation.copy(model.rotation);
            dummy.rotateY(THREE.Math.degToRad(value));
            model.pdata.targetQuaternion=dummy.quaternion.clone();
            model.pdata.rotatingLerp=0;                        
        }
        if(axis=='z'){//walk 
            if(value==1){//forward                
                dummy.position.copy(contact.position);
                dummy.rotation.copy(model.rotation);
                dummy.translateZ(this.gridsize*5);
                contact.moveTo(dummy.position);                
            }
        }
    }

    swap(id, animation) {
        var clipName = animation._clip.name;
        clipName = clipName.split('|');
        clipName = clipName[clipName.length - 1];
        this.change(id, clipName);
    }

    change(id, newpose, speed, weight) {
        if (typeof (speed) == _UN) speed = 1;
        if (typeof (weight) == _UN) weight = 1;
        var contact = this.players[id];
        var model = contact.model;
        if (typeof (model) == _UN || typeof (model.pdata) == _UN || typeof (model.pdata.action) == _UN ||
            typeof (model.pdata.action[newpose]) == _UN) {
            console.warn('Animation or clip not found', id, newpose);
            return;
        }
        model.pdata.action[newpose].weight = weight;        
        model.pdata.action[newpose].play();
        for (var i = 0; i < Object.keys(model.pdata.action).length; i++) {
            var clipName = Object.keys(model.pdata.action)[i];
            var action = model.pdata.action[clipName];
            if (action.weight != 0 && clipName!=newpose) {
                action.weight = 0;
                action.stop();
            }
        }
    }

    getType(name) {
        var atype = 4;
        switch (newpose) {
            //unique
            case 'swdie': atype = 0; break;
            case 'tpose': atype = 0; break;
            //legworks
            case 'swwalk': atype = 1; break;
            case 'idledie': atype = 1; break;
            case 'idle': atype = 1; break;
            case 'idlearmed': atype = 1; break;
            case 'run': atype = 1; break;
            case 'swrun': atype = 1; break;
            case 'walk': atype = 1; break;
            //uperbody
            case 'swwithdraw': atype = 2; break;
            case 'archaim': atype = 2; break;
            case 'swatack': atype = 2; break;
            case 'swdraw': atype = 2; break;
            case 'punch': atype = 2; break;
            case 'drop': atype = 2; break;
            //extra
            case 'swimpact': atype = 3; break;
            case 'jump': atype = 3; break;
        }
        return atype;
    }

    fixBones(bones) {
        //spine erectus
        //bones["Spine1"].rotation.copy(bones["Spine"].rotation);
        //bones["Spine2"].rotation.copy(bones["Spine"].rotation);
        //rings
        for (var i = 1; i < 5; i++) {
            bones["RightHandPinky" + i].rotation.copy(bones["RightHandRing" + i].rotation);
            bones["LeftHandPinky" + i].rotation.copy(bones["LeftHandRing" + i].rotation);
        }

    }

    update(delta) {
        for (var i = 0; i < Object.keys(this.players).length; i++) {
            var id = Object.keys(this.players)[i];
            var contact = this.players[id];
            var model = contact.model;
            if (model && model.pdata) {
                //UPDATE MIXER
                if (model.pdata.mixer && model.pdata.bones["Spine"].parent!=null) {
                    var hipsRot = model.pdata.bones["Spine"].parent.rotation.clone();
                    var hipsPos = model.pdata.bones["Spine"].parent.position.clone();
                    model.pdata.mixer.update(delta*1.25);
                    model.pdata.bones["Spine"].parent.rotation.copy(hipsRot);
                    model.pdata.bones["Spine"].parent.position.copy(hipsPos);
                    this.fixBones(model.pdata.bones);
                }
                //UPDATE POSITION
                if (model.pdata.isFolowPath) {
                    this.moveplayer(contact, delta*1.6);
                }
                //ROTATING on AXIS
                if(typeof(model.pdata.rotatingLerp)!=_UN && model.pdata.rotatingLerp!=1){
                    this.rotatePlayer(contact,delta*0.5);
                }
            }
        }
    }

}
export { PLAYER };