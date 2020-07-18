import * as m3 from './utils/m3';
import { Preview, ShaderPropDefinition, ShaderInstance } from './types';

const WORKFLOW_SIZE = 512;

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

function setupBox(gl: WebGLRenderingContext, x = 0, y = 0): void {
    const halfSize = Math.floor(WORKFLOW_SIZE / 2);
    const dx = x * WORKFLOW_SIZE;
    const dy = y * WORKFLOW_SIZE;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -halfSize + dx, -halfSize + dy,
        -halfSize + dx, halfSize + dy,
        halfSize + dx, -halfSize + dy,
        -halfSize + dx, halfSize + dy,
        halfSize + dx, halfSize + dy,
        halfSize + dx, -halfSize + dy
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

function setShaderUniforms(gl: WebGLRenderingContext, shader: ShaderInstance): void {
    const { program, definition, props } = shader;

    for (const [name, def] of Object.entries(definition.props)) {
        const value = props[name];
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
}

function getProjectionMatrix(preview: Preview): m3.M3 {
    const { canvas, props } = preview;

    let matrix = m3.projection(canvas.clientWidth, canvas.clientHeight);
    matrix = m3.translate(matrix, props.position[0], props.position[1]);
    matrix = m3.scale(matrix, props.zoom, props.zoom);

    return matrix;
}

export function createPreview(canvas: HTMLCanvasElement, props?: Partial<Preview['props']>): Preview {
    const gl = canvas.getContext('webgl2')!;

    resizeCanvas(canvas);

    const { clientWidth, clientHeight } = canvas;
    const x = clientWidth / 2;
    const y = clientHeight / 2;

    return {
        canvas,
        gl,
        shader: null,
        props: {
            shader: null,
            tiling: false,
            position: [x, y],
            zoom: 1,
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
        
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const textCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
        gl.enableVertexAttribArray(textCoordAttributeLocation);
        gl.vertexAttribPointer(textCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
        gl.useProgram(program);
        gl.bindVertexArray(vao);

        const matrix = getProjectionMatrix(preview);
        gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
        setupTextureCoord(gl);

        setShaderUniforms(gl, shader);

        const min = props.tiling ? -1 : 0;
        const max = props.tiling ? 1 : 0;

        for (let x = min; x <= max; x++) {
            for (let y = min; y <= max; y++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                setupBox(gl, x, y);
        
                const offset = 0;
                const count = 6;
                gl.drawArrays(gl.TRIANGLES, offset, count);
            }
        }
    }
}