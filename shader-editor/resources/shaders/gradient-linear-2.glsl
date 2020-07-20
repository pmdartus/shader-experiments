#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_textcoord;
out vec4 o_color;

// From: https://www.iquilezles.org/www/articles/functions/functions.htm
float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

void main() {
    vec2 tile = fract(v_textcoord * vec2(u_tiling));
    float val = parabola(tile.x, 1.0);

    o_color = vec4(vec3(val), 1.0);
}