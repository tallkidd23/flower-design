// simulation/field/field-config.js
import { createPlantState } from '../plant/plant-state.js';

export const defaultFieldConfig = {
  id: "field-001",
  name: "Meadow Plot",
  dimensions: { width: 100, height: 100 },
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
    state: plantState || createPlantState(plantSpecies.id),
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

export function getPlantsInBloom(fieldConfig, currentDay) {
  return fieldConfig.plants.filter(plant => {
    const time = plant.species?.reproduction?.flowering_time;
    if (!time) return true;
    const start = time.start_day ?? 0;
    const dur = time.duration_days ?? 100;
    return currentDay >= start && currentDay <= (start + dur);
  });
}

export function getPollinatorsActive(fieldConfig, timeOfDay) {
  const isDay = timeOfDay >= 6 && timeOfDay <= 18;
  return fieldConfig.pollinators.filter(pollinator => {
    const act = pollinator.species?.behaviour?.active_period;
    if (act === "day") return isDay;
    if (act === "night") return !isDay;
    return true;
  });
}
