import type { License } from "@shared/types";

function isBoreholeLicense(l: License): boolean {
  if (l.minerals.value[0]?.group !== "вода") return false;
  const name = l.objectName.value.toLowerCase();
  return name.includes("скв") || name.includes("родник");
}

export function toGeoJsonFeatures(filtered: License[]) {
  return filtered
    .filter((l) => l.polygon.value.length >= 1)
    .map((l) => {
      const pts = l.polygon.value;
      const properties = {
        id: l.id.value,
        licenseNumber: l.licenseNumber.value,
        objectName: l.objectName.value,
        mineralGroup: l.minerals.value[0]?.group ?? "прочее",
        isAnnulled: l.status.value.isAnnulled,
      };

      if (pts.length < 3 || isBoreholeLicense(l)) {
        const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties,
        };
      }

      const coords = pts.map(([lat, lon]) => [lon, lat]);
      const first = coords[0]!;
      if (coords.at(-1)![0] !== first[0] || coords.at(-1)![1] !== first[1]) coords.push(first);
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties,
      };
    });
}
