export type Vec2 = [number, number];

export interface PropertyDefinition {
  type: string;
  label: string;

  [key: string]: unknown;
}

export interface GraphNodeDefinition {
  name: string;
  label: string;
  shader: string;
  properties: { [name: string]: PropertyDefinition };
}

type ShaderId = string;

interface BooleanUniform {
  type: "boolean";
  value: boolean;
}

interface IntegerUniform {
  type: "integer";
  value: number;
}

interface FloatUniform {
  type: "float";
  value: number;
}

type UniformValue = BooleanUniform | IntegerUniform | FloatUniform;

export interface ShaderInfo {
  name: string;
  program: WebGLShader;
  buffers: {
    position: WebGLBuffer;
    texCoord: WebGLBuffer;
  };
  uniforms: Map<string, WebGLUniformLocation>;
}

export interface CompilerShaderRequest {
  name: string;
  src: string;
  uniforms: string[];
}

export interface CompilerShaderResponse {
  id: ShaderId;
}

export interface RunShaderRequest {
  id: ShaderId;
  size: number;
  uniforms: { [name: string]: UniformValue };
}

export interface RunShaderResponse {
  result: ArrayBuffer;
}
