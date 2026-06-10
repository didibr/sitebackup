//iChannel2 = https://didisoftwares.ddns.net/10/tile.jpg

//iChannel0
precision highp float;

// ========================================
// WATER SIMULATION BUFFER
// ========================================
const float cameraAngle = 0.0;//-0.64;

mat2 rotate2D(float a)
{
    float s = sin(a);
    float c = cos(a);

    return mat2(
        c,-s,
        s, c
    );
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv =
        fragCoord.xy / iResolution.xy;

    vec2 px =
        1.0 / iResolution.xy;

    vec4 data =
        texture2D(iChannel0, uv);

    float h    = data.x;
    float prev = data.y;

    float l =
        texture2D(
            iChannel0,
            uv - vec2(px.x,0.0)
        ).x;

    float r =
        texture2D(
            iChannel0,
            uv + vec2(px.x,0.0)
        ).x;

    float d =
        texture2D(
            iChannel0,
            uv - vec2(0.0,px.y)
        ).x;

    float u =
        texture2D(
            iChannel0,
            uv + vec2(0.0,px.y)
        ).x;

    // =====================================
    // WAVE PROPAGATION
    // =====================================

    float newH =
        (l + r + d + u) * 0.5
        - prev;

    newH *= 0.995;

    // =====================================
    // IDLE WAVES
    // =====================================

    newH +=
        sin(uv.x * 14.0 + iTime)
        * sin(
            uv.y * 13.0
            + iTime * 1.2
        )
        * 0.0005;

    // =====================================
    // MOUSE RIPPLE
    // =====================================

    if(iMouse.z > 0.0)
    {
        // UV do mouse

        vec2 m =
            iMouse.xy
            / iResolution.xy;

        // inversão completa
        // porque câmera está invertida

        m = 1.0 - m;

        // centro

        m =
            m * 2.0 - 1.0;

        // aspect

        m.x *=
            iResolution.x
            / iResolution.y;

        // rotação câmera

        m =
            rotate2D(cameraAngle)
            * m;

        // sensibilidade
        // AJUSTE AQUI

        m *= 0.82;

        // volta pra UV

        m.x /=
            iResolution.x
            / iResolution.y;

        m =
            m * 0.5 + 0.5;

        // ripple

        float distv =
            length(uv - m);

        newH +=
            exp(-distv * 80.0)
            * 0.03;
    }

    // =====================================
    // OUTPUT
    // =====================================

    fragColor =
        vec4(
            newH,
            h,
            0.0,
            1.0
        );
}





//Main
precision highp float;


#define MAX_STEPS 100
#define MAX_DIST 50.0
#define SURF_DIST 0.01
const float cameraAngle = 0.0;//-1.64;

// ========================================
// ROTATION
// ========================================

mat2 rotate2D(float a)
{
    float s = sin(a);
    float c = cos(a);

    return mat2(
        c,-s,
        s, c
    );
}

// ========================================
// BOX SDF
// ========================================

float sdBox(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;

    return
        length(max(q,0.0))
        + min(max(q.x,max(q.y,q.z)),0.0);
}

// ========================================
// POOL
// ========================================

float mapPool(vec3 p)
{
    vec3 q = p - vec3(0.0,-1.8,0.0);

    return sdBox(
        q,
        vec3(3.5,1.8,5.5)
    );
}

// ========================================
// WATER HEIGHT
// ========================================

float waterHeight(vec2 xz)
{
    vec2 uv = xz * 0.06 + 0.5;

    return texture2D(iChannel0, uv).x * 0.35;
}

// ========================================
// WATER NORMAL
// ========================================

vec3 getWaterNormal(vec2 xz)
{
    xz.x = clamp(xz.x, -3.4, 3.4);
    xz.y = clamp(xz.y, -5.4, 5.4);

    float e = 0.03;

    float h  = waterHeight(xz);
    float hx = waterHeight(xz + vec2(e,0.0));
    float hz = waterHeight(xz + vec2(0.0,e));

    return normalize(vec3(
        h - hx,
        e,
        h - hz
    ));
}



// ========================================
// TRACE WATER
// ========================================

float traceWater(vec3 ro, vec3 rd)
{
    float t = 0.0;

    for(int i=0;i<220;i++)
    {
        vec3 p = ro + rd * t;

        // limites da piscina

      if(
    abs(p.x) > 3.5 ||
    abs(p.z) > 5.5
)
{
    t += 0.05;
    continue;
}

        float h = waterHeight(p.xz);

        float d = p.y - h;

        // hit

        if(abs(d) < 0.003)
            return t;

        // adaptativo suave
        // sem criar banding

        float stepSize =
            clamp(
                abs(d) * 0.35,
                0.01,
                0.08
            );

        t += stepSize;
    }

    return -1.0;
}

// ========================================
// TRACE POOL
// ========================================

vec3 samplePoolWall(vec3 p)
{
    vec2 uv;

    // =========================
    // ESCALA DOS AZULEJOS
    // =========================

    float tileScaleX = 0.32;
    float tileScaleY = 0.12;

    // =========================
    // parede esquerda/direita
    // =========================

    if(abs(abs(p.x) - 3.5) < 0.1)
    {
        uv = vec2(
            p.z * tileScaleX,
            p.y * tileScaleY
        );
    }

    // =========================
    // frente/fundo
    // =========================

    else
    {
        uv = vec2(
            p.x * tileScaleX,
            p.y * tileScaleY
        );
    }

    // repeat

    uv = fract(uv);

    vec3 tex =
        texture2D(
            iChannel2,
            uv
        ).rgb;

    return tex;
}

vec3 samplePoolFloor(vec3 p)
{
    vec2 uv =
        p.xz * 0.12;

    uv = fract(uv);

    vec3 tex =
        texture2D(
            iChannel2,
            uv
        ).rgb;

    return tex;
}

float tracePool(
    vec3 ro,
    vec3 rd,
    out vec3 hitPos,
    out int hitMat
)
{
    float t = 0.0;

    for(int i=0;i<MAX_STEPS;i++)
    {
        vec3 p = ro + rd * t;

        float floorDist =
            abs(p.y + 3.6);

        float wallLeft =
            abs(p.x + 3.5);

        float wallRight =
            abs(p.x - 3.5);

        float wallBack =
            abs(p.z + 5.5);

        float wallFront =
            abs(p.z - 5.5);

        float d = floorDist;
        hitMat = 0;

        if(wallLeft < d)
        {
            d = wallLeft;
            hitMat = 1;
        }

        if(wallRight < d)
        {
            d = wallRight;
            hitMat = 1;
        }

        if(wallBack < d)
        {
            d = wallBack;
            hitMat = 1;
        }

        if(wallFront < d)
        {
            d = wallFront;
            hitMat = 2;
        }

        if(d < SURF_DIST)
        {
            hitPos = p;
            return t;
        }

        t += max(d * 0.7, 0.02);

        if(t > MAX_DIST)
            break;
    }

    return -1.0;
}

// ========================================
// SKY
// ========================================

vec3 getSky(vec3 rd)
{
    float sun = max(
        dot(rd, normalize(vec3(0.4,0.7,0.3))),
        0.0
    );

    vec3 col = mix(
        vec3(0.1,0.35,0.7),
        vec3(0.8,0.92,1.0),
        rd.y * 0.5 + 0.5
    );

    col += pow(sun, 120.0) * 6.0;

    return col;
}

// ========================================
// CAUSTICS
// ========================================

float getCaustics(vec3 p, vec3 wn)
{
    // =========================
    // HEIGHTMAP UV
    // =========================

    vec2 huv =
        p.xz * 0.06 + 0.5;

    // =========================
    // CONTROLE TAMANHO
    // =========================

    float scale = 0.48;

    vec2 uv =
        p.xz * scale;

    // =========================
    // SAMPLE ÁGUA
    // =========================

    float e = 0.05;

    float hL =
        texture2D(
            iChannel0,
            huv - vec2(e,0.0)
        ).x;

    float hR =
        texture2D(
            iChannel0,
            huv + vec2(e,0.0)
        ).x;

    float hD =
        texture2D(
            iChannel0,
            huv - vec2(0.0,e)
        ).x;

    float hU =
        texture2D(
            iChannel0,
            huv + vec2(0.0,e)
        ).x;

    // =========================
    // DERIVADAS REAIS DA ÁGUA
    // =========================

    vec2 grad =
        vec2(
            hR - hL,
            hU - hD
        );

    // =========================
    // DISTORÇÃO DINÂMICA
    // =========================

    uv += grad * 9.0;

    // normal também influencia

    uv += wn.xz * 0.6;

    // =========================
    // MOVIMENTO
    // =========================

    float t =
        iTime * 0.64;

    // =========================
    // CAMADAS
    // =========================

    float c = 0.0;

    c += sin(uv.x * 16.0 + t);
    c += sin(uv.y * 15.0 - t);

    c += sin(
        (uv.x + uv.y)
        * 20.0
    );

    c += sin(
        length(uv)
        * 20.0
    );

    // =========================
    // COMPRESSÃO DE LUZ
    // =========================

    c = abs(c);

    c =
        1.0 / (
            1.0 +
            c * c * 0.25
        );

    c =
        pow(c, 8.0);

    // =========================
    // CURVATURA DA ÁGUA
    // =========================

    float focus =
        length(grad);

    focus =
        clamp(
            focus * 7.0,
            0.0,
            1.0
        );

    focus =
        pow(
            focus,
            1.6
        );

    // =========================
    // INCLINAÇÃO DA ÁGUA
    // =========================

    float slope =
        1.0 - wn.y;

    slope =
        pow(
            slope,
            2.0
        );

    // =========================
    // INTENSIDADE FINAL
    // =========================

    c *=
        1.0 +
        focus * 5.0 +
        slope * 2.0;

    // =========================
    // SUAVIZA
    // =========================

    c =
        smoothstep(
            0.15,
            1.0,
            c
        );

    return c;
}

// ========================================
// TILES
// ========================================

vec3 poolTiles(vec3 p)
{
    vec2 uv = p.xz * 2.5;

    vec2 gv = fract(uv);

    float line =
        step(0.96, gv.x)
      + step(0.96, gv.y);

    return mix(
        vec3(0.05,0.4,0.75),
        vec3(0.9),
        line
    );
}

// ========================================
//mein
// ========================================

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv =
        (fragCoord * 2.0 - iResolution.xy)
        / iResolution.y;

    // ====================================
    // CAMERA
    // ====================================

    vec3 ro = vec3(0.0,1.5,8.0);

    ro.xz =
        rotate2D(cameraAngle)
        * ro.xz;

    vec3 ta =
        vec3(0.0,-0.5,0.0);

    vec3 ww =
        normalize(ta - ro);

    vec3 uu =
        normalize(
            cross(
                vec3(0.0,1.0,0.0),
                ww
            )
        );

    vec3 vv =
        cross(ww, uu);

    vec3 rd =
        normalize(
            uu * uv.x +
            vv * uv.y +
            ww * 1.7
        );

    vec3 col = vec3(0.0);

    // ====================================
    // WATER HIT
    // ====================================

    float wt =
        traceWater(ro, rd);

    // ====================================
    // SKY fallback
    // ====================================

    if(wt < 0.0)
    {
        col = getSky(rd);
    }

    // ====================================
    // WATER
    // ====================================

    if(wt > 0.0)
    {
        vec3 wp =
            ro + rd * wt;

        vec3 wn =
            getWaterNormal(wp.xz);

        // =================================
        // REFLECTION
        // =================================

        vec3 reflDir =
            reflect(rd, wn);

        vec3 reflection =
            getSky(reflDir);

      	reflection *= 0.55;
        // =================================
        // REFRACTION
        // =================================

        vec3 refrDir =
            refract(
                rd,
                wn,
                1.0 / 1.333
            );

        // =================================
        // TRACE POOL
        // =================================

        vec3 hitPos;
        int hitMat;

        float pt =
            tracePool(
                wp + refrDir * 0.05,
                refrDir,
                hitPos,
                hitMat
            );

        vec3 poolColor =
            vec3(0.0);

        if(pt > 0.0)
        {
            // profundidade água

            float depth =
                length(hitPos - wp);

            // absorção

            vec3 absorb = vec3(
                exp(-depth * 1.2),
                exp(-depth * 0.35),
                exp(-depth * 0.12)
            );

            vec3 baseCol;

// =============================
// FLOOR
// =============================

if(hitMat == 0)
{
    vec2 distort =
    wn.xz * depth * 0.12;

    baseCol =
        samplePoolFloor(
            hitPos +
            vec3(
                distort.x,
                0.0,
                distort.y
            )
        );

    // caustic FORTE no fundo

    float caustic =
    getCaustics(
        hitPos,
        wn
    );

    baseCol +=
        vec3(1.4,1.5,1.2)
        * caustic
        * 1.6;
}

// =============================
// WALLS
// =============================

else
{
    // distorção da água

    vec2 distort =
    wn.xz * depth * 0.05;

    baseCol =
        samplePoolWall(
            hitPos +
            vec3(
                distort.x,
                0.0,
                distort.y
            )
        );

    // caustic MUITO suave

    float caustic =
    getCaustics(
        hitPos * 0.45,
        wn
    );

    baseCol +=
        vec3(0.15,0.22,0.3)
        * caustic
        * 0.58;

    // leve tonalidade azul

    baseCol *= vec3(
        0.7,
        0.9,
        1.0
    );
}

            // =============================
            // UNDERWATER DISTORTION
            // =============================

            baseCol *= absorb;
          // fortalece textura da piscina

		baseCol *= 1.0;



            poolColor =
                baseCol;
        }

        // =================================
        // FRESNEL
        // =================================

        float fresnel =
            pow(
                1.0
                - max(dot(-rd, wn),0.0),
                5.0
            );

        // =================================
        // FINAL MIX
        // =================================

        col =
            mix(
                poolColor,
                reflection,
                fresnel * 0.78
            );

        // água azul

        col *= vec3(
            0.92,
            0.98,
            1.04
        );
    }

    // ====================================
    // VIGNETTE
    // ====================================

    col *=
        1.0
        - dot(uv,uv) * 0.15;

    // ====================================
    // TONEMAP
    // ====================================

    col =
        col / (1.0 + col);

    col =
        pow(
            col,
            vec3(0.4545)
        );

    fragColor =
        vec4(col,1.0);
}