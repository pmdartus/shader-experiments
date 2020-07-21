export enum ColorChannel {
  RGB = "RGB",
  R = "R",
  G = "G",
  B = "B",
}

export const DISPLAY_CHANNELS: Record<
  ColorChannel,
  { label: string; filter: number[] }
> = {
  RGB: {
    label: "RBG",
    // prettier-ignore
    filter: [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]
  },
  R: {
    label: "Red",
    // prettier-ignore
    filter: [
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
    ]
  },
  G: {
    label: "Green",
    // prettier-ignore
    filter: [
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ]
  },
  B: {
    label: "Blue",
    // prettier-ignore
    filter: [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1
    ]
  },
};

export const ZOOM_STEP = 0.2;
