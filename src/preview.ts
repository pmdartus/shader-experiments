import * as m3 from './utils/m3';
import { Preview, ShaderPropDefinition } from './types';

function resizeCanvas(canvas: HTMLCanvasElement): void {
    const { clientWidth, clientHeight, width, height } = canvas;

    const pixelRatio = window.devicePixelRatio;
    const actualClientWidth = Math.floor(clientWidth * pixelRatio);
    const actualClientHeight = Math.floor(clientHeight * pixelRatio);

    if (actualClientWidth !== width || actualClientHeight !== height) {
        canvas.width = actualClientWidth;
        canvas.height = actualClientHeight;
    }
}

function setupSquare(gl: WebGLRenderingContext): void {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0 
    ]), gl.STATIC_DRAW);
}

function setupTextureCoord(gl: WebGLRenderingContext): void {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0
    ]), gl.STATIC_DRAW);
}

export function createPreview(canvas: HTMLCanvasElement, props?: Partial<Preview['props']>): Preview {
    const gl = canvas.getContext('webgl2')!;

    resizeCanvas(canvas);

    return {
        canvas,
        gl,
        shader: null,
        props: {
            shader: null,
            tiling: false,
            position: [0.7, 0.5],
            zoom: 800,
            ...props,
        }
    }
}

export function renderPreview(preview: Preview): void {
    const { gl, canvas, shader, props } = preview;

    resizeCanvas(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (shader !== null) {
        const { program } = shader;

        const positionAttributeLocation = gl.getAttribLocation(
            program,
            'a_position',
        );
        const textCoordAttributeLocation = gl.getAttribLocation(
            program,
            'a_textcoord',
        );
        const matrixUniformLocation = gl.getUniformLocation(
            program, 
            'u_matrix'
        );
    
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        setupSquare(gl);
 
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const textCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
        setupTextureCoord(gl);
    
        gl.enableVertexAttribArray(textCoordAttributeLocation);
        gl.vertexAttribPointer(textCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
        gl.useProgram(program);
        gl.bindVertexArray(vao);

        let matrix = m3.projection(canvas.clientWidth, canvas.clientHeight);
        matrix = m3.translate(matrix, props.position[0], props.position[1]);
        matrix = m3.scale(matrix, props.zoom, props.zoom);

        gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);
    
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
    
        const offset = 0;
        const count = 6;
        gl.drawArrays(gl.TRIANGLES, offset, count);
    }
}