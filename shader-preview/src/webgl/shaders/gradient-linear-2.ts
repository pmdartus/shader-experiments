import { GraphNodeDefinition } from "../types";

const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_texCoord;
out vec4 o_color;

// From: https://www.iquilezles.org/www/articles/functions/functions.htm
float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

void main() {
    vec2 tile = fract(v_texCoord * vec2(u_tiling));
    float val = parabola(tile.x, 1.0);

    o_color = vec4(vec3(val), 1.0);
}`;

const linearGradient2: GraphNodeDefinition = {
  name: "linear-gradient-2",
  label: "Linear Gradient 2",
  shader: FRAGMENT_SHADER,
  properties: {
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

export default linearGradient2;
