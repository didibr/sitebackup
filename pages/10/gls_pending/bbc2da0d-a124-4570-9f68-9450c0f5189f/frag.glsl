//iChannel1
precision highp float;

// =====================================
// HASH / NOISE
// =====================================

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0));
    float d = hash(i + vec2(1.0,1.0));

    return mix(
        mix(a,b,f.x),
        mix(c,d,f.x),
        f.y
    );
}

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;

    for(int i=0;i<5;i++)
    {
        v += noise(p) * a;
        p *= 2.0;
        a *= 0.5;
    }

    return v;
}

// =====================================
// WATER HEIGHT
// =====================================

float waterHeight(vec2 p)
{
    vec2 flow =
        vec2(
            iTime * 0.7,
            iTime * 0.15
        );

    float h = 0.0;

    h += fbm(p * 1.2 + flow) * 0.6;
    h += fbm(p * 2.8 + flow * 1.7) * 0.3;
    h += fbm(p * 6.0 + flow * 2.5) * 0.1;

    return h;
}

// =====================================
// NORMAL
// =====================================

vec3 getNormal(vec2 p)
{
    float e = 0.01;

    float h  = waterHeight(p);
    float hx = waterHeight(p + vec2(e,0.0));
    float hy = waterHeight(p + vec2(0.0,e));

    return normalize(vec3(
        h - hx,
        e,
        h - hy
    ));
}

// =====================================
// SKY
// =====================================

vec3 getSky(vec3 rd)
{
    vec3 col = mix(
        vec3(0.05,0.12,0.2),
        vec3(0.4,0.7,1.0),
        rd.y * 0.5 + 0.5
    );

    float sun = max(dot(rd, normalize(vec3(-0.4,0.7,0.3))), 0.0);

    col += vec3(1.0,0.85,0.6) * pow(sun, 90.0) * 2.0;

    return col;
}

// =====================================
// final
// =====================================
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv =
        (fragCoord.xy * 2.0 - iResolution.xy)
        / iResolution.y;

    // =================================
    // STATIC CAMERA
    // =================================

    vec3 ro = vec3(0.0, 1.6, 4.0);
    vec3 ta = vec3(0.0, 0.0, 0.0);

    // mouse rotate

    float mx = iMouse.x / iResolution.x;

    if(iMouse.z > 0.0)
    {
        float a = (mx - 0.5) * 6.2831;

        ro.xz = mat2(
             cos(a), -sin(a),
             sin(a),  cos(a)
        ) * ro.xz;
    }

    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(vec3(0.0,1.0,0.0), ww));
    vec3 vv = cross(ww, uu);

    vec3 rd = normalize(
        uu * uv.x +
        vv * uv.y +
        ww * 1.8
    );

    // =================================
    // WATER PLANE
    // =================================

    float t = -ro.y / rd.y;

    vec3 col;

    if(t > 0.0)
    {
        vec3 pos = ro + rd * t;

        vec2 wp = pos.xz;

        vec3 n = getNormal(wp);

        // reflection

        vec3 refl = reflect(rd, n);

        vec3 sky = getSky(refl);

        // deep water color

        vec3 waterCol =
            vec3(0.02,0.25,0.4);

        // fresnel

        float fres =
            pow(
                1.0 - max(dot(-rd,n),0.0),
                5.0
            );

        // flowing highlights

        float flow =
            fbm(
                wp * 8.0 +
                vec2(iTime * 2.0, 0.0)
            );

        flow =
            smoothstep(
                0.6,
                0.9,
                flow
            );

        waterCol += flow * 0.12;

        col =
            mix(
                waterCol,
                sky,
                fres * 0.85
            );

        // specular

        vec3 lightDir =
            normalize(vec3(-0.4,0.7,0.3));

        float spec =
            pow(
                max(
                    dot(reflect(-lightDir,n), -rd),
                    0.0
                ),
                64.0
            );

        col += spec * 1.5;
    }
    else
    {
        col = getSky(rd);
    }

    // vignette

    col *= 1.0 - dot(uv,uv) * 0.15;

    // tonemap

    col = col / (1.0 + col);

    col = pow(col, vec3(0.4545));

    fragColor = vec4(col,1.0);
}

//Main
precision highp float;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;

    fragColor = texture2D(iChannel1, uv);
}