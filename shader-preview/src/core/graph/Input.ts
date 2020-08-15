import { Vec2 } from "../types";

import IO from "./IO";
import Connection from "./Connection";

export default class Input extends IO {
  private connection: Connection | null = null;

  getValue(): unknown {
    return this.connection?.from.getValue();
  }

  getPosition(): Vec2 {
    const { node } = this;

    const position = node.getPosition();
    const offset = node.getInputOffset(this);

    return [position[0] + offset[0], position[1] + offset[1]];
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
}
