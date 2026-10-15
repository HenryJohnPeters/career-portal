export interface SparkPoint {
  x: number;
  y: number;
  value: number;
  index: number;
}

/**
 * SVG path for a 0-`max` series drawn in a `width`×`height` box (y grows
 * downwards). Null values leave a gap: the line restarts with a new "M".
 */
export function buildSparkline(
  values: readonly (number | null)[],
  width: number,
  height: number,
  max = 100,
  padding = 2,
): { path: string; points: SparkPoint[] } {
  const points: SparkPoint[] = [];
  if (values.length === 0 || width <= 0 || height <= 0 || max <= 0) return { path: "", points };

  const innerW = Math.max(0, width - padding * 2);
  const innerH = Math.max(0, height - padding * 2);
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  let path = "";
  let penDown = false;
  values.forEach((raw, index) => {
    if (raw === null || !Number.isFinite(raw)) {
      penDown = false;
      return;
    }
    const value = Math.min(max, Math.max(0, raw));
    const x = round(padding + (values.length > 1 ? index * step : innerW / 2));
    const y = round(padding + innerH - (value / max) * innerH);
    points.push({ x, y, value, index });
    path += `${penDown ? "L" : "M"}${x} ${y} `;
    penDown = true;
  });

  return { path: path.trim(), points };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
