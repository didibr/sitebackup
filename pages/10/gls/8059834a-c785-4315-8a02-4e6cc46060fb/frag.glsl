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
if(dot(data,data)<0.01)continue;
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

if(fragCoord.y>iResolution.y-2.0){
fragColor=vec4(fragCoord.xy,(hash(fragCoord.xy+iTime)-0.5)*2.0,-6.0+hash(fragCoord.xy));
return;
}

vec4 partData;
float p=arrivingParticle(fragCoord,partData);

if(p<1.0){
fragColor=vec4(0.0);
return;
}

vec2 uv=partData.xy/iResolution.xy;

float mask=dot(texture(iVideo0,uv).rgb,vec3(0.299,0.587,0.114));

float vel=1.0-mask*0.95;

partData.xy+=partData.zw*vel;

fragColor=partData;
}

#version 300 es
//Main
precision highp float;

void mainImage(out vec4 fragColor,in vec2 fragCoord){

vec2 uv=fragCoord/iResolution.xy;
vec4 p=texture(iChannel0,uv);

float alive=step(0.1,length(p));

vec3 col=vec3(1.0,0.9,0.7)*alive;

fragColor=vec4(col,1.0);
}