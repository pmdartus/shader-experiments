import {
  GraphNode,
  GraphNodeConfig,
  IntProperty,
  FloatProperty,
  IOType,
} from "../graph";

const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform int u_tiling;
uniform float u_edgesmoothness;
uniform float u_intersectionwidth;

in vec2 v_texCoord;
out vec4 o_color;

float brick(vec2 pos) {
    // Compute mortar postion.
    vec2 mortar = vec2(u_intersectionwidth * 0.5);
    
    // Compute edge position. A small value is added to make sure the edge position and the mortar
    // position never overlaps.
    vec2 edge = mix(mortar + 1e-4, vec2(0.5), u_edgesmoothness);

    // Create 2 maps (top-left map and bottom-right map) masking values outside the brick.
    vec2 uv = smoothstep(mortar, edge, pos);
    uv *= smoothstep(vec2(1.0) - mortar, vec2(1.0) - edge, pos);

    // Multiple each map
    return uv.x * uv.y;
}

vec2 tile(vec2 pos) {
    // Multiply the position by the tiling
    pos *= float(u_tiling);

    // Offset every other row by 0.5
    pos.x += step(1.0, mod(pos.y, 2.0)) * 0.5;

    // Normalize each value again
    return fract(pos);
}

void main() {
    vec2 pos = tile(v_texCoord);
    float color = brick(pos);

    o_color = vec4(vec3(color), 1.0);
}`;

export default class Brick extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Brick",
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
    this.addProperty(
      new FloatProperty({
        name: "edgesmoothness",
        label: "Edge Smoothness",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
        node: this,
      })
    );
    this.addProperty(
      new FloatProperty({
        name: "intersectionwidth",
        label: "Intersection Width",
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01,
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
