import { GraphNode, GraphNodeConfig, IntProperty, IOType } from "../graph";

const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_texCoord;
out vec4 o_color;

void main() {
    vec2 tile = fract(v_texCoord * vec2(u_tiling));
    float val = tile.x;

    o_color = vec4(vec3(val), 1.0);
}`;

export default class LinearGradient1 extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Linear Gradient 1",
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
      type: IOType.GrayScale,
    });
  }

  execute() {
    console.log("Execute", FRAGMENT_SHADER);
  }
}
