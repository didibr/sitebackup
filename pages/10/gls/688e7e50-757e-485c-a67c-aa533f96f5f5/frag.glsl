
#version 300 es
//iChannel0
precision highp float;
vec3 blurVideo(vec2 uv,float radius){
vec2 px=1.0/iResolution.xy;
vec3 col=vec3(0.0);
float total=0.0;
for(int x=-4;x<#version 300 es
//iChannel0
precision highp float;

void mainImage(out vec4 fragColor, in vec2 fragCoord){

ivec2 c = ivec2(floor(fragCoord));

// 🔥 inicializa no primeiro frame
if(iFrame == 0){
    // linha branca no lado esquerdo
    if(c.x == 0){
        fragColor = vec4(1.0);
    }else{
        fragColor = vec4(0.0);
    }
    return;
}

// ✅ lê vizinho da ESQUERDA
ivec2 left = c + ivec2(-1, 0);

// proteção de borda
if(left.x < 0){
    fragColor = vec4(0.0);
    return;
}

vec4 v = texelFetch(iChannel0, left, 0);

// copia valor
fragColor = v;
}
#version 300 es
//Main
precision highp float;

void mainImage(out vec4 fragColor, in vec2 fragCoord){

fragColor = texelFetch(iChannel0, ivec2(floor(fragCoord)), 0);

}=4;x++){
for(int y=-4;y<=4;y++){
vec2 offs=vec2(float(x),float(y));
float w=1.0-length(offs)/6.0;
col+=texture(iVideo0,uv+offs*px*radius).rgb*w;
total+=w;
}}
return col/total;
}
void mainImage(out vec4 fragColor,in vec2 fragCoord){
vec2 uv=fragCoord/iResolution.xy;
float focusLine=0.52;
float focusSize=0.08;
float d=abs(uv.y-focusLine);
float blurMask=smoothstep(focusSize,0.45,d);
blurMask=pow(blurMask,1.7);
vec3 sharp=texture(iVideo0,uv).rgb;
vec3 blurred=blurVideo(uv,blurMask*1.0);
vec3 col=mix(sharp,blurred,blurMask);
float lum=dot(col,vec3(0.299,0.587,0.114));
col=mix(vec3(lum),col,1.8);
col=(col-0.5)*1.25+0.5;
col.r*=1.08;
col.g*=1.05;
col.b*=0.92;
vec2 px=1.0/iResolution.xy;
vec3 edge=
texture(iVideo0,uv).rgb*5.0-
texture(iVideo0,uv+vec2(px.x,0.0)).rgb-
texture(iVideo0,uv-vec2(px.x,0.0)).rgb-
texture(iVideo0,uv+vec2(0.0,px.y)).rgb-
texture(iVideo0,uv-vec2(0.0,px.y)).rgb;
float centerMask=1.0-smoothstep(0.02,0.12,d);
col+=edge*0.10*centerMask;
float glow=max(max(col.r,col.g),col.b);
col+=smoothstep(0.7,1.0,glow)*0.08;
vec2 v=uv*(1.0-uv.yx);
col*=pow(v.x*v.y*18.0,0.18);
float grain=fract(sin(dot(fragCoord+iTime,vec2(12.9898,78.233)))*43758.5453);
col+=(grain-0.5)*0.025;
col=col/(col+vec3(0.7));
fragColor=vec4(col,1.0);
}
//Main
precision highp float;
void mainImage(out vec4 fragColor,in vec2 fragCoord){
vec2 uv=fragCoord/iResolution.xy;
fragColor=texture(iChannel0,uv);
}