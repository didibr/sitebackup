//Main
precision highp float;

mat3 rotationXYZ(vec3 a) {
    float cx = cos(a.x);
    float sx = sin(a.x);
    float cy = cos(a.y);
    float sy = sin(a.y);
    float cz = cos(a.z);
    float sz = sin(a.z);

    // rotação X
    mat3 rx = mat3(
        1.0, 0.0, 0.0,
        0.0, cx, -sx,
        0.0, sx,  cx
    );

    // rotação Y
    mat3 ry = mat3(
         cy, 0.0, sy,
        0.0, 1.0, 0.0,
        -sy, 0.0, cy
    );

    // rotação Z
    mat3 rz = mat3(
        cz, -sz, 0.0,
        sz,  cz, 0.0,
        0.0, 0.0, 1.0
    );

    // ordem importa!
    return rz * ry * rx;
}

float boxSDF(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float map(vec3 p) {
    vec3 rot = vec3(iTime * 0.5, iTime, 0.0);
    p = rotationXYZ(rot) * p;
    return boxSDF(p, vec3(0.5));
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;

    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);

        if (d < 0.001) return t;

        t += d;
        if (t > 50.0) break;
    }

    return -1.0;
}

vec3 getNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.001, 0);

    return normalize(vec3(
        map(p + e.xyy) - d,
        map(p + e.yxy) - d,
        map(p + e.yyx) - d
    ));
}



void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;   

    vec3 ro = vec3(0.0, 0.0, 6.0);
  
  
  vec3 rd = normalize(vec3(uv, -1.5));

vec3 rot = vec3(iTime * 0.5, iTime, 0.0);

//rd = rotationXYZ(rot) * rd;
//ro = rotationXYZ(rot) * ro;
  

    // rotação simples
    float t = iTime;
    //mat2 rot = mat2(cos(t), -sin(t), sin(t), cos(t));
    //uv *= rot;

    //vec3 rd = normalize(vec3(uv, -1.5));

    float hit = raymarch(ro, rd);

    vec3 color = vec3(0.0);

    if (hit > 0.0) {
        vec3 p = ro + rd * hit;
        vec3 n = getNormal(p);

        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(n, light), 0.0);

        color = vec3(diff);
    }

    fragColor = vec4(color, 1.0);
}