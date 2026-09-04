// simulation/plant/plant-state.js
// Per-instance runtime state for a plant

export function createPlantState(speciesId, initialState = {}) {
  return {
    age_years: 0,
    life_stage: "seedling",

    health: 1.0,
    energy: 0.8,
    water_status: 0.8,
    nutrient_status: 0.8,

    current_light_capture: 0.7,

    damage: {
      herbivory: 0.0,
      mechanical: 0.0,
      disease: 0.0
    },

    reproductive_output: {
      flowers_this_season: 0,
      successful_pollinations: 0,
      seeds_produced: 0
    },

    clonal_offspring: 0,

    species_id: speciesId,

    ...initialState
  };
}

export function updateLifeStage(state) {
  const { age_years } = state;

  if (age_years === 0) {
    state.life_stage = "seedling";
  } else if (age_years === 1) {
    state.life_stage = "juvenile";
  } else if (age_years >= 2 && age_years < 5) {
    state.life_stage = "adult";
  } else {
    state.life_stage = "senescent";
  }
}

export function applySeasonalUpdate(state, seasonFactors) {
  // seasonFactors: { light, water, nutrients, temperature, herbivoryPressure }
  const { light, water, nutrients, temperature, herbivoryPressure } = seasonFactors;

  // Simple resource update logic (placeholder for fuller sim)
  state.energy = Math.max(0, Math.min(1, state.energy + (light * 0.1) - 0.05));
  state.water_status = Math.max(0, Math.min(1, state.water_status + (water * 0.1) - 0.05));
  state.nutrient_status = Math.max(0, Math.min(1, state.nutrient_status + (nutrients * 0.1) - 0.05));

  // Herbivory damage
  if (herbivoryPressure > 0.7) {
    state.damage.herbivory = Math.min(1, state.damage.herbivory + 0.1);
    state.health = Math.max(0, state.health - 0.05);
  }

  // Age increment
  state.age_years += 1;
  updateLifeStage(state);

  return state;
}
