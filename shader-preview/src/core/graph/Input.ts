import GraphEditor from "../GraphEditor";

import Connection from "./Connection";

export default class Input<T = unknown> {
  readonly type: string;
  readonly name: string;
  private connection: Connection | null = null;

  constructor({ name, type }: { name: string; type: string }) {
    this.name = name;
    this.type = type;
  }

  getValue(): T {
    return this.connection?.from.getValue() as T;
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  removeConnection() {
    const { connection } = this;

    if (connection === null) {
      return;
    }

    this.connection = null;
    connection.from.removeConnection(connection);
  }

  draw(ctx: CanvasRenderingContext2D, editor: GraphEditor) {}
}
