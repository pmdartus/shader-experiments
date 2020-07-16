import { GUI } from "https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js";
import { instanciateShader, renderShader } from "./shader.js";

const shaderPicker = document.getElementById("shader-picker");

async function loadShader(name) {
  const [meta, source] = await Promise.all([
    fetch(`/src/shaders/${name}.meta.json`).then((res) => res.json()),
    fetch(`/src/shaders/${name}.glsl`).then((res) => res.text()),
  ]);

  return instanciateShader({
    ...meta,
    source,
  });
}

/**
 * Render a new GUI for the shader instance.
 * 
 * @param {import("./shader.js").ShaderInstance} shader 
 * @param {Function} onPropChange 
 */
function renderGui(shader, onPropChange) {
    const { definition, props } = shader;

    const gui = new GUI();

    for (const [name, def] of Object.entries(definition.props)) {
        switch (def.type) {
            case 'int':
                gui
                  .add(props, name, def.min, def.max, def.step)
                  .name(def.label)
                  .onFinishChange(onPropChange);
                break;

            default:
                break;
        }
    }
}

function getSelectedShader() {
  const selectedOption = shaderPicker.selectedOptions[0];
  return {
    name: selectedOption.value,
    label: selectedOption.text,
  };
}

function getShaderFromUrl() {
  const { searchParams } = new URL(window.location);
  return searchParams.get("shader");
}

const urlShader = getShaderFromUrl();
if (urlShader === null) {
  const selectShader = getSelectedShader();
  history.replaceState(
    selectShader,
    selectShader.label,
    `?shader=${selectShader.name}`
  );
} else {
  shaderPicker.value = urlShader;

  loadShader(urlShader).then((shader) => {
    renderShader(shader);

    renderGui(shader, () => {
      renderShader(shader);
    });
  });
}