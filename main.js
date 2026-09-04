import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { initializeExportButton } from "./export-integration.js";

const $ = (id) => document.getElementById(id);

const container = $("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 2.4, 6.6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.82));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
keyLight.position.set(3.5, 5.5, 4.5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x9d7cff, 0.7);
rimLight.position.set(-4, 2.5, -4);
scene.add(rimLight);

const flower = new THREE.Group();
scene.add(flower);

const totalDays = 100;
let day = 0;
let playing = false;
let lastTime = performance.now();
let flowerMeshes = [];
let yaw = 0;
let dragging = false;
let dragStartX = 0;
let dragStartYaw = 0;

const ids = [
  "petalCount", "petalLength", "petalWidth", "petalCurl", "bloomOpenness",
  "petalShape", "petalEdge", "petalLayers", "colorBase", "colorTip",
  "stemHeight", "stemWidth", "stemColor", "leafCount", "leafLength", "leafWidth",
  "leafEdge", "leafPattern", "leafColor", "variegationColor",
  "stamenCount", "stamenHeight", "filamentColor", "antherColor",
  "pollenAmount", "pollenSize", "pollenColor", "growthSpeed",
  // Defenses
  "thornPresence", "thornDensity", "thornLength", "thornShape", "thornColor",
  "trichomeDensity", "surfaceTexture",
  // Carnivorous
  "carnivorousMode", "trapType", "trapSize", "lureColor", "nectarGlow",
  "digestiveFluidColor", "captureSpeed",
  // Advanced physiology
  "scentProfile", "uvPattern", "nectarGuides",
  "photosynthesisEfficiency", "waterDemand", "growthPace"
];

const ui = Object.fromEntries(ids.map((id) => [id, $(id)]));
ui.daySlider = $("daySlider");
ui.dayValue = $("dayValue");
ui.playPauseBtn = $("playPauseBtn");
ui.resetBtn = $("resetBtn");
ui.randomizeBtn = $("randomizeBtn");
ui.saveBtn = $("saveBtn");
ui.loadBtn = $("loadBtn");
ui.loadFile = $("loadFile");

const outputIds = [
  "petalCount", "petalLength", "petalWidth", "petalCurl", "bloomOpenness",
  "stemHeight", "stemWidth", "leafCount", "leafLength", "leafWidth",
  "stamenCount", "stamenHeight", "pollenAmount", "pollenSize", "growthSpeed",
  "thornDensity", "thornLength", "trichomeDensity",
  "trapSize", "nectarGlow", "captureSpeed",
  "uvPattern", "photosynthesisEfficiency", "waterDemand"
];

const outputs = Object.fromEntries(outputIds.map((id) => [id, $(`${id}Value`)]));

function readParams() {
  const params = {};
  for (const id of ids) {
    if (!ui[id]) continue;
    params[id] = ui[id].type === "range" ? Number(ui[id].value) : ui[id].value;
  }
  return params;
}

function syncOutputs() {
  for (const id of outputIds) {
    if (outputs[id] && ui[id]) outputs[id].textContent = ui[id].value;
  }
  if (ui.dayValue) ui.dayValue.textContent = Math.round(day);
  if (ui.daySlider) ui.daySlider.value = Math.round(day);
}

function plantGrowth(dayValue) {
  const t = THREE.MathUtils.clamp(dayValue / 64, 0, 1);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function stage(dayValue, start, end) {
  return THREE.MathUtils.smoothstep(dayValue, start, end);
}

function add(mesh) {
  flowerMeshes.push(mesh);
  flower.add(mesh);
  return mesh;
}

function clearFlower() {
  for (const mesh of flowerMeshes) {
    flower.remove(mesh);
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
    else mesh.material?.dispose();
  }
  flowerMeshes = [];
}

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.04, side: THREE.DoubleSide, ...options });
}

function makeRibbonGeometry(points, widths) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 1)];
    const tangent = after.clone().sub(before).normalize();
    let side = new THREE.Vector3(0, 1, 0).cross(tangent);
    if (side.lengthSq() < 0.0001) side = new THREE.Vector3(1, 0, 0);
    side.normalize().multiplyScalar(widths[i] / 2);
    positions.push(points[i].x + side.x, points[i].y + side.y, points[i].z + side.z);
    positions.push(points[i].x - side.x, points[i].y - side.y, points[i].z - side.z);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, t, 1, t);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildStem(params, grown) {
  const height = Math.max(0.025, params.stemHeight * grown);
  const rawWidth = (typeof params.stemWidth === "number" && !isNaN(params.stemWidth)) ? params.stemWidth : 0.35;
  const topRadius = Math.max(0.015, rawWidth * 0.18);
  const bottomRadius = Math.max(0.025, rawWidth * 0.35);

  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 16);
  const stem = new THREE.Mesh(geometry, createMaterial(params.stemColor, { roughness: 0.84 }));
  stem.position.y = height / 2;
  add(stem);
  
  // Build thorns on stem
  if (params.thornPresence === "true") buildThorns(params, stem.position.y, height, topRadius);
  
  // Build trichomes
  if (params.trichomeDensity > 0.05) buildTrichomes(params, stem.position.y, height, topRadius);
}

function buildThorns(params, startY, stemHeight, stemRadius) {
  const thornCount = Math.round(params.thornDensity * 14);
  const thornLength = params.thornLength * 0.45;
  
  for (let i = 0; i < thornCount; i++) {
    const angle = (i / thornCount) * Math.PI * 2 + (i * 0.4);
    const y = startY + (Math.random() - 0.5) * stemHeight * 0.75;
    
    const thornGeo = new THREE.ConeGeometry(0.02, thornLength, 8);
    const thorn = new THREE.Mesh(thornGeo, createMaterial(params.thornColor, { roughness: 0.6 }));
    
    thorn.position.set(Math.cos(angle) * (stemRadius + 0.02), y, Math.sin(angle) * (stemRadius + 0.02));
    thorn.rotation.x = Math.PI / 2 - 0.25;
    thorn.rotation.z = angle;
    
    if (params.thornShape === "curved") thorn.rotation.x += 0.25;
    if (params.thornShape === "hooked") thorn.rotation.x += 0.5;
    
    add(thorn);
  }
}

function buildTrichomes(params, startY, stemHeight, stemRadius) {
  const trichomeCount = Math.round(params.trichomeDensity * 24);
  
  for (let i = 0; i < trichomeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const y = startY + (Math.random() - 0.5) * stemHeight * 0.9;
    
    const hairGeo = new THREE.CylinderGeometry(0.003, 0.005, 0.09, 6);
    const hair = new THREE.Mesh(hairGeo, createMaterial(params.stemColor, { roughness: 0.9, transparent: true, opacity: 0.75 }));
    
    hair.position.set(Math.cos(angle) * (stemRadius + 0.01), y, Math.sin(angle) * (stemRadius + 0.01));
    hair.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    
    add(hair);
  }
}

function buildLeaves(params, grown) {
  const leafGrowth = stage(day, 12, 48);
  if (params.leafCount === 0 || leafGrowth < 0.02) return;

  for (let i = 0; i < params.leafCount; i++) {
    const ratio = (i + 1) / (params.leafCount + 1);
    const angle = i * 2.399 + 0.45;
    const length = params.leafLength * leafGrowth * (0.75 + 0.25 * Math.sin(i * 1.7 + 1));
    const width = params.leafWidth * leafGrowth;
    const baseY = params.stemHeight * grown * (0.12 + ratio * 0.72);

    const points = [];
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const sideDirection = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));

    for (let s = 0; s <= 20; s++) {
      const t = s / 20;
      const wobble = params.leafEdge === "jagged" ? Math.sin(t * Math.PI * 10 + i) * 0.045 * length : 0;
      const point = direction.clone().multiplyScalar(length * t + wobble);
      point.add(sideDirection.clone().multiplyScalar(Math.sin(t * Math.PI * 2) * 0.025 * length));
      point.y = baseY + 0.25 * length * Math.sin(t * Math.PI * 0.75) - t * t * 0.08 * length;
      points.push(point);
    }

    const widths = points.map((point, pointIndex) => {
      const t = pointIndex / (points.length - 1);
      const serration = params.leafEdge === "jagged" ? 1 + 0.13 * Math.sin(t * Math.PI * 10 + i) : 1;
      return width * Math.sin(t * Math.PI) * serration;
    });

    const leaf = new THREE.Mesh(makeRibbonGeometry(points, widths), createMaterial(params.leafColor, { roughness: 0.7 }));
    add(leaf);

    if (params.leafPattern === "variegated") {
      const stripePoints = points.map((p) => p.clone().add(new THREE.Vector3(0, 0.003, 0)));
      const stripeWidths = widths.map((w) => w * 0.3);
      const stripe = new THREE.Mesh(makeRibbonGeometry(stripePoints, stripeWidths), createMaterial(params.variegationColor, { roughness: 0.62 }));
      add(stripe);
    }
    
    // Thorns on leaf edges
    if (params.thornPresence === "true" && params.leafEdge === "jagged") {
      buildLeafThorns(params, points, widths);
    }
    
    // Trichomes on leaf surface
    if (params.trichomeDensity > 0.1) {
      buildLeafTrichomes(params, points);
    }
  }
}

function buildLeafThorns(params, points, widths) {
  const thornCount = Math.min(3, Math.round(params.thornDensity * 5));
  for (let i = 0; i < thornCount; i++) {
    const idx = Math.floor((i + 1) * points.length / (thornCount + 1));
    if (idx >= points.length) continue;
    
    const thornGeo = new THREE.ConeGeometry(0.01, params.thornLength * 0.2, 6);
    const thorn = new THREE.Mesh(thornGeo, createMaterial(params.thornColor, { roughness: 0.6 }));
    thorn.position.copy(points[idx]);
    thorn.position.y += 0.01;
    thorn.rotation.x = Math.PI / 2;
    add(thorn);
  }
}

function buildLeafTrichomes(params, points) {
  const trichomeCount = Math.round(params.trichomeDensity * 8);
  for (let i = 0; i < trichomeCount; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const hairGeo = new THREE.CylinderGeometry(0.002, 0.004, 0.05, 5);
    const hair = new THREE.Mesh(hairGeo, createMaterial(params.leafColor, { roughness: 0.9, transparent: true, opacity: 0.6 }));
    hair.position.copy(points[idx]);
    hair.position.y += 0.015;
    add(hair);
  }
}

function buildBud(params, stemTop) {
  const budGrowth = stage(day, 34, 66);
  const bloomOpening = stage(day, 68, 88);
  if (budGrowth < 0.02 || bloomOpening > 0.98) return;

  const budColor = new THREE.Color(params.stemColor).lerp(new THREE.Color(params.colorBase), 0.3);
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.25 * budGrowth, 18, 14), createMaterial(budColor, { roughness: 0.46, transparent: true, opacity: 1 - bloomOpening * 0.9 }));
  bud.scale.set(0.84, 1.3, 0.84);
  bud.position.y = stemTop + 0.06 * budGrowth;
  add(bud);
}

function makePetalPoints(params, angle, layer, stemTop, petalSize, opening, offset) {
  const points = [];
  const segments = 30;
  const layerScale = layer === 1 ? 0.72 : 1;
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const twist = params.petalCurl * t * Math.PI * 0.72;
    const direction = angle + twist;
    const upwardDistance = petalSize * layerScale * t * (1 - opening * 0.94);
    const outwardDistance = petalSize * layerScale * opening * (0.1 + 0.95 * t) * t;
    const ruffle = Math.sin(t * Math.PI * 2.3 + offset) * 0.065 * petalSize * (params.petalEdge === "ruffled" ? 1 : 0.18);
    const curlLift = Math.sin(t * Math.PI) * params.petalCurl * 0.2 * petalSize;
    const x = Math.cos(direction) * (outwardDistance + ruffle);
    const z = Math.sin(direction) * (outwardDistance + ruffle);
    const y = stemTop + upwardDistance + curlLift + layer * 0.025;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

function buildPetals(params, stemTop) {
  const petalGrowth = stage(day, 48, 76);
  const opening = params.bloomOpenness * stage(day, 68, 92);
  if (petalGrowth < 0.015) return;

  const layerCount = params.petalLayers === "double" ? 2 : 1;
  const baseColor = new THREE.Color(params.colorBase);
  const tipColor = new THREE.Color(params.colorTip);
  const petalSize = params.petalLength * petalGrowth;

  for (let layer = 0; layer < layerCount; layer++) {
    const petalCount = layer === 1 ? Math.max(3, Math.floor(params.petalCount * 0.8)) : params.petalCount;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 + (layer ? Math.PI / petalCount : 0);
      const points = makePetalPoints(params, angle, layer, stemTop, petalSize, opening, i * 0.8 + layer);
      const widths = points.map((point, pointIndex) => {
        const t = pointIndex / (points.length - 1);
        const profile = params.petalShape === "round" ? Math.pow(Math.sin(t * Math.PI), 0.56) : Math.pow(Math.sin(t * Math.PI), 1.5) * (1 - 0.12 * t);
        const ruffle = params.petalEdge === "ruffled" ? 1 + 0.12 * Math.sin(t * Math.PI * 9 + i) : 1;
        return params.petalWidth * petalGrowth * profile * ruffle * (layer ? 0.8 : 1);
      });
      const shade = 0.3 + (i % 4) * 0.13 + layer * 0.08;
      const petalColor = baseColor.clone().lerp(tipColor, Math.min(0.92, shade));
      const petal = new THREE.Mesh(makeRibbonGeometry(points, widths), createMaterial(petalColor, { roughness: 0.43, emissive: petalColor.clone().multiplyScalar(0.055) }));
      add(petal);
    }
  }
}

function makeTube(points, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 7, false), createMaterial(color, { roughness: 0.35 }));
}

function buildCoreStamensAndPollen(params, stemTop) {
  const coreGrowth = stage(day, 76, 94);
  if (coreGrowth < 0.02) return;

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.13 * coreGrowth, 16, 12), createMaterial(params.antherColor, { roughness: 0.35, emissive: new THREE.Color(params.antherColor).multiplyScalar(0.08) }));
  core.position.y = stemTop + 0.02;
  add(core);

  if (params.stamenCount === 0) return;

  for (let i = 0; i < params.stamenCount; i++) {
    const angle = (i / params.stamenCount) * Math.PI * 2;
    const height = params.stamenHeight * coreGrowth * (0.82 + 0.18 * Math.sin(i * 2.3));
    const points = [
      new THREE.Vector3(Math.cos(angle) * 0.035, stemTop, Math.sin(angle) * 0.035),
      new THREE.Vector3(Math.cos(angle) * 0.08, stemTop + height * 0.52, Math.sin(angle) * 0.08),
      new THREE.Vector3(Math.cos(angle) * 0.18, stemTop + height, Math.sin(angle) * 0.18),
    ];
    const filament = makeTube(points, 0.014 * coreGrowth, params.filamentColor);
    add(filament);
    const anther = new THREE.Mesh(new THREE.SphereGeometry(0.052 * coreGrowth, 10, 8), createMaterial(params.antherColor, { roughness: 0.34 }));
    anther.position.copy(points[2]);
    anther.scale.set(0.8, 1.35, 0.8);
    add(anther);
  }

  const pollenMaterial = createMaterial(params.pollenColor, { roughness: 0.3, emissive: new THREE.Color(params.pollenColor).multiplyScalar(0.05) });
  const grainCount = Math.round(params.pollenAmount * coreGrowth);
  for (let i = 0; i < grainCount; i++) {
    const angle = i * 2.399963;
    const radius = 0.03 + (((i * 17) % 100) / 100) * 0.24 * coreGrowth;
    const pollenY = stemTop + params.stamenHeight * coreGrowth * (0.62 + (((i * 13) % 100) / 100) * 0.45);
    const pollen = new THREE.Mesh(new THREE.SphereGeometry(params.pollenSize * coreGrowth, 7, 6), pollenMaterial);
    pollen.position.set(Math.cos(angle) * radius, pollenY, Math.sin(angle) * radius);
    add(pollen);
  }
}

function buildCarnivorousStructures(params, stemTop) {
  if (params.carnivorousMode !== "true") return;
  
  const trapGrowth = stage(day, 60, 90);
  if (trapGrowth < 0.02) return;
  
  const trapSize = params.trapSize * trapGrowth;
  
  if (params.trapType === "snap") {
    for (let side = -1; side <= 1; side += 2) {
      const lobeGeo = new THREE.SphereGeometry(trapSize * 0.5, 16, 12);
      const lobe = new THREE.Mesh(lobeGeo, createMaterial(params.lureColor, { roughness: 0.4, side: THREE.DoubleSide }));
      lobe.position.set(0, stemTop + trapSize * 0.3, side * trapSize * 0.4);
      lobe.scale.set(1, 0.6, 0.8);
      lobe.rotation.x = side * 0.3;
      add(lobe);
      
      for (let h = 0; h < 5; h++) {
        const hairGeo = new THREE.CylinderGeometry(0.005, 0.008, trapSize * 0.3, 6);
        const hair = new THREE.Mesh(hairGeo, createMaterial(params.stemColor, { roughness: 0.8 }));
        hair.position.set((h - 2) * 0.04, stemTop + trapSize * 0.3, side * trapSize * 0.5);
        add(hair);
      }
    }
  } else if (params.trapType === "pitcher") {
    const pitcherGeo = new THREE.CylinderGeometry(trapSize * 0.3, trapSize * 0.5, trapSize * 0.8, 12);
    const pitcher = new THREE.Mesh(pitcherGeo, createMaterial(params.lureColor, { roughness: 0.5, transparent: true, opacity: 0.9 }));
    pitcher.position.set(0, stemTop + trapSize * 0.4, 0);
    pitcher.rotation.x = 0.3;
    add(pitcher);
    
    const fluidGeo = new THREE.CylinderGeometry(trapSize * 0.25, trapSize * 0.45, trapSize * 0.3, 12);
    const fluid = new THREE.Mesh(fluidGeo, createMaterial(params.digestiveFluidColor, { roughness: 0.3, transparent: true, opacity: 0.7 }));
    fluid.position.set(0, stemTop + trapSize * 0.2, 0);
    fluid.rotation.x = 0.3;
    add(fluid);
  } else if (params.trapType === "sticky") {
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const stalkGeo = new THREE.CylinderGeometry(0.008, 0.012, trapSize * 0.4, 8);
      const stalk = new THREE.Mesh(stalkGeo, createMaterial(params.stemColor, { roughness: 0.7 }));
      stalk.position.set(Math.cos(angle) * trapSize * 0.3, stemTop, Math.sin(angle) * trapSize * 0.3);
      add(stalk);
      
      const glandGeo = new THREE.SphereGeometry(trapSize * 0.08, 8, 6);
      const gland = new THREE.Mesh(glandGeo, createMaterial(params.lureColor, { roughness: 0.4, emissive: new THREE.Color(params.lureColor).multiplyScalar(params.nectarGlow) }));
      gland.position.set(Math.cos(angle) * trapSize * 0.3, stemTop + trapSize * 0.4, Math.sin(angle) * trapSize * 0.3);
      add(gland);
    }
  } else if (params.trapType === "bladder") {
    const bladderGeo = new THREE.SphereGeometry(trapSize * 0.4, 16, 12);
    const bladder = new THREE.Mesh(bladderGeo, createMaterial(params.lureColor, { roughness: 0.4, transparent: true, opacity: 0.85 }));
    bladder.position.set(0, stemTop + trapSize * 0.3, 0);
    bladder.scale.set(0.8, 1.2, 0.8);
    add(bladder);
    
    const doorGeo = new THREE.SphereGeometry(trapSize * 0.15, 10, 8);
    const door = new THREE.Mesh(doorGeo, createMaterial(params.digestiveFluidColor, { roughness: 0.5 }));
    door.position.set(0, stemTop + trapSize * 0.1, trapSize * 0.35);
    add(door);
  }
}

function rebuildFlower() {
  const params = readParams();
  const grown = plantGrowth(day);
  const stemTop = params.stemHeight * grown;
  clearFlower();
  buildStem(params, grown);
  buildLeaves(params, grown);
  buildBud(params, stemTop);
  buildPetals(params, stemTop);
  buildCoreStamensAndPollen(params, stemTop);
  buildCarnivorousStructures(params, stemTop);
  syncOutputs();
}

function resizeRenderer() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function randomHexColor() {
  const color = new THREE.Color().setHSL(Math.random(), 0.65 + Math.random() * 0.25, 0.42 + Math.random() * 0.25);
  return `#${color.getHexString()}`;
}

function randomizeFlower() {
  ui.petalCount.value = String(5 + Math.floor(Math.random() * 16));
  ui.petalLength.value = (0.8 + Math.random() * 2.2).toFixed(1);
  ui.petalWidth.value = (0.18 + Math.random() * 0.64).toFixed(2);
  ui.petalCurl.value = (-0.85 + Math.random() * 1.7).toFixed(2);
  ui.bloomOpenness.value = (0.35 + Math.random() * 0.62).toFixed(2);
  ui.petalShape.value = Math.random() > 0.45 ? "long" : "round";
  ui.petalEdge.value = Math.random() > 0.42 ? "ruffled" : "smooth";
  ui.petalLayers.value = Math.random() > 0.45 ? "double" : "single";
  ui.colorBase.value = randomHexColor();
  ui.colorTip.value = randomHexColor();
  ui.stemHeight.value = (1 + Math.random() * 2.1).toFixed(1);
  ui.stemWidth.value = (0.15 + Math.random() * 0.65).toFixed(2);
  ui.leafCount.value = String(3 + Math.floor(Math.random() * 10));
  ui.leafLength.value = (0.35 + Math.random() * 0.85).toFixed(2);
  ui.leafWidth.value = (0.12 + Math.random() * 0.32).toFixed(2);
  ui.leafEdge.value = Math.random() > 0.45 ? "jagged" : "smooth";
  ui.leafPattern.value = Math.random() > 0.45 ? "variegated" : "solid";
  ui.leafColor.value = randomHexColor();
  ui.variegationColor.value = randomHexColor();
  ui.stamenCount.value = String(6 + Math.floor(Math.random() * 20));
  ui.stamenHeight.value = (0.28 + Math.random() * 0.85).toFixed(2);
  ui.filamentColor.value = "#f5edff";
  ui.antherColor.value = randomHexColor();
  ui.pollenAmount.value = String(15 + Math.floor(Math.random() * 70));
  ui.pollenSize.value = (0.014 + Math.random() * 0.032).toFixed(3);
  ui.pollenColor.value = randomHexColor();
  
  ui.thornPresence.value = Math.random() > 0.5 ? "true" : "false";
  ui.thornDensity.value = (Math.random() * 0.8).toFixed(2);
  ui.thornLength.value = (0.2 + Math.random() * 0.5).toFixed(2);
  ui.thornShape.value = ["straight", "curved", "hooked"][Math.floor(Math.random() * 3)];
  ui.thornColor.value = randomHexColor();
  ui.trichomeDensity.value = (Math.random() * 0.7).toFixed(2);
  
  ui.carnivorousMode.value = Math.random() > 0.7 ? "true" : "false";
  ui.trapType.value = ["snap", "pitcher", "sticky", "bladder"][Math.floor(Math.random() * 4)];
  ui.trapSize.value = (0.3 + Math.random() * 0.7).toFixed(2);
  ui.lureColor.value = randomHexColor();
  ui.digestiveFluidColor.value = randomHexColor();
  
  ui.scentProfile.value = ["sweet", "spiced", "fruity", "floral", "musky", "none"][Math.floor(Math.random() * 6)];
  ui.uvPattern.value = (Math.random() * 0.8).toFixed(2);
  
  day = totalDays;
  rebuildFlower();
}

for (const id of ids) {
  if (ui[id]) ui[id].addEventListener("input", rebuildFlower);
}

ui.daySlider.addEventListener("input", () => { day = Number(ui.daySlider.value); rebuildFlower(); });
ui.playPauseBtn.addEventListener("click", () => { playing = !playing; ui.playPauseBtn.textContent = playing ? "Pause" : "Play"; });
ui.resetBtn.addEventListener("click", () => { playing = false; ui.playPauseBtn.textContent = "Play"; day = 0; rebuildFlower(); });
ui.randomizeBtn.addEventListener("click", randomizeFlower);

ui.saveBtn.addEventListener("click", () => {
  const design = { name: "Abstract Bloom", version: "0.4", day, ...readParams() };
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "abstract-bloom.json";
  link.click();
  URL.revokeObjectURL(url);
});

ui.loadBtn.addEventListener("click", () => ui.loadFile.click());
ui.loadFile.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const design = JSON.parse(reader.result);
      for (const id of ids) if (design[id] !== undefined && ui[id]) ui[id].value = design[id];
      day = Number(design.day ?? totalDays);
      rebuildFlower();
    } catch { alert("That file is not a valid Abstract Bloom design."); }
  };
  reader.readAsText(file);
  event.target.value = "";
});

container.addEventListener("pointerdown", (event) => { dragging = true; dragStartX = event.clientX; dragStartYaw = yaw; container.setPointerCapture(event.pointerId); });
container.addEventListener("pointermove", (event) => { if (!dragging) return; yaw = dragStartYaw + (event.clientX - dragStartX) * 0.012; });
container.addEventListener("pointerup", () => { dragging = false; });
container.addEventListener("pointercancel", () => { dragging = false; });
container.addEventListener("wheel", (event) => { event.preventDefault(); camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.004, 3.7, 10); }, { passive: false });

function animate(now) {
  requestAnimationFrame(animate);
  const seconds = Math.min(0.06, (now - lastTime) / 1000);
  lastTime = now;
  if (playing) {
    const speed = Number(ui.growthSpeed.value);
    day = Math.min(totalDays, day + seconds * 16 * speed);
    if (day >= totalDays) { playing = false; ui.playPauseBtn.textContent = "Play"; }
    rebuildFlower();
  }
  if (!dragging) yaw += 0.0018;
  flower.rotation.y = yaw;
  renderer.render(scene, camera);
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer();
rebuildFlower();
requestAnimationFrame(animate);
initializeExportButton();
