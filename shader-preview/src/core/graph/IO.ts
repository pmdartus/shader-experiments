import GraphEditor from "../GraphEditor";

export enum IOType {
  GrayScale = "GrayScale",
  Color = "Image",
  ImageOrColor = "ImageOrGrayScale",
}

export interface IOConfig {
  name: string;
  type: IOType;
}

const IO_RADIUS = 6;
const IO_LINE_WIDTH = 6;
const IO_STROKE_STYLE = "#1e1e1e";
const IO_GRAY_SCALE_FILL_STYLE = "#c8c8c8";
const IO_COLOR_FILL_STYLE = "#da7b10";

export default abstract class IO {
  readonly name: string;
  readonly type: IOType;

  constructor({ name, type }: IOConfig) {
    this.name = name;
    this.type = type;
  }

  abstract getValue(): unknown | null;

  protected isCompatible(io: IO): boolean {
    return this.type === io.type;
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    const { type } = this;

    ctx.beginPath();
    ctx.arc(0, 0, IO_RADIUS, 0, 2 * Math.PI);
    ctx.closePath();

    ctx.lineWidth = IO_LINE_WIDTH;
    ctx.strokeStyle = IO_STROKE_STYLE;
    ctx.stroke();

    switch (type) {
      case IOType.GrayScale:
      case IOType.Color: {
        ctx.beginPath();
        ctx.arc(0, 0, IO_RADIUS, 0, 2 * Math.PI);
        ctx.closePath();

        ctx.fillStyle =
          type === IOType.GrayScale
            ? IO_GRAY_SCALE_FILL_STYLE
            : IO_COLOR_FILL_STYLE;
        ctx.fill();
        break;
      }

      case IOType.ImageOrColor: {
        ctx.beginPath();
        ctx.arc(0, 0, IO_RADIUS, 0, Math.PI);
        ctx.closePath();

        ctx.fillStyle = IO_GRAY_SCALE_FILL_STYLE;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, IO_RADIUS, Math.PI, 2 * Math.PI);
        ctx.closePath();

        ctx.fillStyle = IO_COLOR_FILL_STYLE;
        ctx.fill();
        break;
      }
    }
  }
}
