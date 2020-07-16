/**
 * A shader definition
 *
 * @typedef {Object} ShaderDefinition
 * @property {string} name - The shader unique name
 * @property {string} label - The shader label
 * @property {Object} props - The shader property definition
 * @property {string} source - The WebGL fragment shader source
 */

/**
 * An instantance of a ShaderDefinition
 *
 * @typedef {Object} ShaderInstance
 * @property {ShaderDefinition} definition - The shader definition
 * @property {Object} props - The instance properties
 * @property {WebGLProgram} program - The WebGL program resulting of the shader instanciation
 * @property {WebGL2RenderingContext} gl - The WebGL rendering context associated with the program
 */

const VERTEX_POSITION = [-1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1];

const VERTEX_SHADER = `#version 300 es
 
in vec4 a_position;
 
void main() {
  gl_Position = a_position;
}`;

/**
 * Returns the page rendering context.
 *
 * @returns {WebGL2RenderingContext}
 */
function getWebGLContext() {
  const canvas = document.getElementById("canvas");
  return canvas.getContext("webgl2");
}

/**
 * Create a new WebGL shader.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error("Failed to compile shader", gl.getShaderInfoLog(shader));

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create a new WebGL shader program
 *
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 */
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const sucess = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!sucess) {
    console.error("Failed to link shaders", gl.getProgramInfoLog(program));

    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * Instanciate a shader from its definition
 *
 * @param {ShaderDefinition} definition
 * @returns {ShaderInstance}
 */
export function instanciateShader(definition) {
  const props = Object.fromEntries(
    Object.entries(definition.props).map(([name, config]) => [
      name,
      config.default,
    ])
  );

  const gl = getWebGLContext();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, definition.source);
  const program = createProgram(gl, vertexShader, fragmentShader);

  return {
    definition,
    props,
    gl,
    program,
  };
}

/**
 * Render the shader instance.
 *
 * @param {ShaderInstance} shader
 */
export function renderShader(shader) {
  const { gl, program } = shader;

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(VERTEX_POSITION),
    gl.STATIC_DRAW
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  for (const [name, def] of Object.entries(shader.definition.props)) {
    const value = shader.props[name];
    const uniformLocation = gl.getUniformLocation(program, `u_${name}`);

    switch (def.type) {
      case 'int':
        gl.uniform1i(uniformLocation, value);
        break;
    
      default:
        console.log(`Unknown prop type "${def.type}"`);
        break;
    }
  }

  gl.drawArrays(gl.TRIANGLES, 0, VERTEX_SHADER.length / 2);
}
