import { uuid } from "../../utils/uuid";

import { Vec2 } from "../types";
import GraphEditor from "../GraphEditor";

import Graph from "./Graph";
import Input from "./Input";
import Output from "./Output";
import Property from "./Property";
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

  createInput<T>(config: { name: string; type: string }): Input<T> {
    const input = new Input<T>(config);
    this.addInput(input);
    return input;
  }

  createOutput<T>(config: { name: string; type: string; value: T }): Output<T> {
    const output = new Output<T>(config);
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

  getNodeHeight(): number {
    const { inputs, outputs } = this;

    return Math.max(
      NODE_MIN_HEIGHT,
      inputs.size * SOCKET_HEIGHT,
      outputs.size * SOCKET_HEIGHT
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

    const inputArray = [...inputs.values()];
    const inputVerticalOffset =
      height / 2 - (SOCKET_HEIGHT * inputArray.length) / 2 + SOCKET_HEIGHT / 2;

    for (let i = 0; i < inputArray.length; i++) {
      ctx.save();

      ctx.translate(0, inputVerticalOffset + i * SOCKET_HEIGHT);
      inputArray[i].draw(ctx, editor);

      ctx.restore();
    }

    const outputArray = [...outputs.values()];
    const outputVerticalOffset =
      height / 2 - (SOCKET_HEIGHT * outputArray.length) / 2 + SOCKET_HEIGHT / 2;

    for (let i = 0; i < outputArray.length; i++) {
      ctx.save();

      ctx.translate(NODE_WIDTH, outputVerticalOffset + i * SOCKET_HEIGHT);
      outputArray[i].draw(ctx, editor);
      ctx.translate(0, SOCKET_HEIGHT);

      ctx.restore();
    }

    ctx.restore();
  }
}
