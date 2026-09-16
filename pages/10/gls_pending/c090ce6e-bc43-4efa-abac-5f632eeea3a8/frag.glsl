//iChannel1
precision highp float;

#define PIXEL_SIZE 2.0

// =====================================
// HASH / NOISE
// =====================================

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
// CLOUDS
// =====================================

float cloudLayer(vec2 p, float scale, float threshold)
{
    float n = fbm(p * scale);

    return smoothstep(
        threshold,
        threshold + 0.14,
        n
    );
}

vec3 drawClouds(vec2 p, float skyMask)
{
    vec2 cp = p;
    cp.x += iTime * -0.012;

    float c1 =
        cloudLayer(
            cp + vec2(0.3, -0.12),
            1.25,
            0.50
        );

    float c2 =
        cloudLayer(
            cp * vec2(1.4, 0.75) + vec2(-1.2, 0.25),
            0.95,
            0.52
        );

    float clouds =
        max(c1, c2 * 0.75);

    float fadeHorizon =
        smoothstep(
            0.12,
            0.75,
            p.y
        );

    float fadeTop =
        1.0 - smoothstep(
            0.85,
            1.05,
            p.y
        );

    clouds *= fadeHorizon * fadeTop * skyMask;

    vec3 shadow =
        vec3(0.65, 0.86, 0.95);

    vec3 white =
        vec3(1.0, 0.98, 0.9);

    return mix(
        shadow,
        white,
        smoothstep(0.25, 0.85, clouds)
    ) * clouds;
}

// =====================================
// ORGANIC WAVE FRONT
// =====================================

float waveFront(vec2 p, float depth, float offset, float speed, float freq)
{
    // depth:
    // 0 = horizonte
    // 1 = perto da câmera

    // não deixa ondas nascerem perto do horizonte
    float visible =
        smoothstep(
            0.22,
            0.42,
            depth
        );

    // perspectiva: comprime longe e abre perto
    float perspective =
        pow(depth, 1.45);

    // ondulação horizontal da frente da onda
    float curve =
        sin(p.x * 2.2 + offset) * 0.055 +
        sin(p.x * 5.3 + offset * 1.7) * 0.022;

    // ruído bem suave só para quebrar a linha
    float organic =
        fbm(
            vec2(
                p.x * 1.8 + offset,
                perspective * 2.0
            )
        );

    curve +=
        (organic - 0.5)
        * 0.075
        * depth;

    // coordenada da onda
    // o -iTime faz a frente vir em direção à praia/câmera
    float phase =
        (perspective + curve) * freq
        - iTime * speed
        + offset;

    float f =
        fract(phase);

    // crista principal
    float crestDist =
        min(f, 1.0 - f);

    // largura aumenta perto da câmera
    float width =
        mix(
            0.018,
            0.055,
            depth
        );

    float softness =
        mix(
            0.018,
            0.035,
            depth
        );

    float crest =
        1.0 - smoothstep(
            width,
            width + softness,
            crestDist
        );

    // máscara para a onda não ser uma linha perfeita contínua
    // mas também não virar ruído aleatório
    float segments =
        fbm(
            vec2(
                p.x * 2.4 + offset,
                floor(phase) * 0.35
            )
        );

    segments =
        smoothstep(
            0.30,
            0.62,
            segments
        );

    // corpo azul claro atrás da crista
    float body =
        1.0 - smoothstep(
            width * 2.5,
            width * 7.0,
            crestDist
        );

    body *=
        smoothstep(
            0.18,
            0.85,
            f
        );

    body *=
        segments
        * visible
        * 0.45;

    crest *=
        segments
        * visible;

    return crest + body * 0.55;
}

// =====================================
// FINAL
// =====================================

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 pixCoord =
        floor(fragCoord.xy / PIXEL_SIZE) * PIXEL_SIZE;

    vec2 uv =
        pixCoord.xy / iResolution.xy;

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

    sky +=
        vec3(0.35, 0.45, 0.45)
        * (1.0 - skyT)
        * 0.35;

    sky +=
        drawClouds(
            p,
            skyMask
        );

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
            pow(depth, 0.72)
        );

    // brilho suave central
    float waterGlow =
        1.0 - length(
            vec2(0.0, -0.38)
            - p / vec2(2.6, 1.0)
        );

    waterGlow =
        clamp(
            waterGlow,
            0.0,
            1.0
        );

    ocean +=
        vec3(0.12, 0.28, 0.38)
        * waterGlow
        * 0.42;

    // =====================================
    // ORGANIC WAVES
    // =====================================

    float waves = 0.0;

    waves +=
        waveFront(
            p,
            depth,
            0.0,
            0.48,
            8.0
        );

    waves +=
        waveFront(
            p,
            depth,
            2.1,
            0.42,
            6.5
        ) * 0.65;

    waves +=
        waveFront(
            p,
            depth,
            4.7,
            0.36,
            5.2
        ) * 0.45;

    waves =
        clamp(
            waves,
            0.0,
            1.0
        );

    vec3 waveBlue =
        vec3(0.50, 0.88, 1.0);

    vec3 foamWhite =
        vec3(0.95, 1.0, 1.0);

    vec3 waveCol =
        mix(
            waveBlue,
            foamWhite,
            smoothstep(0.55, 1.0, waves)
        );

    ocean =
        mix(
            ocean,
            waveCol,
            waves * 0.82
        );

    // =====================================
    // HORIZON LINE
    // =====================================

    float horizonLine =
        1.0 - smoothstep(
            0.0,
            0.018,
            abs(p.y)
        );

    vec3 horizonCol =
        vec3(0.75, 0.95, 1.0);

    // =====================================
    // COMPOSE
    // =====================================

    col +=
        sky * skyMask;

    col +=
        ocean * oceanMask;

    col =
        mix(
            col,
            horizonCol,
            horizonLine * 0.55
        );

    // =====================================
    // CARTOON QUANTIZATION
    // =====================================

    col =
        floor(col * 34.0 + 0.5)
        / 34.0;

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