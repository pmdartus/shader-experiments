#version 300 es

precision mediump float;

const float GIZMO_SIZE = .015;
const vec3 GIZMO_COLOR = vec3(0.0, 1.0, 0.0);

uniform vec2 u_p1;
uniform vec2 u_p2;
uniform bool u_gizmo;

in vec2 v_textcoord;
out vec4 o_color;

void main() {
    // Normalize pos and p2 relative to the origin.
    vec2 pos_norm = v_textcoord - u_p1;
    vec2 p2_norm = u_p2 - u_p1;

    // Project the normalize noralized pos vector on the normalize pos one.
    float pos_projection = dot(p2_norm, pos_norm) / dot(p2_norm, p2_norm);
    vec3 color = vec3(pos_projection);

    // Add gizmo is necessary.
    if (u_gizmo) {
        float markers = max(
            step(distance(v_textcoord, u_p1), GIZMO_SIZE),
            step(distance(v_textcoord, u_p2), GIZMO_SIZE)
        );

        color = mix(color, GIZMO_COLOR, markers);
    }

    o_color = vec4(color, 1.0);
}