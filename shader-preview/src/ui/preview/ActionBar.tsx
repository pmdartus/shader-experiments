import React from "react";

import {
  MenuTrigger,
  Menu,
  Item,
  ActionButton,
  TextField,
  Flex,
} from "@adobe/react-spectrum";
import InfoIcon from "@spectrum-icons/workflow/Info";
import TilingIcon from "@spectrum-icons/workflow/ClassicGridView";
import FullScreenIcon from "@spectrum-icons/workflow/FullScreen";
import FullScreenExitIcon from "@spectrum-icons/workflow/FullScreenExit";
import LayersIcon from "@spectrum-icons/workflow/Layers";

import { ColorChannels } from "../../core/Preview2D";

const ZOOM_STEP = 0.2;
const COLOR_CHANNEL_LABELS = [
  {
    name: ColorChannels.RGB,
    label: "RGB",
  },
  {
    name: ColorChannels.R,
    label: "Red",
  },
  {
    name: ColorChannels.G,
    label: "Green",
  },
  {
    name: ColorChannels.B,
    label: "Blue",
  },
];

function ColorChannelPicker(props: {
  value: ColorChannels;
  onChange: (value: ColorChannels) => void;
}) {
  const { value, onChange } = props;

  const selectedKeys = [value];

  const handleSelectionChange = (selection: string | Set<string | number>) => {
    if (typeof selection === "string") {
      return;
    }

    const selected = Array.from(selection)[0];
    onChange(selected as ColorChannels);
  };

  return (
    <MenuTrigger>
      <ActionButton aria-label="Select color channel">
        <LayersIcon />
      </ActionButton>

      <Menu
        items={COLOR_CHANNEL_LABELS}
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
      >
        {(item) => <Item key={item.name}>{item.label}</Item>}
      </Menu>
    </MenuTrigger>
  );
}

function ZoomControl(props: {
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

function SelectableActionButton(props: {
  isSelected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <ActionButton
      {...props}
      UNSAFE_className={props.isSelected ? "is-selected" : ""}
    >
      {props.children}
    </ActionButton>
  );
}

export function ActionBar(props: {
  channels: ColorChannels;
  tiling: boolean;
  infoVisible: boolean;
  zoom: number;

  onChannelsChange: (channels: ColorChannels) => void;
  onTilingChange: (tiling: boolean) => void;
  onInfoVisibleChange: (infoVisible: boolean) => void;
  onZoomChange: (zoom: number) => void;
  fitToPreview: () => void;
  fitToContent: () => void;
}) {
  const {
    channels,
    tiling,
    infoVisible,
    zoom,

    onChannelsChange,
    onTilingChange,
    onInfoVisibleChange,
    onZoomChange,
    fitToPreview,
    fitToContent,
  } = props;

  return (
    <Flex direction="row" justifyContent="space-between" gap="size-200">
      <Flex wrap="nowrap">
        <ColorChannelPicker value={channels} onChange={onChannelsChange} />

        <SelectableActionButton
          isSelected={tiling}
          onPress={() => onTilingChange(!tiling)}
        >
          <TilingIcon />
        </SelectableActionButton>

        <SelectableActionButton
          isSelected={infoVisible}
          onPress={() => onInfoVisibleChange(!infoVisible)}
        >
          <InfoIcon />
        </SelectableActionButton>
      </Flex>

      <Flex wrap="nowrap">
        <ActionButton aria-label="Fit to preview" onPress={fitToPreview}>
          <FullScreenIcon />
        </ActionButton>

        <ActionButton aria-label="Fit to content" onPress={fitToContent}>
          <FullScreenExitIcon />
        </ActionButton>

        <ZoomControl value={zoom} onChange={onZoomChange} />
      </Flex>
    </Flex>
  );
}
