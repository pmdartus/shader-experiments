import { GraphNode, Graph } from "../graph";

export class BuiltInNode extends GraphNode {
  constructor(config: { graph: Graph }) {
    super({
      graph: config.graph,
      title: "Built in",
    });
  }
}
