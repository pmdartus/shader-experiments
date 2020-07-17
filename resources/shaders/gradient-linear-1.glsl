#version 300 es

precision mediump float;

uniform int u_tiling;
uniform vec2 u_resolution;

out vec4 o_color;

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    vec2 tile = fract(pos * vec2(u_tiling));
    float val = tile.x;

    o_color = vec4(vec3(val), 1.0);
}