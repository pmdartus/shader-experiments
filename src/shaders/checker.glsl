#version 300 es

precision mediump float;

const int c_tiling = 2;

uniform vec2 u_resolution;
out vec4 o_color;

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    vec2 grid = fract(pos * vec2(c_tiling));
    
    vec2 tile = step(grid, vec2(.5));
    float val = tile.x == tile.y ? 1.0 : 0.0;

    o_color = vec4(vec3(val), 1.0);
}