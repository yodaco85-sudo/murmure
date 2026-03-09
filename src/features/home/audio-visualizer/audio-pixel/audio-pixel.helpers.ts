/**
 * Returns an RGBA color string for a lit pixel based on its vertical position.
 * The gradient goes from sky-blue at the bottom, through violet in the middle,
 * to rose/pink at the top.
 *
 * rowIndex=0 is the topmost row rendered in the DOM; the visualizer fills from
 * the center outward, so the "topmost lit pixel" in terms of visual height is
 * actually the one with the smallest rowIndex.  We therefore invert the index
 * before computing the ratio so that high pixels (small rowIndex) map to warm
 * colors (rose) and low pixels (large rowIndex near center) map to cool colors
 * (sky blue).
 */
export const getPixelColor = (
    rowIndex: number,
    totalRows: number,
    opacity: number = 1
): string => {
    // ratio: 0 = bottom of the visual stack (near center), 1 = top (outer edge)
    const ratio = 1 - rowIndex / Math.max(1, totalRows - 1);

    // Sky-blue  #38bdf8  → rgb(56,  189, 248)
    // Violet    #a78bfa  → rgb(167, 139, 250)
    // Rose      #fb7185  → rgb(251, 113, 133)

    let r: number, g: number, b: number;

    if (ratio <= 0.5) {
        // Sky → Violet
        const t = ratio / 0.5;
        r = Math.round(56 + (167 - 56) * t);
        g = Math.round(189 + (139 - 189) * t);
        b = Math.round(248 + (250 - 248) * t);
    } else {
        // Violet → Rose
        const t = (ratio - 0.5) / 0.5;
        r = Math.round(167 + (251 - 167) * t);
        g = Math.round(139 + (113 - 139) * t);
        b = Math.round(250 + (133 - 250) * t);
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Returns the glow radius (px) for a lit pixel.
 * Pixels higher up (smaller rowIndex / larger ratio) glow more intensely.
 */
export const getGlowRadius = (rowIndex: number, totalRows: number): number => {
    const ratio = 1 - rowIndex / Math.max(1, totalRows - 1);
    // Range: 3px (bottom) → 8px (top)
    return 3 + ratio * 5;
};
