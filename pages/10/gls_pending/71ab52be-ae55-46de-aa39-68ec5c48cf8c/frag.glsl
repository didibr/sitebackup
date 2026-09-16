//iChannel1
precision highp float;

// =====================================
// CARTOON OCEAN - MELHORADO
// Ondas vindo do horizonte para frente
// Nuvens mais suaves
// Pixelização menor
// WebGL1 / GLSL ES
// =====================================

#define PIXEL_SIZE 2.0

float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 23.1031);
    p3 += dot(p3, p3.yzx + 110.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p)
{
    p = vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    );

    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 uv)
{
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    ) + 0.5;
}

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;

    for(int i = 0; i < 4; i++)
    {
        v += noise(p) * a;
        p *= 2.0;
        a *= 0.5;
    }

    return v;
}

// =====================================
// CLOUDS CARTOON
// =====================================

float cloudLayer(vec2 p, float scale, float threshold)
{
    float n = fbm(p * scale);

    return smoothstep(
        threshold,
        threshold + 0.12,
        n
    );
}

vec3 drawClouds(vec2 p, float skyMask)
{
    vec3 cloudCol = vec3(0.0);

    // posição das nuvens só no céu
    vec2 cp = p;

    cp.x += iTime * -0.018;

    float c1 =
        cloudLayer(
            cp + vec2(0.3, -0.15),
            1.35,
            0.48
        );

    float c2 =
        cloudLayer(
            cp * vec2(1.3, 0.8) + vec2(-1.2, 0.2),
            1.0,
            0.52
        );

    float c3 =
        cloudLayer(
            cp * vec2(1.8, 0.9) + vec2(1.4, 0.4),
            0.85,
            0.55
        );

    float clouds =
        max(c1 * 0.9, max(c2 * 0.7, c3 * 0.55));

    // fade: mais nuvem no alto/médio, menos perto do horizonte
    float fadeHorizon =
        smoothstep(
            0.05,
            0.75,
            p.y
        );

    // evita nuvem no topo inteiro chapado
    float fadeTop =
        1.0 - smoothstep(
            0.85,
            1.05,
            p.y
        );

    clouds *= fadeHorizon * fadeTop * skyMask;

    // cartoon: borda branca mais forte e sombra suave
    vec3 shadow =
        vec3(0.65, 0.86, 0.95);

    vec3 white =
        vec3(1.0, 0.98, 0.9);

    cloudCol =
        mix(
            shadow,
            white,
            smoothstep(0.35, 0.9, clouds)
        ) * clouds;

    return cloudCol;
}

// =====================================
// FINAL
// =====================================

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // pixelização menor
    vec2 pixCoord =
        floor(fragCoord.xy / PIXEL_SIZE) * PIXEL_SIZE;

    vec2 uv =
        pixCoord.xy / iResolution.xy;

    // coordenada centralizada:
    // p.y > 0 céu
    // p.y < 0 oceano
    vec2 p =
        uv * 2.0 - 1.0;

    p.x *= iResolution.x / iResolution.y;

    float skyMask =
        step(0.0, p.y);

    float oceanMask =
        1.0 - skyMask;

    vec3 col = vec3(0.0);

    // =====================================
    // SKY
    // =====================================

    vec3 skyBottom =
        vec3(0.28, 0.80, 0.95);

    vec3 skyTop =
        vec3(0.03, 0.30, 0.70);

    float skyT =
        clamp(p.y, 0.0, 1.0);

    vec3 sky =
        mix(
            skyBottom,
            skyTop,
            skyT
        );

    // brilho perto do horizonte
    sky +=
        vec3(0.35, 0.45, 0.45)
        * (1.0 - skyT)
        * 0.35;

    // nuvens
    sky += drawClouds(p, skyMask);

    // =====================================
    // OCEAN BASE
    // =====================================

    float depth =
        clamp(-p.y, 0.0, 1.0);

    vec3 oceanFar =
        vec3(0.00, 0.20, 0.55);

    vec3 oceanNear =
        vec3(0.16, 0.72, 0.95);

    vec3 ocean =
        mix(
            oceanFar,
            oceanNear,
            pow(depth, 0.75)
        );

    // leve claridade central
    float waterGlow =
        1.0 - length(
            vec2(0.0, -0.35) -
            p / vec2(2.4, 1.0)
        );

    waterGlow =
        clamp(waterGlow, 0.0, 1.0);

    ocean +=
        vec3(0.15, 0.35, 0.45)
        * waterGlow
        * 0.45;

    // =====================================
    // ONDAS VINDO DO HORIZONTE
    // =====================================

    // profundidade com perspectiva
    // perto do horizonte = quase zero
    // perto da câmera = maior
    float persp =
        pow(depth, 1.75);

    // ruído deformando a linha da onda
    float n =
        fbm(
            vec2(
                p.x * 1.4,
                depth * 2.0
            )
            + vec2(0.0, iTime * 0.05)
        );

    // fase principal:
    // usando "- iTime" as ondas descem para a câmera
    float wavePhase =
        persp * 14.0
        + n * 1.6
        - iTime * 0.85;

    float waveFract =
        fract(wavePhase);

    // largura das linhas:
    // mais finas no horizonte, mais largas perto
    float waveWidth =
        mix(
            0.035,
            0.12,
            depth
        );

    float stripe =
        smoothstep(
            waveWidth,
            0.0,
            waveFract
        );

    // recorta para parecer faixa horizontal quebrada
    float broken =
        fbm(
            vec2(
                p.x * 4.0,
                wavePhase * 0.35
            )
        );

    stripe *=
        smoothstep(
            0.28,
            0.65,
            broken
        );

    // ondas mais visíveis no meio/frente, menos coladas no horizonte
    float waveVisibility =
        smoothstep(
            0.05,
            0.22,
            depth
        );

    stripe *= waveVisibility;

    // cor das ondas
    vec3 foamCol =
        vec3(0.92, 0.98, 1.0);

    ocean =
        mix(
            ocean,
            foamCol,
            stripe * 0.85
        );

    // =====================================
    // LINHA DO HORIZONTE
    // =====================================

    float horizonLine =
        smoothstep(
            0.012,
            0.0,
            abs(p.y)
        );

    vec3 horizonCol =
        vec3(0.75, 0.95, 1.0);

    // =====================================
    // COMPOSIÇÃO
    // =====================================

    col += sky * skyMask;
    col += ocean * oceanMask;

    col =
        mix(
            col,
            horizonCol,
            horizonLine * 0.65
        );

    // =====================================
    // CARTOON QUANTIZATION
    // =====================================

    col =
        floor(col * 32.0 + 0.5)
        / 32.0;

    fragColor =
        vec4(col, 1.0);
}

//Main
precision highp float;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv =
        fragCoord.xy / iResolution.xy;

    fragColor =
        texture2D(
            iChannel1,
            uv
        );
}