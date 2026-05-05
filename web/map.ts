import { MINERAL_GROUP_COLORS } from "@shared/minerals";

declare const maplibregl: any;

const el = document.getElementById("map");
if (!el) throw new Error("No #map element");

const qs = (el as HTMLElement).dataset["qs"];
const geojsonUrl = `/api/features.geojson${qs ? "?" + qs : ""}`;

const form = document.querySelector("form") as HTMLFormElement | null;
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  new FormData(form).forEach((value, key) => params.append(key, value as string));
  const newQs = params.toString();
  history.pushState({}, "", "/map" + (newQs ? "?" + newQs : ""));
  const url = `/api/features.geojson${newQs ? "?" + newQs : ""}`;
  (map.getSource("licenses") as any)?.setData(url);
});

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
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
        ["match", ["get", "mineralGroup"], ...Object.entries(MINERAL_GROUP_COLORS).flat(), "#9ca3af"],
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

  const panel = document.getElementById("license-panel")!;
  const panelContent = document.getElementById("license-panel-content")!;
  const panelClose = document.getElementById("license-panel-close")!;

  function openPanel(html: string) {
    panelContent.innerHTML = html;
    panel.style.display = "block";
  }

  function closePanel() {
    panel.style.display = "none";
  }

  panelClose.addEventListener("click", closePanel);

  map.on("click", "license-fill", (e: any) => {
    const p = e.features[0].properties;
    fetch(`/api/license/${p.id}/fragment`)
      .then((r) => r.text())
      .then(openPanel);
  });

  map.on("click", (e: any) => {
    if (!map.queryRenderedFeatures(e.point, { layers: ["license-fill"] }).length) {
      closePanel();
    }
  });
});
