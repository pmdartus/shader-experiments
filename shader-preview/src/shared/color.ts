export type ColorRgba = [number, number, number, number];
export type ColorHsl = [number, number, number];
export type ColorHex = string;

function componentToHex(component: number): string {
    const hex = component.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
}

export function rgbaToHex(rgba: ColorRgba): ColorHex {
    const [r, g, b] = rgba;
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// From: https://github.com/Qix-/color-convert/blob/master/conversions.js#L55
export function rgbaToHsl(rgba: ColorRgba): ColorHsl {
    const r = rgba[0] / 255;
    const g = rgba[1] / 255;
    const b = rgba[2] / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h = 0;
    let s;

    if (max === min) {
        h = 0;
    } else if (r === max) {
        h = (g - b) / delta;
    } else if (g === max) {
        h = 2 + (b - r) / delta;
    } else if (b === max) {
        h = 4 + (r - g) / delta;
    }

    h = Math.min(h * 60, 360);

    if (h < 0) {
        h += 360;
    }

    const l = (min + max) / 2;

    if (max === min) {
        s = 0;
    } else if (l <= 0.5) {
        s = delta / (max + min);
    } else {
        s = delta / (2 - max - min);
    }

    return [h, s * 100, l * 100];
}
