// src/utils/colorUtils.ts

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16); // Ensure integer before converting
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

export const rgbToCmyk = (r: number, g: number, b: number): { c: number; m: number; y: number; k: number } => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    const k = Math.min(c, m, y);

    if (k === 1) return { c: 0, m: 0, y: 0, k: 1 };

    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);

    return { c, m, y, k };
};

export const cmykToRgb = (c: number, m: number, y: number, k: number): { r: number; g: number; b: number } => {
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b)
    };
}; 