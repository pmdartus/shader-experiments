import { createShader, createProgram } from "./shader";
import {
  ShaderInfo,
  CompilerShaderRequest,
  CompilerShaderResponse,
  RunShaderRequest,
  RunShaderResponse,
} from "./types";

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

const DEFAULT_WORKFLOW_SIZE = 1024;
const VERTEX_SHADER = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoord = a_texCoord;
}`;

const canvas = new OffscreenCanvas(
  DEFAULT_WORKFLOW_SIZE,
  DEFAULT_WORKFLOW_SIZE
);
const gl = canvas.getContext("webgl2")!;

let nextShaderId = 0;
const shaders: Map<string, ShaderInfo> = new Map();

async function compilerShader(
  msg: CompilerShaderRequest
): Promise<{ data: CompilerShaderResponse }> {
  const { name, src, uniforms: uniformNames } = msg;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, src);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create vertex array.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Setup position attribute buffer.
  const positionBuffer = gl.createBuffer()!;
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Setup texture coordinate attribute buffer.
  const texCoordBuffer = gl.createBuffer()!;
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const id = `shader_${name}_${nextShaderId++}`;

  const buffers = {
    position: positionBuffer,
    texCoord: texCoordBuffer,
  };

  const uniforms = new Map(
    uniformNames.map((uniformName) => {
      return [uniformName, gl.getUniformLocation(program, uniformName)!];
    })
  );

  shaders.set(id, {
    name,
    program,
    buffers,
    uniforms,
  });

  return {
    data: {
      id,
    },
  };
}

async function runShader(
  msg: RunShaderRequest
): Promise<{ data: RunShaderResponse; transferable: Transferable[] }> {
  const { id, size, uniforms } = msg;

  const shaderInfo = shaders.get(id);
  if (shaderInfo === undefined) {
    throw new Error(`Unknown shader ${id}`);
  }

  // Clear canvas.
  gl.viewport(0, 0, size, size);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell WebGL which program to use.
  gl.useProgram(shaderInfo.program);

  // Set uniforms
  for (const [uniformName, uniformConfig] of Object.entries(uniforms)) {
    const uniformLocation = shaderInfo.uniforms.get(uniformName);

    if (uniformLocation === undefined) {
      throw new Error(`Unknown uniform "${uniformName}" in "${id}".`);
    }

    switch (uniformConfig.type) {
      case "boolean":
        gl.uniform1i(uniformLocation, uniformConfig.value ? 1 : 0);
        break;

      case "integer":
        gl.uniform1i(uniformLocation, uniformConfig.value);
        break;

      case "float":
        gl.uniform1f(uniformLocation, uniformConfig.value);
        break;

      default:
        throw new Error(`Unknown uniform type "${uniformName}" in "${id}".`);
    }
  }

  // Set position attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, shaderInfo.buffers.position);
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
  gl.bindBuffer(gl.ARRAY_BUFFER, shaderInfo.buffers.texCoord);
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

  // Retrieve pixels values
  const pixelArray = new Uint8ClampedArray(Math.pow(size, 2) * 4);
  gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixelArray);

  // Convert ArrayBufferView to plain ArrayBuffer to make it transferable.
  const buffer = pixelArray.buffer;
  return {
    data: {
      result: buffer,
    },
    transferable: [buffer],
  };
}

function handleMessage(handlers: {
  [key: string]: (
    data: any
  ) => Promise<{ data: any; transferable?: Transferable[] }>;
}) {
  return async (msg: MessageEvent) => {
    const { id, type } = msg.data;

    if (!Object.hasOwnProperty.call(handlers, type)) {
      ctx.postMessage({
        id,
        err: `Unknown handler for "${type}"`,
      });
    }

    const handler = handlers[type];

    try {
      const res = await handler(msg.data.data);
      ctx.postMessage(
        {
          id,
          res: res.data,
        },
        res.transferable || []
      );
    } catch (err) {
      ctx.postMessage({
        id,
        err,
      });
    }
  };
}

ctx.addEventListener(
  "message",
  handleMessage({
    "compile-shader": compilerShader,
    "run-shader": runShader,
  })
);
