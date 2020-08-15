import { uuid } from "../../utils/uuid";

import { Vec2 } from "../types";
import GraphEditor from "../GraphEditor";

import Graph from "./Graph";
import Input from "./Input";
import Output from "./Output";
import { IOConfig } from "./IO";
import { Property } from "./Property";
import Connection from "./Connection";

const NODE_WIDTH = 100;
const NODE_MIN_HEIGHT = NODE_WIDTH;
const NODE_FILL_STYLE = "#323232";

const NODE_BORDER_WIDTH = 6;
const NODE_STROKE_STYLE = "#1e1e1e";
const NODE_STROKE_STYLE_SELECTED = "#c8c8c8";

const TITLE_HEIGHT = 20;
const TILE_FILL_STYLE = "#d7373f";

const FONT_FILL_STYLE = "#fff";
const TITLE_FONT = "1em sans-serif";

const SOCKET_HEIGHT = 20;

export interface GraphNodeConfig {
  graph: Graph;
  title: string;
}

export default class GraphNode {
  readonly id: string;
  readonly graph: Graph;
  readonly title: string;

  private position: Vec2 = [0, 0];
  private inputs = new Map<string, Input>();
  private outputs = new Map<string, Output>();
  private properties = new Map<string, Property>();

  constructor({ graph, title }: GraphNodeConfig) {
    this.id = uuid();
    this.graph = graph;
    this.title = title;
  }

  getPosition(): Vec2 {
    return this.position;
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

  createInput(config: Omit<IOConfig, "node">): Input {
    const input = new Input({ ...config, node: this });
    this.addInput(input);
    return input;
  }

  createOutput(config: Omit<IOConfig, "node">): Output {
    const output = new Output({ ...config, node: this });
    this.addOutput(output);
    return output;
  }

  addInput(input: Input) {
    const { name } = input;

    if (this.inputs.has(name)) {
      throw new Error(`Input with name "${name}" already exists.`);
    }

    this.inputs.set(name, input);
  }

  getInput(name: string): Input | undefined {
    return this.inputs.get(name);
  }

  getInputs(): Input[] {
    return [...this.inputs.values()];
  }

  getInputOffset(input: Input): Vec2 {
    const inputsArray = [...this.inputs.values()];
    const inputIndex = inputsArray.indexOf(input);

    if (inputIndex === -1) {
      throw new Error(`Invalid output parameter.`);
    }

    const height = this.getNodeHeight();
    const outputVerticalOffset =
      height / 2 - (SOCKET_HEIGHT * inputsArray.length) / 2 + SOCKET_HEIGHT / 2;

    return [0, outputVerticalOffset + inputIndex * SOCKET_HEIGHT];
  }

  removeInput(input: Input) {
    const { name } = input;

    const actualInput = this.inputs.get(name);
    if (input !== actualInput) {
      throw new Error(
        `Invalid input parameter, input with name "${name}" maps to another Input instance.`
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

  getOutput(name: string): Output | undefined {
    return this.outputs.get(name);
  }

  getOutputs(): Output[] {
    return [...this.outputs.values()];
  }

  getOutputOffset(output: Output): Vec2 {
    const outputsArray = [...this.outputs.values()];
    const outputIndex = outputsArray.indexOf(output);

    if (outputIndex === -1) {
      throw new Error(`Invalid output parameter.`);
    }

    const height = this.getNodeHeight();
    const outputVerticalOffset =
      height / 2 -
      (SOCKET_HEIGHT * outputsArray.length) / 2 +
      SOCKET_HEIGHT / 2;

    return [NODE_WIDTH, outputVerticalOffset + outputIndex * SOCKET_HEIGHT];
  }

  removeOutput(output: Output) {
    const { name } = output;

    const actualOutput = this.outputs.get(name);
    if (output !== actualOutput) {
      throw new Error(
        `Invalid output parameter, output with name "${name}" maps to another Output instance.`
      );
    }

    output.removeConnections();
    this.outputs.delete(output.name);
  }

  addProperty(property: Property) {
    const { name } = property;

    if (this.properties.has(name)) {
      throw new Error(`Property with name "${name}" already exists.`);
    }

    this.properties.set(name, property);
  }

  getProperty(name: string): Property | undefined {
    return this.properties.get(name);
  }

  removeProperty(property: Property) {
    const { name } = property;

    const actualProperty = this.properties.get(name);
    if (property !== actualProperty) {
      throw new Error(
        `Invalid property parameter, property with name "${name}" maps to another Property instance.`
      );
    }

    this.properties.delete(property.name);
  }

  markDirty() {
    console.info("TODO: Handle dirty");
  }

  getNodeHeight(): number {
    const { inputs, outputs } = this;

    return Math.max(
      NODE_MIN_HEIGHT,
      inputs.size * SOCKET_HEIGHT,
      outputs.size * SOCKET_HEIGHT
    );
  }

  isUnder(target: Vec2): boolean {
    const { position } = this;
    const width = NODE_WIDTH;
    const height = this.getNodeHeight();

    return (
      target[0] >= position[0] &&
      target[0] < position[0] + width &&
      target[1] >= position[1] &&
      target[1] < position[1] + height
    );
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    const { position, title, inputs, outputs } = this;
    const { selection } = editor;

    const height = this.getNodeHeight();

    ctx.save();

    ctx.translate(position[0], position[1]);

    ctx.lineWidth = NODE_BORDER_WIDTH;
    ctx.strokeStyle = selection.has(this)
      ? NODE_STROKE_STYLE_SELECTED
      : NODE_STROKE_STYLE;
    ctx.strokeRect(0, 0, NODE_WIDTH, height);

    ctx.fillStyle = NODE_FILL_STYLE;
    ctx.fillRect(0, 0, NODE_WIDTH, NODE_WIDTH);

    ctx.fillStyle = TILE_FILL_STYLE;
    ctx.fillRect(0, 0, NODE_WIDTH, TITLE_HEIGHT);

    ctx.font = TITLE_FONT;
    ctx.fillStyle = FONT_FILL_STYLE;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(title, NODE_WIDTH / 2, TITLE_HEIGHT / 2, NODE_WIDTH);

    for (const input of inputs.values()) {
      ctx.save();

      const [offsetX, offsetY] = this.getInputOffset(input);
      ctx.translate(offsetX, offsetY);
      input.draw(ctx, editor);

      ctx.restore();
    }

    for (const output of outputs.values()) {
      ctx.save();

      const [offsetX, offsetY] = this.getOutputOffset(output);
      ctx.translate(offsetX, offsetY);
      output.draw(ctx, editor);

      ctx.restore();
    }

    ctx.restore();
  }
}
