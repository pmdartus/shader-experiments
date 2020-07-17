interface BaseShaderPropDefinition {
    label: 'string';
    type: string;
}

interface ShaderIntPropDefinition extends BaseShaderPropDefinition {
    type: 'int';
    default: number;
    min: number;
    max: number;
    step: number;
}

interface ShaderFloatPropDefinition extends BaseShaderPropDefinition {
    type: 'float';
    default: number;
    min: number;
    max: number;
    step: number;
}

interface ShaderFloat2PropDefinition extends BaseShaderPropDefinition {
    type: 'float2';
    default: [number, number];
}

export type ShaderPropDefinition = ShaderIntPropDefinition | ShaderFloatPropDefinition | ShaderFloat2PropDefinition;

export interface ShaderDefinition {
    name: string;
    label: string;
    source: string;
    props: { [name: string]: ShaderPropDefinition };
}

export interface ShaderInstance {
    definition: ShaderDefinition;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: { [name: string]: any };
}
