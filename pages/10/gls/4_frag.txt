//iChannel0
#define PI 3.141592653589793
#define EXPLOSION_COUNT 6.
#define SPARKS_PER_EXPLOSION 64.
#define EXPLOSION_DURATION 20.
#define EXPLOSION_SPEED 5.
#define EXPLOSION_RADIUS_THRESHOLD .06
// Hash function
#define MOD3 vec3(.1031, .11369, .13787)
vec3 hash31(float p) {
vec3 p3 = fract(vec3(p) * MOD3);
p3 += dot(p3, p3.yzx + 19.19);
return fract(vec3(
(p3.x + p3.y) * p3.z,
(p3.x + p3.z) * p3.y,
(p3.y + p3.z) * p3.x
));
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
vec2 uv = fragCoord / iResolution.xy;
float aspect = iResolution.x / iResolution.y;
uv.x *= aspect;
float t = mod(iTime + 10.0, 7200.0);
vec3 col = vec3(0.0);
vec2 origin;
for (float j = 0.0; j < EXPLOSION_COUNT; j++) {
vec3 oh = hash31((j + 1234.1939) * 641.6974);
origin = vec2(oh.x, oh.y) * 0.6 + 0.2;
origin.x *= aspect; //explosion aspect
float localTime = mod(t * EXPLOSION_SPEED + (j + 1.0) * 9.6491 * oh.z, EXPLOSION_DURATION);
if (localTime > 2.0) {
for (float i = 0.0; i < SPARKS_PER_EXPLOSION; i++) {
vec3 h = hash31(j * 963.31 + i + 497.8943);
float angle = h.x * PI * 2.0;
float rScale = h.y * EXPLOSION_RADIUS_THRESHOLD;
float radius = localTime * rScale;
vec2 sparkPos = vec2(radius * cos(angle), radius * sin(angle));
// Gravidade fake
float gravityZone = 0.04;
float fallFactor = (length(sparkPos) - (rScale - gravityZone)) / gravityZone;
sparkPos.y -= pow(fallFactor, 3.0) * 6e-5;
//float spark = 0.0002 / pow(length(uv - sparkPos - origin), 1.65);
float d = length(uv - sparkPos - origin);
float spark = 0.0002 / (d * sqrt(d) * sqrt(sqrt(d)));
// Shimmer
float sd = 2.0 * length(origin - sparkPos);
float shimmer = max(0.0, sqrt(sd) * sin((t + h.y * 2.0 * PI) * 20.0));
float shimmerThreshold = EXPLOSION_DURATION * 0.32;
float fade = max(0.0, (EXPLOSION_DURATION - 5.0) * rScale - radius);
col += spark * mix(1.0, shimmer, smoothstep(
shimmerThreshold * rScale,
(shimmerThreshold + 1.0) * rScale,
radius
)) * fade * oh;
}
}
}
// Background gradiente
col = max(vec3(0.1), col);
col += vec3(0.12, 0.06, 0.02) * (1.0 - uv.y);
fragColor = vec4(col, 1.0);
}
//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
vec2 uv = fragCoord.xy / iResolution.xy;
fragColor = texture2D(iChannel0, uv); // Mostrar o bufferA como saída final
}