/**
 * Recharts bar chart helpers (stacked bar radius, cell radius prop).
 */

import type { ChartDataPoint } from "./chart-types";

/**
 * Returns [topLeft, topRight, bottomRight, bottomLeft] radius for a stacked bar
 * segment so only the topmost segment has top radius and only the bottommost has
 * bottom radius; single segment gets full capsule.
 */
export function getStackedBarRadius(
  stackKeys: (keyof ChartDataPoint)[],
  dataKey: keyof ChartDataPoint,
  payload: ChartDataPoint,
  barRadius: number
): [number, number, number, number] {
  const visibleSegments = stackKeys.filter(
    (k) => (Number(payload[k]) ?? 0) > 0
  );
  const currentIndex = visibleSegments.indexOf(dataKey);
  if (currentIndex === -1) return [0, 0, 0, 0];

  const isTopmost = currentIndex === visibleSegments.length - 1;
  const isBottommost = currentIndex === 0;
  const isSingle = visibleSegments.length === 1;

  const top = isTopmost || isSingle ? barRadius : 0;
  const bottom = isBottommost || isSingle ? barRadius : 0;
  return [top, top, bottom, bottom];
}

/**
 * Recharts Cell passes radius as a tuple; types don't declare it. Use this when
 * passing getStackedBarRadius result to Cell radius prop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellRadius(r: [number, number, number, number]): any {
  return r;
}
