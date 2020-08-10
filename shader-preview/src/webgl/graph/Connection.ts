import Input from "./Input";
import Output from "./Output";

export default class Connection {
  readonly from: Output;
  readonly to: Input;

  constructor({ from, to }: { from: Output; to: Input }) {
    this.from = from;
    this.to = to;
  }

  removeConnection() {
    this.from.removeConnection(this);
    this.to.removeConnection();
  }
}
