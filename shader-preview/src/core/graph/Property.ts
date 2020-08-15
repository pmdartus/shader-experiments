import { Vec2 } from "../types";

import GraphNode from "./GraphNode";

export enum PropertyType {
  bool = "bool",
  int = "int",
  float = "float",
  float2 = "float2",
  float3 = "float3",
}

export type Property =
  | BoolProperty
  | IntProperty
  | FloatProperty
  | Float2Property
  | Float3Property;

interface AbstractPropertyConfig<T> {
  name: string;
  label: string;
  node: GraphNode;
  value: T;
}

function isFloat(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

abstract class AbstractProperty<T> {
  readonly name: string;
  readonly label: string;
  readonly node: GraphNode;

  abstract readonly type: PropertyType;

  value: T;

  constructor({ name, label, node, value }: AbstractPropertyConfig<T>) {
    this.name = name;
    this.label = label;
    this.node = node;
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  setValue(value: T) {
    if (this.isValidValue(value) === false) {
      throw new TypeError(
        `Unexpected value for property ${this.name}. Expected "${
          this.type
        }" but received ${JSON.stringify(value)}`
      );
    }

    this.value = value;
    this.node.markDirty();
  }

  abstract isValidValue(value: unknown): boolean;
}

export class BoolProperty extends AbstractProperty<boolean> {
  type = PropertyType.bool;

  isValidValue(value: unknown): boolean {
    return typeof value === "boolean";
  }
}

export class IntProperty extends AbstractProperty<number> {
  type = PropertyType.int;

  min: number;
  max: number;
  step: number;

  constructor({
    min,
    max,
    step,
    ...rest
  }: { min: number; max: number; step: number } & AbstractPropertyConfig<
    number
  >) {
    super(rest);

    this.min = min;
    this.max = max;
    this.step = step;
  }

  isValidValue(value: unknown): boolean {
    return Number.isInteger(value);
  }
}

export class FloatProperty extends AbstractProperty<number> {
  type = PropertyType.float;

  min: number;
  max: number;
  step: number;

  constructor({
    min,
    max,
    step,
    ...rest
  }: { min: number; max: number; step: number } & AbstractPropertyConfig<
    number
  >) {
    super(rest);

    this.min = min;
    this.max = max;
    this.step = step;
  }

  isValidValue(value: unknown): boolean {
    return isFloat(value);
  }
}

export class Float2Property extends AbstractProperty<Vec2> {
  type = PropertyType.float2;

  isValidValue(value: unknown): boolean {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      isFloat(value[0]) &&
      isFloat(value[1])
    );
  }
}

export class Float3Property extends AbstractProperty<[number, number, number]> {
  type = PropertyType.float3;

  isValidValue(value: unknown): boolean {
    return (
      Array.isArray(value) &&
      value.length === 3 &&
      isFloat(value[0]) &&
      isFloat(value[1]) &&
      isFloat(value[2])
    );
  }
}
