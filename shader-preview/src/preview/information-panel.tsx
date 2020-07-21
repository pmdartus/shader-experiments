import React from 'react';

import { Flex, View, Heading, Divider } from '@adobe/react-spectrum';

export function InformationPanel(props: {
    position: [number, number];
    size: [number, number];
    color: [number, number, number, number];
  }) {
    const { position, size, color } = props;
  
    const info = {
      rgb: {
        r: `R: ${color[0]}`,
        g: `G: ${color[1]}`,
        b: `B: ${color[2]}`,
        a: `A: ${color[3]}`,
      },
      hsv: {
        h: `H: ${color[0]}`,
        s: `S: ${color[1]}`,
        v: `V: ${color[2]}`,
      },
      position: {
        x: `X: ${position[0]} / ${(position[0] / size[0]).toFixed(2)}`,
        y: `X: ${position[1]} / ${(position[1] / size[1]).toFixed(2)}`,
      },
    };
  
    const informationSection = Object.entries(info).map(([name, col]) => (
      <Flex key={name} direction="column">
        {Object.entries(col).map(([name, row]) => (
          <View key={name}>{row}</View>
        ))}
      </Flex>
    ));
  
    return (
      <div>
        <Heading>Information</Heading>
        <Flex direction="row" gap="size-200">
          <View
            width="size-200"
            height="size-200"
            UNSAFE_style={{
              backgroundColor: `rgba(${color.join(", ")})`,
            }}
          />
  
          <Divider orientation="vertical" />
  
          <Flex direction="row" gap="size-200">
            {informationSection}
          </Flex>
        </Flex>
      </div>
    );
  }
  