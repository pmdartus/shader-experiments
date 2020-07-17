#version 300 es

precision mediump float;

uniform int u_tiling;
uniform float u_postion;

in vec2 v_textcoord;
out vec4 o_color;

void main() {
    vec2 tile = fract(v_textcoord * vec2(u_tiling));
    float val = tile.x < u_postion ? 
        smoothstep(0.0, 1.0, u_postion - tile.x) : 
        smoothstep(1.0, 0.0, tile.x - u_postion);

    o_color = vec4(vec3(val), 1.0);
}