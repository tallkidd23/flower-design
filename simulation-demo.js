import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import {
  defaultPlantSpecies,
  createSpeciesFromTemplate,
  createPlantState
} from './simulation/plant/index.js';
import { pollinatorPresets } from './simulation/pollinator/index.js';
import {
  createFieldConfig,
  addPlantToField,
  addPollinatorToField,
  getPlantsInBloom,
  getPollinatorsActive
} from './simulation/field/index.js';
import {
  pollinatorVisit,
  findNearestFloweringPlant,
  simulatePollinatorMovement
} from './simulation/pollination/index.js';
import {
  createSeedManager,
  addSeeds,
  processSeedDormancy,
  processGerminatedSeeds
} from './simulation/seed/index.js';
import {
  loadSpeciesFromFile,
  createSpeciesLibrary
} from './simulation/species-loader.js';

// ===== THREE.JS SETUP =====

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 30, 50);
camera.lookAt(0, 10, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(20, 40, 20);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x9d7cff, 0.5);
rimLight.position.set(-30, 20, -30);
scene.add(rimLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// ===== SIMULATION STATE =====

let field = null;
let seedManager = null;
let currentDay = 0;
let isRunning = false;
let animationId = null;
let totalPollinations = 0;
let customSpeciesList = [];
const speciesLibrary = createSpeciesLibrary();
const plantMeshes = new Map();
const pollinatorMeshes = new Map();

// ===== SPECIES =====

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
    flowering_time: { start_day: 10, duration_days: 40, season: "late_spring" },
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
    flowering_time: { start_day: 15, duration_days: 35, season: "late_spring" },
    nectar_production: 0.7
  }
});

speciesLibrary.add(moonCrest);
speciesLibrary.add(emberBell);

// ===== PLANT RENDERING (Simplified but matches editor style) =====

function createPlantMesh(species, position) {
  const group = new THREE.Group();
  
  // Stem
  const stemHeight = species.morphology.stem.height * 3;
  const stemGeo = new THREE.CylinderGeometry(0.15, 0.25, stemHeight, 8);
  const stemMat = new THREE.MeshStandardMaterial({ color: species.morphology.defenses.thorn_presence ? 0x2d5016 : 0x28643a, roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = stemHeight / 2;
  group.add(stem);
  
  // Leaves
  const leafCount = species.morphology.leaves.arrangement === "basal_rosette" ? 0 : 6;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const leafGeo = new THREE.SphereGeometry(0.8, 8, 6);
    const leafMat = new THREE.MeshStandardMaterial({ 
      color: species.morphology.leaves.variegation ? species.morphology.leaves.pattern === "mottled" ? 0x1b5b35 : 0xd2e6ab : 0x1b5b35, 
      roughness: 0.7 
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 1.2, stemHeight * 0.4, Math.sin(angle) * 1.2);
    leaf.scale.set(1, 0.3, 0.5);
    leaf.rotation.x = Math.PI / 2;
    leaf.rotation.z = angle;
    group.add(leaf);
  }
  
  // Flower
  const flowerGroup = new THREE.Group();
  const petalCount = species.morphology.flower.petal_count;
  const petalColor = new THREE.Color(species.morphology.flower.petal_base_color);
  
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petalGeo = new THREE.SphereGeometry(0.6, 8, 6);
    const petalMat = new THREE.MeshStandardMaterial({ 
      color: petalColor, 
      roughness: 0.4,
      emissive: petalColor.clone().multiplyScalar(0.1)
    });
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.8, stemHeight + 0.3, Math.sin(angle) * 0.8);
    petal.scale.set(0.4, 1, 0.3);
    petal.rotation.z = angle;
    petal.rotation.x = Math.PI / 2 - 0.3;
    flowerGroup.add(petal);
  }
  
  // Flower center
  const centerGeo = new THREE.SphereGeometry(0.3, 8, 6);
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.y = stemHeight + 0.5;
  flowerGroup.add(center);
  
  group.add(flowerGroup);
  
  // Thorns
  if (species.morphology.defenses.thorn_presence) {
    const thornColor = new THREE.Color(species.morphology.defenses.thorn_color || "#8b4513");
    for (let i = 0; i < 8; i++) {
      const thornGeo = new THREE.ConeGeometry(0.05, 0.3, 6);
      const thornMat = new THREE.MeshStandardMaterial({ color: thornColor, roughness: 0.6 });
      const thorn = new THREE.Mesh(thornGeo, thornMat);
      const angle = (i / 8) * Math.PI * 2;
      thorn.position.set(Math.cos(angle) * 0.3, stemHeight * 0.5, Math.sin(angle) * 0.3);
      thorn.rotation.x = Math.PI / 2 - 0.3;
      thorn.rotation.z = angle;
      group.add(thorn);
    }
  }
  
  group.position.set(position.x, 0, position.y);
  scene.add(group);
  
  return group;
}

// ===== POLLINATOR RENDERING =====

function createPollinatorMesh(species, position) {
  const group = new THREE.Group();
  
  // Body
  const bodyGeo = new THREE.SphereGeometry(0.4, 8, 6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(species.body.color), roughness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  
  // Wings
  const wingGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.6 });
  for (let side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(side * 0.5, 0.2, 0);
    wing.scale.set(0.3, 1, 0.2);
    wing.rotation.z = side * 0.5;
    group.add(wing);
  }
  
  group.position.set(position.x, 5, position.y);
  scene.add(group);
  
  return group;
}

// ===== INITIALIZE =====

function initializeSimulation() {
  // Clear existing meshes
  plantMeshes.forEach(mesh => scene.remove(mesh));
  pollinatorMeshes.forEach(mesh => scene.remove(mesh));
  plantMeshes.clear();
  pollinatorMeshes.clear();
  
  field = createFieldConfig({
    name: "Demo Meadow",
    dimensions: { width: 100, height: 100 },
    environment: {
      season_length_days: 120,
      weather: "sunny",
      soil: "well_drained",
      temperature: 22,
      mutation_rate: 0.03,
      crossing_rules: "compatible_species"
    }
  });
  
  seedManager = createSeedManager();
  currentDay = 0;
  totalPollinations = 0;
  
  // Add plants
  customSpeciesList.forEach(species => {
    for (let i = 0; i < 3; i++) {
      const pos = { x: 20 + Math.random() * 60, y: 30 + Math.random() * 40 };
      const plant = addPlantToField(field, species, createPlantState(species.id), pos);
      const mesh = createPlantMesh(species, pos);
      plantMeshes.set(plant.species.id + Math.random(), mesh);
    }
  });
  
  // Add pollinators
  [pollinatorPresets.moth, pollinatorPresets.butterfly, pollinatorPresets.bee].forEach((preset, i) => {
    const pos = { x: 40 + i * 10, y: 40 };
    const pollinator = addPollinatorToField(field, preset, pos);
    const mesh = createPollinatorMesh(preset, pos);
    pollinatorMeshes.set(pollinator.id, mesh);
  });
  
  logEvent("Simulation initialized", "info");
  updateStats();
  updateLegend();
}

// ===== SIMULATION LOOP =====

const deltaTime = 1;

function simulationStep() {
  if (!isRunning) return;
  
  currentDay += deltaTime * 0.1;
  
  const plantsInBloom = getPlantsInBloom(field, currentDay);
  const timeOfDay = currentDay % 24;
  const activePollinators = getPollinatorsActive(field, timeOfDay);
  
  activePollinators.forEach(pollinator => {
    simulatePollinatorMovement(pollinator, field, deltaTime);
    const mesh = pollinatorMeshes.get(pollinator.species.id);
    if (mesh) {
      mesh.position.x = pollinator.position.x;
      mesh.position.z = pollinator.position.y;
    }
    
    const targetPlant = findNearestFloweringPlant(pollinator, plantsInBloom, currentDay);
    if (targetPlant) {
      const result = pollinatorVisit(pollinator, targetPlant, field, currentDay);
      if (result.action === "pollinated" && result.seed) {
        addSeeds(seedManager, result.seed);
        totalPollinations++;
        logEvent(`Day ${Math.floor(currentDay)}: ${pollinator.species.name} → ${targetPlant.species.name}`, "success");
      }
    }
  });
  
  processSeedDormancy(seedManager, currentDay, field.environment);
  const newPlants = processGerminatedSeeds(seedManager, field);
  if (newPlants.length > 0) {
    logEvent(`Day ${Math.floor(currentDay)}: ${newPlants.length} new plants!`, "info");
  }
  
  updateStats();
  
  if (currentDay < field.environment.season_length_days) {
    animationId = requestAnimationFrame(simulationStep);
  } else {
    isRunning = false;
    logEvent("Season complete!", "info");
  }
}

// ===== UI =====

function updateStats() {
  document.getElementById('dayStat').textContent = Math.floor(currentDay);
  document.getElementById('plantsStat').textContent = field.plants.length;
  document.getElementById('pollinatorsStat').textContent = field.pollinators.length;
  document.getElementById('seedsStat').textContent = seedManager.seeds.length;
  document.getElementById('pollinationsStat').textContent = totalPollinations;
}

function updateLegend() {
  const container = document.getElementById('legendContainer');
  container.innerHTML = '';
  customSpeciesList.forEach(species => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" style="background: ${species.morphology.flower.petal_base_color}"></div><span>${species.name}</span>`;
    container.appendChild(item);
  });
}

function updateSpeciesList() {
  const container = document.getElementById('speciesList');
  container.innerHTML = '';
  customSpeciesList.forEach(species => {
    const item = document.createElement('div');
    item.className = 'species-item';
    item.innerHTML = `<div class="species-color" style="background: ${species.morphology.flower.petal_base_color}"></div><div class="species-info"><div class="species-name">${species.name}</div></div>`;
    container.appendChild(item);
  });
}

function logEvent(message, type = "info") {
  const log = document.getElementById('eventLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ===== FILE UPLOAD =====

document.getElementById('speciesFileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const species = await loadSpeciesFromFile(file);
    customSpeciesList.push(species);
    speciesLibrary.add(species);
    logEvent(`Loaded: ${species.name}`, "success");
    updateSpeciesList();
    updateLegend();
    initializeSimulation();
  } catch (error) {
    logEvent(`Error: ${error.message}`, "warning");
  }
  
  event.target.value = '';
});

// ===== CONTROLS =====

document.getElementById('startBtn').addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true;
    logEvent("Started", "info");
    simulationStep();
  }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  isRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  logEvent("Paused", "warning");
});

document.getElementById('resetBtn').addEventListener('click', () => {
  isRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  document.getElementById('eventLog').innerHTML = '';
  initializeSimulation();
  logEvent("Reset", "info");
});

// ===== RENDER LOOP =====

function animate() {
  requestAnimationFrame(animate);
  
  // Slow rotation
  plantMeshes.forEach(mesh => {
    mesh.rotation.y += 0.002;
  });
  
  renderer.render(scene, camera);
}

// ===== RESIZE =====

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ===== INIT =====

speciesLibrary.getAll().forEach(s => customSpeciesList.push(s));
initializeSimulation();
updateSpeciesList();
logEvent("Welcome! Upload species JSON to add plants.", "info");
animate();
