// Map style drawn in the Diago Spice palette, using free OpenFreeMap vector tiles.
// MapLibre paints on a canvas and cannot read CSS variables, so colours are set here.
import type { StyleSpecification } from "maplibre-gl";

const colors = {
  paper: "#f9f8f2",
  park: "#ebe7d9",
  water: "#d6cfc4",
  building: "#efeadf",
  buildingLine: "#dcd5c8",
  casing: "#cabfb5",
  road: "#ffffff",
  mainRoad: "#eeb9b6",
  mainCasing: "#c4060c",
  ink: "#1a1a1a",
  inkSoft: "#5a5249",
};

const FONT = ["Noto Sans Regular"];
const FONT_BOLD = ["Noto Sans Bold"];
const MAIN_ROADS = ["motorway", "trunk", "primary", "secondary"];
const MINOR_ROADS = ["tertiary", "minor", "service"];

export const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution:
        '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> ' +
        '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> ' +
        'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": colors.paper } },
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass"]]],
      paint: { "fill-color": colors.park, "fill-opacity": 0.8 },
    },
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: { "fill-color": colors.park },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": colors.water },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: { "line-color": colors.water, "line-width": 2 },
    },
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: { "fill-color": colors.building, "fill-outline-color": colors.buildingLine },
    },
    {
      id: "road-minor-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", MINOR_ROADS]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.casing,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 15, 7, 18, 22],
      },
    },
    {
      id: "road-main-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", MAIN_ROADS]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.mainCasing,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 10, 18, 28],
      },
    },
    {
      id: "road-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", MINOR_ROADS]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.road,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 15, 5, 18, 19],
      },
    },
    {
      id: "road-main",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", MAIN_ROADS]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.mainRoad,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 8, 18, 25],
      },
    },
    {
      id: "rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["==", ["get", "class"], "rail"],
      paint: { "line-color": colors.inkSoft, "line-width": 1, "line-dasharray": [3, 3] },
    },
    {
      id: "road-name",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 13,
      layout: {
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
        "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 14],
      },
      paint: { "text-color": colors.inkSoft, "text-halo-color": colors.paper, "text-halo-width": 1.5 },
    },
    {
      id: "place-name",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      layout: {
        "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
        "text-font": FONT_BOLD,
        "text-size": ["match", ["get", "class"], "city", 18, "town", 16, 13],
      },
      paint: { "text-color": colors.ink, "text-halo-color": colors.paper, "text-halo-width": 2 },
    },
  ],
};
