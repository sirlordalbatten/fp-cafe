import fs from "fs";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath, geoArea, geoCentroid } from "d3-geo";
import countries from "i18n-iso-countries";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json"));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== "Antarctica");
const W = 1000, H = 500;
const proj = geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], fc);
const path = geoPath(proj).digits(1);
const out = {}, cen = {}, names = {};
const FIX = { Kosovo: "XK", "N. Cyprus": "CY", Somaliland: "SO" };
for (const f of fc.features) {
  let a2 = f.id ? countries.numericToAlpha2(f.id) : FIX[f.properties.name];
  if (!a2) a2 = FIX[f.properties.name]; if (!a2) { console.error("skip", f.properties.name); continue; }
  const d = path(f); if (!d) continue;
  out[a2] = (out[a2] ? out[a2] : "") + d;
  if (!cen[a2]) {
    let g = f.geometry;
    if (g.type === "MultiPolygon") { const big = g.coordinates.map((c) => ({ type: "Polygon", coordinates: c })).sort((x, y) => geoArea(y) - geoArea(x))[0]; g = big; }
    const [x, y] = proj(geoCentroid(g)); cen[a2] = [Math.round(x), Math.round(y)];
    names[a2] = f.properties.name;
  }
}
// small/missing countries that show up in threat data: give them a point
const extra = { SG: [103.8, 1.35], HK: [114.17, 22.3], MT: [14.4, 35.9], LU: [6.13, 49.6], BH: [50.55, 26.07], MU: [57.55, -20.2], MV: [73.5, 4.2], LI: [9.55, 47.15], MC: [7.42, 43.74], AD: [1.52, 42.5], SM: [12.45, 43.94], BB: [-59.55, 13.15], AG: [-61.8, 17.07], SC: [55.45, -4.62], GI: [-5.35, 36.14], BM: [-64.75, 32.3], MO: [113.55, 22.2] };
const enames = { SG: "Singapore", HK: "Hong Kong", MT: "Malta", LU: "Luxembourg", BH: "Bahrain", MU: "Mauritius", MV: "Maldives", LI: "Liechtenstein", MC: "Monaco", AD: "Andorra", SM: "San Marino", BB: "Barbados", AG: "Antigua and Barbuda", SC: "Seychelles", GI: "Gibraltar", BM: "Bermuda", MO: "Macao" };
for (const [k, ll] of Object.entries(extra)) if (!cen[k]) { const [x, y] = proj(ll); cen[k] = [Math.round(x), Math.round(y)]; names[k] = enames[k]; }
const js = `// World map for the Lounge threat map. Generated from Natural Earth via world-atlas (110m), Natural Earth projection.
// Keys are ISO 3166-1 alpha-2. Do not edit by hand; regenerate with scripts/gen-world.mjs.
export const W = ${W}, H = ${H};
export const PATHS = ${JSON.stringify(out)};
export const CENTROIDS = ${JSON.stringify(cen)};
export const NAMES = ${JSON.stringify(names)};
`;
fs.writeFileSync("world.js", js);
console.log("countries", Object.keys(out).length, "bytes", js.length);
