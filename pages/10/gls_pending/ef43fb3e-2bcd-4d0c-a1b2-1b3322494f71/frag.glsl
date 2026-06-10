//piscina
//iChannel0
precision highp float;


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

    newH *= 0.996;

    // ondas de fundo suaves
    newH +=
        sin(uv.x * 12.0 + iTime)
        * sin(uv.y * 11.0 + iTime * 1.3)
        * 0.00035;

    // efeito do mouse corrigido
    if(iMouse.z > 0.0)
{
    vec2 m =
        iMouse.xy / iResolution.xy;

    // corrige horizontal
    m.x = 1.0 - m.x;

    // área visível da água na tela
    vec2 poolMin = vec2(0.18, 0.18);
    vec2 poolMax = vec2(0.82, 0.72);

    // somente dentro da piscina
    if(
        m.x > poolMin.x &&
        m.x < poolMax.x &&
        m.y > poolMin.y &&
        m.y < poolMax.y
    )
    {
        // remapeia para área interna
        vec2 p =
            (m - poolMin)
            / (poolMax - poolMin);

        // corrige perspectiva da câmera
        p.x = mix(
            p.x,
            0.5,
            (1.0 - p.y) * 0.38
        );

        float py =
    pow(
        1.35 - p.y,
        1.35
    );

vec2 waterUV = vec2(
    p.x,
    py
);

        // remove interação na parte frontal aberta
        float frontMask =
            smoothstep(
                0.22,
                0.42,
                waterUV.y
            );

        float distv =
            length(uv - waterUV);

        newH +=
            exp(-distv * 140.0)
            * 0.03
            * frontMask;
    }
}

    fragColor = vec4(newH, h, 0.0, 1.0);
}


//Main
precision highp float;


#define MAX_STEPS 120
#define MAX_DIST 60.0
#define SURF_DIST 0.001

const float cameraAngle = 0.0;//-0.42;

mat2 rotate2D(float a)
{
    float s = sin(a);
    float c = cos(a);

    return mat2(
        c,-s,
        s, c
    );
}

float waterHeight(vec2 xz)
{
    vec2 uv = xz * 0.065 + 0.5;

    uv = clamp(uv, 0.0, 1.0);

    return texture2D(iChannel0, uv).x * 0.22;
}

vec3 getWaterNormal(vec2 xz)
{
    float e = 0.02;

    float h  = waterHeight(xz);
    float hx = waterHeight(xz + vec2(e,0.0));
    float hz = waterHeight(xz + vec2(0.0,e));

    return normalize(vec3(
        h - hx,
        e,
        h - hz
    ));
}

float traceWater(vec3 ro, vec3 rd)
{
    float t = 0.0;

    for(int i=0;i<120;i++)
    {
        vec3 p = ro + rd * t;

        if(
            abs(p.x) > 3.0 ||
            abs(p.z) > 5.0
        )
        {
            t += 0.08;
            continue;
        }

        float d = p.y - waterHeight(p.xz);

        if(abs(d) < 0.002)
            return t;

        t += max(0.02, abs(d) * 0.7);

        if(t > 40.0)
            break;
    }

    return -1.0;
}

vec3 getSky(vec3 rd)
{
    float sun = max(
        dot(rd, normalize(vec3(0.4,0.7,0.3))),
        0.0
    );

    vec3 col = mix(
        vec3(0.12,0.35,0.7),
        vec3(0.78,0.92,1.0),
        rd.y * 0.5 + 0.5
    );

    col += pow(sun, 120.0) * 6.0;

    return col;
}

float getCaustics(vec3 p)
{
    vec2 uv = p.xz * 2.3;

    float t = iTime * 1.5;

    float c =
        sin(uv.x * 14.0 + t)
      + sin(uv.y * 16.0 - t)
      + sin((uv.x + uv.y) * 10.0 + t * 0.6);

    c = sin(c);

    return pow(abs(c), 15.0);
}

vec3 poolTiles(vec3 p)
{
    vec2 uv;

    vec3 n;

    float eps = 0.01;

    vec3 px = p + vec3(eps,0.0,0.0);
    vec3 py = p + vec3(0.0,eps,0.0);
    vec3 pz = p + vec3(0.0,0.0,eps);

    float dx = abs(abs(px.x) - 3.5);
    float dy = abs(abs(py.y + 1.8) - 1.8);
    float dz = abs(abs(pz.z) - 5.5);

    if(dx < dy && dx < dz)
    {
        uv = p.zy;
        n = vec3(sign(p.x),0.0,0.0);
    }
    else if(dz < dx && dz < dy)
    {
        uv = p.xy;
        n = vec3(0.0,0.0,sign(p.z));
    }
    else
    {
        uv = p.xz;
        n = vec3(0.0,1.0,0.0);
    }

    uv *= 2.5;

    vec2 gv = fract(uv);

    float line =
        step(0.96, gv.x)
      + step(0.96, gv.y);

    vec3 tile = mix(
        vec3(0.06,0.45,0.82),
        vec3(0.9),
        line
    );

    return tile;
}

bool intersectPool(
    vec3 ro,
    vec3 rd,
    out vec3 hitPos,
    out vec3 hitNormal
)
{
    float tMin = 9999.0;

    bool hit = false;

    vec3 bmin = vec3(-3.5,-3.6,-5.5);
    vec3 bmax = vec3( 3.5, 0.0, 5.5);

    if(rd.y < 0.0)
    {
        float t = (bmin.y - ro.y) / rd.y;

        vec3 p = ro + rd * t;

        if(
            abs(p.x) < 3.5 &&
            abs(p.z) < 5.5 &&
            t > 0.0 &&
            t < tMin
        )
        {
            tMin = t;
            hit = true;
            hitPos = p;
            hitNormal = vec3(0.0,1.0,0.0);
        }
    }

    /*if(rd.x > 0.0)
    {
        float t = (bmin.x - ro.x) / rd.x;

        vec3 p = ro + rd * t;

        if(
            p.y > -3.6 &&
            p.y < 0.0 &&
            abs(p.z) < 5.5 &&
            t > 0.0 &&
            t < tMin
        )
        {
            tMin = t;
            hit = true;
            hitPos = p;
            hitNormal = vec3(1.0,0.0,0.0);
        }
    }*/

    if(rd.x < 0.0)
    {
        float t = (bmax.x - ro.x) / rd.x;

        vec3 p = ro + rd * t;

        if(
            p.y > -3.6 &&
            p.y < 0.0 &&
            abs(p.z) < 5.5 &&
            t > 0.0 &&
            t < tMin
        )
        {
            tMin = t;
            hit = true;
            hitPos = p;
            hitNormal = vec3(-1.0,0.0,0.0);
        }
    }

    /*if(rd.z > 0.0)
    {
        float t = (bmin.z - ro.z) / rd.z;

        vec3 p = ro + rd * t;

        if(
            p.y > -3.6 &&
            abs(p.x) < 3.5 &&
            t > 0.0 &&
            t < tMin
        )
        {
            tMin = t;
            hit = true;
            hitPos = p;
            hitNormal = vec3(0.0,0.0,1.0);
        }
    }*/

    if(rd.z < 0.0)
    {
        float t = (bmax.z - ro.z) / rd.z;

        vec3 p = ro + rd * t;

        if(
            p.y > -3.6 &&
            abs(p.x) < 3.5 &&
            t > 0.0 &&
            t < tMin
        )
        {
            tMin = t;
            hit = true;
            hitPos = p;
            hitNormal = vec3(0.0,0.0,-1.0);
        }
    }

    return hit;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv =
        (fragCoord * 2.0 - iResolution.xy)
        / iResolution.y;

    vec3 ro = vec3(0.0,1.8,8.5);

    ro.xz = rotate2D(cameraAngle) * ro.xz;

    vec3 ta = vec3(0.0,-1.0,0.0);

    vec3 ww = normalize(ta - ro);

    vec3 uu = normalize(
        cross(vec3(0.0,1.0,0.0), ww)
    );

    vec3 vv = cross(ww, uu);

    vec3 rd = normalize(
        uu * uv.x +
        vv * uv.y +
        ww * 1.8
    );

    vec3 col = getSky(rd);

    float wt = traceWater(ro, rd);

    if(wt > 0.0)
    {
        vec3 wp = ro + rd * wt;

        vec3 wn = getWaterNormal(wp.xz);

        vec3 reflDir = reflect(rd, wn);

        vec3 reflection = getSky(reflDir);

        vec3 refrDir =
            refract(
                rd,
                wn,
                1.0 / 1.333
            );

        vec3 pp;
        vec3 pn;

        vec3 poolColor = vec3(0.0);

        if(intersectPool(
            wp + refrDir * 0.03,
            refrDir,
            pp,
            pn
        ))
        {
            float depth = length(pp - wp);

            vec3 absorb = vec3(
                exp(-depth * 1.4),
                exp(-depth * 0.45),
                exp(-depth * 0.16)
            );

            vec3 tile = poolTiles(pp);

            float caustic = getCaustics(pp);

            float facing =
                max(dot(pn, vec3(0.0,1.0,0.0)), 0.0);

            tile +=
                vec3(1.4,1.5,1.2)
                * caustic
                * facing
                * 2.0;

            float diffuse =
                max(
                    dot(
                        pn,
                        normalize(vec3(0.4,1.0,0.3))
                    ),
                    0.0
                );

            tile *= diffuse * 0.8 + 0.2;

            poolColor = tile * absorb;
        }

        float fresnel =
            pow(
                1.0 - max(dot(-rd, wn),0.0),
                5.0
            );

        col =
            mix(
                poolColor,
                reflection,
                fresnel * 0.72
            );

        col *= vec3(0.92,0.98,1.05);
    }

    col *= 1.0 - dot(uv,uv) * 0.14;

    col = col / (1.0 + col);

    col = pow(col, vec3(0.4545));

    fragColor = vec4(col,1.0);
}