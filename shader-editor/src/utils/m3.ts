export type M3 = [
    number, number, number,
    number, number, number,
    number, number, number
];

export function projection(width: number, height: number): M3 {
    return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1,
    ];
}
  
function translation(tx: number, ty: number): M3 {
    return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
    ];
}
  
function rotation(angleInRadians: number): M3 {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
        c, -s, 0,
        s, c, 0,
        0, 0, 1,
    ];
}
  
function scaling(sx: number, sy: number): M3 {
    return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
    ];
}
  
function multiply(a: M3, b: M3): M3 {
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
    ];
}
  
export function translate(m: M3, tx: number, ty: number): M3 {
    return multiply(m, translation(tx, ty));
}
  
export function rotate(m: M3, angleInRadians: number): M3 {
    return multiply(m, rotation(angleInRadians));
}
  
export function scale(m: M3, sx: number, sy: number): M3 {
    return multiply(m, scaling(sx, sy));
}