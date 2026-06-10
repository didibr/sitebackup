//iChannel0
float rand(vec2 co){
return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float hermite(float t) {
return t * t * (3.0 - 2.0 * t);
}
float noise(vec2 co, float frequency) {
vec2 v = co * frequency;
vec2 i = floor(v);
vec2 f = fract(v);
float a = rand(i);
float b = rand(i + vec2(1.0, 0.0));
float c = rand(i + vec2(0.0, 1.0));
float d = rand(i + vec2(1.0, 1.0));
vec2 u = vec2(hermite(f.x), hermite(f.y));  // ✅ Correção aqui
return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pnoise(vec2 co, float freq, float persistence) {
const int steps = 5;
float value = 0.0;
float ampl = 1.0;
float sum = 0.0;
for(int i = 0; i < steps; i++) {
sum += ampl;
value += noise(co, freq) * ampl;
freq *= 2.0;
ampl *= persistence;
}
return value / sum;
}
        
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;

    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    float gradient = (1.0 - uvAspect.y) * 0.5;
    float gradientStep = 0.2;

    vec2 pos = fragCoord.xy / iResolution.x;
    pos.x *= aspect;
    pos.y -= iTime * 0.3125;

    vec4 brighterColor = vec4(1.0, 0.65, 0.1, 1.0);
    vec4 darkerColor   = vec4(1.0, 0.0, 0.15, 1.0);
    vec4 middleColor   = mix(brighterColor, darkerColor, 0.5);

    float noiseTexel = pnoise(pos, 8.0, 0.5);

    float firstStep       = smoothstep(0.0, noiseTexel, gradient);
    float darkerColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep);
    float darkerColorPath = firstStep - darkerColorStep;

    vec4 color = mix(brighterColor, darkerColor, darkerColorPath);

    float middleColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep * 2.0);
    color = mix(color, middleColor, darkerColorStep - middleColorStep);

    // 🔥 remove fundo preto → usa alpha real
    float alpha = firstStep;

    fragColor = vec4(color.rgb, alpha);
}

//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = texture2D(iChannel0, uv);
}