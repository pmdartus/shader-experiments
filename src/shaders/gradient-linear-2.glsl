#version 300 es

precision mediump float;

const int c_tiling = 1;

uniform vec2 u_resolution;
out vec4 o_color;

// From: https://www.iquilezles.org/www/articles/functions/functions.htm
float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    vec2 tile = fract(pos * vec2(c_tiling));
    float val = parabola(tile.x, 1.0);

    o_color = vec4(vec3(val), 1.0);
}