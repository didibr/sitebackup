//iChannel0
precision highp float;

// ========================================
// WATER SIMULATION BUFFER
// ========================================


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;

    vec2 px = 1.0 / iResolution.xy;

    vec4 data = texture2D(iChannel0, uv);

    float h = data.x;
    float prev = data.y;

    float l = texture2D(iChannel0, uv - vec2(px.x,0.0)).x;
    float r = texture2D(iChannel0, uv + vec2(px.x,0.0)).x;
    float d = texture2D(iChannel0, uv - vec2(0.0,px.y)).x;
    float u = texture2D(iChannel0, uv + vec2(0.0,px.y)).x;

    float newH =
        (l + r + d + u) * 0.5
        - prev;

    newH *= 0.995;

    // idle waves
    newH +=
        sin(uv.x * 14.0 + iTime)
        * sin(uv.y * 13.0 + iTime * 1.2)
        * 0.0005;

    // mouse ripple
    if(iMouse.z > 0.0)
    {
        vec2 m = iMouse.xy / iResolution.xy;

        float distv = length(uv - m);

        newH += exp(-distv * 80.0) * 0.03;
    }

    fragColor = vec4(newH, h, 0.0, 1.0);
}



//Main
precision highp float;


#define MAX_STEPS 100
#define MAX_DIST 50.0
#define SURF_DIST 0.001

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

    for(int i=0;i<120;i++)
    {
        vec3 p = ro + rd * t;

        float d = p.y - waterHeight(p.xz);

        if(abs(d) < 0.002)
            return t;

        t += d * 0.7;

        if(t > 30.0)
            break;
    }

    return -1.0;
}

// ========================================
// TRACE POOL
// ========================================

float tracePool(vec3 ro, vec3 rd)
{
    float t = 0.0;

    for(int i=0;i<MAX_STEPS;i++)
    {
        vec3 p = ro + rd * t;

        float d = mapPool(p);

        d = abs(d);

        if(d < SURF_DIST)
            return t;

        t += d;

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

float getCaustics(vec3 p)
{
    vec2 uv = p.xz * 2.0;

    float t = iTime * 1.5;

    float c =
        sin(uv.x * 12.0 + t)
      + sin(uv.y * 15.0 - t)
      + sin((uv.x + uv.y) * 8.0 + t * 0.5);

    c = sin(c);

    return pow(abs(c), 14.0);
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

    vec3 ta = vec3(0.0,-0.5,0.0);

    float mx =
        (iMouse.x / iResolution.x - 0.5);

    ro.xz = rotate2D(mx * 2.5) * ro.xz;

    vec3 ww = normalize(ta - ro);

    vec3 uu = normalize(
        cross(vec3(0.0,1.0,0.0), ww)
    );

    vec3 vv = cross(ww, uu);

    vec3 rd = normalize(
        uu * uv.x +
        vv * uv.y +
        ww * 1.7
    );

    vec3 col = getSky(rd);

    // ====================================
    // WATER HIT
    // ====================================

    float wt = traceWater(ro, rd);

    if(wt > 0.0)
    {
        vec3 wp = ro + rd * wt;

        vec3 wn = getWaterNormal(wp.xz);

        // reflection

        vec3 reflDir = reflect(rd, wn);

        vec3 reflection = getSky(reflDir);

        // refraction

        vec3 refrDir =
            refract(
                rd,
                wn,
                1.0 / 1.333
            );

        float pt =
            tracePool(
                wp + refrDir * 0.05,
                refrDir
            );

        vec3 poolColor = vec3(0.0);

        if(pt > 0.0)
        {
            vec3 pp = wp + refrDir * pt;

            float depth =
                length(pp - wp);

            vec3 absorb = vec3(
                exp(-depth * 1.2),
                exp(-depth * 0.35),
                exp(-depth * 0.12)
            );

            vec3 tile = poolTiles(pp);

            float caustic =
                getCaustics(pp);

            tile +=
                vec3(1.4,1.5,1.2)
                * caustic
                * 1.8;

            poolColor = tile * absorb;
        }

        // fresnel

        float fresnel =
            pow(
                1.0 - max(dot(-rd, wn),0.0),
                5.0
            );

        col =
            mix(
                poolColor,
                reflection,
                fresnel * 0.78
            );

        col *= vec3(0.92,0.98,1.04);
    }

    // vignette

    col *= 1.0 - dot(uv,uv) * 0.15;

    // tonemap

    col = col / (1.0 + col);

    col = pow(col, vec3(0.4545));

    fragColor = vec4(col,1.0);
}