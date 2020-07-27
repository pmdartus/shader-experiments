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
