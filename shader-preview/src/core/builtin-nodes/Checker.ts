import { GraphNode, GraphNodeConfig, IntProperty, IOType } from "../graph";

const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;

in vec2 v_texCoord;
out vec4 o_color;

void main() {
    vec2 grid = fract(v_texCoord * vec2(u_tiling));
    
    vec2 tile = step(grid, vec2(.5));
    float val = tile.x == tile.y ? 1.0 : 0.0;

    o_color = vec4(vec3(val), 1.0);
}`;

export default class Checker extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Checker",
    });

    this.addProperty(
      new IntProperty({
        name: "tiling",
        label: "Tiling",
        value: 2,
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
