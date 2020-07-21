import React, { useRef, useState, useEffect } from 'react';

import { createShader, createProgram } from './webgl/shader';
import './Preview.css';

enum ColorChannel {
    RGB = 'RGB',
    R = 'R',
    G = 'G',
    B = 'B',
}

const ZOOM_STEP = 0.2;

const DISPLAY_CHANNELS: Record<
    ColorChannel,
    { label: string; filter: number[] }
> = {
    RGB: {
        label: 'RBG',
        // prettier-ignore
        filter: [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]
    },
    R: {
        label: 'Red',
        // prettier-ignore
        filter: [
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
    ]
    },
    G: {
        label: 'Green',
        // prettier-ignore
        filter: [
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ]
    },
    B: {
        label: 'Blue',
        // prettier-ignore
        filter: [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1
    ]
    },
};

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

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec2 a_texCoord;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// Used to pass the texture coordinates to the fragment shader
out vec2 v_texCoord;

// all shaders have a main function
void main() {
  gl_Position = vec4(a_position, 0, 1);

  // pass the texCoord to the fragment shader
  // The GPU will interpolate this value between points.
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es

precision highp float;

uniform sampler2D u_image;
uniform mat3 u_channelsFilter;
uniform bool u_tiling;

in vec2 v_texCoord;

out vec4 outColor;

void main() {
  vec2 pos = v_texCoord * vec2(1.2);

  if (!u_tiling && any(greaterThan(abs(pos), vec2(1.0)))) {
    discard;
  }

  outColor = texture(u_image, pos) * mat4(u_channelsFilter);
}
`;

function loadImageData(url: string): Promise<ImageData> {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');

            if (ctx === null) {
                return reject(new Error(`Can't access 2d context`));
            }

            ctx.drawImage(image, 0, 0);
            const data = ctx.getImageData(0, 0, image.width, image.height);

            resolve(data);
        };

        image.src = url;
    });
}

function drawPreview(
    canvas: HTMLCanvasElement,
    config: { imageData: ImageData; channels: ColorChannel; tiling: boolean },
): void {
    const { imageData, channels, tiling } = config;
    const { clientWidth, clientHeight } = canvas;

    if (clientWidth !== canvas.width || clientHeight !== canvas.height) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    }

    const gl = canvas.getContext('webgl2');

    if (!gl) {
        throw new Error(`Can't access webgl2 context`);
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER_SRC,
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(
        program,
        'a_position',
    );
    const texCoordAtributeLocation = gl.getAttribLocation(
        program,
        'a_texCoord',
    );

    const resolutionUniformLocation = gl.getUniformLocation(
        program,
        'u_resolution',
    );
    const imageUniformLocation = gl.getUniformLocation(program, 'u_image');
    const channelsFilerLocation = gl.getUniformLocation(
        program,
        'u_channelsFilter',
    );
    const tilingUniformLocation = gl.getUniformLocation(program, 'u_tiling');

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
        imageData,
    );

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform1i(imageUniformLocation, 0);
    gl.uniformMatrix3fv(
        channelsFilerLocation,
        false,
        DISPLAY_CHANNELS[channels].filter,
    );
    gl.uniform1i(tilingUniformLocation, tiling ? 1 : 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, POSITION_VERTEX, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function Preview(props: { url: string }) {
    const [imageData, setImageData] = useState<null | ImageData>(null);
    const [channels, setChannels] = useState<ColorChannel>(ColorChannel.RGB);
    const [tiling, setTiling] = useState<boolean>(false);
    const [zoom, setZoom] = useState<number>(1);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        loadImageData(props.url).then((imageData) => {
            setImageData(imageData);
        });
    }, [props.url]);

    useEffect(() => {
        if (canvasRef.current && imageData) {
            drawPreview(canvasRef.current, {
                imageData,
                channels,
                tiling,
            });
        }
    }, [imageData, channels, tiling]);

    const handleZoomIncrease = () => {
      setZoom(zoom + zoom * ZOOM_STEP);
    };

    const handleZoomDecrease = () => {
      setZoom(zoom - zoom * ZOOM_STEP);
    };

    return (
        <div className="preview">
            <select
                onChange={(e) => setChannels(e.target.value as ColorChannel)}
            >
                {Object.entries(DISPLAY_CHANNELS).map(([name, { label }]) => (
                    <option key={name} value={name}>
                        {label}
                    </option>
                ))}
            </select>

            <label htmlFor="tiling">Tiling</label>
            <input
                type="checkbox"
                id="tiling"
                name="tiling"
                title={tiling ? "Disable tiling" : "Enable tiling"}
                checked={tiling}
                onChange={(e) => setTiling(e.target.checked)}
            />

            <button title="Decrease zoom" onClick={handleZoomDecrease}>-</button>
            <input type="text" name="zoom" id="zoom" value={zoom}/>
            <button title="Increase zoom" onClick={handleZoomIncrease}>+</button>

            <hr />

            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

export default Preview;
