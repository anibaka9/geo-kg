import type { License } from "@shared/types";

export function toGeoJsonFeatures(filtered: License[]) {
  return filtered
    .filter((l) => l.polygon.value.length >= 3)
    .map((l) => {
      const coords = l.polygon.value.map(([lat, lon]) => [lon, lat]);
      const first = coords[0]!;
      const last = coords.at(-1)!;
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: {
          id: l.id.value,
          licenseNumber: l.licenseNumber.value,
          objectName: l.objectName.value,
          mineralGroup: l.minerals.value[0]?.group ?? "прочее",
          isAnnulled: l.status.value.isAnnulled,
        },
      };
    });
}
