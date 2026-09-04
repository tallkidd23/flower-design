// simulation/plant/index.js
// Barrel export for plant simulation modules

export { defaultPlantSpecies, cloneSpecies, createSpeciesFromTemplate } from "./plant-schema.js";
export { createPlantState, updateLifeStage, applySeasonalUpdate } from "./plant-state.js";
export { createOffspring } from "./plant-inheritance.js";
