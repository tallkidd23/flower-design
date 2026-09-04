// simulation/seed/seed-manager.js
// Seed storage, germination, offspring creation

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

    // Dormancy countdown
    seed.dormancy -= 0.01; // Base decay

    // Temperature boost
    if (temperature >= 15 && temperature <= 25) {
      seed.dormancy -= 0.02;
    }

    // Moisture boost
    if (weather === "rainy" || soil === "moist") {
      seed.dormancy -= 0.01;
    }

    // Germination trigger
    if (seed.dormancy <= 0) {
      seed.germinated = true;
      seed.germination_day = currentDay;
      seedManager.germinatedSeeds.push(seed);
      return false; // Remove from active seeds
    }

    return true; // Keep in seeds array
  });
}

export function germinateSeed(seed, field, position = null) {
  const { createPlantState } = await import('../plant/plant-state.js');

  const newState = createPlantState(seed.species.id);
  newState.life_stage = "seedling";
  newState.age_years = 0;

  const newPlant = {
    species: seed.species,
    state: newState,
    position: position || {
      x: seed.position.x + (Math.random() - 0.5) * 10,
      y: seed.position.y + (Math.random() - 0.5) * 10
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
    seedManager.seedBank.push({
      species: seed.species,
      count
    });
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
