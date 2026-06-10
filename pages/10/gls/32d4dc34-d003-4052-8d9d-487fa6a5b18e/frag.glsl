//iChannel0
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
vec2 uv = fragCoord.xy / iResolution.xy;
// Corrigir aspect ratio
float aspect = iResolution.x / iResolution.y;
vec2 mouse = iMouse.xy / iResolution.xy;
vec2 uvAspect = vec2(uv.x * aspect, uv.y);
vec2 mouseAspect = vec2(mouse.x * aspect, mouse.y);
vec2 diff = uvAspect - mouseAspect;
// Leitura do frame anterior
vec4 prev = texture2D(iChannel0, uv);
prev.rgb *= 0.985;
// Movimento animado das cores
float t = iTime * 0.2;
vec3 baseColor;
baseColor.r = 0.5 + 0.5 * sin(uv.x * 5.0 + t);
baseColor.g = 0.5 + 0.5 * sin(uv.y * 5.0 + t + 2.0);
baseColor.b = 0.5 + 0.5 * sin((uv.x + uv.y) * 5.0 + t + 4.0);
// Distância com aspect ratio corrigido
float d = length(diff);
float influence = smoothstep(0.2, 0.0, d);
vec3 mouseSplash = vec3(
0.5 + 0.5 * sin(iTime * 10.0),
0.5 + 0.5 * sin(iTime * 12.0 + 2.0),
0.5 + 0.5 * sin(iTime * 14.0 + 4.0)
);
vec3 result = mix(prev.rgb, baseColor, 0.02);
result += mouseSplash * influence * 0.3;
result = clamp(result, 0.0, 1.0);
fragColor = vec4(result, 1.0);
}
//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
vec2 uv = fragCoord.xy / iResolution.xy;
fragColor = texture2D(iChannel0, uv); // Mostrar o bufferA como saída final
}
