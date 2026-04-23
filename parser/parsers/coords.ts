import proj4 from "proj4";
import type { Field } from "@shared/types";

// Pulkovo 1942 / Gauss-Kruger (SK-42), zones covering Kyrgyzstan.
// Easting is stored with zone prefix: zone*1_000_000 + 500_000 + local_easting.
const GK_ZONE: Record<number, string> = {
  12: "+proj=tmerc +lat_0=0 +lon_0=69 +k=1 +x_0=12500000 +y_0=0 +ellps=krass +towgs84=23.57,-140.95,-79.8,0,-0.35,-0.79,-0.22 +units=m +no_defs",
  13: "+proj=tmerc +lat_0=0 +lon_0=75 +k=1 +x_0=13500000 +y_0=0 +ellps=krass +towgs84=23.57,-140.95,-79.8,0,-0.35,-0.79,-0.22 +units=m +no_defs",
};
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

function gkToWgs84(easting: number, northing: number): [number, number] | null {
  const zone = Math.floor(easting / 1_000_000);
  const proj = GK_ZONE[zone];
  if (!proj || !isFinite(easting) || !isFinite(northing)) return null;
  const [lon, lat] = proj4(proj, WGS84, [easting, northing]);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  return [parseFloat(lat.toFixed(6)), parseFloat(lon.toFixed(6))];
}

function splitNums(raw: string): number[] {
  return raw.trim().split(/\s+/).filter(Boolean).map(Number);
}

export function parseCoords(
  rawX: string,
  rawY: string,
): Field<[number, number][], { x: string; y: string }> {
  const raw = { x: rawX, y: rawY };

  const xNums = splitNums(rawX);
  const yNums = splitNums(rawY);

  if (xNums.length === 0 || xNums.length !== yNums.length) {
    return { raw, value: [] };
  }

  // Easting has zone prefix so it's >10_000_000; northing is ~4–5M
  const xIsEasting = xNums[0] > 10_000_000;
  const eastings = xIsEasting ? xNums : yNums;
  const northings = xIsEasting ? yNums : xNums;

  const value: [number, number][] = [];
  for (let i = 0; i < eastings.length; i++) {
    const point = gkToWgs84(eastings[i], northings[i]);
    if (point) value.push(point);
  }

  return { raw, value };
}
