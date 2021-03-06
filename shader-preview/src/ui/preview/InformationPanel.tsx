import React from "react";

import { Flex, View, Heading, Divider } from "@adobe/react-spectrum";

import { ColorRgba, rgbaToHex, rgbaToHsl } from "../../utils/color";

const UNIT8_MAX = 255;
const BLACK_COLOR: ColorRgba = [0, 0, 0, 0];

function getPixelAt(imageData: ImageData, [x, y]: [number, number]): ColorRgba {
  const { data, width, height } = imageData;
  const offset = y * (width * 4) + x * 4;

  return x >= 0 && x < width && y >= 0 && y < height
    ? [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]
    : BLACK_COLOR;
}

function getPixelData(position: [number, number], imageData: ImageData | null) {
  const rgba = imageData ? getPixelAt(imageData, position) : BLACK_COLOR;
  const hsl = rgbaToHsl(rgba);
  const hex = rgbaToHex(rgba);

  return {
    color: rgba,
    info: {
      rgb: {
        r: `R: ${rgba[0]} / ${(rgba[0] / UNIT8_MAX).toFixed(3)}`,
        g: `G: ${rgba[1]} / ${(rgba[1] / UNIT8_MAX).toFixed(3)}`,
        b: `B: ${rgba[2]} / ${(rgba[2] / UNIT8_MAX).toFixed(3)}`,
        a: `A: ${rgba[3]} / ${(rgba[3] / UNIT8_MAX).toFixed(3)}`,
      },
      hsv: {
        h: `H: ${Math.floor(hsl[0])} / ${(hsl[0] / 360).toFixed(3)}`,
        s: `S: ${Math.floor(hsl[1])} / ${(hsl[1] / 100).toFixed(3)}`,
        l: `L: ${Math.floor(hsl[2])} / ${(hsl[2] / 100).toFixed(3)}`,
        hex: `Hex: ${hex}`,
      },
      position: {
        x: imageData
          ? `X: ${position[0]} / ${(position[0] / imageData.width).toFixed(2)}`
          : `X: 0 / 0`,
        y: imageData
          ? `Y: ${position[1]} / ${(position[1] / imageData.height).toFixed(2)}`
          : `Y: 0 / 0`,
      },
    },
  };
}

export function InformationPanel(props: {
  position: [number, number];
  imageData: ImageData | null;
}) {
  const { position, imageData } = props;
  const { color, info } = getPixelData(position, imageData);

  return (
    <>
      <Heading margin="size-0" marginBottom="size-100">
        Information
      </Heading>

      <Flex direction="row" gap="size-100">
        <View
          width="size-200"
          height="size-200"
          UNSAFE_style={{
            backgroundColor: `rgba(${color.join(", ")})`,
          }}
        />

        <Divider orientation="vertical" />

        <Flex
          direction="row"
          gap="size-200"
          flex="1"
          justifyContent="space-between"
        >
          {Object.entries(info).map(([name, col]) => (
            <Flex key={name} direction="column">
              {Object.entries(col).map(([name, row]) => (
                <View key={name}>{row}</View>
              ))}
            </Flex>
          ))}
        </Flex>
      </Flex>
    </>
  );
}
