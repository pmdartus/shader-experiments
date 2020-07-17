#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_textcoord;
out vec4 o_color;

void main() {
    vec2 tile = fract(v_textcoord * vec2(u_tiling));
    float val = tile.x;

    o_color = vec4(vec3(val), 1.0);
}