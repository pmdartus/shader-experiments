import { rgbaToHex, rgbaToHsl, ColorRgba, ColorHex, ColorHsl } from "../color";

function testRgbaToHex(rgba: ColorRgba, expected: ColorHex) {
  test(`rgbaToHex(${JSON.stringify(rgba)})`, () => {
    expect(rgbaToHex(rgba)).toBe(expected);
  });
}

function testRgbaToHsl(rgba: ColorRgba, expected: ColorHsl) {
  test(`rgbaToHex(${JSON.stringify(rgba)})`, () => {
    const actual = rgbaToHsl(rgba);

    expect(actual[0]).toBeCloseTo(expected[0]);
    expect(actual[1]).toBeCloseTo(expected[1]);
    expect(actual[2]).toBeCloseTo(expected[2]);
  });
}

describe("rgbaToHex", () => {
  testRgbaToHex([0, 0, 0, 0], "#000000");
  testRgbaToHex([255, 255, 255, 255], "#ffffff");

  testRgbaToHex([255, 0, 0, 0], "#ff0000");
  testRgbaToHex([0, 255, 0, 0], "#00ff00");
  testRgbaToHex([0, 0, 255, 0], "#0000ff");

  testRgbaToHex([17, 85, 204, 0], "#1155cc");
});

describe("rgbaToHex", () => {
  testRgbaToHsl([0, 0, 0, 0], [0, 0, 0]);
  testRgbaToHsl([255, 255, 255, 255], [0, 0, 100]);

  testRgbaToHsl([255, 0, 0, 0], [0, 100, 50]);
  testRgbaToHsl([0, 255, 0, 0], [120, 100, 50]);
  testRgbaToHsl([0, 0, 255, 0], [240, 100, 50]);

  testRgbaToHsl([17, 85, 204, 0], [218.185, 84.615, 43.333]);
});
