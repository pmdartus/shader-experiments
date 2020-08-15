import { Vec2 } from "../types";

import IO from "./IO";
import Input from "./Input";
import Connection from "./Connection";

export default class Output extends IO {
  private value: unknown | null = null;
  private connections: Connection[] = [];

  getValue(): unknown | null {
    return this.value;
  }

  setValue(value: unknown) {
    this.value = value;
  }

  getPosition(): Vec2 {
    const { node } = this;

    const position = node.getPosition();
    const offset = node.getOutputOffset(this);

    return [position[0] + offset[0], position[1] + offset[1]];
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
}
