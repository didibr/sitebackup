//Common
float sharedFunc(float x)
{
    return sin(x) * 0.5 + 0.5;
}

vec3 sharedColor(float t)
{
    return vec3(
        sharedFunc(t),
        sharedFunc(t + 1.0),
        sharedFunc(t + 2.0)
    );
}

//iChannel0
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    vec3 col = sharedColor(uv.x * 10.0 + iTime);

    fragColor = vec4(col, 1.0);
}

//Main
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // usa MESMA função do Common
    vec3 col = sharedColor(uv.y * 10.0 + iTime);

    fragColor = vec4(col, 1.0);
}