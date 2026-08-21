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

// ── Northing repair ──────────────────────────────────────────────────────────

const KG_N_MIN = 4_300_000;
const KG_N_MAX = 4_850_000;

// All plausible northing values for v; returns [v] if already valid.
function northingCandidates(v: number): number[] {
  if (v >= KG_N_MIN && v <= KG_N_MAX) return [v];
  if (!isFinite(v)) return [v];

  const s = String(Math.round(v));
  const out: number[] = [];
  const seen = new Set<number>();

  const add = (c: number) => {
    if (c >= KG_N_MIN && c <= KG_N_MAX && !seen.has(c)) {
      out.push(c);
      seen.add(c);
    }
  };

  if (s.length === 6) {
    add(4_000_000 + v); // missing leading '4'
    for (
      let i = 0;
      i <= 7;
      i++ // try any single insertion
    )
      for (let d = 0; d <= 9; d++) add(parseInt(s.slice(0, i) + String(d) + s.slice(i), 10));
  }
  if (s.length === 8)
    for (
      let i = 0;
      i < 8;
      i++ // extra digit
    )
      add(parseInt(s.slice(0, i) + s.slice(i + 1), 10));
  if (s.length === 7) add(parseInt(`4${s.slice(1)}`, 10)); // wrong first digit

  return out.length > 0 ? out : [v];
}

// Pick the candidate closest to refNorthing.
// If the best candidate is still far (>30 km) and has 7 digits, try single-digit replacement
// and adjacent-digit transpositions (e.g. 4357500→4537500, 4783397→4738397).
function bestNorthing(v: number, refNorthing: number): number {
  const cs = northingCandidates(v);
  let best = cs.reduce((b, c) => (Math.abs(c - refNorthing) < Math.abs(b - refNorthing) ? c : b));

  if (Math.abs(best - refNorthing) > 30_000) {
    const s = String(Math.round(best));
    if (s.length === 7) {
      for (let pos = 0; pos < s.length; pos++) {
        for (let d = 0; d <= 9; d++) {
          if (s[pos] === String(d)) continue;
          const c = parseInt(s.slice(0, pos) + String(d) + s.slice(pos + 1), 10);
          if (
            c >= KG_N_MIN &&
            c <= KG_N_MAX &&
            Math.abs(c - refNorthing) < Math.abs(best - refNorthing)
          )
            best = c;
        }
      }
      for (let pos = 0; pos < s.length - 1; pos++) {
        if (s[pos] === s[pos + 1]) continue;
        const c = parseInt(s.slice(0, pos) + s[pos + 1]! + s[pos]! + s.slice(pos + 2), 10);
        if (
          c >= KG_N_MIN &&
          c <= KG_N_MAX &&
          Math.abs(c - refNorthing) < Math.abs(best - refNorthing)
        )
          best = c;
      }
    }
  }
  return best;
}

// ── Easting zone repair ──────────────────────────────────────────────────────

// lon bounds used to accept/reject a zone-prefix fix
const KG_LON_MIN = 69.0;
const KG_LON_MAX = 80.5;

function majorityZone(eastings: number[]): number | null {
  const counts = new Map<number, number>();
  for (const e of eastings) {
    if (!isFinite(e)) continue;
    const z = Math.floor(e / 1_000_000);
    if (GK_ZONE[z]) counts.set(z, (counts.get(z) ?? 0) + 1);
  }
  return [...counts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// Candidates for a null-point easting via single-digit deletion/insertion.
function eastingRepairCandidates(e: number): number[] {
  const s = String(Math.round(e));
  const out: number[] = [];
  const seen = new Set<number>();
  const add = (c: number) => {
    const z = Math.floor(c / 1_000_000);
    if ((z === 12 || z === 13) && !seen.has(c)) {
      out.push(c);
      seen.add(c);
    }
  };
  // single-digit deletion (handles extra digit, e.g. 9-digit easting)
  for (let i = 0; i < s.length; i++) add(parseInt(s.slice(0, i) + s.slice(i + 1), 10));
  // single-digit insertion for short eastings (handles missing digit, e.g. 7-digit)
  if (s.length <= 7) {
    for (let i = 0; i <= s.length; i++)
      for (let d = 0; d <= 9; d++) add(parseInt(s.slice(0, i) + String(d) + s.slice(i), 10));
  }
  return out;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  const s = values.toSorted((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function dist2(pt: [number, number], refLat: number, refLon: number): number {
  return (pt[0] - refLat) ** 2 + (pt[1] - refLon) ** 2;
}

function splitNums(raw: string): number[] {
  return raw.trim().split(/\s+/u).filter(Boolean).map(Number);
}

function inRegion(pt: [number, number]): boolean {
  return pt[0] >= 35 && pt[0] <= 48 && pt[1] >= 60 && pt[1] <= 85;
}

function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): boolean {
  const cross = (O: [number, number], A: [number, number], B: [number, number]) =>
    (A[1] - O[1]) * (B[0] - O[0]) - (A[0] - O[0]) * (B[1] - O[1]);
  const d1 = cross(p3, p4, p1),
    d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3),
    d4 = cross(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function isSelfIntersecting(pts: [number, number][]): boolean {
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue;
      if (segmentsIntersect(pts[i]!, pts[i + 1]!, pts[j]!, pts[j + 1]!)) return true;
    }
    if (i > 0 && i < n - 2 && segmentsIntersect(pts[n - 1]!, pts[0]!, pts[i]!, pts[i + 1]!))
      return true;
  }
  return false;
}

// Andrew's monotone chain convex hull; returns points in CCW order.
function convexHull(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts;
  const p = pts.toSorted((a, b) => (a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (O: [number, number], A: [number, number], B: [number, number]) =>
    (A[1] - O[1]) * (B[0] - O[0]) - (A[0] - O[0]) * (B[1] - O[1]);
  const hull: [number, number][] = [];
  for (const pt of p) {
    while (hull.length >= 2 && cross(hull.at(-2)!, hull.at(-1)!, pt) <= 0) hull.pop();
    hull.push(pt);
  }
  const lower = hull.length + 1;
  for (let i = p.length - 2; i >= 0; i--) {
    const pt = p[i]!;
    while (hull.length >= lower && cross(hull.at(-2)!, hull.at(-1)!, pt) <= 0) hull.pop();
    hull.push(pt);
  }
  hull.pop();
  return hull;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function parseCoords(
  rawX: string,
  rawY: string,
): Field<[number, number][], { x: string; y: string }> {
  const raw = { x: rawX, y: rawY };
  const xNums = splitNums(rawX);
  const yNums = splitNums(rawY);

  if (xNums.length === 0 || xNums.length !== yNums.length) return { raw, value: [] };

  const xIsEasting = xNums[0]! > 10_000_000;
  const eastings = xIsEasting ? xNums : yNums;
  const northings = xIsEasting ? yNums : xNums;

  // Step 1: repair northings using median of already-valid values as reference.
  const validNorthings = northings.filter((n) => n >= KG_N_MIN && n <= KG_N_MAX);
  const refNorthing = validNorthings.length > 0 ? median(validNorthings) : 4_600_000;
  const repairedN = northings.map((n) => bestNorthing(n, refNorthing));

  // Step 2: initial conversion with repaired northings.
  const mZone = majorityZone(eastings);
  const pts0 = eastings.map((e, i) => gkToWgs84(e, repairedN[i]!));

  // Step 3: reference lat/lon from valid converted points (for easting zone fix).
  const validPts = pts0.filter((p): p is [number, number] => p !== null && inRegion(p));
  const refLat = validPts.length > 0 ? median(validPts.map((p) => p[0])) : 41.5;
  const refLon = validPts.length > 0 ? median(validPts.map((p) => p[1])) : 74.5;

  // Outlier threshold: a valid pt is a spike if it's >3× the median dist AND >1 km.
  // dist2 in raw degree²; 1km at KG latitudes ≈ 0.009° → 0.0001 deg²
  const validDists2 = validPts.map((p) => dist2(p, refLat, refLon));
  const medDist2 = validDists2.length > 0 ? median(validDists2) : 0;
  const SPIKE_D2 = Math.max(medDist2 * 9, 0.0001);

  // Step 4: repair bad eastings and spike northings.
  // Case A: pt is null (zone not in GK_ZONE) → try digit-level repair + zone-prefix fix.
  // Case B: pt is valid but in minority zone → try zone-prefix fix if it's closer to median.
  // Case C: pt is a spike outlier → try single-digit replacement on easting OR northing.
  const value: [number, number][] = [];
  for (let i = 0; i < eastings.length; i++) {
    let pt = pts0[i] ?? null;
    const e = eastings[i]!;
    let repairedE = e; // tracks the easting after any Case A/B fix

    if (pt === null) {
      const candidates = eastingRepairCandidates(e);
      if (mZone !== null) {
        const zone = Math.floor(e / 1_000_000);
        const fixedE = mZone * 1_000_000 + (e - zone * 1_000_000);
        const fz = Math.floor(fixedE / 1_000_000);
        if (fz === 12 || fz === 13) candidates.push(fixedE);
      }
      for (const ec of candidates) {
        const fp = gkToWgs84(ec, repairedN[i]!);
        if (
          fp &&
          fp[1] >= KG_LON_MIN &&
          fp[1] <= KG_LON_MAX &&
          inRegion(fp) &&
          (!pt || dist2(fp, refLat, refLon) < dist2(pt, refLat, refLon))
        ) {
          pt = fp;
          repairedE = ec;
        }
      }
    } else if (mZone !== null) {
      const zone = Math.floor(e / 1_000_000);
      if (zone !== mZone) {
        const fixedE = mZone * 1_000_000 + (e - zone * 1_000_000);
        const fp = gkToWgs84(fixedE, repairedN[i]!);
        if (
          fp &&
          fp[1] >= KG_LON_MIN &&
          fp[1] <= KG_LON_MAX &&
          dist2(fp, refLat, refLon) < dist2(pt, refLat, refLon)
        ) {
          pt = fp;
          repairedE = fixedE;
        }
      }
    }

    // Case C: spike — try single-digit replacement on easting AND northing.
    // Only accept if ≥10× closer than current pt.
    if (pt !== null && dist2(pt, refLat, refLon) > SPIKE_D2) {
      const ptD2 = dist2(pt, refLat, refLon);
      let bestFp: [number, number] | null = null;
      let bestD2 = ptD2 * 0.1;

      // Easting digit replacement (8-digit repaired easting)
      const se = String(Math.round(repairedE));
      if (se.length === 8) {
        for (let pos = 0; pos < se.length; pos++) {
          for (let d = 0; d <= 9; d++) {
            if (se[pos] === String(d)) continue;
            const c = parseInt(se.slice(0, pos) + String(d) + se.slice(pos + 1), 10);
            const zone = Math.floor(c / 1_000_000);
            if (zone !== 12 && zone !== 13) continue;
            const fp = gkToWgs84(c, repairedN[i]!);
            if (fp && fp[1] >= KG_LON_MIN && fp[1] <= KG_LON_MAX && inRegion(fp)) {
              const fpD2 = dist2(fp, refLat, refLon);
              if (fpD2 < bestD2) {
                bestD2 = fpD2;
                bestFp = fp;
              }
            }
          }
        }
      }

      // Northing digit replacement + adjacent transposition (7-digit northing)
      const sn = String(Math.round(repairedN[i]!));
      if (sn.length === 7) {
        for (let pos = 0; pos < sn.length; pos++) {
          for (let d = 0; d <= 9; d++) {
            if (sn[pos] === String(d)) continue;
            const nc = parseInt(sn.slice(0, pos) + String(d) + sn.slice(pos + 1), 10);
            if (nc < KG_N_MIN || nc > KG_N_MAX) continue;
            const fp = gkToWgs84(repairedE, nc);
            if (fp && fp[1] >= KG_LON_MIN && fp[1] <= KG_LON_MAX && inRegion(fp)) {
              const fpD2 = dist2(fp, refLat, refLon);
              if (fpD2 < bestD2) {
                bestD2 = fpD2;
                bestFp = fp;
              }
            }
          }
        }
        for (let pos = 0; pos < sn.length - 1; pos++) {
          if (sn[pos] === sn[pos + 1]) continue;
          const nc = parseInt(sn.slice(0, pos) + sn[pos + 1]! + sn[pos]! + sn.slice(pos + 2), 10);
          if (nc < KG_N_MIN || nc > KG_N_MAX) continue;
          const fp = gkToWgs84(repairedE, nc);
          if (fp && fp[1] >= KG_LON_MIN && fp[1] <= KG_LON_MAX && inRegion(fp)) {
            const fpD2 = dist2(fp, refLat, refLon);
            if (fpD2 < bestD2) {
              bestD2 = fpD2;
              bestFp = fp;
            }
          }
        }
      }

      if (bestFp) pt = bestFp;
    }

    if (pt && inRegion(pt)) value.push(pt);
  }

  // Step 5: if the polygon self-intersects (bad vertex order or borehole points),
  // replace with convex hull — always produces a valid simple polygon.
  const result = value.length >= 3 && isSelfIntersecting(value) ? convexHull(value) : value;

  return { raw, value: result };
}
