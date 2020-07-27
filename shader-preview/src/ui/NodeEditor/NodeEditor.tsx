import React, { useRef } from "react";

import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  View,
} from "@adobe/react-spectrum";

import * as definitions from "../../webgl/shaders";
import { createShader, createProgram } from "../../webgl/shader";
import { GraphNodeDefinition } from "../../webgl/types";

const WORKFLOW_SIZE = 512;
const VERTEX_SHADER = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoord = a_texCoord;
}`;

let cachedGlContext: WebGL2RenderingContext | null = null;

function getGlContext(): WebGL2RenderingContext {
  if (cachedGlContext === null) {
    const canvas = new OffscreenCanvas(WORKFLOW_SIZE, WORKFLOW_SIZE);
    cachedGlContext = canvas.getContext("webgl2")!;
  }

  return cachedGlContext;
}

function renderShader(definition: GraphNodeDefinition): Uint8ClampedArray {
  const gl = getGlContext();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    definition.shader
  );
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

  const uniforms: { [name: string]: WebGLUniformLocation } = Object.fromEntries(
    Object.keys(definition.properties).map((prop) => {
      const uniformName = `u_${prop}`;
      return [prop, gl.getUniformLocation(program, uniformName)!];
    })
  );

  // Create vertex array.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Setup position attribute buffer.
  const positionBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Setup texture coordinate attribute buffer.
  const textCoordBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // TODO: Is this really needed for OffScreenCanvas ?
  gl.viewport(0, 0, WORKFLOW_SIZE, WORKFLOW_SIZE);

  // Clear canvas.
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell WebGL which program to use.
  gl.useProgram(program);

  // Set position attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // prettier-ignore
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0,  -1.0,
      1.0,  -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
      1.0,  -1.0,
      1.0,  1.0,
    ]),
    gl.STATIC_DRAW
  );

  // Set texture coordinate attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
  // prettier-ignore
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
    ]),
    gl.STATIC_DRAW
  );

  // Draw the screen
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Get pixels
  const arr = new Uint8ClampedArray(Math.pow(WORKFLOW_SIZE, 2) * 4);
  gl.readPixels(
    0,
    0,
    WORKFLOW_SIZE,
    WORKFLOW_SIZE,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    arr
  );

  return arr;
}

export default function NodeEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAddShader = (name: keyof typeof definitions) => {
    const arr = renderShader(definitions[name]);
    const image = new ImageData(arr, WORKFLOW_SIZE, WORKFLOW_SIZE);

    const canvas = canvasRef.current!;
    canvas.width = WORKFLOW_SIZE;
    canvas.height = WORKFLOW_SIZE;

    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(image, 0, 0);
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
