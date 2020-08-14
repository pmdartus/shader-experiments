import { GraphNode, GraphNodeConfig, IOType } from "../graph";

export default class Output extends GraphNode {
  constructor(config: Omit<GraphNodeConfig, "title">) {
    super({
      ...config,
      title: "Output",
    });

    this.createInput({
      name: "input",
      type: IOType.ImageOrColor,
    });
  }
}
