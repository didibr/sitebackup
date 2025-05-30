//postprocess
//import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
//import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
//import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
//Antialiases Pass
import * as THREE from 'three';

var darkmaterials = {};
window.finalComposer = null;
var bloomLayer = null,
    filters = { FXAA: null, N8AO: null, SMAA: null, SSAO: null, HBLUR: null, VBLUR: null, BLOOM: null },
    postprocessEnabled = true,
    darkMaterial = null;
window.SHADERMATERIAL = {};

class ISHADERS {
	vertex = [];
	fragment = [];
	_generateVertex(id, data) {
		this.vertex[id] = data;
	}
	_generateFragment(id, data) {
		this.fragment[id] = data;
	}

	load() {
		//######## DEFAULT ######
		this._generateVertex('vertexshader',
			`varying vec2 vUv;void main() {vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`);
		this._generateFragment('fragmentshader',
			`uniform sampler2D baseTexture;
				uniform sampler2D xTexture;varying vec2 vUv;
				void main() {gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( xTexture, vUv ) );}`
		);
	
		

		//######## BUBLES ######
		this._generateFragment('bublefragment',
			`uniform vec3 color1;
			uniform vec3 color2;			
			varying vec2 vUv;
			void main() {
				gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
				gl_FragColor.a=0.06;
			}`
		);
		
	}

}

class POSTPROCESS {    
    ishaders = null;
    filters = filters;
 
    update(delta,elapsed) {
        //if (SHADERMATERIAL.LAVA && SHADERMATERIAL.LAVA.onUpdate) SHADERMATERIAL.LAVA.onUpdate(delta,elapsed);
        //if (SHADERMATERIAL.WATER && SHADERMATERIAL.WATER.onUpdate) SHADERMATERIAL.WATER.onUpdate(delta,elapsed);
        if (SHADERMATERIAL.BUBLE && SHADERMATERIAL.BUBLE.onUpdate) SHADERMATERIAL.BUBLE.onUpdate(delta,elapsed);
        //if (SHADERMATERIAL.WATERFALL && SHADERMATERIAL.WATERFALL.onUpdate) SHADERMATERIAL.WATERFALL.onUpdate(delta,elapsed);
    }

    render(execute) {
        //renderer.render(scene,camera);
        //if(typeof(execute)=='function')execute();
        //return;     
        if (finalComposer && finalComposer.render && finalComposer.render != null &&
            typeof (scene) != _UN) {
            if (postprocessEnabled == true) {
                var prevFog=scene.fog;
                var prevBack=scene.background;
                finalComposer.render();
                scene.fog=null;
                scene.background=null;
                scene.traverse(this.bloomMaterialTest);
                finalComposer.bloomComposer.render();
                scene.traverse(this.bloomMaterialRestore);
                scene.fog=prevFog;
                scene.background=prevBack;
            } else {
                finalComposer.render();
            }
            if (typeof (execute) == 'function') execute();
        } else {
            renderer.render(scene, camera);
        }
        renderer.clearDepth();
    }

    async createMaterials() {
      
        //#### BUBLE
        try {
            SHADERMATERIAL['BUBLE'] = {
                uniforms: null,
                material: null,
                onUpdate: undefined
            }
            SHADERMATERIAL.BUBLE.uniforms = {
                color1: { value: new THREE.Color("#FFFFFF") },
                color2: { value: new THREE.Color("#AAAAAA") }
            };
            SHADERMATERIAL.BUBLE.material = new THREE.ShaderMaterial({
                uniforms: SHADERMATERIAL.BUBLE.uniforms,
                vertexShader: this.ishaders.vertex['vertexshader'],
                fragmentShader: this.ishaders.fragment['bublefragment'],
                transparent: true,
                depthTest: true
            });
            SHADERMATERIAL.BUBLE.onUpdate = function (delta) {
                //SHADERMATERIAL.BUBLE.uniforms[1]['viewVector'].value=camera.position;
            }
        } catch (e) { console.log('Shader Buble', e); }
           
        
    }

    async createPostProcess() {   
        this.ishaders = new ISHADERS();
        this.ishaders.load();
        await this.createMaterials();
        darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
        bloomLayer = new THREE.Layers();
        bloomLayer.set(10);
        var defaultShader = this.ishaders.vertex['vertexshader'];
        var defaultFragment = this.ishaders.fragment['fragmentshader'];

        /*var watershader=ishaders.vertex['watershader'];
        var updateShader=ishaders.vertex['updateShader'];
        var normalShader=ishaders.vertex['normalShader'];*/
        //#####################################
        //###### FINAL FILTERS on Window
        //#####################################
        function makevertex(texture) {
            return new THREE.ShaderPass(
                new THREE.ShaderMaterial({
                    uniforms: {
                        baseTexture: { value: null },
                        xTexture: { value: texture },
                        brightness: { value: 1.0 }
                    },
                    vertexShader: defaultShader,
                    //document.getElementById('vertexshader').textContent,
                    fragmentShader: defaultFragment,
                    //document.getElementById('fragmentshader').textContent,
                    defines: {}
                }), "baseTexture"
            );
        }

        finalComposer = new THREE.EffectComposer(renderer);
        filters.FINAL = finalComposer;

        const renderScene = new THREE.RenderPass(scene, camera);
        finalComposer.addPass(renderScene);


        var vetor2 = new THREE.Vector2(renderer.domElement.width, renderer.domElement.height);
        const pixelRatio = renderer.getPixelRatio();
        //SSAO - shadow on borders
        /* Disabled - Using N8AO
        filters.SSAO = new SSAOPass(scene, camera, vetor2.x, vetor2.y);
        filters.SSAO.kernelRadius = 1.4;//14;
        filters.SSAO.minDistance = 0.0005;//0.012;
        filters.SSAO.maxDistance = 0.3;//1;
        filters.SSAO.enabled = postprocessEnabled;
        finalComposer.addPass(filters.SSAO);
        filters.SSAO.active = function (onOff) {
            if (onOff == true) {
                if (finalComposer.passes.includes(filters.SSAO) != true)
                finalComposer.addPass(filters.SSAO);
            } else {
                if (finalComposer.passes.includes(filters.SSAO) == true)
                finalComposer.removePass(filters.SSAO);
            }
            filters.SSAO.enabled = onOff;
        }
        */


        

        //FFXAA - pixel cleaner    
        /*Disabled using SMAA      
        filters.FXAA = new ShaderPass(FXAAShader);
        filters.FXAA.enabled = false;
        filters.FXAA.material.uniforms['resolution'].value.x = 1 / (vetor2.x * pixelRatio);
        filters.FXAA.material.uniforms['resolution'].value.y = 1 / (vetor2.y * pixelRatio);
        finalComposer.addPass(filters.FXAA);
        filters.FXAA.active = function (onOff) {
            if (onOff == true) {
                if (finalComposer.passes.includes(filters.FXAA) != true)
                finalComposer.addPass(filters.FXAA);
            } else {
                if (finalComposer.passes.includes(filters.FXAA) == true)
                finalComposer.removePass(filters.FXAA);
            }
            filters.FXAA.enabled = onOff;
        }
        */

        //N8AO - shadow on borders
        filters.N8AO = new THREE.N8AOPass(scene, camera, vetor2.x, vetor2.y);
        filters.N8AO.configuration.gammaCorrection = false;
        filters.N8AO.configuration.denoiseRadius
        filters.N8AO.configuration.aoRadius = 6;
        filters.N8AO.configuration.denoiseRadius = 10;
        filters.N8AO.enabled = false;
        finalComposer.addPass(filters.N8AO);

        //######### EFFECT BLOOM                 
        filters.BLOOM = new THREE.UnrealBloomPass(vetor2, 1.5, 0.4, 0.85);
        filters.BLOOM.enabled = postprocessEnabled;        
        filters.BLOOM.threshold = 0;
        filters.BLOOM.strength = 1;
        filters.BLOOM.radius = 0;
        finalComposer.bloomComposer = new THREE.EffectComposer(renderer);
        finalComposer.bloomComposer.renderToScreen = false;
        finalComposer.bloomComposer.addPass(renderScene);
        finalComposer.bloomComposer.addPass(filters.BLOOM);
        const bloomPass = makevertex(finalComposer.bloomComposer.renderTarget2.texture);
        bloomPass.needsSwap = true;
        finalComposer.addPass(bloomPass);


        //antaliase
        filters.SMAA = new THREE.SMAAPass(vetor2.x, vetor2.y);
        filters.SMAA.enabled = postprocessEnabled;
        finalComposer.addPass(filters.SMAA);

        //######### EFFECT Blur 
        /*Disable - too Ugly                 
        filters.HBLUR = new ShaderPass(HorizontalBlurShader);
        filters.VBLUR = new ShaderPass(VerticalBlurShader);
        filters.HBLUR.uniforms['h'].value = 0.0002;//2 / ( ENGINE.canvObj.width / 2 );
        filters.VBLUR.uniforms['v'].value = 0.0002;//2 / ( ENGINE.canvObj.height / 2 );  
        finalComposer.addPass(filters.HBLUR);
        finalComposer.addPass(filters.VBLUR);
        filters.VBLUR.enabled = filters.HBLUR.enabled = true;
        */
    }

    bloomMaterialTest(obj) {
        if (bloomLayer != null && (obj.isMesh || obj.isSprite) &&
            bloomLayer.test(obj.layers) === false) {
            darkmaterials[obj.uuid] = obj.material;
            obj.material = darkMaterial;
        }
    }

    bloomMaterialRestore(obj) {
        if (typeof (darkmaterials[obj.uuid]) !== _UN) {
            obj.material = darkmaterials[obj.uuid];
            delete darkmaterials[obj.uuid];
        }
    }



}
export { POSTPROCESS };