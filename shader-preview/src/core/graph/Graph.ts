import GraphEditor from "../GraphEditor";

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

  position: [number, number] = [0, 0];
  zoom: number = 1;

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

  getConnections(): readonly Connection[] {
    return this.nodes.flatMap((node) => {
      return node.getOutputs().flatMap((output) => output.getConnections());
    });
  }

  getScenePosition(viewPosition: [number, number]): [number, number] {
    const { position, zoom } = this;

    return [
      viewPosition[0] / zoom - position[0],
      viewPosition[1] / zoom - position[1],
    ];
  }

  handleWheel(evt: WheelEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    const { offsetX, offsetY } = evt;

    const originalMousePosition = this.getScenePosition([offsetX, offsetY]);

    // https://stackoverflow.com/a/57899935
    // Make zoom change proportionate to the current zoom level.
    this.zoom = this.zoom * Math.pow(2, evt.deltaY * -0.01);

    const updatedMousePosition = this.getScenePosition([offsetX, offsetY]);

    this.position = [
      this.position[0] + (updatedMousePosition[0] - originalMousePosition[0]),
      this.position[1] + (updatedMousePosition[1] - originalMousePosition[1]),
    ];
  }

  handleDrag(evt: MouseEvent) {
    this.updatePosition(evt);
  }

  private updatePosition(evt: MouseEvent) {
    const { position, zoom } = this;
    const { movementX, movementY } = evt;

    this.position = [
      position[0] + movementX / zoom,
      position[1] + movementY / zoom,
    ];
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    const { zoom, position } = this;

    ctx.scale(zoom, zoom);
    ctx.translate(position[0], position[1]);

    const connections = this.getConnections();
    for (const connection of connections) {
      connection.draw(ctx, editor);
    }

    for (const node of this.nodes) {
      node.draw(ctx, editor);
    }
  }
}
