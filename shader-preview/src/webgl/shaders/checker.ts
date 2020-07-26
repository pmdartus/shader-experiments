const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_textcoord;
out vec4 o_color;

void main() {
    vec2 grid = fract(v_textcoord * vec2(u_tiling));
    
    vec2 tile = step(grid, vec2(.5));
    float val = tile.x == tile.y ? 1.0 : 0.0;

    o_color = vec4(vec3(val), 1.0);
}`;

export default {
  name: "checker",
  label: "Checker",
  shader: FRAGMENT_SHADER,
  props: {
    tiling: {
      label: "Tiling",
      type: "int",
      default: 2,
      min: 1,
      max: 16,
      step: 1,
    },
  },
};
