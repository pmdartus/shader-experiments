import { Graph, GraphNode } from "./graph";

enum EditorState {
  Idle,
  Dragging,
  Selecting,
}

enum MouseButton {
  Left,
  Middle,
  Right,
}

const SELECTION_RECT_FILL_STYLE = "#3b3b3b";

function getMouseButton(evt: MouseEvent): MouseButton {
  switch (evt.button) {
    case 0:
      return MouseButton.Left;

    case 1:
      return MouseButton.Middle;

    case 2:
      return MouseButton.Right;

    default:
      return MouseButton.Left;
  }
}

export default class GraphEditor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  graph: Graph;

  state: EditorState = EditorState.Idle;
  selection: Set<GraphNode> = new Set();
  selectionRect: [number, number, number, number] | null = null;

  position: [number, number] = [0, 0];
  zoom: number = 1;
  isDirty: boolean = false;

  constructor(canvas: HTMLCanvasElement, graph: Graph) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.graph = graph;

    this.resizeCanvas();
    this.addListeners();
    this.draw();
  }

  private resizeCanvas() {
    const { canvas } = this;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }

  private addListeners() {
    const { graph, canvas } = this;

    graph.addEventListener("nodecreated", (evt) => {
      // TODO: Do better job with event handlers.
      this.selection = new Set([(evt as CustomEvent).detail]);
      this.draw();
    });

    canvas.addEventListener("mousemove", (evt) =>
      this.handleCanvasMouseMove(evt)
    );
    canvas.addEventListener("mousedown", (evt) =>
      this.handleCanvasMouseDown(evt)
    );
    canvas.addEventListener("wheel", (evt) => this.handleCanvasWheel(evt));
  }

  private handleCanvasMouseDown(evt: MouseEvent) {
    const mouseButton = getMouseButton(evt);

    if (mouseButton === MouseButton.Left) {
      this.handleLeftMouseDown(evt);
    } else if (mouseButton === MouseButton.Middle) {
      this.handleGraphDrag(evt);
    }
  }

  private handleLeftMouseDown(evt: MouseEvent) {
    const { graph, selection } = this;

    const initialPosition = this.getScenePosition([evt.offsetX, evt.offsetY]);

    const nodeUnderMouse = [...graph.nodes]
      .reverse()
      .find((node) => node.isUnder(initialPosition));

    if (nodeUnderMouse && selection.has(nodeUnderMouse)) {
      this.handleNodeDrag(evt);
    } else {
      this.handleGraphSelect(evt);
    }
  }

  private handleNodeDrag(evt: MouseEvent) {
    const updatePosition = (evt: MouseEvent) => {
      const delta = this.getScenePosition([evt.movementX, evt.movementY]);

      for (const node of this.selection) {
        const position = node.getPosition();
        node.setPosition([position[0] + delta[0], position[1] + delta[1]]);
      }

      this.markDirty();
    };

    const handleMouseMove = (evt: MouseEvent) => {
      updatePosition(evt);
    };

    const handleMouseUp = (evt: MouseEvent) => {
      updatePosition(evt);

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    updatePosition(evt);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  private handleGraphSelect(evt: MouseEvent) {
    const initialPosition = this.getScenePosition([evt.offsetX, evt.offsetY]);

    const nodeUnderMouse = [...this.graph.nodes]
      .reverse()
      .find((node) => node.isUnder(initialPosition));

    this.state = EditorState.Selecting;
    this.selection = new Set();
    this.selectionRect = null;

    if (nodeUnderMouse !== undefined) {
      this.selection.add(nodeUnderMouse);
    }

    const handleMouseMove = (evt: MouseEvent) => {
      const [xInitial, yInitial] = initialPosition;
      const [xCurrent, yCurrent] = this.getScenePosition([
        evt.offsetX,
        evt.offsetY,
      ]);

      this.selectionRect = [
        xInitial,
        yInitial,
        xCurrent - xInitial,
        yCurrent - yInitial,
      ];

      this.selection = new Set();
      for (const node of this.graph.nodes) {
        const { width: nodeWidth, height: nodeHeight } = node;
        const nodePosition = node.getPosition();

        if (
          !(
            xInitial >= nodePosition[0] + nodeWidth ||
            nodePosition[0] >= xCurrent ||
            yInitial >= nodePosition[1] + nodeHeight ||
            nodePosition[1] >= yCurrent
          )
        ) {
          this.selection.add(node);
        }
      }

      this.markDirty();
    };

    const handleMouseUp = (evt: MouseEvent) => {
      this.state = EditorState.Idle;
      this.selectionRect = null;

      this.markDirty();

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    this.markDirty();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  private handleGraphDrag(evt: MouseEvent) {
    this.state = EditorState.Dragging;

    const updatePosition = (evt: MouseEvent) => {
      const { position, zoom } = this;
      const { movementX, movementY } = evt;

      this.position = [
        position[0] + movementX / zoom,
        position[1] + movementY / zoom,
      ];

      this.markDirty();
    };

    const handleMouseMove = (evt: MouseEvent) => {
      updatePosition(evt);
    };

    const handleMouseUp = (evt: MouseEvent) => {
      this.state = EditorState.Idle;

      updatePosition(evt);

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    updatePosition(evt);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  private handleCanvasWheel(evt: WheelEvent) {
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

    this.markDirty();
  }

  private getScenePosition(viewPosition: [number, number]): [number, number] {
    const { position, zoom } = this;

    return [
      viewPosition[0] / zoom - position[0],
      viewPosition[1] / zoom - position[1],
    ];
  }

  private handleCanvasMouseMove(evt: MouseEvent) {
    const position = this.getScenePosition([evt.offsetX, evt.offsetY]);
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
    const { ctx, canvas, position, zoom, graph, selectionRect } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(50, 50, 50)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(zoom, zoom);
    ctx.translate(position[0], position[1]);

    if (selectionRect !== null) {
      ctx.fillStyle = SELECTION_RECT_FILL_STYLE;
      ctx.fillRect(...selectionRect);
    }

    graph.draw(ctx, this);
  }
}
