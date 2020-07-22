import * as m3 from "../utils/m3";
import { createShader, createProgram } from "../webgl/shader";

import { DISPLAY_CHANNELS } from "./constants";
import { ColorChannel } from "./types";

// prettier-ignore
const POSITION_VERTEX = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1
]);

const VERTEX_SHADER_SRC = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform mat3 u_matrix;

out vec2 v_texCoord;

// all shaders have a main function
void main() {
  gl_Position = vec4(a_position, 0, 1);

  v_texCoord =  (u_matrix * vec3(a_texCoord, 1)).xy;
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
  vec2 pos = v_texCoord;

  if (!u_tiling && any(greaterThan(abs(pos), vec2(1.0)))) {
    discard;
  }

  outColor = texture(u_image, pos) * mat4(u_channelsFilter);
}
`;

export function drawPreview(
  canvas: HTMLCanvasElement,
  config: {
    imageData: ImageData;
    projectionMatrix: m3.M3;
    options: {
      channels: ColorChannel;
      tiling: boolean;
    };
  }
): void {
  const {
    imageData,
    projectionMatrix,
    options: { channels, tiling },
  } = config;
  const { clientWidth, clientHeight } = canvas;

  if (clientWidth !== canvas.width || clientHeight !== canvas.height) {
    canvas.width = clientWidth;
    canvas.height = clientHeight;
  }

  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error(`Can't access webgl2 context`);
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SRC
  );
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texCoordAtributeLocation = gl.getAttribLocation(program, "a_texCoord");

  const imageUniformLocation = gl.getUniformLocation(program, "u_image");
  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

  const channelsFilerLocation = gl.getUniformLocation(
    program,
    "u_channelsFilter"
  );
  const tilingUniformLocation = gl.getUniformLocation(program, "u_tiling");

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const textCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
  // prettier-ignore
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0, 
        1, 0, 
        0, 1, 
        0, 1, 
        1, 0, 
        1, 1
      ]),
      gl.STATIC_DRAW
    );

  gl.enableVertexAttribArray(texCoordAtributeLocation);
  gl.vertexAttribPointer(texCoordAtributeLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 0);
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

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  gl.bindVertexArray(vao);

  gl.uniform1i(imageUniformLocation, 0);
  gl.uniformMatrix3fv(
    channelsFilerLocation,
    false,
    DISPLAY_CHANNELS[channels].filter
  );
  gl.uniform1i(tilingUniformLocation, tiling ? 1 : 0);
  gl.uniformMatrix3fv(matrixUniformLocation, false, projectionMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, POSITION_VERTEX, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
