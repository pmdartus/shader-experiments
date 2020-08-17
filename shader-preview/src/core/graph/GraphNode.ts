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
  private readonly inputs: Input[] = [];
  private readonly outputs: Output[] = [];
  private readonly properties: Property[] = [];

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
    const inputConnections = this.inputs
      .flatMap((input) => input.getConnection())
      .filter((connection) => connection !== null) as Connection[];

    const outputConnections = this.outputs.flatMap((output) =>
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

    if (this.getInput(name)) {
      throw new Error(`Input with name "${name}" already exists.`);
    }

    this.inputs.push(input);
  }

  getInput(name: string): Input | undefined {
    return this.inputs.find((i) => i.name === name);
  }

  getInputs(): readonly Input[] {
    return this.inputs;
  }

  getInputOffset(input: Input): Vec2 {
    const { height, inputs } = this;

    const inputsArray = [...inputs.values()];
    const inputIndex = inputsArray.indexOf(input);

    if (inputIndex === -1) {
      throw new Error(`Invalid output parameter.`);
    }

    const outputVerticalOffset =
      height / 2 - (SOCKET_HEIGHT * inputsArray.length) / 2 + SOCKET_HEIGHT / 2;

    return [0, outputVerticalOffset + inputIndex * SOCKET_HEIGHT];
  }

  removeInput(name: string) {
    const input = this.getInput(name);
    if (input === undefined) {
      throw new Error(`Can't find input with name "${name}".`);
    }

    input.removeConnection();

    const { inputs } = this;
    inputs.splice(inputs.indexOf(input), 1);
  }

  addOutput(output: Output) {
    const { name } = output;

    if (this.getOutput(name)) {
      throw new Error(`Output with name "${name}" already exists.`);
    }

    this.outputs.push(output);
  }

  getOutput(name: string): Output | undefined {
    return this.outputs.find((o) => o.name === name);
  }

  getOutputs(): readonly Output[] {
    return this.outputs;
  }

  getOutputOffset(output: Output): Vec2 {
    const { width, height, outputs } = this;

    const outputIndex = outputs.indexOf(output);

    if (outputIndex === -1) {
      throw new Error(`Invalid output parameter.`);
    }

    const outputVerticalOffset =
      height / 2 - (SOCKET_HEIGHT * outputs.length) / 2 + SOCKET_HEIGHT / 2;

    return [width, outputVerticalOffset + outputIndex * SOCKET_HEIGHT];
  }

  removeOutput(name: string) {
    const output = this.getOutput(name);
    if (output === undefined) {
      throw new Error(`Can't find output with name "${name}".`);
    }

    output.removeConnections();

    const { outputs } = this;
    outputs.splice(outputs.indexOf(output), 1);
  }

  addProperty(property: Property) {
    const { name } = property;

    if (this.getProperty(name)) {
      throw new Error(`Property with name "${name}" already exists.`);
    }

    this.properties.push(property);
  }

  getProperty(name: string): Property | undefined {
    return this.properties.find((p) => p.name === name);
  }

  removeProperty(name: string) {
    const property = this.getProperty(name);
    if (property === undefined) {
      throw new Error(`Can't find property with name "${name}".`);
    }

    const { properties } = this;
    properties.splice(properties.indexOf(property), 1);
  }

  handleClick(evt: MouseEvent) {
    evt.preventDefault();
    console.log("TODO: Handle click");
  }

  handleDoubleClick(evt: MouseEvent) {
    evt.preventDefault();
    console.log("TODO: Double click");
  }

  handleDrag(evt: MouseEvent) {
    evt.preventDefault();

    const {
      graph: { zoom },
      position,
    } = this;
    const { movementX, movementY } = evt;

    this.position = [
      position[0] + movementX / zoom,
      position[1] + movementY / zoom,
    ];
  }

  markDirty() {
    console.info("TODO: Handle dirty");
  }

  get width(): number {
    return NODE_WIDTH;
  }

  get height(): number {
    const { inputs, outputs } = this;

    return Math.max(
      NODE_MIN_HEIGHT,
      inputs.length * SOCKET_HEIGHT,
      outputs.length * SOCKET_HEIGHT
    );
  }

  isUnder(target: Vec2): boolean {
    const { position, width, height } = this;

    return (
      target[0] >= position[0] &&
      target[0] < position[0] + width &&
      target[1] >= position[1] &&
      target[1] < position[1] + height
    );
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    const { position, width, height, title, inputs, outputs } = this;
    const { selection } = editor;

    ctx.save();

    ctx.translate(position[0], position[1]);

    ctx.lineWidth = NODE_BORDER_WIDTH;
    ctx.strokeStyle = selection.has(this)
      ? NODE_STROKE_STYLE_SELECTED
      : NODE_STROKE_STYLE;
    ctx.strokeRect(0, 0, width, height);

    ctx.fillStyle = NODE_FILL_STYLE;
    ctx.fillRect(0, 0, width, width);

    ctx.fillStyle = TILE_FILL_STYLE;
    ctx.fillRect(0, 0, width, TITLE_HEIGHT);

    ctx.font = TITLE_FONT;
    ctx.fillStyle = FONT_FILL_STYLE;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, TITLE_HEIGHT / 2, width);

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
