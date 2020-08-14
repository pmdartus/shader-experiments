import { GraphNode, GraphNodeConfig, Float3Property, IOType } from "../graph";

export default class UniformColor extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Uniform Color",
    });

    this.addProperty(
      new Float3Property({
        name: "color",
        label: "Color",
        value: [0, 0, 0],
        node: this,
      })
    );

    this.createOutput({
      name: "output",
      type: IOType.Color,
    });
  }
}
