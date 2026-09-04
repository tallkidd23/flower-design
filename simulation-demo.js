import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { defaultPlantSpecies, createSpeciesFromTemplate, createPlantState } from './simulation/plant/index.js';
import { pollinatorPresets } from './simulation/pollinator/index.js';
import { createFieldConfig, addPlantToField, addPollinatorToField, getPlantsInBloom, getPollinatorsActive } from './simulation/field/index.js';
import { pollinatorVisit, findNearestFloweringPlant, simulatePollinatorMovement } from './simulation/pollination/index.js';
import { createSeedManager, addSeeds, processSeedDormancy, processGerminatedSeeds } from './simulation/seed/index.js';
import { loadSpeciesFromFile, createSpeciesLibrary } from './simulation/species-loader.js';

// ===== THREE.JS ENGINE =====

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 32, 52);
camera.lookAt(0, 8, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

function resizeCanvas() {
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || 320;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resizeCanvas);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
keyLight.position.set(20, 45, 25);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x9d7cff, 0.6);
rimLight.position.set(-30, 20, -30);
scene.add(rimLight);

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x141424, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// ===== STATE =====

let field = null;
let seedManager = null;
let currentDay = 0;
let isRunning = false;
let animationId = null;
let totalPollinations = 0;
let customSpeciesList = [];
const speciesLibrary = createSpeciesLibrary();
const plantMeshes = [];
const pollinatorMeshes = [];

// ===== DEFAULT FOUNDER SPECIES =====

const moonCrest = createSpeciesFromTemplate(defaultPlantSpecies, {
  id: "moon-crest-001",
  name: "Moon Crest",
  morphology: {
    ...defaultPlantSpecies.morphology,
    flower: {
      ...defaultPlantSpecies.morphology.flower,
      petal_base_color: "#3a1670",
      petal_tip_color: "#da9cff",
      tube_length: 0.7,
      petal_count: 7
    }
  },
  reproduction: {
    ...defaultPlantSpecies.reproduction,
    pollination_syndrome: "moth",
    scent_profile: "sweet-night",
    flowering_time: { start_day: 0, duration_days: 100, season: "late_spring" },
    nectar_production: 0.8
  }
});

const emberBell = createSpeciesFromTemplate(defaultPlantSpecies, {
  id: "ember-bell-001",
  name: "Ember Bell",
  morphology: {
    ...defaultPlantSpecies.morphology,
    flower: {
      ...defaultPlantSpecies.morphology.flower,
      petal_base_color: "#d9531e",
      petal_tip_color: "#ffb347",
      tube_length: 0.4,
      petal_count: 5
    }
  },
  reproduction: {
    ...defaultPlantSpecies.reproduction,
    pollination_syndrome: "butterfly",
    scent_profile: "spiced",
    flowering_time: { start_day: 0, duration_days: 100, season: "late_spring" },
    nectar_production: 0.7
  }
});

speciesLibrary.add(moonCrest);
speciesLibrary.add(emberBell);

// Check if a species was sent seamlessly from the flower editor
try {
  const activeIncoming = localStorage.getItem('bloom_active_species');
  if (activeIncoming) {
    const parsedActive = JSON.parse(activeIncoming);
    customSpeciesList.push(parsedActive);
    speciesLibrary.add(parsedActive);
    localStorage.removeItem('bloom_active_species');
  }
  
  const savedStored = JSON.parse(localStorage.getItem('bloom_custom_species') || '[]');
  savedStored.forEach(sp => {
    if (!customSpeciesList.some(s => s.id === sp.id)) {
      customSpeciesList.push(sp);
      speciesLibrary.add(sp);
    }
  });
} catch (e) {}

// ===== 3D BUILDERS =====

function createPlantMesh(species, position) {
  const group = new THREE.Group();
  const stemHeight = (species.morphology?.stem?.height || 2) * 2.8;
  
  const stemColor = species.morphology?.bud?.color || species.morphology?.stemColor || "#28643a";
  const stemGeo = new THREE.CylinderGeometry(0.12, 0.22, stemHeight, 10);
  const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(stemColor), roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = stemHeight / 2;
  group.add(stem);
  
  const leafCount = 6;
  const leafColor = species.morphology?.leaves?.variegation ? 0xd2e6ab : 0x1b5b35;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + 0.3;
    const leafGeo = new THREE.SphereGeometry(0.9, 8, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.7 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 1.1, stemHeight * 0.4 + (i * 0.2), Math.sin(angle) * 1.1);
    leaf.scale.set(1.1, 0.2, 0.5);
    leaf.rotation.x = Math.PI / 2;
    leaf.rotation.z = angle;
    group.add(leaf);
  }
  
  const flowerGroup = new THREE.Group();
  const petalCount = species.morphology?.flower?.petal_count || 5;
  const baseColor = new THREE.Color(species.morphology?.flower?.petal_base_color || "#ff6b9e");
  const tipColor = new THREE.Color(species.morphology?.flower?.petal_tip_color || "#ffb3d1");
  const petalColor = baseColor.clone().lerp(tipColor, 0.5);

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petalGeo = new THREE.SphereGeometry(0.7, 8, 6);
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColor,
      roughness: 0.45,
      emissive: petalColor.clone().multiplyScalar(0.08)
    });
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.85, stemHeight + 0.2, Math.sin(angle) * 0.85);
    petal.scale.set(0.45, 1.2, 0.3);
    petal.rotation.z = angle;
    petal.rotation.x = Math.PI / 2 - 0.35;
    flowerGroup.add(petal);
  }
  
  const centerGeo = new THREE.SphereGeometry(0.35, 10, 8);
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.4, emissive: 0x332200 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.y = stemHeight + 0.35;
  flowerGroup.add(center);
  
  group.add(flowerGroup);
  
  if (species.morphology?.defenses?.thorn_presence) {
    const thornMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const thornGeo = new THREE.ConeGeometry(0.05, 0.3, 6);
      const thorn = new THREE.Mesh(thornGeo, thornMat);
      thorn.position.set(Math.cos(angle) * 0.22, stemHeight * 0.3 + (i * 0.3), Math.sin(angle) * 0.22);
      thorn.rotation.x = Math.PI / 2 - 0.2;
      thorn.rotation.z = angle;
      group.add(thorn);
    }
  }

  if (species.carnivorous?.enabled || species.physiology?.nutrients?.special_strategy === "carnivorous") {
    const trapMat = new THREE.MeshStandardMaterial({ color: 0xff1493, roughness: 0.3, emissive: 0x440022 });
    const trapGeo = new THREE.SphereGeometry(0.5, 10, 8);
    const trap = new THREE.Mesh(trapGeo, trapMat);
    trap.position.set(0, stemHeight + 0.9, 0);
    trap.scale.set(0.8, 1.3, 0.8);
    group.add(trap);
  }
  
  group.position.set(position.x - 50, 0, position.y - 50);
  scene.add(group);
  return group;
}

function createPollinatorMesh(species, position) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(0.45, 8, 6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(species.body?.color || "#f4c542"), roughness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  
  const wingGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.7 });
  for (let side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(side * 0.5, 0.2, 0);
    wing.scale.set(0.3, 1, 0.2);
    wing.rotation.z = side * 0.5;
    group.add(wing);
  }
  
  group.position.set(position.x - 50, 6, position.y - 50);
  scene.add(group);
  return group;
}

// ===== INITIALIZE SYSTEM =====

function initializeSimulation() {
  plantMeshes.forEach(mesh => scene.remove(mesh));
  pollinatorMeshes.forEach(item => scene.remove(item.mesh));
  plantMeshes.length = 0;
  pollinatorMeshes.length = 0;
  
  field = createFieldConfig({
    name: "Living Field",
    dimensions: { width: 100, height: 100 },
    environment: { season_length_days: 120, weather: "sunny", soil: "well_drained", temperature: 22, mutation_rate: 0.03, crossing_rules: "compatible_species" }
  });
  
  seedManager = createSeedManager();
  currentDay = 0;
  totalPollinations = 0;
  
  customSpeciesList.forEach(species => {
    for (let i = 0; i < 3; i++) {
      const pos = { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
      const plant = addPlantToField(field, species, createPlantState(species.id), pos);
      const mesh = createPlantMesh(species, pos);
      plantMeshes.push(mesh);
    }
  });
  
  [pollinatorPresets.moth, pollinatorPresets.butterfly, pollinatorPresets.bee].forEach((preset, i) => {
    const pos = { x: 30 + i * 20, y: 50 };
    const pollinator = addPollinatorToField(field, preset, pos);
    const mesh = createPollinatorMesh(preset, pos);
    pollinatorMeshes.push({ pollinator, mesh });
  });
  
  updateStats();
  updateLegend();
  updateSpeciesList();
}

// ===== SIMULATION LOOP =====

const deltaTime = 1;

function simulationStep() {
  if (!isRunning) return;
  
  currentDay += deltaTime * 0.2;
  const plantsInBloom = getPlantsInBloom(field, currentDay);
  const timeOfDay = currentDay % 24;
  const activePollinators = getPollinatorsActive(field, timeOfDay);
  
  pollinatorMeshes.forEach(({ pollinator, mesh }) => {
    simulatePollinatorMovement(pollinator, field, deltaTime);
    mesh.position.x = pollinator.position.x - 50;
    mesh.position.z = pollinator.position.y - 50;
    mesh.position.y = 5 + Math.sin(currentDay * 2 + pollinator.position.x) * 1.5;
    
    const targetPlant = findNearestFloweringPlant(pollinator, plantsInBloom, currentDay);
    if (targetPlant) {
      const result = pollinatorVisit(pollinator, targetPlant, field, currentDay);
      if (result.action === "pollinated" && result.seed) {
        addSeeds(seedManager, result.seed);
        totalPollinations++;
        logEvent(`Day ${Math.floor(currentDay)}: ${pollinator.species.name} pollinated ${targetPlant.species.name}!`, "success");
      }
    }
  });
  
  processSeedDormancy(seedManager, currentDay, field.environment);
  const newPlants = processGerminatedSeeds(seedManager, field);
  if (newPlants.length > 0) {
    newPlants.forEach(np => {
      const mesh = createPlantMesh(np.species, np.position);
      plantMeshes.push(mesh);
    });
    logEvent(`Day ${Math.floor(currentDay)}: ${newPlants.length} new seedlings germinated!`, "info");
  }
  
  updateStats();
  
  if (currentDay < field.environment.season_length_days) {
    animationId = requestAnimationFrame(simulationStep);
  } else {
    isRunning = false;
    logEvent("Season complete! Generations evolved.", "info");
  }
}

// ===== UI HELPERS =====

function updateStats() {
  const d = document.getElementById('dayStat');
  const p = document.getElementById('plantsStat');
  const pol = document.getElementById('pollinatorsStat');
  const s = document.getElementById('seedsStat');
  const polCount = document.getElementById('pollinationsStat');

  if (d) d.textContent = Math.floor(currentDay);
  if (p) p.textContent = field ? field.plants.length : 0;
  if (pol) pol.textContent = field ? field.pollinators.length : 0;
  if (s) s.textContent = seedManager ? seedManager.seeds.length : 0;
  if (polCount) polCount.textContent = totalPollinations;
}

function updateLegend() {
  const container = document.getElementById('legendContainer');
  if (!container) return;
  container.innerHTML = '';
  customSpeciesList.forEach(species => {
    const color = species.morphology?.flower?.petal_base_color || '#fff';
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" style="background: ${color}"></div><span>${species.name}</span>`;
    container.appendChild(item);
  });
}

function updateSpeciesList() {
  const container = document.getElementById('speciesList');
  if (!container) return;
  container.innerHTML = '';
  customSpeciesList.forEach(species => {
    const color = species.morphology?.flower?.petal_base_color || '#fff';
    const item = document.createElement('div');
    item.className = 'species-item';
    item.innerHTML = `<div class="species-color" style="background: ${color}"></div><div class="species-info"><div class="species-name">${species.name}</div></div>`;
    container.appendChild(item);
  });
}

function logEvent(message, type = "info") {
  const log = document.getElementById('eventLog');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ===== FILE INPUT EVENT =====

const fileInput = document.getElementById('fileInput');
if (fileInput) {
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    logEvent(`Reading file: ${file.name}...`, "info");

    try {
      const species = await loadSpeciesFromFile(file);
      customSpeciesList.push(species);
      speciesLibrary.add(species);
      
      logEvent(`✓ Loaded: "${species.name}"`, "success");
      initializeSimulation();
    } catch (err) {
      logEvent(`✗ Upload error: ${err.message}`, "warning");
    }

    fileInput.value = '';
  });
}

// ===== BUTTON CONTROLS =====

document.getElementById('startBtn')?.addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true;
    logEvent("Simulation running...", "info");
    simulationStep();
  }
});

document.getElementById('pauseBtn')?.addEventListener('click', () => {
  isRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  logEvent("Paused", "warning");
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  isRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  const log = document.getElementById('eventLog');
  if (log) log.innerHTML = '';
  initializeSimulation();
  logEvent("Simulation reset to day 0", "info");
});

// ===== ANIMATION =====

function animate() {
  requestAnimationFrame(animate);
  plantMeshes.forEach(mesh => { mesh.rotation.y += 0.003; });
  renderer.render(scene, camera);
}

// ===== BOOTSTRAP =====

resizeCanvas();
speciesLibrary.getAll().forEach(s => customSpeciesList.push(s));
initializeSimulation();

// Auto-start if transferred directly from Lab
const params = new URLSearchParams(window.location.search);
if (params.get('autoplay') === 'true') {
  isRunning = true;
  logEvent("🚀 Plant imported directly! Simulation starting...", "success");
  simulationStep();
} else {
  logEvent("System ready. Founder species loaded.", "info");
}

animate();
