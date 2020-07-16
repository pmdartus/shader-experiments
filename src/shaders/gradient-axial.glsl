#version 300 es

precision mediump float;

const vec2 c_p1 = vec2(0);
const vec2 c_p2 = vec2(1);

uniform vec2 u_resolution;
out vec4 o_color;

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    // Normalize pos and p2 relative to the origin.
    vec2 pos_norm = pos - c_p1;
    vec2 p2_norm = c_p2 - c_p1;

    // Project the normalize noralized pos vector on the normalize pos one.
    float pos_projection = dot(pos_norm, p2_norm) / length(p2_norm); 

    o_color = vec4(vec3(pos_projection), 1.0);
}