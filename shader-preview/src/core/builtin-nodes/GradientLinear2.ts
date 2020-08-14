import { GraphNode, GraphNodeConfig, IntProperty, IOType } from "../graph";

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

export default class LinearGradient2 extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Linear Gradient 2",
    });

    this.addProperty(
      new IntProperty({
        name: "tiling",
        label: "Tiling",
        value: 1,
        min: 1,
        max: 16,
        step: 1,
        node: this,
      })
    );

    this.createOutput({
      name: "output",
      type: IOType.ImageOrColor,
    });
  }

  execute() {
    console.log("Execute", FRAGMENT_SHADER);
  }
}
