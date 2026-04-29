declare const maplibregl: any;

const el = document.getElementById("map");
if (!el) throw new Error("No #map element");

const qs = (el as HTMLElement).dataset["qs"];
const geojsonUrl = `/api/features.geojson${qs ? "?" + qs : ""}`;

const GROUP_COLORS: Record<string, string> = {
  металлы: "#64748b",
  топливо: "#f59e0b",
  "строительные материалы": "#f97316",
  минералы: "#10b981",
  вода: "#3b82f6",
};

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [74.5, 41.2],
  zoom: 6,
});

map.on("load", () => {
  map.addSource("licenses", { type: "geojson", data: geojsonUrl });

  map.addLayer({
    id: "license-fill",
    type: "fill",
    source: "licenses",
    paint: {
      "fill-color": [
        "case",
        ["get", "isAnnulled"],
        "#fca5a5",
        ["match", ["get", "mineralGroup"], ...Object.entries(GROUP_COLORS).flat(), "#9ca3af"],
      ],
      "fill-opacity": 0.5,
    },
  });

  map.addLayer({
    id: "license-outline",
    type: "line",
    source: "licenses",
    paint: { "line-color": "#374151", "line-width": 0.5 },
  });

  map.addLayer({
    id: "license-hover",
    type: "fill",
    source: "licenses",
    paint: { "fill-color": "#ffffff", "fill-opacity": 0.25 },
    filter: ["==", ["get", "id"], ""],
  });

  map.on("mousemove", "license-fill", (e: any) => {
    map.getCanvas().style.cursor = "pointer";
    map.setFilter("license-hover", ["==", ["get", "id"], e.features[0].properties.id]);
  });

  map.on("mouseleave", "license-fill", () => {
    map.getCanvas().style.cursor = "";
    map.setFilter("license-hover", ["==", ["get", "id"], ""]);
  });

  map.on("click", "license-fill", (e: any) => {
    const p = e.features[0].properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `<div style="font-family:sans-serif;font-size:13px;max-width:240px;line-height:1.5">` +
          `<div style="font-weight:600;margin-bottom:2px">${p.licenseNumber}</div>` +
          `<div style="color:#6b7280;margin-bottom:6px">${p.objectName}</div>` +
          `<a href="/license/${p.id}" style="color:#2563eb;text-decoration:none">Открыть →</a>` +
          `</div>`
      )
      .addTo(map);
  });
});
