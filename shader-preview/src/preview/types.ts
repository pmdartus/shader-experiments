export type Position = [number, number];

export interface Camera {
  position: Position;
  zoom: number;
}

export enum ColorChannel {
  RGB = "RGB",
  R = "R",
  G = "G",
  B = "B",
}
