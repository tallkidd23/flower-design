// simulation/seed/seed-manager.js
import { createPlantState } from '../plant/plant-state.js';

export function createSeedManager() {
  return {
    seeds: [],
    germinatedSeeds: [],
    seedBank: []
  };
}

export function addSeeds(seedManager, seed) {
  seedManager.seeds.push(seed);
  return seed;
}

export function processSeedDormancy(seedManager, currentDay, environment) {
  const { temperature, soil, weather } = environment;

  seedManager.seeds = seedManager.seeds.filter(seed => {
    if (seed.germinated) return true;

    seed.dormancy -= 0.01;
    if (temperature >= 15 && temperature <= 25) seed.dormancy -= 0.02;
    if (weather === "rainy" || soil === "moist") seed.dormancy -= 0.01;

    if (seed.dormancy <= 0) {
      seed.germinated = true;
      seed.germination_day = currentDay;
      seedManager.germinatedSeeds.push(seed);
      return false;
    }
    return true;
  });
}

export function germinateSeed(seed, field, position = null) {
  const newState = createPlantState(seed.species.id);
  newState.life_stage = "seedling";
  newState.age_years = 0;

  const newPlant = {
    species: seed.species,
    state: newState,
    position: position || {
      x: (seed.position?.x || 50) + (Math.random() - 0.5) * 10,
      y: (seed.position?.y || 50) + (Math.random() - 0.5) * 10
    },
    parentA: seed.parentA,
    parentB: seed.parentB,
    germination_day: seed.germination_day
  };

  field.plants.push(newPlant);
  return newPlant;
}

export function processGerminatedSeeds(seedManager, field) {
  const newPlants = [];
  seedManager.germinatedSeeds.forEach(seed => {
    if (!seed.planted) {
      const newPlant = germinateSeed(seed, field);
      newPlants.push(newPlant);
      seed.planted = true;
    }
  });
  return newPlants;
}

export function addToSeedBank(seedManager, seed, count = 1) {
  const existing = seedManager.seedBank.find(s => s.species.id === seed.species.id);
  if (existing) {
    existing.count += count;
  } else {
    seedManager.seedBank.push({ species: seed.species, count });
  }
}

export function getSeedStats(seedManager) {
  return {
    totalSeeds: seedManager.seeds.length,
    germinatedSeeds: seedManager.germinatedSeeds.length,
    seedBankCount: seedManager.seedBank.reduce((sum, s) => sum + s.count, 0),
    uniqueSpecies: new Set([
      ...seedManager.seeds.map(s => s.species.id),
      ...seedManager.germinatedSeeds.map(s => s.species.id),
      ...seedManager.seedBank.map(s => s.species.id)
    ]).size
  };
}
