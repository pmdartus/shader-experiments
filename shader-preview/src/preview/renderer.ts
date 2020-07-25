import * as m3 from "../utils/m3";
import { createShader, createProgram } from "../webgl/shader";

import { DISPLAY_CHANNELS } from "./constants";
import { ColorChannel } from "./types";

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

interface PreviewConfig {
  imageData: ImageData | null;
  matrix: m3.M3;
  tiling: boolean;
  channels: ColorChannel;
}

export class PreviewRenderer {
  canvas: HTMLCanvasElement;

  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly buffers: Record<string, WebGLBuffer>;
  readonly uniforms: Record<string, WebGLUniformLocation>;
  readonly textures: Record<string, WebGLTexture>;

  config: PreviewConfig = {
    imageData: null,
    matrix: m3.identity(),
    tiling: false,
    channels: ColorChannel.RGB,
  };

  isDrawScheduled = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = (this.gl = canvas.getContext("webgl2")!);

    // Setup shader
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER_SRC
    );
    const program = (this.program = createProgram(
      gl,
      vertexShader,
      fragmentShader
    ));

    // Get attribute locations.
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    const texCoordAttributeLocation = gl.getAttribLocation(
      program,
      "a_texCoord"
    );

    // Get uniform locations.
    const imageUniformLocation = gl.getUniformLocation(program, "u_image");
    const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
    const tilingUniformLocation = gl.getUniformLocation(program, "u_tiling");
    const channelsFilerLocation = gl.getUniformLocation(
      program,
      "u_channelsFilter"
    );

    this.uniforms = {
      image: imageUniformLocation!,
      matrix: matrixUniformLocation!,
      tiling: tilingUniformLocation!,
      channelsFilter: channelsFilerLocation!,
    };

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

    this.buffers = {
      position: positionBuffer!,
      texCoord: textCoordBuffer!,
    };

    // Setup image texture.
    const imageTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);

    this.textures = {
      image: imageTexture!,
    };

    this.scheduleDraw();
  }

  setConfig(config: PreviewConfig) {
    this.config = config;
    this.scheduleDraw();
  }

  private scheduleDraw() {
    if (this.isDrawScheduled === false) {
      this.isDrawScheduled = true;

      requestAnimationFrame(() => {
        this.isDrawScheduled = false;
        this.draw();
      });
    }
  }

  draw() {
    const { canvas, gl, config } = this;
    const channelFiler = DISPLAY_CHANNELS[config.channels].filter;

    // Resize the display size and update tell WebGL how to convert pixels to clip size.
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear canvas.
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Early exit if imageData is not set
    if (config.imageData === null) {
      return;
    }

    // Tell WebGL which program to use.
    gl.useProgram(this.program);

    // Set texture
    gl.bindTexture(gl.TEXTURE_2D, this.textures.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      config.imageData
    );

    // Set uniforms
    gl.uniform1i(this.uniforms.image, 0);
    gl.uniform1i(this.uniforms.tiling, config.tiling ? 1 : 0);
    gl.uniformMatrix3fv(this.uniforms.channelsFilter, false, channelFiler);
    gl.uniformMatrix3fv(this.uniforms.matrix, false, config.matrix);

    // Set position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    setRectangle(gl, 0, 0, config.imageData.width, config.imageData.height);

    // Set texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoord);
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
  }
}
