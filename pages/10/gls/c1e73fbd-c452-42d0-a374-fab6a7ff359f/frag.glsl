//iChannel1 = https://didisoftwares.ddns.net/10/noise.png

//iChannel0
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(1.0, 0.6, 1.0, 1.0);
}

//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture2D(iChannel1, uv);
}