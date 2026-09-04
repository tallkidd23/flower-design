// simulation-demo.js
// Standalone ecosystem simulation demo with canvas renderer

import {
  defaultPlantSpecies,
  createSpeciesFromTemplate,
  createPlantState
} from './simulation/plant/index.js';

import {
  pollinatorPresets
} from './simulation/pollinator/index.js';

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

// ===== CANVAS SETUP =====

const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== SIMULATION STATE =====

let field = null;
let seedManager = null;
let currentDay = 0;
let isRunning = false;
let animationId = null;
let totalPollinations = 0;

// ===== CREATE SPECIES =====

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
    flowering_time: {
      start_day: 10,
      duration_days: 40,
      season: "late_spring"
    },
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
    flowering_time: {
      start_day: 15,
      duration_days: 35,
      season: "late_spring"
    },
    nectar_production: 0.7
  }
});

// ===== INITIALIZE =====

function initializeSimulation() {
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
    },
    simulation: {
      time_scale: 1.0,
      running: false,
      current_day: 0
    }
  });

  seedManager = createSeedManager();
  currentDay = 0;
  totalPollinations = 0;

  // Add plants (multiple individuals)
  for (let i = 0; i < 3; i++) {
    addPlantToField(field, moonCrest, createPlantState(moonCrest.id), {
      x: 20 + Math.random() * 30,
      y: 30 + Math.random() * 40
    });
  }

  for (let i = 0; i < 3; i++) {
    addPlantToField(field, emberBell, createPlantState(emberBell.id), {
      x: 60 + Math.random() * 30,
      y: 30 + Math.random() * 40
    });
  }

  // Add pollinators
  addPollinatorToField(field, pollinatorPresets.moth, { x: 50, y: 50 });
  addPollinatorToField(field, pollinatorPresets.butterfly, { x: 50, y: 50 });
  addPollinatorToField(field, pollinatorPresets.bee, { x: 40, y: 40 });

  logEvent("Simulation initialized", "info");
  updateStats();
  render();
}

// ===== RENDERING =====

function render() {
  // Clear canvas
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1;
  const gridSize = 50;

  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw plants
  field.plants.forEach(plant => {
    const x = (plant.position.x / field.dimensions.width) * canvas.width;
    const y = (plant.position.y / field.dimensions.height) * canvas.height;

    // Check if in bloom
    const inBloom = currentDay >= plant.species.reproduction.flowering_time.start_day &&
                    currentDay <= plant.species.reproduction.flowering_time.start_day +
                    plant.species.reproduction.flowering_time.duration_days;

    if (inBloom) {
      // Draw flower
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = plant.species.morphology.flower.petal_base_color;
      ctx.fill();
      ctx.strokeStyle = plant.species.morphology.flower.petal_tip_color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bloom indicator
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Draw vegetative plant
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#27ae60';
      ctx.fill();
    }

    // Plant label
    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(plant.species.name.substring(0, 10), x, y + 25);
  });

  // Draw pollinators
  field.pollinators.forEach(pollinator => {
    const x = (pollinator.position.x / field.dimensions.width) * canvas.width;
    const y = (pollinator.position.y / field.dimensions.height) * canvas.height;

    // Body
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = pollinator.species.body.color;
    ctx.fill();

    // Wings (simple ovals)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 3, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5, y - 3, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Pollen indicator
    if (pollinator.pollen) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#f4c542';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Draw seeds (germinated)
  seedManager.germinatedSeeds.forEach(seed => {
    if (!seed.planted) {
      const x = (seed.position.x / field.dimensions.width) * canvas.width;
      const y = (seed.position.y / field.dimensions.height) * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#27ae60';
      ctx.fill();
      ctx.strokeStyle = '#1e8449';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

// ===== SIMULATION LOOP =====

const deltaTime = 1;

function simulationStep() {
  if (!isRunning) return;

  currentDay += deltaTime * 0.1;
  field.simulation.current_day = currentDay;

  // Get active entities
  const plantsInBloom = getPlantsInBloom(field, currentDay);
  const timeOfDay = (currentDay % 24);
  const activePollinators = getPollinatorsActive(field, timeOfDay);

  // Process each pollinator
  activePollinators.forEach(pollinator => {
    // Move
    simulatePollinatorMovement(pollinator, field, deltaTime);

    // Find target flower
    const targetPlant = findNearestFloweringPlant(pollinator, plantsInBloom, currentDay);

    if (targetPlant) {
      // Visit
      const result = pollinatorVisit(pollinator, targetPlant, field, currentDay);

      if (result.action === "pollinated" && result.seed) {
        // Store seed
        addSeeds(seedManager, result.seed);
        totalPollinations++;
        logEvent(`Day ${Math.floor(currentDay)}: ${pollinator.species.name} pollinated ${targetPlant.species.name}`, "success");
      }
    }
  });

  // Process seed dormancy
  processSeedDormancy(seedManager, currentDay, field.environment);

  // Germinate seeds
  const newPlants = processGerminatedSeeds(seedManager, field);
  if (newPlants.length > 0) {
    logEvent(`Day ${Math.floor(currentDay)}: ${newPlants.length} new plants germinated!`, "info");
  }

  // Update stats
  updateStats();

  // Render
  render();

  // Continue
  if (currentDay < field.environment.season_length_days) {
    animationId = requestAnimationFrame(simulationStep);
  } else {
    isRunning = false;
    logEvent("Season complete!", "info");
    updateStats();
  }
}

// ===== UI FUNCTIONS =====

function updateStats() {
  document.getElementById('dayStat').textContent = Math.floor(currentDay);
  document.getElementById('plantsStat').textContent = field.plants.length;
  document.getElementById('pollinatorsStat').textContent = field.pollinators.length;
  document.getElementById('seedsStat').textContent = seedManager.seeds.length;
  document.getElementById('germinatedStat').textContent = seedManager.germinatedSeeds.length;
  document.getElementById('pollinationsStat').textContent = totalPollinations;
}

function logEvent(message, type = "info") {
  const logContainer = document.getElementById('eventLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// ===== CONTROLS =====

document.getElementById('startBtn').addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true;
    logEvent("Simulation started", "info");
    simulationStep();
  }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  logEvent("Simulation paused", "warning");
});

document.getElementById('resetBtn').addEventListener('click', () => {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  logContainer = document.getElementById('eventLog');
  logContainer.innerHTML = '';
  initializeSimulation();
  logEvent("Simulation reset", "info");
});

document.getElementById('clearLogBtn').addEventListener('click', () => {
  document.getElementById('eventLog').innerHTML = '';
});

// ===== INITIALIZE ON LOAD =====

initializeSimulation();
logEvent("Welcome to the Ecosystem Demo!", "info");
logEvent("Press Start to begin the simulation", "info");
