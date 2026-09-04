import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { initializeExportButton } from "./export-integration.js";

const $ = (id) => document.getElementById(id);

const container = $("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

let cameraRadius = 6.4;
let cameraPitch = 0.35;
let cameraYaw = 0;
let targetLookY = 2.0;

function updateCameraPosition() {
  const horizontalDist = cameraRadius * Math.cos(cameraPitch);
  camera.position.x = horizontalDist * Math.sin(cameraYaw);
  camera.position.z = horizontalDist * Math.cos(cameraYaw);
  camera.position.y = targetLookY + cameraRadius * Math.sin(cameraPitch);
  camera.lookAt(0, targetLookY, 0);
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Multi-point Studio Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(4.5, 8.0, 4.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xa884ff, 0.95);
rimLight.position.set(-5, 4.5, -4.5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x6ee7b7, 0.5);
fillLight.position.set(0, -3, 3.5);
scene.add(fillLight);

const flower = new THREE.Group();
scene.add(flower);

// ===== HIGH-CONTRAST PROCEDURAL TEXTURE GENERATORS (WITH NORMAL MAPS) =====

function createPetalMaps(baseHex, tipHex, uvStrength = 0.4) {
  // 1. Diffuse / Albedo Map
  const dCanvas = document.createElement("canvas");
  dCanvas.width = 512;
  dCanvas.height = 512;
  const dCtx = dCanvas.getContext("2d");

  // Longitudinal Gradient (v=0 throat -> v=1 tip)
  const grad = dCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(0.35, baseHex);
  grad.addColorStop(0.85, tipHex);
  grad.addColorStop(1, tipHex);
  dCtx.fillStyle = grad;
  dCtx.fillRect(0, 0, 512, 512);

  // 2. Normal Map Canvas (for physical light displacement)
  const nCanvas = document.createElement("canvas");
  nCanvas.width = 512;
  nCanvas.height = 512;
  const nCtx = nCanvas.getContext("2d");
  nCtx.fillStyle = "rgb(128, 128, 255)"; // Flat normal neutral
  nCtx.fillRect(0, 0, 512, 512);

  // High-Contrast Veins & Normal Creases
  for (let i = 0; i <= 36; i++) {
    const normX = i / 36;
    const xPos = normX * 512;
    const spread = (normX - 0.5) * 60;

    // Diffuse highlight
    dCtx.beginPath();
    dCtx.moveTo(xPos, 0);
    dCtx.bezierCurveTo(xPos + spread * 0.4, 160, xPos + spread * 0.8, 360, xPos + spread, 512);
    dCtx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    dCtx.lineWidth = 2.4;
    dCtx.stroke();

    // Diffuse shadow trench
    dCtx.beginPath();
    dCtx.moveTo(xPos + 1.5, 0);
    dCtx.bezierCurveTo(xPos + spread * 0.4 + 1.5, 160, xPos + spread * 0.8 + 1.5, 360, xPos + spread + 1.5, 512);
    dCtx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    dCtx.lineWidth = 2.0;
    dCtx.stroke();

    // Normal Map Left/Right bevels
    nCtx.beginPath();
    nCtx.moveTo(xPos - 1, 0);
    nCtx.bezierCurveTo(xPos + spread * 0.4 - 1, 160, xPos + spread * 0.8 - 1, 360, xPos + spread - 1, 512);
    nCtx.strokeStyle = "rgb(170, 128, 255)";
    nCtx.lineWidth = 2.0;
    nCtx.stroke();

    nCtx.beginPath();
    nCtx.moveTo(xPos + 1, 0);
    nCtx.bezierCurveTo(xPos + spread * 0.4 + 1, 160, xPos + spread * 0.8 + 1, 360, xPos + spread + 1, 512);
    nCtx.strokeStyle = "rgb(85, 128, 255)";
    nCtx.lineWidth = 2.0;
    nCtx.stroke();
  }

  // Botanical Freckles / Spots
  for (let s = 0; s < 140; s++) {
    const spotX = 256 + (Math.random() - 0.5) * 440 * (1 - s / 180);
    const spotY = 15 + Math.random() * 160;
    const r = 1.5 + Math.random() * 3.5;

    dCtx.beginPath();
    dCtx.arc(spotX, spotY, r, 0, Math.PI * 2);
    dCtx.fillStyle = "rgba(25, 0, 35, 0.85)";
    dCtx.fill();

    dCtx.beginPath();
    dCtx.arc(spotX, spotY, r * 1.6, 0, Math.PI * 2);
    dCtx.fillStyle = "rgba(255, 210, 240, 0.35)";
    dCtx.fill();

    // Bump pit in normal map
    nCtx.beginPath();
    nCtx.arc(spotX, spotY, r, 0, Math.PI * 2);
    nCtx.fillStyle = "rgb(128, 100, 230)";
    nCtx.fill();
  }

  // UV Guide Lines
  if (uvStrength > 0.05) {
    for (let u = -4; u <= 4; u++) {
      dCtx.beginPath();
      dCtx.moveTo(256 + u * 20, 0);
      dCtx.lineTo(256 + u * 45, 260);
      dCtx.strokeStyle = `rgba(255, 255, 255, ${uvStrength * 0.6})`;
      dCtx.lineWidth = 3.0;
      dCtx.stroke();
    }
  }

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.ClampToEdgeWrapping;
  diffuse.wrapT = THREE.ClampToEdgeWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;

  const normal = new THREE.CanvasTexture(nCanvas);
  normal.wrapS = THREE.ClampToEdgeWrapping;
  normal.wrapT = THREE.ClampToEdgeWrapping;

  return { diffuse, normal };
}

function createLeafMaps(leafHex, varHex, pattern = "variegated") {
  const dCanvas = document.createElement("canvas");
  dCanvas.width = 512;
  dCanvas.height = 512;
  const dCtx = dCanvas.getContext("2d");

  dCtx.fillStyle = leafHex;
  dCtx.fillRect(0, 0, 512, 512);

  const nCanvas = document.createElement("canvas");
  nCanvas.width = 512;
  nCanvas.height = 512;
  const nCtx = nCanvas.getContext("2d");
  nCtx.fillStyle = "rgb(128, 128, 255)";
  nCtx.fillRect(0, 0, 512, 512);

  if (pattern === "variegated") {
    dCtx.fillStyle = varHex;
    for (let y = 0; y < 512; y += 8) {
      const margin = 35 + Math.sin(y * 0.08) * 18 + Math.random() * 12;
      dCtx.fillRect(0, y, margin, 10);
      dCtx.fillRect(512 - margin, y, margin, 10);
    }
  }

  // Midrib
  dCtx.beginPath();
  dCtx.moveTo(256, 0);
  dCtx.lineTo(256, 512);
  dCtx.strokeStyle = pattern === "variegated" ? varHex : "rgba(255, 255, 255, 0.7)";
  dCtx.lineWidth = 7;
  dCtx.stroke();

  nCtx.beginPath();
  nCtx.moveTo(254, 0);
  nCtx.lineTo(254, 512);
  nCtx.strokeStyle = "rgb(190, 128, 255)";
  nCtx.lineWidth = 4;
  nCtx.stroke();

  nCtx.beginPath();
  nCtx.moveTo(258, 0);
  nCtx.lineTo(258, 512);
  nCtx.strokeStyle = "rgb(65, 128, 255)";
  nCtx.lineWidth = 4;
  nCtx.stroke();

  // Lateral Secondary Veins
  for (let y = 20; y < 500; y += 32) {
    dCtx.beginPath();
    dCtx.moveTo(256, y);
    dCtx.quadraticCurveTo(140, y + 25, 0, y + 45);
    dCtx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    dCtx.lineWidth = 2.5;
    dCtx.stroke();

    dCtx.beginPath();
    dCtx.moveTo(256, y);
    dCtx.quadraticCurveTo(372, y + 25, 512, y + 45);
    dCtx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    dCtx.lineWidth = 2.5;
    dCtx.stroke();

    // Normal map ridge
    nCtx.beginPath();
    nCtx.moveTo(256, y);
    nCtx.quadraticCurveTo(140, y + 25, 0, y + 45);
    nCtx.strokeStyle = "rgb(160, 160, 255)";
    nCtx.lineWidth = 3.0;
    nCtx.stroke();

    nCtx.beginPath();
    nCtx.moveTo(256, y);
    nCtx.quadraticCurveTo(372, y + 25, 512, y + 45);
    nCtx.strokeStyle = "rgb(95, 95, 255)";
    nCtx.lineWidth = 3.0;
    nCtx.stroke();
  }

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.ClampToEdgeWrapping;
  diffuse.wrapT = THREE.ClampToEdgeWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;

  const normal = new THREE.CanvasTexture(nCanvas);
  normal.wrapS = THREE.ClampToEdgeWrapping;
  normal.wrapT = THREE.ClampToEdgeWrapping;

  return { diffuse, normal };
}

function createStemMaps(stemHex) {
  const dCanvas = document.createElement("canvas");
  dCanvas.width = 256;
  dCanvas.height = 512;
  const dCtx = dCanvas.getContext("2d");
  dCtx.fillStyle = stemHex;
  dCtx.fillRect(0, 0, 256, 512);

  const nCanvas = document.createElement("canvas");
  nCanvas.width = 256;
  nCanvas.height = 512;
  const nCtx = nCanvas.getContext("2d");
  nCtx.fillStyle = "rgb(128, 128, 255)";
  nCtx.fillRect(0, 0, 256, 512);

  for (let x = 0; x < 256; x += 6) {
    const tone = (Math.random() - 0.5) * 90;
    dCtx.fillStyle = `rgba(${tone > 0 ? 255 : 0}, ${tone > 0 ? 255 : 0}, ${tone > 0 ? 255 : 0}, ${Math.abs(tone) / 255 * 0.55})`;
    dCtx.fillRect(x, 0, 3 + Math.random() * 3, 512);

    const normalVal = Math.round(128 + (tone / 90) * 45);
    nCtx.fillStyle = `rgb(${normalVal}, 128, 255)`;
    nCtx.fillRect(x, 0, 3, 512);
  }

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.repeat.set(3, 1);
  diffuse.colorSpace = THREE.SRGBColorSpace;

  const normal = new THREE.CanvasTexture(nCanvas);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(3, 1);

  return { diffuse, normal };
}

// ===== STATE & PARAMS =====

const totalDays = 100;
let day = 0;
let playing = false;
let lastTime = performance.now();
let flowerMeshes = [];

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startYaw = 0;
let startPitch = 0;

const ids = [
  "petalCount", "petalLength", "petalWidth", "petalCurl", "bloomOpenness",
  "petalShape", "petalEdge", "petalLayers", "colorBase", "colorTip",
  "stemHeight", "stemWidth", "stemColor", "leafCount", "leafLength", "leafWidth",
  "leafEdge", "leafPattern", "leafColor", "variegationColor",
  "stamenCount", "stamenHeight", "filamentColor", "antherColor",
  "pollenAmount", "pollenSize", "pollenColor", "growthSpeed",
  "thornPresence", "thornDensity", "thornLength", "thornShape", "thornColor",
  "trichomeDensity", "surfaceTexture",
  "carnivorousMode", "trapType", "trapSize", "lureColor", "nectarGlow",
  "digestiveFluidColor", "captureSpeed",
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  flowerMeshes.push(mesh);
  flower.add(mesh);
  return mesh;
}

function clearFlower() {
  for (const mesh of flowerMeshes) {
    flower.remove(mesh);
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => {
        m.map?.dispose();
        m.normalMap?.dispose();
        m.dispose();
      });
    } else {
      mesh.material?.map?.dispose();
      mesh.material?.normalMap?.dispose();
      mesh.material?.dispose();
    }
  }
  flowerMeshes = [];
}

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.04,
    side: THREE.DoubleSide,
    ...options,
  });
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
    normals.push(0, 1, 0);
    uvs.push(0, t);

    positions.push(points[i].x - side.x, points[i].y - side.y, points[i].z - side.z);
    normals.push(0, 1, 0);
    uvs.push(1, t);
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
  const w = (typeof params.stemWidth === "number" && !isNaN(params.stemWidth)) ? params.stemWidth : 0.35;
  
  const topRadius = 0.02 + (w - 0.1) * 0.35;
  const bottomRadius = 0.04 + (w - 0.1) * 0.60;

  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24);
  const stemMaps = createStemMaps(params.stemColor);
  const stemMat = new THREE.MeshStandardMaterial({
    map: stemMaps.diffuse,
    normalMap: stemMaps.normal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.62,
    metalness: 0.04
  });
  const stem = new THREE.Mesh(geometry, stemMat);
  stem.position.y = height / 2;
  add(stem);
  
  if (params.thornPresence === "true") buildThorns(params, stem.position.y, height, topRadius);
  if (params.trichomeDensity > 0.05) buildTrichomes(params, stem.position.y, height, topRadius);
}

function buildThorns(params, startY, stemHeight, stemRadius) {
  const thornCount = Math.round(params.thornDensity * 14);
  const thornLength = params.thornLength * 0.45;
  
  for (let i = 0; i < thornCount; i++) {
    const angle = (i / thornCount) * Math.PI * 2 + (i * 0.4);
    const y = startY + (Math.random() - 0.5) * stemHeight * 0.75;
    
    const thornGeo = new THREE.ConeGeometry(0.025, thornLength, 10);
    const thorn = new THREE.Mesh(thornGeo, createMaterial(params.thornColor, { roughness: 0.5 }));
    
    thorn.position.set(Math.cos(angle) * (stemRadius + 0.02), y, Math.sin(angle) * (stemRadius + 0.02));
    thorn.rotation.x = Math.PI / 2 - 0.25;
    thorn.rotation.z = angle;
    
    if (params.thornShape === "curved") thorn.rotation.x += 0.25;
    if (params.thornShape === "hooked") thorn.rotation.x += 0.5;
    
    add(thorn);
  }
}

function buildTrichomes(params, startY, stemHeight, stemRadius) {
  const trichomeCount = Math.round(params.trichomeDensity * 30);
  
  for (let i = 0; i < trichomeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const y = startY + (Math.random() - 0.5) * stemHeight * 0.9;
    
    const hairGeo = new THREE.CylinderGeometry(0.003, 0.005, 0.1, 6);
    const hair = new THREE.Mesh(hairGeo, createMaterial(params.stemColor, { roughness: 0.9, transparent: true, opacity: 0.75 }));
    
    hair.position.set(Math.cos(angle) * (stemRadius + 0.01), y, Math.sin(angle) * (stemRadius + 0.01));
    hair.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    
    add(hair);
  }
}

function buildLeaves(params, grown) {
  const leafGrowth = stage(day, 12, 48);
  if (params.leafCount === 0 || leafGrowth < 0.02) return;

  const leafMaps = createLeafMaps(params.leafColor, params.variegationColor, params.leafPattern);

  for (let i = 0; i < params.leafCount; i++) {
    const ratio = (i + 1) / (params.leafCount + 1);
    const angle = i * 2.399 + 0.45;
    const length = params.leafLength * leafGrowth * (0.75 + 0.25 * Math.sin(i * 1.7 + 1));
    const width = params.leafWidth * leafGrowth;
    const baseY = params.stemHeight * grown * (0.12 + ratio * 0.72);

    const points = [];
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const sideDirection = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));

    for (let s = 0; s <= 24; s++) {
      const t = s / 24;
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

    const leaf = new THREE.Mesh(
      makeRibbonGeometry(points, widths),
      new THREE.MeshStandardMaterial({
        map: leafMaps.diffuse,
        normalMap: leafMaps.normal,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.42,
        side: THREE.DoubleSide
      })
    );
    add(leaf);
  }
}

function buildBud(params, stemTop) {
  const budGrowth = stage(day, 34, 66);
  const bloomOpening = stage(day, 68, 88);
  if (budGrowth < 0.02 || bloomOpening > 0.98) return;

  const budColor = new THREE.Color(params.stemColor).lerp(new THREE.Color(params.colorBase), 0.3);
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.25 * budGrowth, 20, 16), createMaterial(budColor, { roughness: 0.42, transparent: true, opacity: 1 - bloomOpening * 0.9 }));
  bud.scale.set(0.84, 1.3, 0.84);
  bud.position.y = stemTop + 0.06 * budGrowth;
  add(bud);
}

function makePetalPoints(params, angle, layer, stemTop, petalSize, opening, offset) {
  const points = [];
  const segments = 36;
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
  const petalSize = params.petalLength * petalGrowth;
  const petalMaps = createPetalMaps(params.colorBase, params.colorTip, params.uvPattern);

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
      
      const petal = new THREE.Mesh(
        makeRibbonGeometry(points, widths),
        new THREE.MeshStandardMaterial({
          map: petalMaps.diffuse,
          normalMap: petalMaps.normal,
          normalScale: new THREE.Vector2(1.2, 1.2),
          roughness: 0.26,
          metalness: 0.02,
          side: THREE.DoubleSide
        })
      );
      add(petal);
    }
  }
}

function makeTube(points, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), createMaterial(color, { roughness: 0.3 }));
}

function buildCoreStamensAndPollen(params, stemTop) {
  const coreGrowth = stage(day, 76, 94);
  if (coreGrowth < 0.02) return;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.14 * coreGrowth, 20, 16),
    createMaterial(params.antherColor, {
      roughness: 0.28,
      emissive: new THREE.Color(params.antherColor).multiplyScalar(0.12),
    })
  );
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
    const anther = new THREE.Mesh(new THREE.SphereGeometry(0.052 * coreGrowth, 12, 10), createMaterial(params.antherColor, { roughness: 0.28 }));
    anther.position.copy(points[2]);
    anther.scale.set(0.8, 1.35, 0.8);
    add(anther);
  }

  const pollenMaterial = createMaterial(params.pollenColor, { roughness: 0.25, emissive: new THREE.Color(params.pollenColor).multiplyScalar(0.08) });
  const grainCount = Math.round(params.pollenAmount * coreGrowth);
  for (let i = 0; i < grainCount; i++) {
    const angle = i * 2.399963;
    const radius = 0.03 + (((i * 17) % 100) / 100) * 0.24 * coreGrowth;
    const pollenY = stemTop + params.stamenHeight * coreGrowth * (0.62 + (((i * 13) % 100) / 100) * 0.45);
    const pollen = new THREE.Mesh(new THREE.SphereGeometry(params.pollenSize * coreGrowth, 8, 8), pollenMaterial);
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
      const lobeGeo = new THREE.SphereGeometry(trapSize * 0.5, 20, 16);
      const lobe = new THREE.Mesh(lobeGeo, createMaterial(params.lureColor, { roughness: 0.35, side: THREE.DoubleSide }));
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
    const pitcherGeo = new THREE.CylinderGeometry(trapSize * 0.3, trapSize * 0.5, trapSize * 0.8, 16);
    const pitcher = new THREE.Mesh(pitcherGeo, createMaterial(params.lureColor, { roughness: 0.4, transparent: true, opacity: 0.9 }));
    pitcher.position.set(0, stemTop + trapSize * 0.4, 0);
    pitcher.rotation.x = 0.3;
    add(pitcher);
    
    const fluidGeo = new THREE.CylinderGeometry(trapSize * 0.25, trapSize * 0.45, trapSize * 0.3, 16);
    const fluid = new THREE.Mesh(fluidGeo, createMaterial(params.digestiveFluidColor, { roughness: 0.25, transparent: true, opacity: 0.75 }));
    fluid.position.set(0, stemTop + trapSize * 0.2, 0);
    fluid.rotation.x = 0.3;
    add(fluid);
  }
}

function rebuildFlower() {
  const params = readParams();
  const grown = plantGrowth(day);
  const stemTop = params.stemHeight * grown;
  
  targetLookY = THREE.MathUtils.lerp(0.8, stemTop, 0.7);
  
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

$("viewSideBtn")?.addEventListener("click", () => {
  cameraPitch = 0.05;
  cameraRadius = 6.0;
  updateCameraPosition();
});

$("viewAngledBtn")?.addEventListener("click", () => {
  cameraPitch = 0.55;
  cameraRadius = 5.8;
  updateCameraPosition();
});

$("viewTopBtn")?.addEventListener("click", () => {
  cameraPitch = 1.45;
  cameraRadius = 5.0;
  updateCameraPosition();
});

container.addEventListener("pointerdown", (event) => {
  dragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  startYaw = cameraYaw;
  startPitch = cameraPitch;
  container.setPointerCapture(event.pointerId);
});

container.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;
  
  cameraYaw = startYaw - deltaX * 0.012;
  cameraPitch = THREE.MathUtils.clamp(startPitch + deltaY * 0.012, -0.15, 1.48);
  updateCameraPosition();
});

container.addEventListener("pointerup", () => { dragging = false; });
container.addEventListener("pointercancel", () => { dragging = false; });

container.addEventListener("wheel", (event) => {
  event.preventDefault();
  cameraRadius = THREE.MathUtils.clamp(cameraRadius + event.deltaY * 0.005, 2.5, 12);
  updateCameraPosition();
}, { passive: false });

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
  
  if (!dragging) {
    cameraYaw += 0.0018;
  }
  
  updateCameraPosition();
  renderer.render(scene, camera);
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer();
rebuildFlower();
updateCameraPosition();
requestAnimationFrame(animate);
initializeExportButton();
