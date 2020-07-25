import * as m3 from "../utils/m3";
import { ColorRgba } from "../utils/color";
import { createShader, createProgram } from "../webgl/shader";

import { DISPLAY_CHANNELS } from "./constants";
import { ColorChannel } from "./types";

export interface PreviewRenderer {
  canvas: HTMLCanvasElement;
  update(config: {
    imageData: ImageData;
    matrix: m3.M3;
    channels: ColorChannel;
    tiling: boolean;
  }): void;
}

const VERTEX_SHADER_SRC = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform mat3 u_matrix;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es

precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_image;
uniform mat3 u_channelsFilter;
uniform bool u_tiling;

out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord) * mat4(u_channelsFilter);
}
`;

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
  const { clientWidth, clientHeight } = canvas;

  if (clientWidth !== canvas.width || clientHeight !== canvas.height) {
    canvas.width = clientWidth;
    canvas.height = clientHeight;
  }
}

function setRectangle(
  gl: WebGL2RenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    // prettier-ignore
    new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2,
    ]),
    gl.STATIC_DRAW
  );
}

export function getPreviewRenderer(canvas: HTMLCanvasElement): PreviewRenderer {
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error(`Can't access webgl2 context`);
  }

  // Setup shader
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SRC
  );
  const program = createProgram(gl, vertexShader, fragmentShader);

  // Get attribute locations.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

  // Get uniform locations.
  const imageUniformLocation = gl.getUniformLocation(program, "u_image");
  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
  const tilingUniformLocation = gl.getUniformLocation(program, "u_tiling");
  const channelsFilerLocation = gl.getUniformLocation(
    program,
    "u_channelsFilter"
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

  // Setup image texture.
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 0);

  return {
    canvas,
    update(config) {
      const { imageData, matrix, channels, tiling } = config;
      const channelFiler = DISPLAY_CHANNELS[channels].filter;

      // Resize the display size and update tell WebGL how to convert pixels to clip size.
      resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Clear canvas.
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Tell WebGL which program to use.
      gl.useProgram(program);

      // Set texture
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imageData
      );

      // Set uniforms
      gl.uniform1i(imageUniformLocation, 0);
      gl.uniform1i(tilingUniformLocation, tiling ? 1 : 0);
      gl.uniformMatrix3fv(channelsFilerLocation, false, channelFiler);
      gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);

      // Set position attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      setRectangle(gl, 0, 0, imageData.width, imageData.height);

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
    },
  };
}
