import { ShaderDefinition, ShaderInstance, ShaderPropDefinition } from './types';

const VERTEX_COUNT = 6;
const VERTEX_POSITION = [
    -1, -1, 
    -1, 1,
    1, -1, 
    -1, 1, 
    1, 1,
    1, -1, 
];
const TEXTURE_COORDINATES = [
    0, 0,
    0, 1,
    1, 0,
    0, 1,
    1, 1,
    1, 0
];

const VERTEX_SHADER = `#version 300 es
 
in vec4 a_position;
in vec2 a_textcoord;

out vec2 v_textcoord;
 
void main() {
  gl_Position = a_position;
  v_textcoord = a_textcoord;
}`;

function getWebGLContext(): WebGL2RenderingContext {
    const canvas = document.querySelector('canvas')!;
    return canvas.getContext('webgl2')!;
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        const err = new Error(`Failed to compile shader ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        
        throw err;
    }

    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram()!;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        const err = new Error(`Failed to link shaders ${gl.getProgramInfoLog(program)}`);
        gl.deleteProgram(program);

        throw err;
    }

    return program;
}

export function instantiateShader(definition: ShaderDefinition): ShaderInstance {
    const props = Object.fromEntries(
        Object.entries(definition.props).map(([name, config]) => [
            name,
            config.default,
        ]),
    );

    const gl = getWebGLContext();

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        definition.source,
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    return {
        definition,
        props,
        gl,
        program,
    };
}

export function renderShaderInstance(shader: ShaderInstance): void {
    const { gl, program } = shader;

    const positionAttributeLocation = gl.getAttribLocation(
        program,
        'a_position',
    );

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(VERTEX_POSITION),
        gl.STATIC_DRAW,
    );

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const textCoordAttributeLocation = gl.getAttribLocation(
        program,
        'a_textcoord',
    );

    const textCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(TEXTURE_COORDINATES),
        gl.STATIC_DRAW,
    );

    gl.enableVertexAttribArray(textCoordAttributeLocation);
    gl.vertexAttribPointer(textCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    for (const [name, def] of Object.entries(shader.definition.props)) {
        const value = shader.props[name];
        const uniformLocation = gl.getUniformLocation(program, `u_${name}`);

        switch (def.type) {
            case 'int':
                gl.uniform1i(uniformLocation, value);
                break;

            case 'float':
                gl.uniform1f(uniformLocation, value);
                break;
            
            case 'float2':
                gl.uniform2f(uniformLocation, value[0], value[1]);
                break

            default:
                console.log(`Unknown prop type "${(def as ShaderPropDefinition).type}"`);
                break;
        }
    }

    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
}
