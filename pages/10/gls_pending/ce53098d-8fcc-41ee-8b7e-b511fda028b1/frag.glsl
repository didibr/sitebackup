//iChannel1
precision highp float;

#define PIXEL_SIZE 2.0

float sandLine =-0.52; //=-0.52;
float dayNight =1.0; //=1.0;

// =====================================
// HASH / NOISE
// =====================================

float hash1(float n){return fract(sin(n*127.1)*43758.5453123);}
vec2 hash22(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453123);}

float noise(vec2 uv){
    vec2 i=floor(uv),f=fract(uv);
    vec2 u=f*f*(3.0-2.0*f);
    float a=dot(hash22(i+vec2(0.0,0.0)),f-vec2(0.0,0.0));
    float b=dot(hash22(i+vec2(1.0,0.0)),f-vec2(1.0,0.0));
    float c=dot(hash22(i+vec2(0.0,1.0)),f-vec2(0.0,1.0));
    float d=dot(hash22(i+vec2(1.0,1.0)),f-vec2(1.0,1.0));
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y)+0.5;
}

float fbm(vec2 p){
    float v=0.0,a=0.5;
    for(int i=0;i<4;i++){v+=noise(p)*a;p*=2.0;a*=0.5;}
    return v;
}

// =====================================
// CARTOON CLOUDS
// =====================================

float cloudLayer(vec2 p,float scale,float threshold){
    float n=fbm(p*scale);
    return smoothstep(threshold,threshold+0.14,n);
}

vec3 drawClouds(vec2 p,float skyMask,float horizonY){
    vec2 cp=p;cp.x+=iTime*-0.012;
    float c1=cloudLayer(cp+vec2(0.3,-0.12),1.25,0.50);
    float c2=cloudLayer(cp*vec2(1.4,0.75)+vec2(-1.2,0.25),0.95,0.52);
    float clouds=max(c1,c2*0.75);
    float skyLocal=clamp((p.y-horizonY)/(1.0-horizonY),0.0,1.0);
    float fadeHorizon=smoothstep(0.10,0.65,skyLocal);
    float fadeTop=1.0-smoothstep(0.82,1.05,skyLocal);
    clouds*=fadeHorizon*fadeTop*skyMask;
    vec3 shadow=vec3(0.65,0.86,0.95);
    vec3 white=vec3(1.0,0.98,0.9);
    return mix(shadow,white,smoothstep(0.25,0.85,clouds))*clouds;
}

// =====================================
// ORGANIC WAVE TRAIN
// =====================================

float organicWaveTrain(vec2 p,float depth){
    float visible=smoothstep(0.18,0.38,depth);
    float perspective=pow(depth,1.42);
    float largeWarp=fbm(vec2(p.x*0.55,perspective*1.2+iTime*0.03));
    float waveCount=5.6;
    float travel=perspective*waveCount-iTime*0.42;
    travel+=(largeWarp-0.5)*0.42;

    float waveId=floor(travel);
    float local=fract(travel);
    float r1=hash1(waveId+1.0);
    float r2=hash1(waveId+7.0);
    float r3=hash1(waveId+13.0);

    float curve=sin(p.x*mix(1.2,2.8,r1)+r2*6.2831)*mix(0.025,0.075,r2);
    curve+=sin(p.x*mix(3.5,6.0,r3)+r1*6.2831)*mix(0.010,0.035,r3);

    float edgeNoise=fbm(vec2(p.x*mix(1.8,3.2,r1)+r2*5.0,waveId*0.35));
    curve+=(edgeNoise-0.5)*0.05*depth;

    float crestPos=mix(0.32,0.58,r1);
    float distToCrest=abs(local-crestPos+curve);
    float width=mix(0.020,0.060,depth)*mix(0.75,1.35,r2);
    float soft=mix(0.025,0.060,depth);

    float crest=1.0-smoothstep(width,width+soft,distToCrest);

    float backFoam=smoothstep(crestPos+width*0.4,crestPos+width*5.5,local+curve);
    backFoam*=1.0-smoothstep(crestPos+width*5.5,crestPos+width*10.0,local+curve);

    float segment=fbm(vec2(p.x*1.6+r1*8.0,waveId*0.75));
    segment=smoothstep(0.22,0.58,segment);

    float strength=mix(0.45,1.0,r3);
    crest*=segment*strength;
    backFoam*=segment*strength*0.45;

    float life=smoothstep(0.03,0.18,local)*(1.0-smoothstep(0.78,0.98,local));
    float result=(crest+backFoam)*visible*life;
    return clamp(result,0.0,1.0);
}

// =====================================
// FINAL IMAGE
// =====================================

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 pixCoord=floor(fragCoord.xy/PIXEL_SIZE)*PIXEL_SIZE;
    vec2 uv=pixCoord.xy/iResolution.xy;
    vec2 p=uv*2.0-1.0;
    p.x*=iResolution.x/iResolution.y;

    // Main layout
    float horizonY=0.22;
    float dn=clamp(dayNight,0.0,1.0);

    // Beach / shoreline
    float beachY=sandLine+sin(p.x*1.4)*0.035+sin(p.x*3.1+0.8)*0.018;
    float waterPush=sin(iTime*1.25+p.x*2.0)*0.018+sin(iTime*0.75+p.x*5.0)*0.008;
    float shoreY=beachY+waterPush;

    float skyMask=step(horizonY,p.y);
    float sandMask=1.0-step(shoreY,p.y);
    float oceanMask=(1.0-skyMask)*(1.0-sandMask);

    vec3 col=vec3(0.0);

    // Sky colors
    vec3 skyBottomDay=vec3(0.28,0.80,0.95);
    vec3 skyTopDay=vec3(0.03,0.30,0.70);
    vec3 skyBottomNight=vec3(0.03,0.08,0.18);
    vec3 skyTopNight=vec3(0.005,0.015,0.05);

    vec3 skyBottom=mix(skyBottomNight,skyBottomDay,dn);
    vec3 skyTop=mix(skyTopNight,skyTopDay,dn);

    float skyT=clamp((p.y-horizonY)/(1.0-horizonY),0.0,1.0);
    vec3 sky=mix(skyBottom,skyTop,skyT);
    sky+=vec3(0.35,0.45,0.45)*(1.0-skyT)*0.35*dn;
    sky+=drawClouds(p,skyMask,horizonY)*mix(0.35,1.0,dn);

    // Ocean colors
    float depth=clamp((horizonY-p.y)/(horizonY-shoreY),0.0,1.0);

    vec3 oceanFarDay=vec3(0.00,0.20,0.55);
    vec3 oceanNearDay=vec3(0.16,0.72,0.95);
    vec3 oceanFarNight=vec3(0.00,0.03,0.14);
    vec3 oceanNearNight=vec3(0.02,0.16,0.28);

    vec3 oceanFar=mix(oceanFarNight,oceanFarDay,dn);
    vec3 oceanNear=mix(oceanNearNight,oceanNearDay,dn);
    vec3 ocean=mix(oceanFar,oceanNear,pow(depth,0.72));

    float waterGlow=1.0-length(vec2(0.0,-0.28)-p/vec2(2.6,1.0));
    waterGlow=clamp(waterGlow,0.0,1.0);
    ocean+=vec3(0.12,0.28,0.38)*waterGlow*0.42*mix(0.35,1.0,dn);

    // Waves
    float waves=organicWaveTrain(p,depth);

    vec3 waveBlue=mix(vec3(0.08,0.28,0.45),vec3(0.50,0.88,1.0),dn);
    vec3 foamWhite=mix(vec3(0.35,0.55,0.70),vec3(0.96,1.0,1.0),dn);
    vec3 waveCol=mix(waveBlue,foamWhite,smoothstep(0.45,1.0,waves));

    ocean=mix(ocean,waveCol,waves*0.85);

    // Sand
    float sandDepth=clamp((shoreY-p.y)/(shoreY+1.0),0.0,1.0);
    float sandNoise=fbm(p*vec2(5.0,8.0));

    vec3 sandFarDay=vec3(0.95,0.83,0.55);
    vec3 sandNearDay=vec3(0.76,0.62,0.38);
    vec3 sandFarNight=vec3(0.18,0.16,0.13);
    vec3 sandNearNight=vec3(0.10,0.09,0.075);

    vec3 sandFar=mix(sandFarNight,sandFarDay,dn);
    vec3 sandNear=mix(sandNearNight,sandNearDay,dn);

    vec3 sand=mix(sandFar,sandNear,pow(sandDepth,0.65));
    sand+=(sandNoise-0.5)*vec3(0.08,0.06,0.03)*mix(0.35,1.0,dn);

    // Wet sand
    float wetSand=1.0-smoothstep(0.00,0.20,shoreY-p.y);
    sand=mix(sand,sand*vec3(0.58,0.72,0.78),wetSand*0.65);

    // Shore foam
    float shoreDist=abs(p.y-shoreY);
    float shoreFoam=1.0-smoothstep(0.0,0.045,shoreDist);
    float foamBreak=fbm(vec2(p.x*3.0+iTime*0.15,iTime*0.25));
    shoreFoam*=smoothstep(0.25,0.70,foamBreak);

    float foamOnSand=smoothstep(0.12,0.0,shoreY-p.y);
    foamOnSand*=smoothstep(0.02,0.16,shoreY-p.y);
    foamOnSand*=smoothstep(0.20,0.65,foamBreak);

    // Horizon line
    float horizonLine=1.0-smoothstep(0.0,0.018,abs(p.y-horizonY));
    vec3 horizonCol=mix(vec3(0.18,0.32,0.45),vec3(0.75,0.95,1.0),dn);

    // Compose
    col+=sky*skyMask;
    col+=ocean*oceanMask;
    col+=sand*sandMask;

    col=mix(col,foamWhite,shoreFoam*0.85);
    col=mix(col,foamWhite,foamOnSand*0.55);
    col=mix(col,horizonCol,horizonLine*0.55);

    // Cartoon quantization
    col=floor(col*34.0+0.5)/34.0;

    // Night darkening
    col*=mix(vec3(0.45,0.55,0.75),vec3(1.0),dn);

    fragColor=vec4(col,1.0);
}

//Main
precision highp float;

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord.xy/iResolution.xy;
    fragColor=texture2D(iChannel1,uv);
}