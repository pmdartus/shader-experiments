#version 300 es

precision mediump float;

const int c_tiling = 1;

uniform vec2 u_resolution;
out vec4 o_color;

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    vec2 tile = fract(pos * vec2(c_tiling));
    float val = tile.x;

    o_color = vec4(vec3(val), 1.0);
}