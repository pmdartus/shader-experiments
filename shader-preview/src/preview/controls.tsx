import React from "react";

import {
  MenuTrigger,
  Menu,
  Item,
  ActionButton,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import LayersIcon from "@spectrum-icons/workflow/Layers";

import { ColorChannel, DISPLAY_CHANNELS, ZOOM_STEP } from "./shared";

export function ColorChannelPicker(props: {
  value: ColorChannel;
  onChange: (value: ColorChannel) => void;
}) {
  const { value, onChange } = props;

  const selectedKeys = [value];
  const items = Object.entries(DISPLAY_CHANNELS).map(([name, value]) => {
    return { name, ...value };
  });

  const handleSelectionChange = (selection: string | Set<string | number>) => {
    if (typeof selection === "string") {
      return;
    }

    const selected = Array.from(selection)[0];
    onChange(selected as ColorChannel);
  };

  return (
    <MenuTrigger>
      <ActionButton aria-label="Select color channel">
        <LayersIcon />
        <Text>Channels</Text>
      </ActionButton>

      <Menu
        items={items}
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
      >
        {(item) => <Item key={item.name}>{item.label}</Item>}
      </Menu>
    </MenuTrigger>
  );
}

export function ZoomControl(props: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { value, onChange } = props;

  const handleZoomDecreaseClick = () => {
    onChange(value / (1 + ZOOM_STEP));
  };

  const handleZoomIncreaseClick = () => {
    onChange(value * (1 + ZOOM_STEP));
  };

  const handleZoomValueChange = (newValue: string) => {
    if (!newValue.match(/\d+\.\d?/)) {
      return;
    }

    onChange(parseFloat(newValue) / 100);
  };

  return (
    <>
      <ActionButton
        aria-label="Decrease zoom"
        isQuiet
        onPress={handleZoomDecreaseClick}
      >
        -
      </ActionButton>
      <TextField
        aria-label="Zoom factor"
        value={(value * 100).toFixed(2)}
        onChange={handleZoomValueChange}
      />
      <ActionButton
        aria-label="Increase zoom"
        isQuiet
        onPress={handleZoomIncreaseClick}
      >
        +
      </ActionButton>
    </>
  );
}

export function SelectableActionButton(props: {
  isSelected: boolean,
  onPress: () => void,
  children: React.ReactNode
}) {
  return (
    <ActionButton
      {...props}
      UNSAFE_className={props.isSelected ? "is-selected" : ""}
    >
      {props.children}
    </ActionButton>
  )
}
