export default class Property<T = unknown> {
  readonly name: string;
  readonly type: string;
  private value: T;

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
}
