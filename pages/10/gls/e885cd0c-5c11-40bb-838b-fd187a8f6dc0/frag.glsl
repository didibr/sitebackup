
//iChannel1 = https://cdn.jsdelivr.net/gh/didibr/sitebackup/pages/10/flor.jpg

//iChannel0
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = vec4(1.0, 0.4, 1.0, 1.0);
}

//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture2D(iChannel1, uv);
}