import { uuid } from "../../utils/uuid";
import { Vec2 } from "../types";

import Graph from "./Graph";
import Input from "./Input";
import Output from "./Output";
import Property from "./Property";
import Connection from "./Connection";

export default class GraphNode {
  id: string;
  graph: Graph;

  title: string;
  position: Vec2 = [0, 0];
  inputs = new Map<string, Input>();
  outputs = new Map<string, Output>();
  properties = new Map<string, Property>();

  constructor({ graph, title }: { graph: Graph; title: string }) {
    this.id = uuid();
    this.graph = graph;
    this.title = title;
  }

  setPosition(position: Vec2) {
    this.position = position;
  }

  getConnections(): Connection[] {
    const inputConnections = [...this.inputs.values()]
      .map((input) => input.getConnection())
      .filter((connection) => connection !== null) as Connection[];

    const outputConnections = [...this.outputs.values()].flatMap((output) =>
      output.getConnections()
    );

    return [...inputConnections, ...outputConnections];
  }

  addInput(input: Input) {
    const { name } = input;

    if (this.inputs.has(name)) {
      throw new Error(`Input with name "${name}" already exists.`);
    }

    this.inputs.set(name, input);
  }

  getInput<T = unknown>(name: string): Input<T> | undefined {
    return this.inputs.get(name) as Input<T> | undefined;
  }

  removeInput(input: Input) {
    const { name } = input;

    const actualInput = this.inputs.get(name);
    if (input !== actualInput) {
      throw new Error(
        `Invalid input parameter, input with name ${name} maps to another Input instance.`
      );
    }

    input.removeConnection();
    this.inputs.delete(name);
  }

  addOutput(output: Output) {
    const { name } = output;

    if (this.inputs.has(name)) {
      throw new Error(`Output with name "${name}" already exists.`);
    }

    this.outputs.set(name, output);
  }

  getOutput<T>(name: string): Output<T> | undefined {
    return this.outputs.get(name) as Output<T> | undefined;
  }

  removeOutput(output: Output) {
    const { name } = output;

    const actualOutput = this.outputs.get(name);
    if (output !== actualOutput) {
      throw new Error(
        `Invalid output parameter, output with name ${name} maps to another Output instance.`
      );
    }

    output.removeConnections();
    this.outputs.delete(output.name);
  }
}
