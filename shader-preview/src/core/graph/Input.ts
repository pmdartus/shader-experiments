import IO from "./IO";
import Connection from "./Connection";

export default class Input extends IO {
  private connection: Connection | null = null;

  getValue(): unknown {
    return this.connection?.from.getValue();
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
