#version 300 es
    //Audio Bargraph - so colocar a musica
    //Main
    void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord.xy / iResolution.xy;
    float bars = 64.0;
    float id = floor(uv.x * bars);
    float freq = (id + 0.5) / bars;
    // usa somente 70% da FFT
    freq *= 0.7;
    float amp = texture(iAudio0, vec2(freq, 0.5)).r;

    // ganho visual
    amp = pow(amp, 0.5);
    // largura da barra
    float localX = fract(uv.x * bars);
    float bar = step(localX, 0.9) * step(uv.y, amp);
    vec3 color = mix( vec3(0.05), vec3(0.2, 0.8, 1.0), amp );
    fragColor = vec4(color * bar, 1.0);
}
    