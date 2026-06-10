
//iChannel1 = https://didisoftwares.ddns.net/10/images/noise3.png

//iChannel0 = https://didisoftwares.ddns.net/10/images/noise2.png

//Main
mat3 setCamera(vec3 ro, vec3 ta, float cr)
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

//--------------------------------------------------

float noise(vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);

    vec2 uv = (p.xy + vec2(37.0,239.0)*p.z) + f.xy;
    vec2 rg = texture2D(iChannel0, (uv+0.5)/256.0).yx;

    return mix(rg.x, rg.y, f.z)*2.0-1.0;
}

//--------------------------------------------------

float map(vec3 p)
{
    vec3 q = p - vec3(0.0,0.1,-0.5)*iTime;

    float f = 0.0;
    float a = 0.5;

    for(int i=0;i<5;i++)
    {
        f += a * noise(q);
        q *= 2.02;
        a *= 0.5;
    }
  
  float d = 1.5*f - 0.5 - p.y;
  d = smoothstep(0.0, 0.8, d);

    return d;
}

//--------------------------------------------------
float sunXvariation=0.8*cos(0.02*iTime);
vec3 sundir = normalize(vec3( sunXvariation ,0.0,1.0));

vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol, vec2 px)
{
    vec4 sum = vec4(0.0);

    float t = 0.1 * texture2D(iChannel1, px / 1024.0).x;

    for(int i=0;i<80;i++)
    {
        vec3 pos = ro + t*rd;
        float den = map(pos);

        if(den > 0.01)
        {
            float dif = clamp((den - map(pos+0.3*sundir))/0.25, 0.0, 1.0);

            vec3 lin = vec3(0.65,0.65,0.75)*1.1
                     + 0.8*vec3(1.0,0.6,0.3)*dif;

            vec4 col = vec4(
                mix(vec3(1.0,0.93,0.84),
                    vec3(0.25,0.3,0.4),
                    den),
                den
            );

            col.rgb *= lin;
            col.rgb = mix(col.rgb, bgcol, 1.0-exp(-0.1*t));

            col.a = min(col.a*8.0*0.05,1.0);
            col.rgb *= col.a;

            sum += col*(1.0-sum.a);
        }

        t += max(0.05, 0.02*t);

        if(sum.a > 0.99) break;
    }

    return clamp(sum,0.0,1.0);
}

//--------------------------------------------------

vec4 render(vec3 ro, vec3 rd, vec2 px)
{
    float sun = clamp(dot(sundir,rd), 0.0, 1.0);

    vec3 col = vec3(0.76,0.75,0.95);
    col -= 0.6*vec3(0.90,0.75,0.95)*rd.y;
    col += 0.2*vec3(1.0,0.6,0.1)*pow(sun,8.0);

    vec4 res = raymarch(ro, rd, col, px);
    col = col*(1.0-res.a) + res.rgb;

    col += 0.2*vec3(1.0,0.4,0.2)*pow(sun,3.0);

    col = smoothstep(0.15,1.1,col);

    return vec4(col,1.0);
}

//--------------------------------------------------


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 m = iMouse.xy / iResolution.xy;

    vec3 ro = 4.0*normalize(vec3(
        sin(3.0*m.x),
        0.05*m.y,
        cos(3.0*m.x)
    )) - vec3(0.0,0.5,0.0);

    vec3 ta = vec3(0.0, -1.0, 0.0);

    //mat3 ca = setCamera(ro, ta, 0.07*cos(0.25*iTime));
    
    vec3 rd = 1.0 * normalize(vec3(p,0.8));

    fragColor = render(ro, rd, fragCoord);
}