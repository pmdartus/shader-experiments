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
