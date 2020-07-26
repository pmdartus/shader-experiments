const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_textcoord;
out vec4 o_color;

void main() {
    vec2 tile = fract(v_textcoord * vec2(u_tiling));
    float val = tile.x;

    o_color = vec4(vec3(val), 1.0);
}`;

export default {
  name: "linear-gradient-1",
  label: "Linear Gradient 1",
  shader: FRAGMENT_SHADER,
  props: {
    tiling: {
      label: "Tiling",
      type: "int",
      default: 1,
      min: 1,
      max: 16,
      step: 1,
    },
  },
};
