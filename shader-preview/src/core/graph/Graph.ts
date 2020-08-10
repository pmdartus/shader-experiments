import Input from "./Input";
import Output from "./Output";
import GraphNode from "./GraphNode";
import Connection from "./Connection";

export interface GraphNodeConstructor {
  new (config: { graph: Graph }): GraphNode;
}

export default class Graph extends EventTarget {
  nodes: GraphNode[] = [];
  registry: Map<string, GraphNodeConstructor> = new Map();

  register(name: string, ctor: GraphNodeConstructor) {
    if (this.registry.has(name)) {
      throw new Error(`Invalid node name. "${name}" is already registered.`);
    }

    this.registry.set(name, ctor);
  }

  createNode(name: string): GraphNode {
    const ctor = this.registry.get(name);
    if (ctor === undefined) {
      throw new Error(`Unknown node name "${name}".`);
    }

    const node = new ctor({ graph: this });
    this.nodes.push(node);

    this.dispatchEvent(new CustomEvent("nodecreated", { detail: node }));

    return node;
  }

  removeNode(node: GraphNode) {
    const nodeIndex = this.nodes.indexOf(node);
    if (nodeIndex === -1) {
      throw new Error(`Unknown node "${node.id}"`);
    }

    for (const connection of node.getConnections()) {
      connection.removeConnection();
    }

    this.nodes.splice(nodeIndex, 1);
  }

  connect({ from, to }: { from: Output; to: Input }): Connection {
    return from.connectTo(to);
  }
}
