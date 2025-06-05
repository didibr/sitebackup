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
// Corrige o aspecto no cálculo do gradiente
vec2 uvAspect = vec2(uv.x * aspect, uv.y);
// Cálculo da altura da chama (reduzida com * 0.5)
float gradient = (1.0 - uvAspect.y) * 0.5;
float gradientStep = 0.2;
// Posição com movimento vertical + aspecto corrigido
vec2 pos = fragCoord.xy / iResolution.x;
pos.x *= aspect;
pos.y -= iTime * 0.3125;
// Cores do fogo
vec4 brighterColor = vec4(1.0, 0.65, 0.1, 0.25);
vec4 darkerColor = vec4(1.0, 0.0, 0.15, 0.0625);
vec4 middleColor = mix(brighterColor, darkerColor, 0.5);
// Ruído procedural
float noiseTexel = pnoise(pos, 8.0, 0.5);
// Camadas com smoothstep
float firstStep = smoothstep(0.0, noiseTexel, gradient);
float darkerColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep);
float darkerColorPath = firstStep - darkerColorStep;
// Composição
vec4 color = mix(brighterColor, darkerColor, darkerColorPath);
float middleColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep * 2.0);
color = mix(color, middleColor, darkerColorStep - middleColorStep);
color = mix(vec4(0.0), color, firstStep);
// Fumaça acima da chama
float smokeThreshold = 0.3;
float smokeIntensity = smoothstep(smokeThreshold, 0.0, gradient);
float smokeFade = 1.0 - firstStep;
float smokeNoise = pnoise(pos + vec2(0.0, iTime * 0.1), 4.0, 0.5);
vec4 smokeColor = vec4(vec3(0.2 + smokeNoise * 0.1), 0.15) * smokeIntensity * smokeFade;
color += smokeColor;
fragColor = color;
}
//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
vec2 uv = fragCoord.xy / iResolution.xy;
fragColor = texture2D(iChannel0, uv); // Mostrar o bufferA como saída final
}