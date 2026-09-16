#version 300 es
//Main
precision highp float;
// ShaderToy style
void mainImage(out vec4 color, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    // centraliza
    uv = uv * 2.0 - 1.0;
    float r = length(uv);
    float angle = atan(uv.y, uv.x);

    float wave = sin(10.0 * r - iTime * 2.0);
    vec3 col = vec3(
        0.5 + 0.5 * cos(iTime + angle + vec3(0.0, 2.0, 4.0))
    );
    col *= wave;
    color = vec4(col, 1.0);
}
