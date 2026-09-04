// simulation/field/field-config.js
// Field setup: dimensions, plant/pollinator populations, environment

export const defaultFieldConfig = {
  id: "field-001",
  name: "Meadow Plot",

  dimensions: {
    width: 100,
    height: 100
  },

  plants: [],
  pollinators: [],

  environment: {
    season_length_days: 90,
    day_night_cycle: true,
    weather: "sunny",
    soil: "well_drained",
    temperature: 20,
    mutation_rate: 0.02,
    crossing_rules: "compatible_species"
  },

  simulation: {
    time_scale: 1.0,
    running: false,
    current_day: 0
  }
};

export function cloneFieldConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

export function createFieldConfig(overrides = {}) {
  const config = cloneFieldConfig(defaultFieldConfig);
  Object.assign(config, overrides);
  return config;
}

export function addPlantToField(fieldConfig, plantSpecies, plantState, position = null) {
  const plantEntry = {
    species: plantSpecies,
    state: plantState,
    position: position || {
      x: Math.random() * fieldConfig.dimensions.width,
      y: Math.random() * fieldConfig.dimensions.height
    }
  };

  fieldConfig.plants.push(plantEntry);
  return plantEntry;
}

export function addPollinatorToField(fieldConfig, pollinatorSpecies, position = null) {
  const pollinatorEntry = {
    species: pollinatorSpecies,
    position: position || {
      x: Math.random() * fieldConfig.dimensions.width,
      y: Math.random() * fieldConfig.dimensions.height
    },
    pollen: null,
    energy: 1.0
  };

  fieldConfig.pollinators.push(pollinatorEntry);
  return pollinatorEntry;
}

export function initializeFieldWithDefaults(fieldConfig, plantSpeciesList, pollinatorSpeciesList) {
  // Add plants
  plantSpeciesList.forEach(species => {
    const { createPlantState } = await import('../plant/index.js');
    const state = createPlantState(species.id);
    addPlantToField(fieldConfig, species, state);
  });

  // Add pollinators
  pollinatorSpeciesList.forEach(species => {
    addPollinatorToField(fieldConfig, species);
  });

  return fieldConfig;
}

export function getPlantsInBloom(fieldConfig, currentDay) {
  return fieldConfig.plants.filter(plant => {
    const { start_day, duration_days } = plant.species.reproduction.flowering_time;
    return currentDay >= start_day && currentDay <= (start_day + duration_days);
  });
}

export function getPollinatorsActive(fieldConfig, timeOfDay) {
  // timeOfDay: 0-24
  const isDay = timeOfDay >= 6 && timeOfDay <= 18;

  return fieldConfig.pollinators.filter(pollinator => {
    const { active_period } = pollinator.species.behaviour;
    if (active_period === "day") return isDay;
    if (active_period === "night") return !isDay;
    return true; // crepuscular or always active
  });
}
