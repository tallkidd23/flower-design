import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ---------- Scene setup ----------
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 2, 6);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

// ---------- Flower group ----------
const flowerGroup = new THREE.Group();
scene.add(flowerGroup);

// ---------- Simulation state ----------
const totalDays = 100;
let currentDay = 0;
let isPlaying = false;
let growthSpeed = 1.0;

// ---------- UI elements ----------
const ui = {
  petalCount: document.getElementById("petalCount"),
  petalLength: document.getElementById("petalLength"),
  petalCurl: document.getElementById("petalCurl"),
  stemHeight: document.getElementById("stemHeight"),
  bloomOpenness: document.getElementById("bloomOpenness"),
  growthSpeed: document.getElementById("growthSpeed"),
  colorBase: document.getElementById("colorBase"),
  colorTip: document.getElementById("colorTip"),

  petalCountValue: document.getElementById("petalCountValue"),
  petalLengthValue: document.getElementById("petalLengthValue"),
  petalCurlValue: document.getElementById("petalCurlValue"),
  stemHeightValue: document.getElementById("stemHeightValue"),
  bloomOpennessValue: document.getElementById("bloomOpennessValue"),
  growthSpeedValue: document.getElementById("growthSpeedValue"),

  playPauseBtn: document.getElementById("playPauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  loadFile: document.getElementById("loadFile"),

  dayValue: document.getElementById("dayValue"),
  totalDays: document.getElementById("totalDays"),
};

ui.totalDays.textContent = totalDays;

// ---------- Flower parameters (design spec) ----------
let params = {
  petal_count: parseInt(ui.petalCount.value, 10),
  petal_length: parseFloat(ui.petalLength.value),
  petal_curl: parseFloat(ui.petalCurl.value),
  stem_height: parseFloat(ui.stemHeight.value),
  bloom_openness: parseFloat(ui.bloomOpenness.value),
  color_base: ui.colorBase.value,
  color_tip: ui.colorTip.value,
};

// ---------- Geometry builders ----------
let stemMesh;
let petalMeshes = [];

function buildStem() {
  if (stemMesh) {
    flowerGroup.remove(stemMesh);
    stemMesh.geometry.dispose();
    stemMesh.material.dispose();
  }

  const height = params.stem_height * growthFactor(currentDay);
  const radiusTop = 0.05;
  const radiusBottom = 0.1;
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    8,
    1,
    false
  );
  const material = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.8,
  });
  stemMesh = new THREE.Mesh(geometry, material);
  stemMesh.position.y = height / 2;
  flowerGroup.add(stemMesh);
}

function buildPetals() {
  // Remove old petals
  for (const mesh of petalMeshes) {
    flowerGroup.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  petalMeshes = [];

  const count = params.petal_count;
  const baseColor = new THREE.Color(params.color_base);
  const tipColor = new THREE.Color(params.color_tip);

  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / count;

    // Petal curve: mixed wavy/organic
    const points = [];
    const segments = 20;
    const maxLen = params.petal_length * growthFactor(currentDay);
    const curl = params.petal_curl;
    const openness = params.bloom_openness;

    for (let s = 0; s <= segments; s++) {
      const t = s / segments; // 0..1 along petal
      const len = maxLen * t;

      // Base direction from center outward
      const dirX = Math.cos(theta) * openness + Math.cos(theta + Math.PI / 2) * (1 - openness) * 0.3;
      const dirZ = Math.sin(theta) * openness + Math.sin(theta + Math.PI / 2) * (1 - openness) * 0.3;

      // Curl: spiral around axis
      const angleOffset = curl * t * Math.PI;
      const x = dirX * len * Math.cos(angleOffset);
      const z = dirZ * len * Math.sin(angleOffset);
      const y = t * (params.stem_height * growthFactor(currentDay)) * 0.6 + Math.sin(t * Math.PI) * 0.3 * curl;

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 16, 0.04 * (1 + 0.5 * t), 6, false);

    // Simple gradient by coloring faces roughly by position
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    petalMeshes.push(mesh);
    flowerGroup.add(mesh);
  }
}

// Growth factor: 0 at day 0, 1 at maturity
function growthFactor(day) {
  // Simple S-curve
  const t = Math.min(day / totalDays, 1);
  return t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
}

// ---------- Update loop ----------
function updateFlower() {
  buildStem();
  buildPetals();
  ui.dayValue.textContent = Math.floor(currentDay);
}

function animate() {
  requestAnimationFrame(animate);

  if (isPlaying) {
    currentDay += growthSpeed;
    if (currentDay >= totalDays) {
      currentDay = totalDays;
      isPlaying = false;
      ui.playPauseBtn.textContent = "Play";
    }
    updateFlower();
  }

  // Gentle rotation
  flowerGroup.rotation.y += 0.002;

  renderer.render(scene, camera);
}

// ---------- UI wiring ----------
function syncParamLabels() {
  ui.petalCountValue.textContent = ui.petalCount.value;
  ui.petalLengthValue.textContent = ui.petalLength.value;
  ui.petalCurlValue.textContent = ui.petalCurl.value;
  ui.stemHeightValue.textContent = ui.stemHeight.value;
  ui.bloomOpennessValue.textContent = ui.bloomOpenness.value;
  ui.growthSpeedValue.textContent = ui.growthSpeed.value;
}

function rebuildFromUI() {
  params.petal_count = parseInt(ui.petalCount.value, 10);
  params.petal_length = parseFloat(ui.petalLength.value);
  params.petal_curl = parseFloat(ui.petalCurl.value);
  params.stem_height = parseFloat(ui.stemHeight.value);
  params.bloom_openness = parseFloat(ui.bloomOpenness.value);
  params.color_base = ui.colorBase.value;
  params.color_tip = ui.colorTip.value;
  growthSpeed = parseFloat(ui.growthSpeed.value);
  syncParamLabels();
  updateFlower();
}

[
  ui.petalCount,
  ui.petalLength,
  ui.petalCurl,
  ui.stemHeight,
  ui.bloomOpenness,
  ui.growthSpeed,
  ui.colorBase,
  ui.colorTip,
].forEach((el) => {
  el.addEventListener("input", rebuildFromUI);
});

ui.playPauseBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  ui.playPauseBtn.textContent = isPlaying ? "Pause" : "Play";
});

ui.resetBtn.addEventListener("click", () => {
  isPlaying = false;
  ui.playPauseBtn.textContent = "Play";
  currentDay = 0;
  updateFlower();
});

ui.randomizeBtn.addEventListener("click", () => {
  ui.petalCount.value = Math.floor(3 + Math.random() * 18);
  ui.petalLength.value = (0.5 + Math.random() * 2.5).toFixed(1);
  ui.petalCurl.value = (-1 + Math.random() * 2).toFixed(2);
  ui.stemHeight.value = (0.5 + Math.random() * 2.5).toFixed(1);
  ui.bloomOpenness.value = Math.random().toFixed(2);
  ui.colorBase.value = randomHexColor();
  ui.colorTip.value = randomHexColor();
  rebuildFromUI();
});

function randomHexColor() {
  const c = Math.floor(Math.random() * 0xffffff).toString(16);
  return "#" + c.padStart(6, "0");
}

// Save / Load
ui.saveBtn.addEventListener("click", () => {
  const spec = {
    name: "Abstract Bloom #" + Math.floor(Math.random() * 1000),
    petal_count: params.petal_count,
    petal_length: params.petal_length,
    petal_curl: params.petal_curl,
    stem_height: params.stem_height,
    bloom_openness: params.bloom_openness,
    color_base: params.color_base,
    color_tip: params.color_tip,
    growth_speed: growthSpeed,
  };
  const blob = new Blob([JSON.stringify(spec, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (spec.name || "flower") + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

ui.loadBtn.addEventListener("click", () => {
  ui.loadFile.click();
});

ui.loadFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const spec = JSON.parse(reader.result);
      ui.petalCount.value = spec.petal_count ?? params.petal_count;
      ui.petalLength.value = spec.petal_length ?? params.petal_length;
      ui.petalCurl.value = spec.petal_curl ?? params.petal_curl;
      ui.stemHeight.value = spec.stem_height ?? params.stem_height;
      ui.bloomOpenness.value = spec.bloom_openness ?? params.bloom_openness;
      ui.colorBase.value = spec.color_base ?? params.color_base;
      ui.colorTip.value = spec.color_tip ?? params.color_tip;
      ui.growthSpeed.value = spec.growth_speed ?? growthSpeed;
      rebuildFromUI();
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
  ui.loadFile.value = "";
});

// ---------- Init ----------
syncParamLabels();
updateFlower();
animate();

// Handle resize
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
