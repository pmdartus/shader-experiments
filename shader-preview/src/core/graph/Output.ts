import GraphEditor from "../GraphEditor";

import Connection from "./Connection";
import Input from "./Input";

const SOCKET_RADIUS = 6;
const SOCKET_LINE_WIDTH = 6;
const SOCKET_STROKE_STYLE = "#1e1e1e";
const SOCKET_FILL_STYLE = "#c8c8c8";

export default class Output<T = unknown> {
  readonly name: string;
  readonly type: string;
  private value: T;
  private connections: Connection[] = [];

  constructor({ name, type, value }: { name: string; type: string; value: T }) {
    this.name = name;
    this.type = type;
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }

  setValue(value: T) {
    this.value = value;
  }

  getConnections(): readonly Connection[] {
    return this.connections;
  }

  connectTo(input: Input): Connection {
    let connection = this.connections.find(
      (connection) => connection.to === input
    );

    if (connection === undefined) {
      connection = new Connection({ from: this, to: input });
      this.connections.push(connection);
    }

    return connection;
  }

  removeConnection(connection: Connection) {
    const connectionIndex = this.connections.indexOf(connection);
    if (connectionIndex === -1) {
      return;
    }

    this.connections.splice(connectionIndex, 1);
    connection.to.removeConnection();
  }

  removeConnections() {
    for (const connection of this.connections) {
      this.removeConnection(connection);
    }
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {
    ctx.beginPath();
    ctx.arc(0, 0, SOCKET_RADIUS, 0, 2 * Math.PI);

    ctx.lineWidth = SOCKET_LINE_WIDTH;
    ctx.strokeStyle = SOCKET_STROKE_STYLE;
    ctx.stroke();

    ctx.fillStyle = SOCKET_FILL_STYLE;
    ctx.fill();
  }
}
