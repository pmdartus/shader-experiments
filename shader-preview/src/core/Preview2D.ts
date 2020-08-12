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
  private transformedImage: OffscreenCanvas | null = null;
  private offset: [number, number] = [0, 0];
  private zoom: number = 1;
  private tiling: boolean = false;
  private colorChannels: ColorChannels = ColorChannels.R;

  private isDirty: boolean = false;
  private isDragging: boolean = false;
  private isHovering: boolean = false;
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
    this.observeCanvasResize();
    this.addEventHandlers();
    this.markDirty();
  }

  setImage(image: ImageData | null) {
    this.image = image;

    this.fitToPreview();
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
    const { image, canvas, zoom } = this;
    let offset: [number, number] = [0, 0];

    if (image !== null) {
      const { width: imageWidth, height: imageHeight } = image;
      const { width: canvasWidth, height: canvasHeight } = canvas;

      offset = [
        canvasWidth / zoom / 2 - imageWidth / 2,
        canvasHeight / zoom / 2 - imageHeight / 2,
      ];
    }

    this.setOffset(offset);
    this.setZoom(1);
  }

  fitToContent() {
    const { image, canvas } = this;
    let offset: [number, number] = [0, 0];
    let zoom = 1;

    if (image !== null) {
      const { width: imageWidth, height: imageHeight } = image;
      const { width: canvasWidth, height: canvasHeight } = canvas;

      zoom = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
      offset = [
        canvasWidth / zoom / 2 - imageWidth / 2,
        canvasHeight / zoom / 2 - imageHeight / 2,
      ];
    }

    this.setOffset(offset);
    this.setZoom(zoom);
  }

  private updateTransformedImage() {
    const { ctx, image, colorChannels } = this;
    let transformedImage: OffscreenCanvas | null = null;

    if (image !== null) {
      let transformed: ImageData;

      if (colorChannels === ColorChannels.RGB) {
        transformed = image;
      } else {
        transformed = ctx.createImageData(image);

        for (let i = 0; i < image.data.length; i += 4) {
          let value: number;
          if (colorChannels === ColorChannels.R) {
            value = image.data[i];
          } else if (colorChannels === ColorChannels.G) {
            value = image.data[i + 1];
          } else {
            value = image.data[i + 2];
          }

          transformed.data[i] = value;
          transformed.data[i + 1] = value;
          transformed.data[i + 2] = value;
          transformed.data[i + 3] = image.data[i + 3];
        }
      }

      transformedImage = new OffscreenCanvas(
        transformed.width,
        transformed.height
      );
      const canvasCtx = transformedImage.getContext("2d")!;
      canvasCtx.putImageData(transformed, 0, 0);
    }

    this.transformedImage = transformedImage;
  }

  private setIsHovering(isHovering: boolean) {
    if (isHovering !== this.isHovering) {
      this.isHovering = isHovering;
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

  private observeCanvasResize() {
    const resizeObserver = new ResizeObserver(() => {
      const { canvas, offset } = this;

      const originalCenter = this.getPreviewPosition([
        canvas.width / 2,
        canvas.height / 2,
      ]);

      this.resizeCanvas();

      const updatedCenter = this.getPreviewPosition([
        canvas.width / 2,
        canvas.height / 2,
      ]);

      // Readjust the offset by keeping the center point of the preview at the center after the
      // resize.
      this.setOffset([
        offset[0] + (updatedCenter[0] - originalCenter[0]),
        offset[1] + (updatedCenter[1] - originalCenter[1]),
      ]);

      // Directly invoke draw instead of markDirty to avoid running into flickering issue after the
      // width and the height of the canvas has been adjusted.
      this.draw();
    });

    resizeObserver.observe(this.canvas);
  }

  private addEventHandlers() {
    const { canvas } = this;

    canvas.addEventListener("wheel", (evt: WheelEvent) =>
      this.handleMouseWheel(evt)
    );
    canvas.addEventListener("mousedown", (evt: MouseEvent) =>
      this.handleMouseDown(evt)
    );
    canvas.addEventListener("mousemove", (evt: MouseEvent) =>
      this.handleMouseMove(evt)
    );
    canvas.addEventListener("mouseenter", () => this.handleMouseEnter());
    canvas.addEventListener("mouseout", () => this.handleMouseOut());
  }

  private handleMouseWheel(evt: WheelEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    const { offset } = this;
    const { offsetX, offsetY } = evt;

    const originalMousePosition = this.getPreviewPosition([offsetX, offsetY]);

    // https://stackoverflow.com/a/57899935
    // Make zoom change proportionate to the current zoom level.
    const updatedZoom = this.zoom * Math.pow(2, evt.deltaY * -0.01);
    this.setZoom(updatedZoom);

    const updatedMousePosition = this.getPreviewPosition([offsetX, offsetY]);

    this.setOffset([
      offset[0] + (updatedMousePosition[0] - originalMousePosition[0]),
      offset[1] + (updatedMousePosition[1] - originalMousePosition[1]),
    ]);
  }

  private handleMouseMove(evt: MouseEvent) {
    const { offsetX, offsetY } = evt;
    const { isDragging } = this;

    if (isDragging) {
      return;
    }

    const previewPosition = this.getPreviewPosition([offsetX, offsetY]);
    this.handlers.mouseMoved(previewPosition);
  }

  private handleMouseEnter() {
    this.setIsHovering(true);
  }

  private handleMouseOut() {
    this.setIsHovering(false);
  }

  private handleMouseDown(evt: MouseEvent) {
    this.isDragging = true;

    const handleWindowMouseMove = (evt: MouseEvent) => {
      const {
        zoom,
        offset: [x, y],
      } = this;
      const { movementX, movementY } = evt;

      this.setOffset([x + movementX / zoom, y + movementY / zoom]);
    };

    const handleWindowMouseUp = (evt: MouseEvent) => {
      this.isDragging = false;

      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);

      this.markDirty();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  private getPreviewPosition(
    canvasPosition: [number, number]
  ): [number, number] {
    const { zoom, offset } = this;

    return [
      Math.floor(canvasPosition[0] / zoom - offset[0]),
      Math.floor(canvasPosition[1] / zoom - offset[1]),
    ];
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
      offset,
      zoom,
      tiling,
      isDragging,
      isHovering,
      transformedImage: image,
    } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(50, 50, 50)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (image === null) {
      return;
    }

    ctx.scale(zoom, zoom);
    ctx.translate(offset[0], offset[1]);

    if (tiling === true) {
      // TODO: Avoid rendering a fixed amount of tiles and prefer only rendering the number of tiles
      // needed for the viewport.
      for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
          ctx.drawImage(image, i * image.width, j * image.height);
        }
      }

      if (isDragging === false && isHovering === true) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, image.width, image.height);
      }
    } else {
      ctx.drawImage(image, 0, 0);
    }
  }
}
