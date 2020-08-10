import React, { useRef } from "react";

import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  View,
} from "@adobe/react-spectrum";

import * as definitions from "../../webgl/shaders";
import { WorkerProxy } from "../../webgl/woker-proxy";

const WORKFLOW_SIZE = 512;

export default function NodeEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAddShader = (name: keyof typeof definitions) => {
    const worker = new WorkerProxy();

    const definition = definitions[name];

    worker
      .compileShader({
        name: definition.name,
        src: definition.shader,
        uniforms: Object.keys(definition.properties).map((prop) => `u_${prop}`),
      })
      .then((res) => {
        return worker.runShader({
          id: res.id,
          size: WORKFLOW_SIZE,
          uniforms: {
            u_tiling: {
              type: "integer",
              value: 2,
            },
          },
        });
      })
      .then((res) => {
        const imageData = new ImageData(
          new Uint8ClampedArray(res.result),
          WORKFLOW_SIZE
        );

        const canvas = canvasRef.current!;
        canvas.width = WORKFLOW_SIZE;
        canvas.height = WORKFLOW_SIZE;

        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(imageData, 0, 0);
      });
  };

  return (
    <View>
      <MenuTrigger>
        <ActionButton>Add shader</ActionButton>
        <Menu
          onAction={(key) => handleAddShader(key as keyof typeof definitions)}
        >
          {Object.entries(definitions).map(([name, shader]) => (
            <Item key={name}>{shader.label}</Item>
          ))}
        </Menu>
      </MenuTrigger>

      <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: "100%" }} />
    </View>
  );
}
