import Input from "./Input";
import Output from "./Output";
import GraphEditor from "../GraphEditor";

const CONNECTION_LINE_WIDTH = 4;
const CONNECTION_STROKE_STYLE = "#505050";
const CONNECTION_SELECTED_STROKE_STYLE = "#c8c8c8";

export default class Connection {
  readonly from: Output;
  readonly to: Input;

  constructor({ from, to }: { from: Output; to: Input }) {
    this.from = from;
    this.to = to;
  }

  removeConnection() {
    this.from.removeConnection(this);
    this.to.removeConnection();
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    const { from, to } = this;

    const fromPosition = from.getPosition();
    const toPosition = to.getPosition();
    const isSelected =
      editor.selection.has(from.node) || editor.selection.has(to.node);

    const deltaX = toPosition[0] - fromPosition[0];

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(fromPosition[0], fromPosition[1]);
    ctx.bezierCurveTo(
      fromPosition[0] + deltaX * 0.5,
      fromPosition[1],
      toPosition[0] - deltaX * 0.5,
      toPosition[1],
      toPosition[0],
      toPosition[1]
    );

    ctx.lineWidth = CONNECTION_LINE_WIDTH;
    ctx.strokeStyle = isSelected
      ? CONNECTION_SELECTED_STROKE_STYLE
      : CONNECTION_STROKE_STYLE;
    ctx.stroke();

    ctx.restore();
  }
}
