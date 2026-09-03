import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 2.2, 6);
camera.lookAt(0, 1.1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x9b7cff, 0.55);
rimLight.position.set(-4, 2, -3);
scene.add(rimLight);

const flowerGroup = new THREE.Group();
scene.add(flowerGroup);

const totalDays = 100;
let currentDay = 0;
let isPlaying = false;
let growthSpeed = 1;
let stemMesh = null;
let petalMeshes = [];

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

let params = {
  petal_count: Number(ui.petalCount.value),
  petal_length: Number(ui.petalLength.value),
  petal_curl: Number(ui.petalCurl.value),
  stem_height: Number(ui.stemHeight.value),
  bloom_openness: Number(ui.bloomOpenness.value),
  color_base: ui.colorBase.value,
  color_tip: ui.colorTip.value,
};

function growthFactor(day) {
  const t = Math.max(0, Math.min(day / totalDays, 1));
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function disposeMesh(mesh) {
  flowerGroup.remove(mesh);
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
  else mesh.material.dispose();
}

function buildStem() {
  if (stemMesh) disposeMesh(stemMesh);

  const grown = growthFactor(currentDay);
  const height = Math.max(0.02, params.stem_height * grown);
  const geometry = new THREE.CylinderGeometry(0.045, 0.09, height, 10);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.82,
  });
  stemMesh = new THREE.Mesh(geometry, material);
  stemMesh.position.y = height / 2;
  flowerGroup.add(stemMesh);
}

function buildPetals() {
  petalMeshes.forEach(disposeMesh);
  petalMeshes = [];

  const grown = growthFactor(currentDay);
  if (grown < 0.015) return;

  const count = params.petal_count;
  const baseColor = new THREE.Color(params.color_base);
  const tipColor = new THREE.Color(params.color_tip);
  const stemTop = params.stem_height * grown;
  const petalLength = params.petal_length * grown;
  const openness = params.bloom_openness * Math.max(0, (grown - 0.22) / 0.78);
  const curl = params.petal_curl;

  for (let i = 0; i < count; i++) {
    const theta = (Math.PI * 2 * i) / count;
    const points = [];
    const segments = 28;

    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const bend = openness * petalLength * (0.25 + 0.95 * t);
      const wave = Math.sin(t * Math.PI * (2.0 + Math.abs(curl) * 2.5) + i * 0.7) * 0.1 * petalLength;
      const twist = curl * t * Math.PI * 0.9;
      const angle = theta + twist;
      const radial = bend * t + wave;
      const x = Math.cos(angle) * radial;
      const z = Math.sin(angle) * radial;
      const y = stemTop + (1 - openness * 0.88) * petalLength * t + Math.sin(t * Math.PI) * curl * 0.26 * petalLength;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 36, 0.048 * grown, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor.clone().lerp(tipColor, 0.35 + (i % 3) * 0.15),
      roughness: 0.46,
      metalness: 0.08,
      emissive: baseColor.clone().multiplyScalar(0.06),
    });
    const petal = new THREE.Mesh(geometry, material);
    petalMeshes.push(petal);
    flowerGroup.add(petal);
  }

  const coreGeometry = new THREE.SphereGeometry(0.11 * grown, 16, 12);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: tipColor,
    roughness: 0.38,
    emissive: tipColor.clone().multiplyScalar(0.1),
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.y = stemTop;
  petalMeshes.push(core);
  flowerGroup.add(core);
}

function updateFlower() {
  buildStem();
  buildPetals();
  ui.dayValue.textContent = Math.floor(currentDay);
}

function syncParamLabels() {
  ui.petalCountValue.textContent = ui.petalCount.value;
  ui.petalLengthValue.textContent = ui.petalLength.value;
  ui.petalCurlValue.textContent = ui.petalCurl.value;
  ui.stemHeightValue.textContent = ui.stemHeight.value;
  ui.bloomOpennessValue.textContent = ui.bloomOpenness.value;
  ui.growthSpeedValue.textContent = ui.growthSpeed.value;
}

function rebuildFromUI() {
  params.petal_count = Number(ui.petalCount.value);
  params.petal_length = Number(ui.petalLength.value);
  params.petal_curl = Number(ui.petalCurl.value);
  params.stem_height = Number(ui.stemHeight.value);
  params.bloom_openness = Number(ui.bloomOpenness.value);
  params.color_base = ui.colorBase.value;
  params.color_tip = ui.colorTip.value;
  growthSpeed = Number(ui.growthSpeed.value);
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
].forEach((element) => element.addEventListener("input", rebuildFromUI));

ui.playPauseBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  ui.playPauseBtn.textContent = isPlaying ? "Pause" : "Play";
});

ui.resetBtn.addEventListener("click", () => {
  currentDay = 0;
  isPlaying = false;
  ui.playPauseBtn.textContent = "Play";
  updateFlower();
});

function randomHexColor() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
}

ui.randomizeBtn.addEventListener("click", () => {
  ui.petalCount.value = String(Math.floor(3 + Math.random() * 18));
  ui.petalLength.value = (0.6 + Math.random() * 2.4).toFixed(1);
  ui.petalCurl.value = (-1 + Math.random() * 2).toFixed(2);
  ui.stemHeight.value = (0.7 + Math.random() * 2.3).toFixed(1);
  ui.bloomOpenness.value = (0.25 + Math.random() * 0.75).toFixed(2);
  ui.growthSpeed.value = (0.4 + Math.random() * 2.2).toFixed(1);
  ui.colorBase.value = randomHexColor();
  ui.colorTip.value = randomHexColor();
  currentDay = totalDays;
  rebuildFromUI();
});

ui.saveBtn.addEventListener("click", () => {
  const spec = {
    name: `Abstract Bloom ${new Date().toISOString().slice(0, 10)}`,
    ...params,
    growth_speed: growthSpeed,
  };
  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
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
      const spec = JSON.parse(reader.result);
      ui.petalCount.value = spec.petal_count ?? params.petal_count;
      ui.petalLength.value = spec.petal_length ?? params.petal_length;
      ui.petalCurl.value = spec.petal_curl ?? params.petal_curl;
      ui.stemHeight.value = spec.stem_height ?? params.stem_height;
      ui.bloomOpenness.value = spec.bloom_openness ?? params.bloom_openness;
      ui.colorBase.value = spec.color_base ?? params.color_base;
      ui.colorTip.value = spec.color_tip ?? params.color_tip;
      ui.growthSpeed.value = spec.growth_speed ?? growthSpeed;
      currentDay = totalDays;
      rebuildFromUI();
    } catch {
      alert("That file is not a valid Abstract Bloom design.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
});

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const elapsedSeconds = (now - lastTime) / 1000;
  lastTime = now;

  if (isPlaying) {
    currentDay = Math.min(totalDays, currentDay + elapsedSeconds * 18 * growthSpeed);
    if (currentDay >= totalDays) {
      isPlaying = false;
      ui.playPauseBtn.textContent = "Play";
    }
    updateFlower();
  }

  flowerGroup.rotation.y += 0.0025;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

syncParamLabels();
updateFlower();
requestAnimationFrame(animate);
