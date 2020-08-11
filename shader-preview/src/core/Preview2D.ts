export enum ColorChannels {
  RGB,
  R,
  G,
  B,
}

interface PreviewHandlers {
  mouseMoved: (position: [number, number]) => void;
  zoomChanged: (zoom: number) => void;
}

export default class Preview2D {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private image: ImageData | null = null;
  private pattern: CanvasPattern | null = null;
  private offset: [number, number] = [0, 0];
  private zoom: number = 1;
  private tiling: boolean = false;
  private colorChannels: ColorChannels = ColorChannels.R;

  private isDirty: boolean = false;
  private isDragging: boolean = false;
  private isHoveringImage: boolean = false;
  private handlers: PreviewHandlers = {
    mouseMoved: () => {},
    zoomChanged: () => {},
  };

  constructor(canvas: HTMLCanvasElement, handlers: Partial<PreviewHandlers>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.handlers = {
      ...this.handlers,
      ...handlers,
    };

    this.resizeCanvas();
    this.addEventHandlers();
    this.markDirty();
  }

  setImage(image: ImageData | null) {
    this.image = image;

    this.updateTransformedImage();
    this.markDirty();
  }

  setColorChannels(colorChannels: ColorChannels) {
    if (colorChannels !== this.colorChannels) {
      this.colorChannels = colorChannels;
      this.updateTransformedImage();
      this.markDirty();
    }
  }

  setZoom(zoom: number) {
    if (zoom !== this.zoom) {
      this.zoom = zoom;
      this.handlers.zoomChanged(zoom);
      this.markDirty();
    }
  }

  setTiling(tiling: boolean) {
    if (tiling !== this.tiling) {
      this.tiling = tiling;
      this.markDirty();
    }
  }

  fitToPreview() {
    this.setOffset([0, 0]);
    this.setZoom(1);
  }

  fitToContent() {
    const { image, canvas } = this;
    let zoom = 1;

    if (image !== null) {
      const { width: imageWidth, height: imageHeight } = image;
      const { width: canvasWidth, height: canvasHeight } = canvas;

      zoom = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
    }

    this.setOffset([0, 0]);
    this.setZoom(zoom);
  }

  private updateTransformedImage() {
    const { ctx, image, colorChannels } = this;
    let pattern: CanvasPattern | null = null;

    if (image !== null) {
      let transformedImage: ImageData;

      if (colorChannels === ColorChannels.RGB) {
        transformedImage = image;
      } else {
        transformedImage = ctx.createImageData(image);

        for (let i = 0; i < image.data.length; i += 4) {
          let value: number;
          if (colorChannels === ColorChannels.R) {
            value = image.data[i];
          } else if (colorChannels === ColorChannels.G) {
            value = image.data[i + 1];
          } else {
            value = image.data[i + 2];
          }

          transformedImage.data[i] = value;
          transformedImage.data[i + 1] = value;
          transformedImage.data[i + 2] = value;
          transformedImage.data[i + 3] = image.data[i + 3];
        }
      }

      const canvasPattern = new OffscreenCanvas(
        transformedImage.width,
        transformedImage.height
      );
      const patternCtx = canvasPattern.getContext("2d")!;
      patternCtx.putImageData(transformedImage, 0, 0);

      pattern = ctx.createPattern(canvasPattern, "repeat")!;
    }

    this.pattern = pattern;
  }

  private setIsHoveringImage(isHoveringImage: boolean) {
    if (isHoveringImage !== this.isHoveringImage) {
      this.isHoveringImage = isHoveringImage;
      this.markDirty();
    }
  }

  private setOffset(offset: [number, number]) {
    if (this.offset[0] !== offset[0] || this.offset[1] !== offset[1]) {
      this.offset = offset;
      this.markDirty();
    }
  }

  private resizeCanvas() {
    const { canvas } = this;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }

  private addEventHandlers() {
    const { canvas } = this;

    canvas.addEventListener("wheel", (evt: WheelEvent) =>
      this.handleMouseWheel(evt)
    );
    canvas.addEventListener("mousemove", (evt: MouseEvent) =>
      this.handleMouseMove(evt)
    );
    canvas.addEventListener("mouseout", (evt: MouseEvent) =>
      this.handleMouseOut()
    );
    canvas.addEventListener("mousedown", (evt: MouseEvent) =>
      this.handleMouseDown(evt)
    );
  }

  private handleMouseWheel(evt: WheelEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    // https://stackoverflow.com/a/57899935
    // Make zoom change proportionate to the current zoom level.
    this.setZoom(this.zoom * Math.pow(2, evt.deltaY * -0.01));
  }

  private handleMouseMove(evt: MouseEvent) {
    const { image, offset, zoom } = this;
    const { offsetX, offsetY } = evt;

    if (image === null) {
      return;
    }

    const isHoveringImage =
      offsetX >= 0 &&
      offsetX < image.width &&
      offsetY >= 0 &&
      offsetY < image.height;
    this.setIsHoveringImage(isHoveringImage);
  }

  private handleMouseOut() {
    this.setIsHoveringImage(false);
  }

  private handleMouseDown(evt: MouseEvent) {
    this.isDragging = true;

    const handleWindowMouseMove = (evt: MouseEvent) => {
      const [x, y] = this.offset;
      const { movementX, movementY } = evt;

      this.setOffset([x + movementX, y + movementY]);
    };

    const handleWindowMouseUp = (evt: MouseEvent) => {
      this.isDragging = false;

      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  private markDirty() {
    if (this.isDirty === true) {
      return;
    }

    this.isDirty = true;
    requestAnimationFrame(() => {
      this.isDirty = false;
      this.draw();
    });
  }

  private draw() {
    const {
      canvas,
      ctx,
      image,
      pattern,
      offset,
      zoom,
      tiling,
      isDragging,
      isHoveringImage,
    } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(50, 50, 50)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (image === null || pattern === null) {
      return;
    }

    ctx.translate(canvas.width / 2 + offset[0], canvas.height / 2 + offset[1]);
    ctx.scale(zoom, zoom);

    // const matrix = new DOMMatrix();
    // pattern.setTransform(matrix);
    ctx.fillStyle = pattern;

    if (tiling) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillRect(
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height
      );
    }

    if (isHoveringImage === true && isDragging === false) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height
      );
    }
  }
}
