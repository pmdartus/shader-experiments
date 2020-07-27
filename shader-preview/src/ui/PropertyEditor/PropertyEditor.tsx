import React from "react";
import { Flex, Checkbox } from "@adobe/react-spectrum";

interface BaseProperty<T extends string, V> {
  type: T;
  name: string;
  label: string;
  value: V;
}

type BooleanProperty = BaseProperty<"boolean", boolean>;
type Float2Property = BaseProperty<"float2", [number, number]>;

interface IntegerProperty extends BaseProperty<"integer", number> {
  min: number;
  max: number;
  step: number;
}

export type Property = BooleanProperty | IntegerProperty | Float2Property;

function PropertyEditor(props: { properties: Property[] }) {
  const { properties } = props;

  return (
    <Flex direction="column">
      {properties.map((property) => {
        return <Checkbox key={property.name} />;
      })}
    </Flex>
  );
}

export default PropertyEditor;
