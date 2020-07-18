import { ShaderDefinition, ShaderInstance, Preview } from './types';

const VERTEX_SHADER = `#version 300 es
 
in vec2 a_position;
uniform mat3 u_matrix;

in vec2 a_textcoord;
out vec2 v_textcoord;
 
void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

    v_textcoord = a_textcoord;
}`;

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

export function instantiateShader(preview: Preview, definition: ShaderDefinition): ShaderInstance {
    const { gl } = preview;

    const props = Object.fromEntries(
        Object.entries(definition.props).map(([name, config]) => [
            name,
            config.default,
        ]),
    );

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        definition.source,
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    return {
        definition,
        preview,
        program,
        props,
    };
}