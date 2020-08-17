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

    canvas.addEventListener("click", (evt) => {
      const target = this.getTarget(evt);

      if (target) {
        target.handleClick(evt);
      } else {
        this.selection = new Set();
      }

      this.markDirty();
    });

    canvas.addEventListener("dblclick", (evt) => {
      const target = this.getTarget(evt);

      if (target) {
        target.handleDoubleClick(evt);
      }

      this.markDirty();
    });

    canvas.addEventListener("mousedown", (evt) => {
      const target = this.getTarget(evt);
      const mouseButton = getMouseButton(evt);

      // Handle graph dragging.
      if (mouseButton === MouseButton.Middle) {
        const handleMouseMove = (evt: MouseEvent) => {
          this.graph.handleDrag(evt);
          this.markDirty();
        };

        const handleMouseUp = (evt: MouseEvent) => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);

          this.graph.handleDrag(evt);
          this.markDirty();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        this.graph.handleDrag(evt);
        this.markDirty();

        return;
      }

      // Handle node dragging.
      if (mouseButton === MouseButton.Left && target !== undefined) {
        if (!this.selection.has(target)) {
          this.selection = new Set([target]);
        }

        const handleSelectionDrag = (evt: MouseEvent) => {
          for (const node of this.selection) {
            node.handleDrag(evt);
          }
        };

        const handleMouseMove = (evt: MouseEvent) => {
          handleSelectionDrag(evt);
          this.markDirty();
        };

        const handleMouseUp = (evt: MouseEvent) => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);

          handleSelectionDrag(evt);
          this.markDirty();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        handleSelectionDrag(evt);
        this.markDirty();

        return;
      }
    });

    canvas.addEventListener("wheel", (evt) => {
      this.graph.handleWheel(evt);
      this.markDirty();
    });
  }

  private getTarget(evt: MouseEvent): GraphNode | undefined {
    const { graph } = this;
    const { nodes } = graph;

    const position = this.graph.getScenePosition([evt.offsetX, evt.offsetY]);

    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      if (node.isUnder(position)) {
        return node;
      }
    }
  }

  // private handleGraphSelect(evt: MouseEvent) {
  //   const initialPosition = this.getScenePosition([evt.offsetX, evt.offsetY]);

  //   const nodeUnderMouse = [...this.graph.nodes]
  //     .reverse()
  //     .find((node) => node.isUnder(initialPosition));

  //   this.state = EditorState.Selecting;
  //   this.selection = new Set();
  //   this.selectionRect = null;

  //   if (nodeUnderMouse !== undefined) {
  //     this.selection.add(nodeUnderMouse);
  //   }

  //   const handleMouseMove = (evt: MouseEvent) => {
  //     const [xInitial, yInitial] = initialPosition;
  //     const [xCurrent, yCurrent] = this.getScenePosition([
  //       evt.offsetX,
  //       evt.offsetY,
  //     ]);

  //     this.selectionRect = [
  //       xInitial,
  //       yInitial,
  //       xCurrent - xInitial,
  //       yCurrent - yInitial,
  //     ];

  //     this.selection = new Set();
  //     for (const node of this.graph.nodes) {
  //       const { width: nodeWidth, height: nodeHeight } = node;
  //       const nodePosition = node.getPosition();

  //       if (
  //         !(
  //           xInitial >= nodePosition[0] + nodeWidth ||
  //           nodePosition[0] >= xCurrent ||
  //           yInitial >= nodePosition[1] + nodeHeight ||
  //           nodePosition[1] >= yCurrent
  //         )
  //       ) {
  //         this.selection.add(node);
  //       }
  //     }

  //     this.markDirty();
  //   };

  //   const handleMouseUp = (evt: MouseEvent) => {
  //     this.state = EditorState.Idle;
  //     this.selectionRect = null;

  //     this.markDirty();

  //     window.removeEventListener("mousemove", handleMouseMove);
  //     window.removeEventListener("mouseup", handleMouseUp);
  //   };

  //   this.markDirty();

  //   window.addEventListener("mousemove", handleMouseMove);
  //   window.addEventListener("mouseup", handleMouseUp);
  // }

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
    const { ctx, canvas, graph, selectionRect } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(50, 50, 50)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (selectionRect !== null) {
      ctx.fillStyle = SELECTION_RECT_FILL_STYLE;
      ctx.fillRect(...selectionRect);
    }

    graph.draw(ctx, this);
  }
}
