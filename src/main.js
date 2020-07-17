import { GUI } from 'https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js';
import { instantiateShader, renderShaderInstance } from './shader.js';

const SHADER_LIST = [
    'checker',
    'gradient-axial',
    'gradient-linear-1',
    'gradient-linear-2',
    'gradient-linear-3',
];

/**
 * Render a new GUI for the shader instance.
 *
 * @param {import("./shader.js").ShaderInstance} shader
 * @param {Function} onPropChange
 */
function updateShaderInstanceGui(shader, onPropChange) {
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
                    get x() { return props[name][0] },
                    set x(val) { props[name][0] = val },
                    
                    get y() { return props[name][1] },
                    set y(val) { props[name][1] = val },
                };

                float2Gui.add(propView, 'x').name('X').min(0).max(1).step(0.01).onChange(onPropChange);
                float2Gui.add(propView, 'y').name('Y').min(0).max(1).step(0.01).onChange(onPropChange);
                break;
            }

            default:
                console.log(`Unknown prop type "${def.type}"`);
                break;
        }
    }
}

/**
 * Setup a new shader
 * 
 * @param {string} shaderName 
 */
async function renderShader(shaderName) {
    const [meta, source] = await Promise.all([
        fetch(`src/shaders/${shaderName}.meta.json`).then((res) => res.json()),
        fetch(`src/shaders/${shaderName}.glsl`).then((res) => res.text()),
    ]);

    const instance = instantiateShader({
        ...meta,
        source,
    });
    
    updateShaderInstanceGui(instance, () => {
        renderShaderInstance(instance);
    });

    renderShaderInstance(instance);
}

/**
 * Retrieve currently selected shader from the URL.
 * 
 * @returns {string} The selected shader name
 */
function getShaderNameFromUrl() {
    const { searchParams } = new URL(window.location);
    return searchParams.get('shader');
}

/**
 * Update the URL to reflect shader change.
 * 
 * @param {string} shaderName The selected shader name
 * @param {boolean?} replace It true the current state is replaced otherwise a new entry is added.
 */
function setShaderNameToUrl(shaderName, replace = false) {
    const data = {};
    const title = `Shader ${shaderName}`;
    const url = `?shader=${shaderName}`;

    if (replace) {
        history.replaceState(data, title, url);
    } else {
        history.pushState(data, title, url);
    }
}

let shaderName = getShaderNameFromUrl();

// Check if the specified shader is a known shader otherwise reset it to the default value.
if (!SHADER_LIST.includes(shaderName)) {
    shaderName = SHADER_LIST[0];
    setShaderNameToUrl(shaderName, true);
}

const config = {
    shader: shaderName
}

const gui = new GUI();

const shaderDefinitionController = gui.add(config, 'shader', SHADER_LIST)
    .name('Shader')
    .onChange(shaderName => {
        setShaderNameToUrl(shaderName);
        renderShader(shaderName);
    });

let shaderInstanceGui;

window.addEventListener('popstate', () => {
    const shaderName = getShaderNameFromUrl();
    shaderDefinitionController.setValue(shaderName);
});

renderShader(shaderName);

