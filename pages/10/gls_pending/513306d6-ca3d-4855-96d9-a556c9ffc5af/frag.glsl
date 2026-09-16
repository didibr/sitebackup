#version 300 es
//iChannel0
precision highp float;

#define A 6

float hash(vec2 p){
return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);
}

float arrivingParticle(vec2 coord,out vec4 partData){
for(int i=-A;i<A;i++){
for(int j=-A;j<A;j++){
vec2 arrCoord=coord+vec2(float(i),float(j));
vec4 data=texture(iChannel0,arrCoord/iResolution.xy);

if(dot(data,data)<0.1)continue;

vec2 nextCoord=data.xy+data.zw;

vec2 offset=abs(coord-nextCoord);

if(offset.x<0.5&&offset.y<0.5){
partData=data;
return 1.0;
}
}}
return 0.0;
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){

if(fragCoord.y>iResolution.y-
   2.0 //sand quantity per pixel 0.3
  ){
vec2 uv=fragCoord/iResolution.xy;
fragColor=vec4(
fragCoord.xy,
( 
  hash(uv+iTime)
  -1.0 //sand direction 0.8
)*4.0, //sand dispersion 4.0
-5.0 //sand gravity -6.0
  +hash(uv)
);
return;
}

vec4 partData;
float p=arrivingParticle(fragCoord,partData);

if(p<1.0){
fragColor=vec4(0.0);
return;
}

vec3 vid=texture(iVideo0,fragCoord/iResolution.xy).rgb;

float vel=max(0.0,1.0-length(vid.rb)*0.95);

partData.xy+=partData.zw*vel;

fragColor=partData;
}
#version 300 es
//Main
precision highp float;

void mainImage(out vec4 fragColor,in vec2 fragCoord){

vec2 uv=fragCoord/iResolution.xy;

vec4 part=texture(iChannel0,uv);

float c=step(0.1,part.x);
float topFade=1.0-smoothstep(0.80,1.0,uv.y);
c*=topFade;

vec3 col=vec3(1.0,0.9,0.8)*c*(1.0-abs(uv.x-0.5));

fragColor=vec4(col,1.0);
}