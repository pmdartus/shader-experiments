#version 300 es

precision mediump float;

uniform vec2 u_p1;
uniform vec2 u_p2;
uniform vec2 u_resolution;

out vec4 o_color;

void main() {
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;

    // Normalize pos and p2 relative to the origin.
    vec2 pos_norm = pos - u_p1;
    vec2 p2_norm = u_p2 - u_p1;

    // Project the normalize noralized pos vector on the normalize pos one.
    float pos_projection = dot(pos_norm, p2_norm) / length(p2_norm); 

    o_color = vec4(vec3(pos_projection), 1.0);
}