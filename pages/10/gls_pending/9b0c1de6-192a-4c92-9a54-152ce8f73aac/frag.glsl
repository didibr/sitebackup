//iChannel1
precision highp float;

#define PIXEL_SIZE 2.0

float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 23.1031);
    p3 += dot(p3, p3.yzx + 110.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash1(float n)
{
    return fract(sin(n * 127.1) * 43758.5453123);
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
// NUVENS SIMPLES
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
// UMA SEQUÊNCIA ORGÂNICA DE ONDAS
// =====================================

float organicWaveTrain(vec2 p, float depth)
{
    // impede ondas muito perto do horizonte
    float visible =
        smoothstep(
            0.24,
            0.42,
            depth
        );

    // perspectiva
    float perspective =
        pow(depth, 1.42);

    // deformação lenta do campo inteiro
    float largeWarp =
        fbm(
            vec2(
                p.x * 0.55,
                perspective * 1.2 + iTime * 0.03
            )
        );

    // coordenada base da onda
    // menos frequência = menos ondas simultâneas
    float waveCount = 5.6;

    float travel =
        perspective * waveCount
        - iTime * 0.42;

    // espaçamento levemente irregular
    travel +=
        (largeWarp - 0.5)
        * 0.42;

    float waveId =
        floor(travel);

    float local =
        fract(travel);

    // random por onda
    float r1 = hash1(waveId + 1.0);
    float r2 = hash1(waveId + 7.0);
    float r3 = hash1(waveId + 13.0);

    // cada onda tem curva própria
    float curve =
        sin(p.x * mix(1.2, 2.8, r1) + r2 * 6.2831)
        * mix(0.025, 0.075, r2);

    curve +=
        sin(p.x * mix(3.5, 6.0, r3) + r1 * 6.2831)
        * mix(0.010, 0.035, r3);

    // ruído só quebra a borda, não cria várias ondas
    float edgeNoise =
        fbm(
            vec2(
                p.x * mix(1.8, 3.2, r1) + r2 * 5.0,
                waveId * 0.35
            )
        );

    curve +=
        (edgeNoise - 0.5)
        * 0.05
        * depth;

    // posição da crista dentro da célula
    // centro variável, evitando padrão perfeito
    float crestPos =
        mix(
            0.32,
            0.58,
            r1
        );

    float distToCrest =
        abs(local - crestPos + curve);

    // largura muda por onda e cresce perto da câmera
    float width =
        mix(
            0.020,
            0.060,
            depth
        );

    width *=
        mix(
            0.75,
            1.35,
            r2
        );

    float soft =
        mix(
            0.025,
            0.060,
            depth
        );

    // crista branca principal
    float crest =
        1.0 - smoothstep(
            width,
            width + soft,
            distToCrest
        );

    // corpo da espuma atrás da onda
    float backFoam =
        smoothstep(
            crestPos + width * 0.4,
            crestPos + width * 5.5,
            local + curve
        );

    backFoam *=
        1.0 - smoothstep(
            crestPos + width * 5.5,
            crestPos + width * 10.0,
            local + curve
        );

    // máscara horizontal para quebrar a onda em trechos grandes
    // sem virar pontilhado aleatório
    float segment =
        fbm(
            vec2(
                p.x * 1.6 + r1 * 8.0,
                waveId * 0.75
            )
        );

    segment =
        smoothstep(
            0.22,
            0.58,
            segment
        );

    // intensidade da onda muda com o id
    float strength =
        mix(
            0.45,
            1.0,
            r3
        );

    // algumas ondas ficam menores, outras maiores
    crest *= segment * strength;
    backFoam *= segment * strength * 0.45;

    // fade perto do final da célula para não sobrepor com a próxima
    float life =
        smoothstep(0.03, 0.18, local)
        * (1.0 - smoothstep(0.78, 0.98, local));

    float result =
        crest + backFoam;

    result *=
        visible
        * life;

    return clamp(result, 0.0, 1.0);
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
    // CÉU
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
    // OCEANO
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

    // brilho suave
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
    // ONDAS ORGÂNICAS SEM SOBREPOSIÇÃO
    // =====================================

    float waves =
        organicWaveTrain(
            p,
            depth
        );

    vec3 waveBlue =
        vec3(0.50, 0.88, 1.0);

    vec3 foamWhite =
        vec3(0.96, 1.0, 1.0);

    vec3 waveCol =
        mix(
            waveBlue,
            foamWhite,
            smoothstep(
                0.45,
                1.0,
                waves
            )
        );

    ocean =
        mix(
            ocean,
            waveCol,
            waves * 0.85
        );

    // =====================================
    // HORIZONTE
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
    // COMPOSIÇÃO
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
    // CARTOON
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