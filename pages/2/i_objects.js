//recompress using https://githubdragonfly.github.io/viewers/templates/GM%20Viewer.html
import { Fish } from './i_fish.js';

class OBJECT3D {
    constructor() {
        
    }

    async createAPong(front, back) {
        return [
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ color: 0xffffff }),
            new THREE.MeshPhongMaterial({ map: await LOADER.textureLoader.loadAsync(front) }),
            new THREE.MeshPhongMaterial({ map: await LOADER.textureLoader.loadAsync(back) })
        ];
    }


    //######### GLB or ZIP model Loader ############
    loadGLBorZipGLB(directory, zipobj, execute, diffuseName, specularName, normalName) {
        if (typeof (diffuseName) == _UN) diffuseName = 'diffuse.png';
        if (typeof (specularName) == _UN) specularName = 'specular.png';
        if (typeof (normalName) == _UN) normalName = 'normal.png';
        function treatObject(glbobj) {
            if (diffuseName == null) { execute(glbobj); return; }
            var finalmaterial = new THREE.MeshPhongMaterial();
            function traversech(element) {
                if (finalmaterial.flatShading) finalmaterial.flatShading = true;
                if (typeof (element.traverse) != _UN)
                    element.traverse((child) => {
                        if (child.isMesh && child.material && child.material.isMaterial) {
                            child.material = finalmaterial;
                            child.castShadow = true;
                            child.receiveShadow = true;
                            //if(typeof(child.material.metalness)!=_UN)child.material.metalness=0;
                        }
                    });
            }
            var objeto;
            if (glbobj.isObject3D) {
                traversech(glbobj);
                objeto = glbobj;
            } else {
                glbobj.scene.children.forEach(element => {
                    traversech(element);
                });
                objeto = glbobj.scene.children[0];
            }
            var oldtexture;

            oldtexture = finalmaterial.map;
            function loadnormal() {
                LOADER.textureLoader.load(directory + normalName, (normal) => {
                    finalmaterial.normalMap = normal;
                    finalmaterial.normalMap.flipY = false;
                    finalmaterial.needsUpdate = true;
                    if (typeof (execute) == 'function') execute(objeto);
                }, () => { }, () => { //error normal
                    finalmaterial.normalMap = null;
                    finalmaterial.needsUpdate = true;
                    console.warn('normalMap not loaded', directory + normalName);
                    if (typeof (execute) == 'function') execute(objeto);
                });
            }
            function loadspecular() {
                LOADER.textureLoader.load(directory + specularName, (specular) => {
                    finalmaterial.specularMap = specular;
                    finalmaterial.specularMap.flipY = false;
                    finalmaterial.specularMap.needsUpdate = true;
                    loadnormal();
                }, () => { }, () => { //error specular
                    console.warn('specularMap not loaded', directory + specularName);
                    finalmaterial.specularMap = null;
                    finalmaterial.needsUpdate = true;
                    loadnormal();
                });
            }
            LOADER.textureLoader.load(directory + diffuseName, (material) => {
                finalmaterial.map = material;
                finalmaterial.map.flipY = false;
                finalmaterial.map.needsUpdate = true;
                loadspecular();
            }, () => { }, () => {//error difuse
                console.warn('difusseMap not loaded', directory + diffuseName);
                finalmaterial.map = oldtexture;
                loadspecular();
            });
        }
        function unzip(zip) {
            zip.filter(function (path, file) {
                var manager = new THREE.LoadingManager();
                manager.setURLModifier(function (url) {
                    console.log(url);
                    var file = zip.files[url];
                    console.log(zip.files[url]);
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
                            treatObject(result);
                        });
                        break;
                }
            });
        }
        var oextension = "object";
        if (!zipobj.isObject3D) {
            oextension = zipobj.split('.').pop().toLowerCase();
        }
        if (oextension == 'object') {
            treatObject(zipobj);
        }
        if (oextension == 'glb') {
            document.getElementById('loadingItens').innerText = 'model: ' + zipobj;
            LOADER.glbloader.load(directory + zipobj, function (result) {
                treatObject(result);
            });
        }
        if (oextension == 'zip') {
            document.getElementById('loadingItens').innerText = 'model: ' + zipobj;
            JSZipUtils.getBinaryContent(directory + zipobj, async function (err, data) {
                if (err) {
                    throw err; // or handle err            
                }
                var myzip = new JSZip();
                unzip(myzip.load(data));
            });
        }
    }

    

    async create(value, execute) {
        var loadGLBZ = this.loadGLBorZipGLB;
        function threatMeshes(object, treatment) {
            object.traverse((child) => {
                if (child.isMesh) {
                    treatment(child);
                }
            });
        }
        var directory;
        var obj1, obj2, obj3, obj4, obj5;

        //CARTS out of switch
        if (value && value.startsWith('cart_single')) {//INSERTED ATARI CART
            var difusseimg = 'card/pacman.jpg';
            var cartn = parseInt(value.substr(11));
            if (cartn == 2) difusseimg = 'card/riveraid.jpg';
            if (cartn == 3) difusseimg = 'card/junglejunt.jpg';
            if (cartn == 4) difusseimg = 'card/digdug.jpg';
            if (cartn == 5) difusseimg = 'card/mspacman.jpg';
            if (cartn == 6) difusseimg = 'card/donkong.jpg';
            if (cartn == 7) difusseimg = 'card/qbert.jpg';
            if (cartn == 8) difusseimg = 'card/adventure.jpg';
            if (cartn == 9) difusseimg = 'card/enduro.jpg';
            if (cartn == 10) difusseimg = 'card/halloi.jpg';
            if (cartn == 11) difusseimg = 'card/hero.jpg';
            if (cartn == 12) difusseimg = 'card/megamania.jpg';
            if (cartn == 13) difusseimg = 'card/missile.jpg';
            if (cartn == 14) difusseimg = 'card/pitifal.jpg';
            if (cartn == 15) difusseimg = 'card/robotank.jpg';
            if (cartn == 16) difusseimg = 'card/spacei.jpg';
            if (cartn == 17) difusseimg = 'card/frog.jpg';
            directory = './models/atari2/';
            objects[value] = new THREE.Group();
            obj1 = new Promise(function (resolve) {//Entire Object    
                loadGLBZ(directory, 'cartright_single.glb', (object) => {
                    object = object.parent;
                    object.name = value;
                    object.scale.multiplyScalar(0.4);
                    object.rotation.y = -Math.PI / 2;
                    object.repeat = new THREE.Vector3(2.15, 2.64);
                    object.center = new THREE.Vector3(0.13, 0.12);
                    switch (cartn) { //fix display video image
                        case 1: object.rom = 'rom/pacman.zip';
                            object.repeat.set(2.15, 2.45, 0);
                            object.center.set(0.13, 0.08, 0);
                            break;
                        case 2: object.rom = 'rom/riverraid.zip';
                            object.repeat.set(1.9, 2.5, 0);
                            object.center.set(0.07, 0.07, 0);
                            break;
                        case 3: object.rom = 'rom/junglehunt.zip';
                            object.repeat.set(1.98, 2.4, 0);
                            object.center.set(0.07, 0.07, 0);
                            break;
                        case 4: object.rom = 'rom/digdug.zip';
                            object.repeat.set(1.84, 2.44, 0);
                            object.center.set(0.07, 0.08, 0);
                            break;
                        case 5: object.rom = 'rom/mspacman.zip';
                            object.repeat.set(2.05, 2.55, 0);
                            object.center.set(0.11, 0.1, 0);
                            break;
                        case 6: object.rom = 'rom/donkong.zip'; break;
                        case 7: object.rom = 'rom/qbert.zip';
                            object.repeat.set(1.9, 2.7, 0);
                            object.center.set(0.08, 0.08, 0);
                            break;
                        case 8: object.rom = 'rom/adventure.zip'; break;
                        case 9: object.rom = 'rom/enduro.zip';
                            object.repeat.set(1.85, 2.75, 0);
                            object.center.set(0, 0.12, 0);
                            break;
                        case 10: object.rom = 'rom/halloi.zip';
                            object.repeat.set(1.7, 2.64, 0);
                            object.center.set(0, 0.08, 0);
                            break;
                        case 11: object.rom = 'rom/hero.zip';
                            object.repeat.set(1.9, 2.4, 0);
                            object.center.set(0.08, 0.05, 0);
                            break;
                        case 12: object.rom = 'rom/megamania.zip';
                            object.repeat.set(2, 2.64, 0);
                            object.center.set(0.08, 0.11, 0);
                            break;
                        case 13: object.rom = 'rom/missile.zip';
                            object.repeat.set(1.9, 2.7, 0);
                            object.center.set(0.08, 0.08, 0);
                            break;
                        case 14: object.rom = 'rom/pitifal.zip';
                            object.repeat.set(2, 2.45, 0);
                            object.center.set(0.08, 0.07, 0);
                            break;
                        case 15: object.rom = 'rom/robotank.zip';
                            object.repeat.set(1.9, 2.4, 0);
                            object.center.set(0.08, 0.06, 0);
                            break;
                        case 16: object.rom = 'rom/spacei.zip';
                            object.repeat.set(1.9, 2.64, 0);
                            object.center.set(0.07, 0.07, 0);
                            break;
                        case 17: object.rom = 'rom/frog.zip';
                            object.repeat.set(1.9, 2.6, 0);
                            object.center.set(0.07, 0.085, 0);
                            break;
                        default: object.rom = 'rom/pacman.zip'; break;
                    }
                    resolve(object);
                }, difusseimg, 'cart_specullar.jpg', 'cart_normal.jpg');
            });
            Promise.all([obj1]).then(function (values) {
                objects[value].add(values[0]);
                if (typeof (execute) == 'function') execute(values[0]);
                return;
            });
        }

        switch (value) {
            case 'ball': {//plane
                objects[value] = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), materials[1]);
                objects[value].name = value + '_box';
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }
            case 'plane': {//plane
                objects[value] = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), materials[1]);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'stair': {//wooden bed
                directory = './models/stairs/';
                //objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'stair.glb', (object) => {                                       
                        object=object.parent;
                        object.rotation.y = -Math.PI / 2;                         
                        //object.scale.multiplyScalar(0.5);
                        object.name = value + '_box';
                        object.getObjectByName('object_1').material.map.center.set( 0.8, 0.4);
                        object.getObjectByName('object_1').material.map.repeat.set( 0.8, 0.5);
                        object.getObjectByName('object_1').material.normalMap.center.copy(object.getObjectByName('object_1').material.map.center);
                        object.getObjectByName('object_1').material.specularMap.repeat.copy(object.getObjectByName('object_1').material.map.repeat);
                        

                        loadGLBZ(directory, object.getObjectByName('object_2'), (object2) => {                              
                            object2.material.map.rotation=Math.PI/2;
                            object2.material.normalMap.rotation=object2.material.map.rotation;
                            object2.material.specularMap.rotation=object2.material.map.rotation;
                        },'wood2_dif.jpg', 'wood2_spec.jpg', 'wood2_norm.jpg');
                        
                        if (typeof (execute) == 'function') execute(object);
                    }, 'wood_dif.jpg', 'wood_spec.jpg', 'wood_norm.jpg');
                });                
                break;
            }
            
            case 'toilet_trash': {//Red victorian Chair
                directory = './models/toilet/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'trash.glb', (object) => {                                       
                        object=object.parent;
                        //object.rotation.x = -Math.PI / 2;                         
                        object.scale.multiplyScalar(7); 
                        //object.position.y=-18;                       
                        object.name = value + '_box';

                        var part= new THREE.Group();                        
                        var partmesh=object.getObjectByName('door_trashbin');                                                    
                        part.add(partmesh);
                        object.add(part);
                        part.position.set(  0, 1.3566047095618505, -0.9267158753450604);
                        part.op=new THREE.Vector3(-1.7,0,0);

                        resolve(object);
                    }, 'gray.jpg', 'gray.jpg', 'gray.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'shower_box': {//Red victorian Chair
                directory = './models/shower/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'shower_box.glb', (object) => {                                       
                        object=object.parent;
                        object.rotation.y = Math.PI / 2;                         
                        object.scale.multiplyScalar(0.6); 
                        //object.position.y=-18;                       
                        object.name = value + '_box';

                        var part= new THREE.Group();
                        part.name='door';
                        var partmesh=object.getObjectByName('door_glass');                                                    
                        part.add(partmesh);
                        part.add(object.getObjectByName('in_pushers'));
                        part.add(object.getObjectByName('roles'));
                        object.add(part);
                        part.position.set( -22.069536952549946,0, 28.016509971790327);
                        part.op=new THREE.Vector3(0,-1.75,0);
                    
                        //part.autoReturn=true;

                        threatMeshes(object, (mesh) => {                            
                            if (mesh.material && mesh.material.isMaterial) {                        
                                if(mesh.name=='door_glass' || mesh.name=='glass'){                                                                        
                                    mesh.material=materials[92];                                    
                                }
                                if(mesh.name=='pushers' || mesh.name=='in_pushers'){                                                                        
                                    mesh.material=materials[90];                                    
                                }
                            }
                        });
                        

                        resolve(object);
                    }, 'gray.jpg', 'gray.jpg', 'gray.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            

            case 'toilet': {//normal cabinet
                directory = './models/toilet/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'toilet.zip', (object) => {                                       
                        object=object.parent;                  
                        window.OO=object;       
                        object.scale.multiplyScalar(0.95);                        
                        object.name = value + '_box';
                        
                        var part= new THREE.Group();
                        var partmesh=object.getObjectByName('pusher');    
                        partmesh.name='door_toilet_pusher';
                        //partmesh.getObjectByName('object_0').name='door_toilet_pusher';
                        part.add(partmesh);
                        object.add(part);
                        part.position.set( -7.788759177181208,  33.75199047935142,  -13.936439597926874);
                        part.op=new THREE.Vector3(1.75,0,0);
                        part.autoReturn=true;

                        part= new THREE.Group();
                        partmesh=object.getObjectByName('tampa');    
                        partmesh.getObjectByName('tampa_mesh').name='door_toilet';
                        part.add(partmesh);
                        object.add(part);
                        part.position.set( 0, 21.77039,  -4.97);
                        part.op=new THREE.Vector3(-1.75,0,0);
                        

                        resolve(object);
                    }, 'gray.jpg','gray.jpg','gray.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }


            case 'cabinet1':
            case 'cabinet2': {//normal cabinet
                directory = './models/cabinet/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'cabinet.glb', (object) => {                                       
                        object=object.parent;                         
                        object.scale.multiplyScalar(0.4);                        
                        object.name = value + '_box';
                        object.position.y=-14;
                        object.position.x=4;

                        threatMeshes(object, (mesh) => {                            
                            if (mesh.material && mesh.material.isMaterial) {                        
                                if(mesh.name=='back'){                                    
                                    var mat2=mesh.material.clone();
                                    LOADER.textureLoader.load(directory+'difuse.jpg',(texture)=>{
                                        mat2.map=texture;
                                        mat2.map.repeat.set(0.5,0.5);
                                        mesh.material=mat2;
                                    });                                    
                                }
                            }
                        });

                        var door= new THREE.Group();
                        door.add(object.getObjectByName('door1'));
                        door.op=new THREE.Vector3(0,1.4,0);
                        door.audioOpen='cab1DoorOpen';
                        door.audioClose='cab1DoorClose';
                        object.add(door);
                        door.position.set(-23.40204018673331,  0,  44.40076728342181);
                        door= new THREE.Group();                                          
                        door.add(object.getObjectByName('door2'));                        
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='cab1DoorOpen';
                        door.audioClose='cab1DoorClose';
                        object.add(door);
                        door.position.set(-23.40193412157757,  0, -43.46521813599203);

                        resolve(object);
                    }, 'difuse.jpg', 'spec.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'table1': {//Red victorian Chair
                directory = './models/table/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'table1.glb', (object) => {                                       
                        //object=object.parent;
                        object.rotation.x = -Math.PI / 2;                         
                        object.scale.multiplyScalar(3.8); 
                        object.position.y=-18;                       
                        object.name = value + '_box';
                        resolve(object);
                    }, 'table1_dif.jpg', 'table1_spec.jpg', 'table1_norm.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'stove': {//Red victorian Chair
                directory = './models/stove/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'stove.glb', (object) => {                                       
                        object=object.parent;
                        //object.rotation.x = -Math.PI / 2;                         
                        object.scale.multiplyScalar(26);
                        object.name = value + '_box';
                        object.position.y=-19;
                        object.getObjectByName('drawn1').op=new THREE.Vector3(-6.832141690000964e-17,  0, 0.42706568202414874);
                        object.getObjectByName('glass1').visible=false;

                        var door= new THREE.Group();
                        door.add(object.getObjectByName('door1'));
                        door.op=new THREE.Vector3(-1.6,0,0);
                        door.audioClose='stoveMainClose';
                        door.audioOpen='stoveMainClose';
                        object.add(door);
                        door.position.set(1.0354964748907711e-16, 1.3710745155238329, -0.5338392611994044);
                        door= new THREE.Group();                        
                        door.add(object.getObjectByName('door2'));
                        door.op=new THREE.Vector3(1.1,0,0);
                        object.add(door);
                        door.position.set(-2.7755575615628914e-17,  0.3194155063038803,  0.32728708570178844);

                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'fridge': {//fridge and doors
                directory = './models/fridge/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'fridge.glb', (object) => {                                       
                        object=object.parent;
                        //object.rotation.x = -Math.PI / 2;                         
                        object.scale.multiplyScalar(0.4);
                        object.name = value + '_box';
                        object.position.y=-1;
                        object.position.z=-1;
                        var door= new THREE.Group();
                        door.add(object.getObjectByName('door1'));
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='fridgeDoorOpen';
                        door.audioClose='fridgeDoorClose';
                        object.add(door);
                        door.position.set(-36.91139187692909, 0, 28.5280442571493);
                        door= new THREE.Group();                        
                        door.add(object.getObjectByName('door2'));
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='fridgeDoorOpen';
                        door.audioClose='fridgeDoorClose';
                        object.add(door);
                        door.position.set(-36.629917777475164,  0,  29.174360985153786);

                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'sink': {//sink with drawners
                directory = './models/sink/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'sink.zip', (object) => {
                       var mbackmaterial=new THREE.MeshStandardMaterial({color:0x94c575});;
                        object=object.parent;                        
                        object.name = value + '_box';
                        object.scale.multiplyScalar(24); 
                        object.position.y=-17; 
                        object.position.x=6;
                        for (var i = 1; i < 6; i++){
                            object.getObjectByName('drawn'+i+'x').material=mbackmaterial;
                            object.getObjectByName('drawn'+i).op=new THREE.Vector3(5.748541174263884e-17,0,0.47);                      
                        }
                        var metal=materials[90];                                                
                        //metal.envMap=new LOADER.textureLoader.load(directory+'envROOM1.jpg');                    
                        threatMeshes(object, (mesh) => {                            
                            if (mesh.material && mesh.material.isMaterial) {                        
                                if(mesh.name.startsWith('back')){
                                    mesh.material=mbackmaterial;
                                }
                                if(mesh.name=='object_18'){
                                    loadGLBZ(directory, mesh, (cobjt) => {
                                        //cobjt.material.color.set(0x666666);                                        
                                    },'sinkd2.jpg', 'sinks2.jpg', 'sinkn2.jpg'); 
                                }
                                if(mesh.name=='faucet0' || mesh.name=='faucet1' || mesh.name=='faucet2' || mesh.name=='object_0'){
                                    mesh.material=metal;
                                } 
                                mesh.castShadow=true;
                                mesh.receiveShadow=true;                               
                            }
                        },);   
                        
                        var door= new THREE.Group();
                        door.add(object.getObjectByName('door1'));
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='sinkDoorOpen';
                        door.audioClose='sinkDoorClose';
                        object.add(door);
                        door.position.set(-2.2336668859417554,  0,  0.5490580815346144);
                        door= new THREE.Group();                        
                        door.add(object.getObjectByName('door2'));
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='sinkDoorOpen';
                        door.audioClose='sinkDoorClose';
                        object.add(door);
                        door.position.set(-1.43441979684697,  0, 0.5253061309969225);
                        door= new THREE.Group();
                        door.add(object.getObjectByName('door3'));
                        door.op=new THREE.Vector3(0,-1.4,0);
                        door.audioOpen='sinkDoorOpen';
                        door.audioClose='sinkDoorClose';
                        object.add(door);
                        door.position.set(-0.8730686513049659,0, 0.5504161001859177);
                        door= new THREE.Group();
                        door.add(object.getObjectByName('door4'));
                        door.op=new THREE.Vector3(0,1.4,0);
                        door.audioOpen='sinkDoorOpen';
                        door.audioClose='sinkDoorClose';
                        object.add(door);
                        door.position.set(0.7673846929669645,  0,  0.5528940114175946);

                        var faulcet=object.getObjectByName('faucet1');
                        faulcet.onClick=(me)=>{                                                        
                            var water=me.parent.getObjectByName('water');                                                        
                            if(water.material===SHADERMATERIAL.WATERFALL.material){
                                water.material=materials[1];
                                water.visible=false;
                            }else{
                                water.material=SHADERMATERIAL.WATERFALL.material;
                                water.visible=true;
                            }
                        }
                        object.getObjectByName('faucet2').onClick=faulcet.onClick;
                        object.getObjectByName('water').visible=false;
                        
                        resolve(object);
                    }, 'sinkd.jpg', 'sinks.jpg', 'sinkn.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'sink_bath': {//Red victorian Chair
                directory = './models/sink_bath/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'sink.zip', (object) => {                                       
                        object=object.parent;                                                 
                        object.scale.multiplyScalar(0.44);                                           
                        object.name = value + '_box';
                        window.OO=object;
                        //convert material type
                        var sinkobj=object.getObjectByName('sink').children[0];
                        var stdmat= new THREE.MeshStandardMaterial({
                            map:sinkobj.material.map,
                            metalnessMap:sinkobj.material.normalMap,                            
                        });
                        sinkobj.material=stdmat;
                        //load wood texture shelf
                        loadGLBZ(directory, object.getObjectByName('support'), (support) => { //Foliage                                
                        stdmat= new THREE.MeshStandardMaterial({
                            map:support.material.map,
                            metalnessMap:support.material.normalMap,   
                            roughnessMap:support.material.specularMap                         
                        });
                        support.material=stdmat;                                                                        
                        }, 'shelf.jpg', 'shelf_rough.jpg', 'shelf_metal.jpg');
                        //aply mirror
                        var mirror=object.getObjectByName('mirror');
                        var mirrorbox=new THREE.Box3().setFromObject(mirror);
                        var mirrorsize=new THREE.Vector3();
                        mirrorbox.getSize(mirrorsize);                          

                        var mirrorgeo=new THREE.PlaneGeometry(mirrorsize.x,mirrorsize.y);                       
                       const mirrorPlane = new THREE.Reflector( mirrorgeo, {
                        clipBias: 0.003,
                        textureWidth: window.innerWidth * window.devicePixelRatio,
                        textureHeight: window.innerHeight * window.devicePixelRatio,
                        color: 0xb5b5b5
                    } );
                        mirrorPlane.name='mirror_glass';
                        object.add(mirrorPlane);
                        mirrorPlane.position.copy(mirror.position);
                        mirrorPlane.position.z=1;

                        var faulcet=object.getObjectByName('faucet').children[0];
                        faulcet.material=materials[90];
                        faulcet.onClick=(me)=>{                                                        
                            var water=me.parent.parent.getObjectByName('water');                                                        
                            if(water.material===SHADERMATERIAL.WATERFALL.material){
                                water.material=materials[1];
                                water.visible=false;
                            }else{
                                water.material=SHADERMATERIAL.WATERFALL.material;
                                water.visible=true;
                            }
                        }                        
                        object.getObjectByName('water').visible=false;



                        resolve(object);
                    }, 'sink.jpg', 'gray.jpg','sink_metal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'bed': {//wooden bed
                directory = './models/bed/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'bed.zip', (object) => {                                       
                        object=object.parent;
                        object.rotation.x = -Math.PI / 2;                         
                        object.scale.multiplyScalar(0.9);
                        object.name = value + '_box';
                        threatMeshes(object, async(mesh) => {
                            mesh.material.shininess=0;
                        if (mesh.name == 'object_0') {
                            mesh.material = mesh.material.clone();
                            mesh.material.map = await LOADER.textureLoader.loadAsync(directory + 'difuse2.jpg');
                            mesh.material.map.flipY=false;
                            mesh.material.specularMap = await LOADER.textureLoader.loadAsync(directory + 'specular2.jpg');
                            mesh.material.specularMap.flipY=false;
                            mesh.material.normalMap = await LOADER.textureLoader.loadAsync(directory + 'normal2.jpg');
                            mesh.material.normalMap.flipY=false;
                            mesh.material.shininess=30;
                            mesh.material.needsUpdate=true;
                        }});

                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }


            case 'paint0': {//paint frame
                directory = './models/paint/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, '0paint.glb', (object) => {
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(5);
                        //object.rotation.x = 0;
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                //mesh.material=materials[1];                                
                                //mesh.material.color.set(0x999999);
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                            }
                        },);
                        resolve(object);
                    }, '0difuse.jpg', '0specular.jpg', '0normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'paint3': {//paint frame
                directory = './models/paint/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, '3paint.glb', (object) => {
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.3);
                        //object.rotation.x = 0;
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                //mesh.material=materials[1];                                
                                mesh.material.color.set(0x999999);
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                            }
                        },);
                        resolve(object);
                    }, '3difuse.jpg', '3specular.jpg', '3normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'curtain': {//window curtain
                directory = './models/curtain/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'curtain.zip', (object) => {
                        var tmap = object.children[0].material.map;
                        var nmap = object.children[0].material.normalMap;
                        var rmap = object.children[0].material.specularMap;
                        object = object.parent;
                        objects[value].name= value + '_box';
                        //object.name = value + '_box';
                        object.scale.multiplyScalar(46);
                        object.material = new THREE.MeshStandardMaterial({
                            //roughness: 0.8,
                            color: 0xffffff,
                            metalness: 0.2,
                            //bumpScale: 1,
                            roughnessMap: rmap,
                            normalMap: nmap,
                            map: tmap,
                            side: 2
                        });
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                                if (mesh.name == 'object_2') {
                                    mesh.material = mesh.material.clone();
                                    LOADER.textureLoader.load(directory + 'difuse2.png',(texture)=>{
                                        mesh.material.map = texture;
                                    });                                    
                                    mesh.material.opacity = 0.9;
                                    mesh.material.color.set(0x555555);
                                    mesh.material.transparent = true;
                                    mesh.layers.toggle(10);
                                }
                                if (mesh.name == 'object_1') {
                                    mesh.material = mesh.material.clone();
                                    mesh.material.map = nmap;
                                }
                            }
                        },);
                        resolve(object);
                    }, 'difuse.png', 'rough.png', 'gray.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'window1':
            case 'window2': {//window frame
                directory = './models/window/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'window.glb', (object) => {
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.38);
                        object.push = 1;
                        //object.rotation.y = -Math.PI/2;
                        /*var bgw = new THREE.Mesh(new THREE.PlaneGeometry(85, 120), materials[91]);
                        bgw.layers.toggle(10);
                        object.add(bgw);*/

                        var lampLight = new THREE.SpotLight(0xFFFFFF, 1, 180, 1);
                        lampLight.name = value + '_light';
                        object.add(lampLight);
                        lampLight.position.set(0, 0, 20);
                        lampLight.castShadow = true;
                        lampLight.shadow.bias = 0;
                        lampLight.lumen = 1;//light itensity
                        //lampLight.itensity=0;
                        //lampLight.visible = false;
                        //lampLight.angle = 1.4;
                        lampLight.penumbra = 0.6;
                        lampLight.target.position.set(-50, -200, 90);
                        lampLight.target.updateMatrixWorld();


                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                                if (mesh.name == 'glass1' || mesh.name == 'glass2') {
                                    mesh.material = materials[92];
                                    //mesh.visible=false;
                                }
                                if (mesh.name == 'exterior') {
                                    mesh.material = materials[91];
                                    mesh.layers.toggle(10);                                    
                                }
                            }
                        },);
                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'window3':
            case 'window4': {//window frame
                directory = './models/window/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'window2.glb', (object) => {
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(10);
                        //object.push = 1;
                        object.rotation.y = Math.PI/2;
                        
                        var lampLight = new THREE.SpotLight(0xFFFFFF, 0.6, 180, 1);//0xFFF85D
                        lampLight.name = value + '_light';
                        object.add(lampLight);
                        lampLight.position.set(0, 0, 20);
                        lampLight.castShadow = true;
                        lampLight.shadow.bias = -0.0009;
                        lampLight.lumen = 0.6;//light itensity
                        //lampLight.itensity=0;
                        //lampLight.visible = false;
                        lampLight.angle = 1.4;
                        lampLight.penumbra = 0.6;
                        lampLight.target.position.set(0,-70, 0);
                        lampLight.target.updateMatrixWorld();


                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                                if (mesh.name == 'glass') {
                                    mesh.visible=false;                                   
                                }
                                if (mesh.name == 'exterior') {
                                    mesh.material = materials[91];
                                    mesh.layers.toggle(10);
                                    //mesh.visible=false;
                                }

                            }
                        },);
                        resolve(object);
                    }, 'gray.jpg', 'gray.jpg', 'gray.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'carpet': {//persian carpet
                directory = './models/carpet/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'carpet.glb', (object) => {
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.38);
                        object.rotation.x = 0;
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.material.color.set(0x999999);
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                            }
                        },);
                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'aquarium': {//plane
                function createBuble() {
                    const bubbleGeometry = new THREE.SphereGeometry(0.3, 5, 5);
                    const bubble = new THREE.Mesh(bubbleGeometry, SHADERMATERIAL.BUBLE.material);
                    bublesUpdate.push(bubble);
                    return bubble;
                }
                directory = './models/aquarium/';
                objects[value] = new THREE.Group();
                loadGLBZ(directory, 'aquarium.glb', (object) => {
                    objects[value].name = value + '_box';
                    //object.scale.multiplyScalar(4.5);                                   
                    object.children[1].visible = false;
                    var glassBox = object.children[0];
                    var waterCube = new THREE.Mesh(new THREE.BoxGeometry(15, 16, 26), materials[1]);
                    var waterTop = new THREE.Mesh(new THREE.BoxGeometry(15, 26, 0.05), materials[1]);
                    var transparentMaterial = materials[1].clone();
                    transparentMaterial.visible = false;
                    /*
                    if (materials[94].envMap == null) {
                        materials[94].envMap = new THREE.PMREMGenerator(renderer).fromScene(scene, 0, 1, 400).texture;
                        materials[94].needsUpdate = true;
                    }*/
                    //Glass Part
                    glassBox.scale.multiplyScalar(4.5);
                    glassBox.material = materials[94];
                    glassBox.renderOrder = 0;
                    glassBox.receiveShadow = false;
                    glassBox.castShadow = false;
                    //glassBox.layers.toggle(10);
                    //Water Part
                    waterCube.material = materials[93];
                    waterCube.renderOrder = 1;
                    waterCube.material.emissive.setRGB(0.05, 0.05, 0.05);
                    waterCube.renderOrder = 2;
                    waterCube.status = 0;
                    window.AQUARIUM = waterCube;
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    waterCube.add(createBuble());
                    //Top of Water part
                    waterTop.material = SHADERMATERIAL.WATER.material;
                    waterTop.material.transparent = true;
                    waterTop.material.blending = 1;
                    waterTop.rotation.x = -Math.PI / 2;
                    waterTop.position.y = 8;

                    loadGLBZ(directory, 'fish_boned.zip', (fishobj) => { //Fish Obj   
                        fishobj = fishobj.parent;
                        window.FISH = new Fish(fishobj);
                        FISH.object = FISH.getFish();
                        FISH.object.scale.multiplyScalar(0.08);
                        FISH.object.rotation.y = Math.PI / 2;
                        FISH.model.scale.multiplyScalar(2);
                        FISH.center = new THREE.AxesHelper(200);
                        FISH.center = new THREE.Object3D();
                        FISH.center.add(FISH.object);
                        FISH.center.add(FISH.model);
                        //new THREE.Vector3((Math.random() * 11)-5, (Math.random() * 8)-2, (Math.random() * 19)-9),
                        FISH.swimpath = FISH.swimPath([
                            new THREE.Vector3(2, 1, 1), //l                  
                            new THREE.Vector3(4.5, 2, 10), //l                  
                            new THREE.Vector3(1, 0, 1), //l                  
                            new THREE.Vector3(-4, -2, -2), //l                  
                            new THREE.Vector3(-3, -4, -4), //l                  
                            new THREE.Vector3(1, 2, -10), //l                  
                            new THREE.Vector3(3, 1, -3), //l                  
                            new THREE.Vector3(-2, 0, 0), //l                  
                        ]);
                        FISH.swim();

                        loadGLBZ(directory, 'ground.zip', (groundobj) => { //Ground Rocks                   
                            groundobj = groundobj.parent;
                            groundobj.scale.set(3.1, 1, 2.85);
                            groundobj.rotation.x = Math.PI;
                            groundobj.rotation.y = -Math.PI / 2;
                            groundobj.position.set(-1.1, -8, -0.4);
                            threatMeshes(groundobj, (mesh) => {
                                if (mesh.material && mesh.material.isMaterial) {
                                    if (mesh.name == 'object_4' || mesh.name == 'object_5') {
                                        mesh.material.map = mesh.material.specularMap;
                                        mesh.material.map.flipY = false;
                                    } else {
                                        mesh.material.map.flipY = true;
                                    }
                                    mesh.castShadow = false;
                                    mesh.receiveShadow = true;
                                    mesh.material.map.needsUpdate = true;
                                }
                            },);

                            loadGLBZ(directory, 'foliage.zip', (foliageobj) => { //Foliage
                                foliageobj = foliageobj.parent;
                                foliageobj.scale.multiplyScalar(0.16);
                                foliageobj.rotation.y = -Math.PI / 2;
                                foliageobj.position.set(-4, -8.2, 0);

                                objects[value].add(groundobj);
                                objects[value].add(foliageobj);
                                objects[value].add(glassBox);
                                objects[value].add(waterTop);
                                objects[value].add(waterCube);
                                objects[value].add(FISH.center);
                                if (typeof (execute) == 'function') execute(objects[value]);
                            }, 'foliage.jpg', 'gray.jpg', 'gray.jpg');

                        }, 'ground2.jpg', 'gray.jpg', 'gray.jpg');

                    }, 'fish.jpg', 'gray.jpg', 'gray.jpg');

                }, 'gray.jpg', 'gray.jpg', 'gray.jpg');
                break;
            }

            case 'door1':
            case 'door2':
            case 'door3': {//door white
                directory = './models/door/';
                objects[value] = new THREE.Group();

                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'door.zip', (object) => {
                        /*object.children[0].material.normalMap = null;
                        object.children[1].material.normalMap = null;
                        object.children[0].castShadow = false;
                        object.children[1].castShadow = false;
                        */
                        object=object.parent;                        
                        object.name = value + '_box';
                        object.scale.multiplyScalar(36.4);
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.material.normalMap = null;
                                mesh.castShadow = false;
                                mesh.receiveShadow = true;
                                mesh.material.map.needsUpdate = true;
                                if(mesh.name=='holder_2'){
                                    mesh.material=materials[90];
                                }
                            }
                        },);
                        resolve(object);
                    }, 'gray.jpg', 'specular.jpg', 'specular.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'desk2': {//Red victorian Chair
                directory = './models/desk2/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'desk.zip', (object) => {
                        var tmap = object.material.map;
                        var nmap = object.material.normalMap;
                        var rmap = object.material.specularMap;
                        object.material = new THREE.MeshStandardMaterial({
                            //roughness: 0.8,
                            color: 0xffffff,
                            metalness: 0.2,
                            //bumpScale: 1,
                            roughnessMap: rmap,
                            normalMap: nmap,
                            map: tmap,
                            side: 2
                        });
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.5);
                        resolve(object);
                    }, 'difuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'chair': {//Red victorian Chair
                directory = './models/chair/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'chair.zip', (object) => {
                        //object.position.set(0,0,0)
                        object = object.parent;
                        //object.material.normalMap=null; 
                        //object.rotation.z = Math.PI / 2; 
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial && mesh.material.shininess) {
                                mesh.material.shininess = 0;                                
                            }
                        },);                                                
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.35);
                        resolve(object);
                    }, 'chair_red.jpg', 'chair_specular.jpg', 'chair_normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'chair2': {//normal chair
                directory = './models/chair2/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'chair2.glb', (object) => {                                       
                        //object=object.parent;
                        //object.rotation.x = -Math.PI / 2;   
                        object.position.y=-18;                      
                        object.scale.multiplyScalar(2.4);                        
                        object.name = value + '_box';
                        resolve(object);
                    }, 'chair2_dif.jpg', 'chair2_spec.jpg', 'chair2_norm.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'room1': {//floor and walls  
                objects[value] = new THREE.Group();
                var size = new THREE.Vector3(140, 160, 110);//ground width/height - wall size

                var mat4=materials[97][4];                
                mat4.map.rotation=mat4.roughnessMap.rotation=mat4.bumpMap.rotation=0;
                mat4.map.repeat.set(2,  4);
                mat4.roughnessMap.repeat.copy(mat4.map.repeat);
                mat4.bumpMap.repeat.copy(mat4.map.repeat);
                mat4.color.set(0x666666);

                var floor = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 1), materials[97]);
                floor.name='room_floor';
                var wall1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, size.z), materials[96]);                
                var mat2=materials[96].clone();
                mat2.map=mat2.map.clone();
                mat2.map.needsUpdate=true;
                mat2.map.repeat.set(4,4);
                var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), mat2);
                //new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y - 30, size.z), materials[96]);
                wall1.position.y = ((size.z) / 2);
                wall2.position.y = (size.z) / 2;
                wall1.name = 'room_wall1';                
                wall2.name = 'room_wall2';
                var wall3 = wall1.clone();
                wall3.name = 'room_wall3';
                var wall4 = wall2.clone();
                wall4.name = 'room_wall4';
                var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, 5), materials[95][4]);
                var plane1_1 = plane1.clone();
                var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, 5), materials[95][4]);
                var plane2_1 = plane2.clone();
                plane1.position.set(0, -(size.z / 5), 0.6);
                plane1_1.position.set(0, -(size.z / 2)+3, 0.6);
                plane2.position.copy(plane1.position);
                plane2_1.position.copy(plane1_1.position);
                wall1.add(plane1);
                wall1.add(plane1_1);
                wall2.add(plane2.clone());
                wall2.add(plane2_1.clone());
                wall3.add(plane1.clone());
                wall3.add(plane1_1.clone());
                wall4.add(plane2.clone());
                wall4.add(plane2_1.clone());
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                wall1.rotation.y = -Math.PI / 2;
                wall1.position.x = (size.x / 2);                
                wall1.receiveShadow = true;
                wall2.position.z = -size.y / 2;
                wall2.receiveShadow = true;
                wall3.rotation.y = Math.PI / 2;
                wall3.position.x = -size.x / 2;
                wall4.position.z = size.y / 2;
                wall4.rotation.y = -Math.PI;
                objects[value].name = value + '_box';
                objects[value].add(floor);
                objects[value].add(wall1);
                objects[value].add(wall2);
                objects[value].add(wall3);
                objects[value].add(wall4);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'room2': {//floor and walls  
                objects[value] = new THREE.Group();
                var mat1=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/wallwhite.jpg'),                    
                }); 
                mat1.map.wrapS = mat1.map.wrapT = THREE.RepeatWrapping;  
                mat1.map.anisotropy = 4;
                mat1.map.repeat.set(2,2);
                
                var size = new THREE.Vector3(180, 200, 110);//ground width/height - wall size
                var floor = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 1), materials[1]);
                    floor.name='room_floor';
                var wall1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, size.z), mat1);                
                //var mat2=mat1.clone();
                //mat2.map=mat2.map.clone();
                //mat2.map.needsUpdate=true;
                //mat2.map.repeat.set(4,4);
                var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), mat1);

                var mat3=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/marble/marble.jpg'),
                    roughnessMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_rough.jpg'),
                    bumpMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_bump.jpg'),
                    normalMap:await LOADER.textureLoader.loadAsync('./images/marble/marble_normal.jpg'),
                });                        
                mat3.map.wrapS = mat3.map.wrapT = THREE.RepeatWrapping;
                mat3.map.anisotropy = 4;  
                mat3.map.repeat.set(3,3);
                mat3.roughnessMap.wrapS = mat3.roughnessMap.wrapT = THREE.RepeatWrapping;  
                mat3.roughnessMap.anisotropy = 4;  
                mat3.roughnessMap.repeat.copy(mat3.map.repeat);    
                mat3.bumpMap.wrapS = mat3.bumpMap.wrapT = THREE.RepeatWrapping;  
                mat3.bumpMap.anisotropy = 4;                      
                mat3.bumpMap.repeat.copy(mat3.map.repeat);   
                mat3.normalMap.wrapS = mat3.normalMap.wrapT = THREE.RepeatWrapping;  
                mat3.normalMap.anisotropy = 4;                      
                mat3.normalMap.repeat.copy(mat3.map.repeat);   
                mat3.needsUpdate=true;
                floor.material=mat3;

                //new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y - 30, size.z), materials[96]);
                wall1.position.y = ((size.z) / 2);
                wall2.position.y = (size.z) / 2;
                wall1.name = 'room_wall1';                
                wall2.name = 'room_wall2';
                var wall3 = wall1.clone();
                wall3.name = 'room_wall3';
                var wall4 = wall2.clone();
                wall4.name = 'room_wall4';
                
                var mat4=materials[97][4];                
                mat4.map.rotation=Math.PI/2;
                mat4.roughnessMap.rotation=Math.PI/2;
                mat4.bumpMap.rotation=Math.PI/2;
                mat4.map.repeat.set(0.29,  6);
                mat4.roughnessMap.repeat.copy(mat4.map.repeat);
                mat4.bumpMap.repeat.copy(mat4.map.repeat);
                mat4.color.set(0xffffff);

                var mat5=materials[95][4].clone();
                mat5.bumpMap.repeat.x=mat5.roughnessMap.repeat.x=mat5.map.repeat.x=8;
                mat5.color.set(0xffffff);
                var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, 5), mat5);
                var plane1_1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, (size.z / 4)+3), mat4);
                var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, 5), mat5);                
                var plane2_1 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, (size.z / 4)+3), mat4);                
                
                plane1.position.set(0, -(size.z / 5), 0.5);
                plane1_1.position.set(0, -(size.z / 2)+16, 0.6);
                plane2.position.copy(plane1.position);
                plane2_1.position.copy(plane1_1.position);
                wall1.add(plane1);
                wall1.add(plane1_1);
                wall2.add(plane2.clone());
                wall2.add(plane2_1.clone());
                wall3.add(plane1.clone());
                wall3.add(plane1_1.clone());
                wall4.add(plane2.clone());
                wall4.add(plane2_1.clone());
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                wall1.rotation.y = -Math.PI / 2;
                wall1.position.x = (size.x / 2);                
                wall1.receiveShadow = true;
                wall2.position.z = -size.y / 2;
                wall2.receiveShadow = true;
                wall3.rotation.y = Math.PI / 2;
                wall3.position.x = -size.x / 2;
                wall4.position.z = size.y / 2;
                wall4.rotation.y = -Math.PI;
                objects[value].name = value + '_box';
                objects[value].add(floor);
                objects[value].add(wall1);
                objects[value].add(wall2);
                objects[value].add(wall3);
                objects[value].add(wall4);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'room3': {//floor and walls  
                objects[value] = new THREE.Group();
                var mat1=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/tile30/base.jpg'),
                    roughnessMap: await LOADER.textureLoader.loadAsync('./images/tile30/rough.jpg'),
                    bumpMap: await LOADER.textureLoader.loadAsync('./images/tile30/bump.jpg'),
                    normalMap:await LOADER.textureLoader.loadAsync('./images/tile30/normal.jpg'),
                });  
                mat1.map.wrapS = mat1.map.wrapT = THREE.RepeatWrapping;
                mat1.map.anisotropy = 4;  
                mat1.map.repeat.set(3,3);
                mat1.roughnessMap.wrapS = mat1.roughnessMap.wrapT = THREE.RepeatWrapping;  
                mat1.roughnessMap.anisotropy = 4;  
                mat1.roughnessMap.repeat.copy(mat1.map.repeat);    
                mat1.bumpMap.wrapS = mat1.bumpMap.wrapT = THREE.RepeatWrapping;  
                mat1.bumpMap.anisotropy = 4;                      
                mat1.bumpMap.repeat.copy(mat1.map.repeat);   
                mat1.normalMap.wrapS = mat1.normalMap.wrapT = THREE.RepeatWrapping;  
                mat1.normalMap.anisotropy = 4;                      
                mat1.normalMap.repeat.copy(mat1.map.repeat);   
                mat1.needsUpdate=true;

                var mat3=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/marble/marble.jpg'),
                    roughnessMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_rough.jpg'),
                    bumpMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_bump.jpg'),
                    normalMap:await LOADER.textureLoader.loadAsync('./images/marble/marble_normal.jpg'),
                }); 
                mat3.map.wrapS = mat3.map.wrapT = THREE.RepeatWrapping;
                mat3.map.anisotropy = 4;  
                mat3.map.repeat.set(3,3);
                mat3.roughnessMap.wrapS = mat3.roughnessMap.wrapT = THREE.RepeatWrapping;  
                mat3.roughnessMap.anisotropy = 4;  
                mat3.roughnessMap.repeat.copy(mat3.map.repeat);    
                mat3.bumpMap.wrapS = mat3.bumpMap.wrapT = THREE.RepeatWrapping;  
                mat3.bumpMap.anisotropy = 4;                      
                mat3.bumpMap.repeat.copy(mat3.map.repeat);   
                mat3.normalMap.wrapS = mat3.normalMap.wrapT = THREE.RepeatWrapping;  
                mat3.normalMap.anisotropy = 4;                      
                mat3.normalMap.repeat.copy(mat3.map.repeat);   
                mat3.needsUpdate=true;
                
                var size = new THREE.Vector3(140, 100, 110);//ground width/height - wall size
                var floor = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 1),mat3);
                floor.name='room_floor';
                var wall1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, size.z), mat1);                
                var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), mat1);

                //floor.material=mat3;
                wall1.position.y = ((size.z) / 2);
                wall2.position.y = (size.z) / 2;
                wall1.name = 'room_wall1';                
                wall2.name = 'room_wall2';
                var wall3 = wall1.clone();
                wall3.name = 'room_wall3';
                var wall4 = wall2.clone();
                wall4.name = 'room_wall4';
                
                var mat5=materials[95][4].clone();                
                mat5.bumpMap.repeat.x=mat5.roughnessMap.repeat.x=mat5.map.repeat.x=8;        
                mat5.color.set(0xffffff);
                var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, 5), mat5);
                var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, 5), mat5);                
                             
                
                plane1.position.set(0, -(size.z / 5), 0.5);
                plane2.position.copy(plane1.position);
                wall1.add(plane1);
                wall2.add(plane2.clone());
                wall3.add(plane1.clone());
                wall4.add(plane2.clone());
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                wall1.rotation.y = -Math.PI / 2;
                wall1.position.x = (size.x / 2);                
                wall1.receiveShadow = true;
                wall2.position.z = -size.y / 2;
                wall2.receiveShadow = true;
                wall3.rotation.y = Math.PI / 2;
                wall3.position.x = -size.x / 2;
                wall4.position.z = size.y / 2;
                wall4.rotation.y = -Math.PI;
                objects[value].name = value + '_box';
                objects[value].add(floor);
                objects[value].add(wall1);
                objects[value].add(wall2);
                objects[value].add(wall3);
                objects[value].add(wall4);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'room4': {//floor and walls  
                objects[value] = new THREE.Group();
                var mat1=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/wallwhite.jpg'),                    
                }); 
                mat1.map.wrapS = mat1.map.wrapT = THREE.RepeatWrapping;  
                mat1.map.anisotropy = 4;
                mat1.map.repeat.set(2,2);
                var mat3=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/marble/marble.jpg'),
                    roughnessMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_rough.jpg'),
                    bumpMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_bump.jpg'),
                    normalMap:await LOADER.textureLoader.loadAsync('./images/marble/marble_normal.jpg'),
                }); 
                mat3.map.wrapS = mat3.map.wrapT = THREE.RepeatWrapping;
                mat3.map.anisotropy = 4;  
                mat3.map.repeat.set(3,3);
                mat3.roughnessMap.wrapS = mat3.roughnessMap.wrapT = THREE.RepeatWrapping;  
                mat3.roughnessMap.anisotropy = 4;  
                mat3.roughnessMap.repeat.copy(mat3.map.repeat);    
                mat3.bumpMap.wrapS = mat3.bumpMap.wrapT = THREE.RepeatWrapping;  
                mat3.bumpMap.anisotropy = 4;                      
                mat3.bumpMap.repeat.copy(mat3.map.repeat);   
                mat3.normalMap.wrapS = mat3.normalMap.wrapT = THREE.RepeatWrapping;  
                mat3.normalMap.anisotropy = 4;                      
                mat3.normalMap.repeat.copy(mat3.map.repeat);   
                mat3.needsUpdate=true;
                
                var size = new THREE.Vector3(140+180, 220, 110);//ground width/height - wall size
                var floor = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 1), materials[1]);
                floor.name='room_floor';
                var wall1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, size.z), mat1);                
                var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), mat1);

                floor.material=mat3;
                wall1.position.y = ((size.z) / 2);
                wall2.position.y = (size.z) / 2;
                wall1.name = 'room_wall1';                
                wall2.name = 'room_wall2';
                var wall3 = wall1.clone();
                wall3.name = 'room_wall3';
                var wall4 = wall2.clone();
                wall4.name = 'room_wall4';
                
                var mat5=materials[95][4].clone();                
                mat5.bumpMap.repeat.x=mat5.roughnessMap.repeat.x=mat5.map.repeat.x=8;        
                mat5.color.set(0xffffff);
                var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, 5), mat5);
                var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, 5), mat5);                
                                             
                plane1.position.set(0, -(size.z / 5), 0.5);
                plane2.position.copy(plane1.position);
                wall1.add(plane1);
                wall2.add(plane2.clone());
                wall3.add(plane1.clone());
                wall4.add(plane2.clone());
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                wall1.rotation.y = -Math.PI / 2;
                wall1.position.x = (size.x / 2);                
                wall1.receiveShadow = true;
                wall2.position.z = -size.y / 2;
                wall2.receiveShadow = true;
                wall3.rotation.y = Math.PI / 2;
                wall3.position.x = -size.x / 2;
                wall4.position.z = size.y / 2;
                wall4.rotation.y = -Math.PI;
                objects[value].name = value + '_box';
                objects[value].add(floor);
                objects[value].add(wall1);
                objects[value].add(wall2);
                objects[value].add(wall3);
                objects[value].add(wall4);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'room5': {//floor and walls  
                objects[value] = new THREE.Group();
                var mat1=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/wallwhite.jpg'),                    
                }); 
                mat1.map.wrapS = mat1.map.wrapT = THREE.RepeatWrapping;  
                mat1.map.anisotropy = 4;
                mat1.map.repeat.set(2,2);
                var mat3=new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    color: 0xffffff,
                    metalness: 0.2,
                    bumpScale: 1,
                    map: await LOADER.textureLoader.loadAsync('./images/marble/marble.jpg'),
                    roughnessMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_rough.jpg'),
                    bumpMap: await LOADER.textureLoader.loadAsync('./images/marble/marble_bump.jpg'),
                    normalMap:await LOADER.textureLoader.loadAsync('./images/marble/marble_normal.jpg'),
                }); 
                mat3.map.wrapS = mat3.map.wrapT = THREE.RepeatWrapping;
                mat3.map.anisotropy = 4;  
                mat3.map.repeat.set(3,3);
                mat3.roughnessMap.wrapS = mat3.roughnessMap.wrapT = THREE.RepeatWrapping;  
                mat3.roughnessMap.anisotropy = 4;  
                mat3.roughnessMap.repeat.copy(mat3.map.repeat);    
                mat3.bumpMap.wrapS = mat3.bumpMap.wrapT = THREE.RepeatWrapping;  
                mat3.bumpMap.anisotropy = 4;                      
                mat3.bumpMap.repeat.copy(mat3.map.repeat);   
                mat3.normalMap.wrapS = mat3.normalMap.wrapT = THREE.RepeatWrapping;  
                mat3.normalMap.anisotropy = 4;                      
                mat3.normalMap.repeat.copy(mat3.map.repeat);   
                mat3.needsUpdate=true;
                
                var size = new THREE.Vector3(200, 180, 110);//ground width/height - wall size
                var floor = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 1), materials[1]);
                floor.name='room_floor';
                var wall1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, size.z), mat1);                
                var wall2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), mat1);

                floor.material=mat3;
                wall1.position.y = ((size.z) / 2);
                wall2.position.y = (size.z) / 2;
                wall1.name = 'room_wall1';                
                wall2.name = 'room_wall2';
                var wall3 = wall1.clone();
                wall3.name = 'room_wall3';
                var wall4 = wall2.clone();
                wall4.name = 'room_wall4';
                
                var mat5=materials[95][4].clone();                
                mat5.bumpMap.repeat.x=mat5.roughnessMap.repeat.x=mat5.map.repeat.x=8;        
                mat5.color.set(0xffffff);
                var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(size.y, 5), mat5);
                var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(size.x, 5), mat5);                
                                             
                plane1.position.set(0, -(size.z / 5), 0.5);
                plane2.position.copy(plane1.position);
                wall1.add(plane1);
                wall2.add(plane2.clone());
                wall3.add(plane1.clone());
                wall4.add(plane2.clone());
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                wall1.rotation.y = -Math.PI / 2;
                wall1.position.x = (size.x / 2);                
                wall1.receiveShadow = true;
                wall2.position.z = -size.y / 2;
                wall2.receiveShadow = true;
                wall3.rotation.y = Math.PI / 2;
                wall3.position.x = -size.x / 2;
                wall4.position.z = size.y / 2;
                wall4.rotation.y = -Math.PI;
                objects[value].name = value + '_box';
                objects[value].add(floor);
                objects[value].add(wall1);
                objects[value].add(wall2);
                objects[value].add(wall3);
                objects[value].add(wall4);
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'atarimanual': {//plane
                objects[value] = new THREE.Group();
                materials[6] = await this.createAPong('./images/manual/amanual0.jpg', './images/manual/amanual1.jpg');
                materials[7] = await this.createAPong('./images/manual/amanual2.jpg', './images/manual/amanual3.jpg');
                materials[8] = await this.createAPong('./images/manual/amanual4.jpg', './images/manual/amanual5.jpg');
                materials[9] = await this.createAPong('./images/manual/amanual6.jpg', './images/manual/amanual7.jpg');
                materials[10] = await this.createAPong('./images/manual/amanual8.jpg', './images/manual/amanual9.jpg');
                materials[11] = await this.createAPong('./images/manual/amanual10.jpg', './images/manual/amanual10.jpg');
                for (var i = 1; i < 7; i++) {
                    var pg = new THREE.Mesh(new THREE.BoxGeometry(70, 100, 1.4 - (i * 0.2)), materials[5 + i]);
                    var pgg = new THREE.Group();
                    pg.name = 'apage' + i;
                    pg.receiveShadow = true;
                    pgg.add(pg);
                    pg.state = 0;
                    pg.lerp = 0;
                    pg.push = 0;
                    pg.position.x = 35;
                    objects[value].add(pgg);
                    pgg.position.x = -35 + (0.5 * i);
                }
                objects[value].name = value;
                if (typeof (execute) == 'function') execute(objects[value]);
                break;
            }

            case 'tlamp': {//INSERTED ATARI CART
                directory = './models/tlamp/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'lamp.zip', (object) => {
                        //object.position.set(0,0,0)
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.4);
                        //object.rotation.y = -Math.PI / 2;
                        var xobj = object.getObjectByName('base').children[0];
                        xobj.name = value + '_base';
                        xobj.material.color.setRGB(0.7, 0.7, 0.7);
                        xobj.material = xobj.material.clone();
                        xobj.material.shininess = 100;
                        xobj = object.getObjectByName('top').children[0];
                        xobj.name = value + '_top';
                        xobj.material = xobj.material.clone();
                        xobj = object.getObjectByName('pusher').children[0];
                        xobj.name = value + '_pusher';
                        xobj = object.getObjectByName('lamp').children[0];
                        xobj.name = value + '_lamp';
                        xobj.material = xobj.material.clone();
                        xobj.material.emissive.set(0x777777);
                        var lampLight = new THREE.SpotLight(0xffffff, 0, 60, 1);
                        xobj.add(lampLight);
                        lampLight.name = value + '_light';
                        lampLight.position.set(12.54, 4, -26.04);
                        lampLight.castShadow = true;
                        lampLight.shadow.bias = 0;
                        lampLight.lumen = 5;//light itensity
                        lampLight.itensity = 0;
                        //lampLight.visible = false;
                        //lampLight.angle = 1.4;
                        lampLight.penumbra = 0.3;
                        lampLight.target.position.set(100, -190, 0);
                        lampLight.target.updateMatrixWorld();

                        resolve(object);
                    }, 'diffuse.jpg', 'specullar.jpg', 'normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'atari': {//ATARI video Game
                directory = './models/atari2/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'atari_nojoy.zip', (object) => {
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.4);
                        object.rotation.y = -Math.PI / 2;
                        //plastic black parts                                       
                        loadGLBZ(directory, object.getObjectByName('object_1'), (cobjt) => {
                            cobjt.material.color.set(0x666666);
                            directory, object.getObjectByName('object_19').material = cobjt.material;
                        }, 'atari_platic_difusse.jpg', 'atari_plastic_specular.jpg', 'main_noise.jpg');
                        //controler                    
                        //loadGLBorZipGLB(directory, object.getObjectByName('object_10'), null,
                        //    'controller_difuse.jpg', 'controller_specular.jpg', 'controller_normal.jpg');

                        //cables and pads and roles                    
                        loadGLBZ(directory, object.getObjectByName('object_18'), (cobjt) => {
                            directory, object.getObjectByName('object_3').material = cobjt.material;
                            //directory, object.getObjectByName('object_11').material = cobjt.material;
                            directory, object.getObjectByName('object_24').material = cobjt.material;
                            directory, object.getObjectByName('object_0').material = cobjt.material;
                            //directory, object.getObjectByName('object_9').material = cobjt.material;
                        },
                            'black_plastic.jpg', 'cabble_specular.jpg', 'cabble_normal.jpg');
                        //switchs
                        loadGLBZ(directory, object.getObjectByName('object_25'), (cobjt) => {
                            directory, object.getObjectByName('object_26').material = cobjt.material;
                            directory, object.getObjectByName('object_27').material = cobjt.material;
                            directory, object.getObjectByName('object_28').material = cobjt.material;
                            directory, object.getObjectByName('object_29').material = cobjt.material;
                            directory, object.getObjectByName('object_30').material = cobjt.material;
                            directory, object.getObjectByName('object_30').rotation.y = -0.075;
                            directory, object.getObjectByName('object_30').position.y = 1.3;
                            directory, object.getObjectByName('object_30').name = value + '_switch1';
                            directory, object.getObjectByName('object_29').name = value + '_switch2';
                            directory, object.getObjectByName('object_28').name = value + '_switch3';
                            directory, object.getObjectByName('object_27').name = value + '_switch4';
                            directory, object.getObjectByName('object_26').name = value + '_switch5';
                            directory, object.getObjectByName('object_25').name = value + '_switch6';
                        },
                            'switch_difuse.jpg', 'switch_difuse.jpg', 'switch_normal.jpg');
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                            }
                        },);
                        resolve(object);
                    }, 'atari_wood_difusse.jpg', 'atari_wood_specular.jpg', 'atari_wood_normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'cart_inserted': {//INSERTED ATARI CART
                directory = './models/atari2/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'cartright_inserted.glb', (object) => {
                        //object.position.set(0,0,0)
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.4);
                        object.rotation.y = -Math.PI / 2;
                        resolve(object);
                    }, 'card/pacman.jpg', 'cart_specullar.jpg', 'cart_normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'joy': {//INSERTED ATARI CART
                directory = './models/atari2/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'joy_boned.zip', (object) => {
                        //object.position.set(0,0,0)
                        object = object.parent;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.4);
                        object.rotation.y = -Math.PI / 2;
                        object.getObjectByName('bone02').name = 'joy_bone';
                        resolve(object);
                    }, 'controller_difuse.jpg', 'controller_specular.jpg', 'controller_normal.jpg');
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'tv_channel': {//TV channel button
                directory = './models/tv/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(async (resolve)=> {//Entire Object    
                    var tvmaterial = await LOADER.textureLoader.loadAsync(directory + 'difuse.jpg');
                    loadGLBZ(directory, 'channel.glb', (object) => {
                        object = object.scene;
                        object.scale.multiplyScalar(230);
                        object.name = value + '_box';
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.material.map = tvmaterial;
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                            }
                        });
                        resolve(object);
                    }, null, null, null);
                });
                Promise.all([obj1]).then(function (values) {
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }
            case 'tv': {//TV
                directory = './models/tv/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(async(resolve)=>{//Entire Object   
                    var tvmaterial = await LOADER.textureLoader.loadAsync(directory + 'difuse.jpg');
                    var tvmaterials = await LOADER.textureLoader.loadAsync(directory + 'specular.jpg');
                    tvmaterial.flipY = false;
                    tvmaterials.flipY = false;
                    loadGLBZ(directory, 'tv.glb', (object) => {
                        object = object.scene;
                        object.scale.multiplyScalar(230);
                        object.name = value + '_box';
                        threatMeshes(object, (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                                if (typeof (mesh.material.metalness) != _UN) mesh.material.metalness = 0;
                                if (mesh.parent) {
                                    if (mesh.parent.name == 'polySurface3') { //box - part
                                        mesh.name = value + '_cube';
                                        var monitorLight = new THREE.SpotLight(0xffffff, 0.15, 180, 1);
                                        monitorLight.position.set(-1.5, 0.5, -4.4);
                                        monitorLight.castShadow = true;
                                        //monitorLight.shadow.bias = 0;
                                        monitorLight.shadow.bias = -0.0009;
                                        //monitorLight.visible = false;
                                        monitorLight.angle = 1.6;
                                        monitorLight.penumbra = 0.4;
                                        monitorLight.target.position.set(-3, 3, 15);
                                        monitorLight.target.updateMatrixWorld();
                                        monitorLight.lumen = 0.15;//light itensity
                                        monitorLight.itensity = 0;
                                        MONITORLIGHT = monitorLight;
                                        mesh.material.map = tvmaterial;
                                        mesh.material.specularIntensityMap = tvmaterials;
                                        mesh.add(monitorLight);
                                    }
                                    if (mesh.parent.name == 'pasted__pCube1') { //monitor - part
                                        mesh.name = value + '_monitor';
                                        mesh.material = materials[3];
                                    }
                                }
                                if (mesh.name == 'polySurface7') { //light area button
                                    mesh.material = mesh.material.clone();
                                }
                                if (mesh.name == 'pCube2' || mesh.name == 'pCube3' ||
                                    mesh.name == 'pCube6' || mesh.name == 'tv_cube' ||
                                    mesh.name == 'pCube7') { //Back black part                                   
                                    //mesh.material = mesh.material.clone();
                                    //mesh.material.color.setRGB(3,3,3);
                                }
                            }
                        });
                        resolve(object);
                    }, null, null, null);
                });
                Promise.all([obj1]).then(async function (values) {
                    values[0].getObjectByName('tv_cube').material.map = await LOADER.textureLoader.load(directory + 'wood.png');
                    values[0].getObjectByName('tv_cube').material.color.set(0x999999);
                    values[0].getObjectByName('pCube2').material.color.set(0x999999);
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }
            case 'desk': {//desk table      
                directory = './models/desk/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//table - part     
                    loadGLBZ(directory, 'desk_nodraw.glb', (object) => {
                        object.name = value + '_table';
                        object.position.y = 140;
                        resolve(object);
                    }, 'diffuse.jpg', 'specular.jpg', 'normal.jpg');
                });
                obj2 = new Promise(function (resolve) {//drawners part    
                    loadGLBZ(directory, 'desk_draws.glb', (object) => {
                        object.parent.name = value + '_draws';
                        object.parent.position.y = 140;
                        for (var i = 1; i < 7; i++){
                            var currdraw=object.parent.getObjectByName('drawn'+i);
                            currdraw.op= new THREE.Vector3(0, -160, 1.66);                        
                            if (i == 2) currdraw.extra=new THREE.Vector3(0,32.8,0);
                            if (i == 3) currdraw.extra=new THREE.Vector3(0, 25.1,0);
                            if (i == 4) currdraw.extra=new THREE.Vector3(0,18.5,0);
                            if (i == 5) currdraw.extra=new THREE.Vector3(0,1.68,0);
                            if (i == 6) currdraw.extra=new THREE.Vector3(0,7,0);
                        }
                        resolve(object.parent);
                    }, 'diffuse2.jpg', 'specular.jpg', 'normal.jpg');
                });
                obj3 = new Promise(function (resolve) {//metal - part     
                    loadGLBZ(directory, 'metal.zip', (object) => {
                        object.name = value + '_metal';
                        object.position.y = 140;
                        resolve(object);
                    }, 'diffuse2.jpg', 'specular2.jpg', 'normal2.jpg');
                });
                Promise.all([obj1, obj2, obj3]).then(function (values) {
                    values[1].children[0].material.map = values[0].material.map;
                    objects[value].add(values[0]);
                    objects[value].add(values[1]);
                    objects[value].add(values[2]);
                    objects[value].rotation.x = -Math.PI / 2;
                    objects[value].scale.multiplyScalar(0.08);
                    objects[value].position.y = -20;
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }
            case 'musicbox': {//musicbox            
                directory = './models/balarin/';
                objects[value] = new THREE.Group();
                objects[value].name=value+'_box';
                obj1 = new Promise(function (resolve) {//box - part
                    loadGLBZ(directory, 'box.zip', (object) => {
                        object.name = value + '_base';
                        object.rotation.x = - Math.PI / 2;
                        resolve(object);
                    });
                });
                obj2 = new Promise(function (resolve) {//cord - part
                    loadGLBZ(directory, 'cord.zip', (object) => {
                        object.name = value + '_cord';
                        object.rotation.x = - Math.PI / 2;
                        object.position.set(-17.594062093094426, 0, 2.838106881756497);
                        resolve(object);
                    });
                });
                obj3 = new Promise(function (resolve) {//rolo - part
                    loadGLBZ(directory, 'rolo.zip', (object) => {
                        var rologroup = new THREE.Group();
                        rologroup.name = value + '_rolo';
                        rologroup.add(object);
                        rologroup.position.set(4.6, 1.2, -4.6);
                        resolve(rologroup);
                    });
                });
                obj4 = new Promise(function (resolve) {//tampa - part
                    loadGLBZ(directory, 'tampa.zip', (object) => {
                        var rologroup = new THREE.Group();
                        rologroup.name = value + '_tampa';
                        rologroup.abrindo = 5;
                        rologroup.add(object);
                        rologroup.position.set(0, 5.9, -11.08);
                        resolve(rologroup);
                        //opened = rotation.x=-1.6;                    
                    });
                });
                Promise.all([obj1, obj2, obj3, obj4]).then(function (values) {
                    objects[value].add(values[0]);
                    objects[value].add(values[1]);
                    objects[value].add(values[2]);
                    objects[value].add(values[3]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
            }
        }
    }
}

export { OBJECT3D };