//iChannel0
precision highp float;
/* Video URL: https://youtu.be/f4s1h2YETNY */
//https://iquilezles.org/articles/palettes/
vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);
    return a + b*cos( 6.28318*(c*t+d) );
}
//https://www.shadertoy.com/view/mtyGWy
void mainImage(out vec4 fragColor, in vec2 fragCoord) {  
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);    
    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);
        d = sin(d*8. + iTime)/8.;
        d = abs(d);
        d = pow(0.01 / d, 1.2);
        finalColor += col * d;
    }        
    float alpha = clamp(length(finalColor), 0.0, 1.0);
    fragColor = vec4(finalColor, alpha);
}

//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 tex = texture2D(iChannel0, uv);  
    vec3 bg = vec3(1.0);
    vec3 color = mix(bg, tex.rgb, tex.a);
    fragColor = vec4(color, 1.0);
}