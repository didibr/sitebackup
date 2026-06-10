//recompress using https://githubdragonfly.github.io/viewers/templates/GM%20Viewer.html


/*usefull

########## EXPORT UV
function exportUVArray(mesh, decimals = 3){
    if(
        !mesh ||
        !mesh.geometry ||
        !mesh.geometry.attributes.uv
    ){
        console.error('Mesh sem UV');
        return;
    }
    const uvArray = Array.from(
        mesh.geometry.attributes.uv.array,
        v => Number(v.toFixed(decimals))
    );
    const formatted =
`const uvArray = ${JSON.stringify(uvArray)};`;
    console.log(formatted);
    return formatted;
}

//########### EXPORT IMAGE
function downloadMaterialMap(mesh, filename = 'texture.jpg') {
    if (
        !mesh ||
        !mesh.material ||
        !mesh.material.map
    ) {
        console.error('Mesh sem material.map');
        return;
    }
    const image = mesh.material.map.image;
    if (!image) {
        console.error('Textura sem image');
        return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
    console.log('Download iniciado:', filename);
}
*/
//import { Fish } from HOMESITE+'i_fish.js';
const { Fish } = await import(`${HOMESITE}i_fish.js`);

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

        /*if(directory.startsWith("./")==true){        
            if(directory.startsWith("models/") && !directory.endsWith(".jpg"))directory='images/'+directory;
            directory=HOMESITE+directory.slice(2);   
        }*/

        var coorectname=HOMESITE+'images/'+directory.slice(2);
        directory=HOMESITE+directory.slice(2);
        
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
                LOADER.textureLoader.load(coorectname + normalName, (normal) => {                    
                    finalmaterial.normalMap = normal;
                    finalmaterial.normalMap.flipY = false;
                    finalmaterial.needsUpdate = true;
                    if (typeof (execute) == 'function') execute(objeto);
                }, () => { }, () => { //error normal
                    finalmaterial.normalMap = null;
                    finalmaterial.needsUpdate = true;
                    console.warn('normalMap not loaded', coorectname + normalName);
                    if (typeof (execute) == 'function') execute(objeto);
                });
            }
            function loadspecular() {
                LOADER.textureLoader.load(coorectname + specularName, (specular) => {
                    finalmaterial.specularMap = specular;
                    finalmaterial.specularMap.flipY = false;
                    finalmaterial.specularMap.needsUpdate = true;
                    loadnormal();
                }, () => { }, () => { //error specular
                    console.warn('specularMap not loaded', coorectname + specularName);
                    finalmaterial.specularMap = null;
                    finalmaterial.needsUpdate = true;
                    loadnormal();
                });
            }
            LOADER.textureLoader.load(coorectname + diffuseName, (material) => {
                finalmaterial.map = material;
                finalmaterial.map.flipY = false;
                finalmaterial.map.needsUpdate = true;
                loadspecular();
            }, () => { }, () => {//error difuse
                console.warn('difusseMap not loaded', coorectname + diffuseName);
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
            directory = './models/atari/';
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
                    loadGLBZ(directory, 'curtain.glb', (object) => {
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
                                    LOADER.textureLoader.load(directory + 'difuse2.jpg',(texture)=>{
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
                    }, 'difuse.jpg', 'rough.jpg', 'gray.jpg');
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

            case 'aquarium': {//aquarium box with fish
                function createBuble() {
                    const bubbleGeometry = new THREE.SphereGeometry(0.3, 5, 5);
                    var SMATERIAL=materials[99];                    
                    if(typeof(SHADERMATERIAL.BUBLE)!==_UN)SMATERIAL=SHADERMATERIAL.BUBLE.material;
                    const bubble = new THREE.Mesh(bubbleGeometry, SMATERIAL);
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
                    var SMATERIAL=materials[99];
                    if(typeof(SHADERMATERIAL.WATER)!==_UN)SMATERIAL=SHADERMATERIAL.WATER.material;

                    waterTop.material = SMATERIAL;
                    waterTop.material.transparent = true;
                    waterTop.material.blending = 1;
                    waterTop.rotation.x = -Math.PI / 2;
                    waterTop.position.y = 8;

                    loadGLBZ(directory, 'fish_boned.glb', (fishobj) => { //Fish Obj   
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

                        loadGLBZ(directory, 'ground.glb', (groundobj) => { //Ground Rocks                   
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

                            loadGLBZ(directory, 'foliage.glb', (foliageobj) => { //Foliage
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
                    loadGLBZ(directory, 'door.glb', (object) => {
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

            case 'desk_simple': {//desk
                directory = './models/desk_simple/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'desk.glb', (object) => {
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
                    loadGLBZ(directory, 'lamp.glb', (object) => {
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

           

            case 'atari': {//ATARI video Game
                directory = './models/atari/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'atari_nojoy.glb', (object) => {
                        object = object.scene;
                        window.CCC = object;
                        object.name = value + '_box';
                        object.scale.multiplyScalar(0.4);
                        object.rotation.y = -Math.PI / 2;                        
                        resolve(object);
                    }, null, null, null);
                });
                Promise.all([obj1]).then(async function (values) {
                    //atari textures plastic
                    var mat1 = await LOADER.textureLoader.loadAsync(directory + 'atari_platic_difusse.jpg');
                    var mat1s = await LOADER.textureLoader.loadAsync(directory + 'atari_plastic_specular.jpg');
                    var mat1n = await LOADER.textureLoader.load(directory + 'main_noise.jpg');
                    mat1.flipY = false;
                    mat1s.flipY = false;
                    mat1n.flipY = false;
                    //atari decalc and wood
                    var wat1 = await LOADER.textureLoader.loadAsync(directory + 'atari_wood_difusse.jpg');
                    var wat1s = await LOADER.textureLoader.loadAsync(directory + 'atari_wood_specular.jpg');
                    var wat1n = await LOADER.textureLoader.load(directory + 'atari_wood_normal.jpg');
                    wat1.flipY = false;
                    wat1s.flipY = false;
                    wat1n.flipY = false;
                    //cabble
                    var cat1 = await LOADER.textureLoader.loadAsync(directory + 'black_plastic.jpg');
                    var cat1s = await LOADER.textureLoader.loadAsync(directory + 'cabble_specular.jpg');
                    var cat1n = await LOADER.textureLoader.load(directory + 'cabble_normal.jpg');
                    cat1.flipY = false;
                    cat1s.flipY = false;
                    cat1n.flipY = false;                    
                    //switches
                    var mat2 = await LOADER.textureLoader.loadAsync(directory + 'switch_difuse.jpg');                    
                    mat2.flipY = false;                    
                    var switchtexture = values[0].children[0].children[0].material.clone();
                    switchtexture.map = mat2;
                    switchtexture.metalness=1.9;                                        

                    threatMeshes(values[0], (mesh) => {
                        if (mesh.material && mesh.material.isMaterial) {
                            mesh.material.map = cat1;
                            mesh.material.specularIntensityMap = cat1s;
                            mesh.material.normalMap = cat1n;
                            //atari
                             if (['object_21_1','object_12_1']
                                .includes(mesh.name)) {
                                  mesh.material.map = wat1;
                                  mesh.material.specularIntensityMap = wat1s;
                                  mesh.material.normalMap = wat1n;  
                                }
                                //atari
                             if (['object_1_1']
                                .includes(mesh.name)) {
                                  mesh.material.map = mat1;
                                  mesh.material.specularIntensityMap = mat1s;
                                  mesh.material.normalMap = mat1n;  
                                }
                            //switch                                    
                            if (['object_25002', 'object_25001', 'object_25_1', 'object_25003', 'object_25004', 'object_25005']
                                .includes(mesh.name)) { 
                                mesh.material = switchtexture;
                                if (mesh.name === 'object_25005') {
                                    mesh.rotation.y = -0.09;
                                    mesh.position.z = -1.8;                                    
                                    mesh.position.x = 0.5; //down
                                    mesh.name = value + '_switch1';
                                }
                                if (mesh.name === 'object_25004') mesh.name = value + '_switch2';
                                if (mesh.name === 'object_25003') mesh.name = value + '_switch3';
                                if (mesh.name === 'object_25002') mesh.name = value + '_switch4';
                                if (mesh.name === 'object_25001') mesh.name = value + '_switch5';
                                if (mesh.name === 'object_25_1') mesh.name = value + '_switch6';
                            }
                        }
                    });
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }

            case 'cart_inserted': {//INSERTED ATARI CART
                directory = './models/atari/';
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
                directory = './models/atari/';
                objects[value] = new THREE.Group();
                obj1 = new Promise(function (resolve) {//Entire Object    
                    loadGLBZ(directory, 'joy_boned.glb', (object) => {
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
                        object.children[0].name=value + '_btn';
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
                    loadGLBZ(directory, 'tv.glb', (object) => {                        
                        object = object.scene;                        
                        object.scale.multiplyScalar(230);
                        object.name = value + '_box';                        
                        resolve(object);
                    }, null, null, null);
                });
                Promise.all([obj1]).then(async function (values) {
                    //values[0].getObjectByName('tv_cube').material.map = await LOADER.textureLoader.load(directory + 'wood.png');
                    //values[0].getObjectByName('tv_cube').material.color.set(0x999999);
                    //values[0].getObjectByName('pCube2').material.color.set(0x999999);

                    var tvmaterial = await LOADER.textureLoader.loadAsync(directory + 'difuse.jpg');
                    var tvmaterials = await LOADER.textureLoader.loadAsync(directory + 'specular.jpg');
                    var tvwood = await LOADER.textureLoader.load(directory + 'wood.png');
                    tvmaterial.flipY = false;
                    tvmaterials.flipY = false;
                    tvwood.flipY = false;

                    threatMeshes(values[0], (mesh) => {
                            if (mesh.material && mesh.material.isMaterial) {
                                mesh.material.map = tvmaterial;
                                mesh.material.specularIntensityMap=tvmaterials;

                                if (mesh.name == 'Mesh') { //box - part
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
                                        mesh.material.map = tvwood;
                                        mesh.material.specularIntensityMap = tvmaterials;
                                        mesh.add(monitorLight);
                                    }

                                    if (mesh.name == 'Mesh011') { //monitor - part
                                        mesh.name = value + '_monitor';
                                        mesh.material = materials[3];
                                    }

                                    if (mesh.name == 'Mesh008') { //monitor - part
                                        mesh.name = value + '_power';                                        
                                    }

                                    if (mesh.name == 'Mesh005') { //monitor - part
                                        mesh.material = mesh.material.clone();
                                        mesh.name = value + '_led';                                        
                                    }
                            }
                        });
                    //values[0].getObjectByName('Mesh003').material.map = tvmaterial;
                    objects[value].add(values[0]);
                    if (typeof (execute) == 'function') execute(objects[value]);
                });
                break;
            }
            case 'desk': {//tv desk
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
                    loadGLBZ(directory, 'metal.glb', (object) => {
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
            
        }
    }
}

export { OBJECT3D };