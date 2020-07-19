import { GUI } from 'dat.gui';

import { ShaderInstance, ShaderPropDefinition } from './types';
import { instantiateShader } from './shader';
import { createPreview, renderPreview, resetCamera } from './preview';

const SHADER_LIST = [
    'checker',
    'gradient-axial',
    'gradient-linear-1',
    'gradient-linear-2',
    'gradient-linear-3',
];

let shaderName = getShaderNameFromUrl();

// Check if the specified shader is a known shader otherwise reset it to the default value.
if (!shaderName || !SHADER_LIST.includes(shaderName)) {
    shaderName = SHADER_LIST[0];
    setShaderNameToUrl(shaderName, true);
}

const canvas = document.querySelector('canvas')!;
const preview = createPreview(canvas, {
    shader: shaderName,
});

const gui = new GUI();

const shaderDefinitionController = gui
    .add(preview.props, 'shader', SHADER_LIST)
    .name('Shader')
    .onChange((shaderName) => {
        setShaderNameToUrl(shaderName);
        loadShader(shaderName);
    });

gui.add(preview.props, 'tiling')
    .name('Tiling')
    .onChange(() => {
        renderPreview(preview);
    });

let shaderInstanceGui: GUI | undefined;


function updateShaderInstanceGui(
    shader: ShaderInstance,
    onPropChange: () => void,
) {
    const { definition, props } = shader;

    if (shaderInstanceGui) {
        gui.removeFolder(shaderInstanceGui);
    }

    shaderInstanceGui = gui.addFolder('Instance');
    shaderInstanceGui.open();

    for (const [name, def] of Object.entries(definition.props)) {
        switch (def.type) {
            case 'int':
            case 'float':
                shaderInstanceGui
                    .add(props, name)
                    .name(def.label)
                    .min(def.min)
                    .max(def.max)
                    .step(def.step)
                    .onChange(onPropChange);
                break;

            case 'float2': {
                const float2Gui = shaderInstanceGui.addFolder(def.label);
                float2Gui.open();

                const propView = {
                    get x() {
                        return props[name][0];
                    },
                    set x(val) {
                        props[name][0] = val;
                    },

                    get y() {
                        return props[name][1];
                    },
                    set y(val) {
                        props[name][1] = val;
                    },
                };

                float2Gui
                    .add(propView, 'x')
                    .name('X')
                    .min(0)
                    .max(1)
                    .step(0.01)
                    .onChange(onPropChange);
                float2Gui
                    .add(propView, 'y')
                    .name('Y')
                    .min(0)
                    .max(1)
                    .step(0.01)
                    .onChange(onPropChange);
                break;
            }

            default:
                console.log(
                    `Unknown prop type "${(def as ShaderPropDefinition).type}"`,
                );
                break;
        }
    }
}

async function loadShader(shaderName: string): Promise<void> {
    const [meta, source] = await Promise.all([
        fetch(`resources/shaders/${shaderName}.meta.json`).then((res) =>
            res.json(),
        ),
        fetch(`resources/shaders/${shaderName}.glsl`).then((res) => res.text()),
    ]);

    const shader = instantiateShader(preview, {
        ...meta,
        source,
    });

    preview.shader = shader;

    updateShaderInstanceGui(shader, () => {
        renderPreview(preview);
    });

    renderPreview(preview);
}

function getShaderNameFromUrl(): string | null {
    const { searchParams } = new URL(String(window.location));
    return searchParams.get('shader');
}

function setShaderNameToUrl(shaderName: string, replace = false): void {
    const data = {};
    const title = `Shader ${shaderName}`;
    const url = `?shader=${shaderName}`;

    if (replace) {
        history.replaceState(data, title, url);
    } else {
        history.pushState(data, title, url);
    }
}

function handleMouseDown(evt: MouseEvent) {
    evt.preventDefault();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    preview.camera.position[0] += evt.movementX;
    preview.camera.position[1] += evt.movementY;

    renderPreview(preview);
}

function handleMouseMove(evt: MouseEvent) {
    evt.preventDefault();

    preview.camera.position[0] += evt.movementX;
    preview.camera.position[1] += evt.movementY;

    renderPreview(preview);
}

function handleMouseUp(evt: MouseEvent) {
    evt.preventDefault();

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
}

function handleMouseWheel(evt: WheelEvent) {
    evt.preventDefault();

    // https://jsfiddle.net/greggman/mdpxw3n6/
    // Multiple the wheel movement by the current zoom, this way it will zoom less when being 
    // zoomed it.
    const newZoom = preview.camera.zoom * Math.pow(2, evt.deltaY * -0.01);
    preview.camera.zoom = Math.max(0.02, Math.min(100, newZoom));

    renderPreview(preview);
}

function focusPreview() {
    resetCamera(preview);
    renderPreview(preview);
}

window.addEventListener('popstate', () => {
    const shaderName = getShaderNameFromUrl();
    shaderDefinitionController.setValue(shaderName);
});

window.addEventListener('resize', () => {
    renderPreview(preview);
});

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('wheel', handleMouseWheel);

window.addEventListener('keypress', evt => {
    if (evt.key === 'f') {
        focusPreview();
    } 
})

loadShader(shaderName!);
