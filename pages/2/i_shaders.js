class ISHADERS {
	vertex = [];
	fragment = [];
	_generateVertex(id, data) {
		this.vertex[id] = data;
		/*var elem = document.createElement('script');
		elem.setAttribute('type','x-shader/x-vertex');
		elem.innerHTML=data;
		elem.id=id;
		document.head.appendChild(elem);
		*/
	}
	_generateFragment(id, data) {
		this.fragment[id] = data;
		/*var elem = document.createElement('script');
		 elem.setAttribute('type','x-shader/x-fragment');
		 elem.innerHTML=data;
		 elem.id=id;
		 document.head.appendChild(elem);
		 */
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
		//######## FIRE ######
		this._generateVertex('vertfire',
			`uniform float pointMultiplier;
			attribute float size;
			attribute float angle;
			attribute vec4 colour;
			varying vec4 vColour;
			varying vec2 vAngle;
			void main() {
			  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			  gl_Position = projectionMatrix * mvPosition;
			  gl_PointSize = 1.0 * pointMultiplier / gl_Position.w;			 
			  vAngle = vec2(cos(angle), sin(angle));
			  vColour = colour;}`
		);
		this._generateFragment('fragfire', `uniform sampler2D diffuseTexture;
		 varying vec4 vColour;
		 varying vec2 vAngle;
		 void main() {
			  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
			  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;}`
		);
		//######## Lava ######
		this._generateFragment('fraglava',
			`uniform float time;uniform float fogDensity;
			uniform vec3 fogColor;uniform sampler2D texture1;
			uniform sampler2D texture2;varying vec2 vUv;
			void main( void ) {
				vec2 position = - 1.0 + 2.0 * vUv;
				vec4 noise = texture2D( texture1, vUv );
				vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
				vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;
				T1.x += noise.x * 2.0;
				T1.y += noise.y * 2.0;
				T2.x -= noise.y * 0.2;
				T2.y += noise.z * 0.2;
				float p = texture2D( texture1, T1 * 2.0 ).a;
				vec4 color = texture2D( texture2, T2 * 2.0 );
				vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
				if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
				if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
				if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }
				gl_FragColor = temp;
				float depth = gl_FragCoord.z / gl_FragCoord.w;
				const float LOG2 = 1.442695;
				float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
				fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
				gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
			}`);
		this._generateVertex('vertlava',
			`uniform vec2 uvScale;
			varying vec2 vUv;void main(){vUv = uvScale * uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;}`);
		//######## WATER ######
		this._generateFragment('fragwater',
			`uniform float time;
			uniform float fogDensity;
			uniform vec3 fogColor;
			uniform sampler2D texture1;
			uniform sampler2D texture2;
			varying vec2 vUv;
			void main( void ) {
				vec2 position = - 1.0 + 2.0 * vUv;
				vec4 noise = texture2D( texture1, vUv );
				vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
				vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;
				T1.x += noise.x * 2.0;
				T1.y += noise.y * 2.0;
				T2.x -= noise.y * 0.2;
				T2.y += noise.z * 0.2;
				float p = texture2D( texture1, T1 * 2.0 ).a;        
				vec4 color = texture2D( texture2, T2 * 2.0 );        
				vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
				//if( temp.r > 1.0 ) { temp.bg += temp.r - 1.0;  }
				//if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
				if( temp.b > 1.0 ) { temp.rg += clamp( temp.b - 2.0, 0.0, 50.0 ); }
				gl_FragColor = temp;				
				float depth = gl_FragCoord.z / gl_FragCoord.w;
				const float LOG2 = 1.442695;
				float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
				fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
				gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor ); 				
                gl_FragColor.a=0.1;       
			}`);

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

		//waterfall
		this._generateVertex('waterfallshader',
			`			
			uniform vec2 uvScale;
			varying vec2 vUv;
			void main(){
				vUv = uvScale * uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
			}
  		`);
		this._generateFragment('waterfallfrag', `
		
		uniform vec3 waterColor;
		uniform vec3 foamColor;
		uniform vec3 topDarkColor;
		uniform vec3 topLightColor;
		uniform vec3 bottomLightColor;	
		uniform vec3 bottomDarkColor;	

		uniform float threshold;
		uniform float time;
		uniform float fogDensity;
		uniform vec3 fogColor;
		uniform sampler2D texture1;
		uniform sampler2D texture2;
		varying vec2 vUv;
		void main( void ) {
			vec2 position = - 1.0 + 2.0 * vUv;
			vec4 noise = texture2D( texture1, vUv );
			vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * -0.02;
			vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * -0.01;
			T1.x += noise.x * 2.0;
			T1.y += noise.y * 2.0;
			T2.x -= noise.y * 0.2;
			T2.y += noise.z * 0.2;
			float p = texture2D( texture1, T1 * 2.0 ).a;        
			vec4 color = texture2D( texture2, T2 * 2.0 );        
			vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
			//if( temp.r > 1.0 ) { temp.bg += temp.r - 1.0;  }
			//if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
			if( temp.b > 1.0 ) { temp.rg += clamp( temp.b - 2.0, 0.0, 50.0 ); }
			gl_FragColor = temp;
			
			vec3 color2 = mix( mix( bottomDarkColor, topDarkColor, vUv.y ), mix( bottomLightColor, topLightColor, vUv.y ), p );
			color2 = mix( gl_FragColor.rgb, foamColor, step( vUv.y , threshold ) ); // add foam
	
			  gl_FragColor.rgb = color2;
			  gl_FragColor.a = 0.6;

			/*
			float depth = gl_FragCoord.z / gl_FragCoord.w;
			const float LOG2 = 1.442695;
			float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
			fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
			gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor ); 			
			gl_FragColor.a=0.1; 
			*/
		}

  		`);


	}

}

export { ISHADERS };