// simulation/plant/plant-inheritance.js
// Blending + mutation logic for creating offspring from two parent species

import { cloneSpecies } from "./plant-schema.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function blendNumber(a, b, mutationRange = 0.05) {
  const base = (a + b) / 2;
  const mutation = (Math.random() * 2 - 1) * mutationRange;
  return clamp01(base + mutation);
}

function blendColor(a, b) {
  // Simple: pick one parent for now; can be enhanced later
  return Math.random() < 0.5 ? a : b;
}

function pickOne(a, b) {
  return Math.random() < 0.5 ? a : b;
}

export function createOffspring(parentA, parentB, newId, newName) {
  const child = cloneSpecies(parentA);

  child.id = newId;
  child.name = newName;
  child.generation = Math.max(parentA.generation, parentB.generation) + 1;
  child.parents = [parentA.id, parentB.id];
  child.lineage_notes = `Hybrid of ${parentA.name} × ${parentB.name}`;

  // Morphology blending
  const mA = parentA.morphology;
  const mB = parentB.morphology;

  child.morphology.growth_form = pickOne(mA.growth_form, mB.growth_form);

  child.morphology.stem.height = blendNumber(mA.stem.height, mB.stem.height);
  child.morphology.stem.thickness = blendNumber(mA.stem.thickness, mB.stem.thickness);
  child.morphology.stem.branching = pickOne(mA.stem.branching, mB.stem.branching);
  child.morphology.stem.flexibility = blendNumber(mA.stem.flexibility, mB.stem.flexibility);

  child.morphology.leaves.arrangement = pickOne(mA.leaves.arrangement, mB.leaves.arrangement);
  child.morphology.leaves.shape = pickOne(mA.leaves.shape, mB.leaves.shape);
  child.morphology.leaves.edge = pickOne(mA.leaves.edge, mB.leaves.edge);
  child.morphology.leaves.size = blendNumber(mA.leaves.size, mB.leaves.size);
  child.morphology.leaves.thickness = blendNumber(mA.leaves.thickness, mB.leaves.thickness);
  child.morphology.leaves.variegation = pickOne(mA.leaves.variegation, mB.leaves.variegation);
  child.morphology.leaves.pattern = pickOne(mA.leaves.pattern, mB.leaves.pattern);
  child.morphology.leaves.orientation = pickOne(mA.leaves.orientation, mB.leaves.orientation);

  child.morphology.bud.shape = pickOne(mA.bud.shape, mB.bud.shape);
  child.morphology.bud.surface = pickOne(mA.bud.surface, mB.bud.surface);
  child.morphology.bud.color = blendColor(mA.bud.color, mB.bud.color);

  child.morphology.flower.symmetry = pickOne(mA.flower.symmetry, mB.flower.symmetry);
  child.morphology.flower.petal_count = Math.round((mA.flower.petal_count + mB.flower.petal_count) / 2);
  child.morphology.flower.petal_shape = pickOne(mA.flower.petal_shape, mB.flower.petal_shape);
  child.morphology.flower.petal_edge = pickOne(mA.flower.petal_edge, mB.flower.petal_edge);
  child.morphology.flower.petal_layers = pickOne(mA.flower.petal_layers, mB.flower.petal_layers);
  child.morphology.flower.petal_base_color = blendColor(mA.flower.petal_base_color, mB.flower.petal_base_color);
  child.morphology.flower.petal_tip_color = blendColor(mA.flower.petal_tip_color, mB.flower.petal_tip_color);
  child.morphology.flower.tube_length = blendNumber(mA.flower.tube_length, mB.flower.tube_length);
  child.morphology.flower.opening_angle = blendNumber(mA.flower.opening_angle, mB.flower.opening_angle);
  child.morphology.flower.uv_pattern = blendNumber(mA.flower.uv_pattern, mB.flower.uv_pattern);

  child.morphology.reproductive_organs.stamen_count = Math.round((mA.reproductive_organs.stamen_count + mB.reproductive_organs.stamen_count) / 2);
  child.morphology.reproductive_organs.stamen_length = blendNumber(mA.reproductive_organs.stamen_length, mB.reproductive_organs.stamen_length);
  child.morphology.reproductive_organs.stigma_shape = pickOne(mA.reproductive_organs.stigma_shape, mB.reproductive_organs.stigma_shape);
  child.morphology.reproductive_organs.stigma_height = blendNumber(mA.reproductive_organs.stigma_height, mB.reproductive_organs.stigma_height);

  child.morphology.defenses.thorn_presence = mA.defenses.thorn_presence || mB.defenses.thorn_presence;
  child.morphology.defenses.thorn_shape = pickOne(mA.defenses.thorn_shape, mB.defenses.thorn_shape);
  child.morphology.defenses.thorn_density = blendNumber(mA.defenses.thorn_density, mB.defenses.thorn_density);
  child.morphology.defenses.hairiness = blendNumber(mA.defenses.hairiness, mB.defenses.hairiness);
  child.morphology.defenses.surface_texture = pickOne(mA.defenses.surface_texture, mB.defenses.surface_texture);

  // Physiology blending
  const pA = parentA.physiology;
  const pB = parentB.physiology;

  child.physiology.photosynthesis.efficiency = blendNumber(pA.photosynthesis.efficiency, pB.photosynthesis.efficiency);
  child.physiology.photosynthesis.light_optimum = pickOne(pA.photosynthesis.light_optimum, pB.photosynthesis.light_optimum);
  child.physiology.photosynthesis.leaf_longevity = pickOne(pA.photosynthesis.leaf_longevity, pB.photosynthesis.leaf_longevity);

  child.physiology.water.demand = blendNumber(pA.water.demand, pB.water.demand);
  child.physiology.water.storage = blendNumber(pA.water.storage, pB.water.storage);
  child.physiology.water.wilting_point = blendNumber(pA.water.wilting_point, pB.water.wilting_point);

  child.physiology.nutrients.nitrogen_demand = blendNumber(pA.nutrients.nitrogen_demand, pB.nutrients.nitrogen_demand);
  child.physiology.nutrients.phosphorus_demand = blendNumber(pA.nutrients.phosphorus_demand, pB.nutrients.phosphorus_demand);
  child.physiology.nutrients.special_strategy = pickOne(pA.nutrients.special_strategy, pB.nutrients.special_strategy);

  child.physiology.growth_strategy.pace = pickOne(pA.growth_strategy.pace, pB.growth_strategy.pace);
  child.physiology.growth_strategy.longevity = pickOne(pA.growth_strategy.longevity, pB.growth_strategy.longevity);

  child.physiology.growth_strategy.allocation.to_leaves = blendNumber(pA.growth_strategy.allocation.to_leaves, pB.growth_strategy.allocation.to_leaves);
  child.physiology.growth_strategy.allocation.to_stem = blendNumber(pA.growth_strategy.allocation.to_stem, pB.growth_strategy.allocation.to_stem);
  child.physiology.growth_strategy.allocation.to_roots = blendNumber(pA.growth_strategy.allocation.to_roots, pB.growth_strategy.allocation.to_roots);
  child.physiology.growth_strategy.allocation.to_reproduction = blendNumber(pA.growth_strategy.allocation.to_reproduction, pB.growth_strategy.allocation.to_reproduction);

  child.physiology.stress_responses.drought_response = pickOne(pA.stress_responses.drought_response, pB.stress_responses.drought_response);
  child.physiology.stress_responses.shade_response = pickOne(pA.stress_responses.shade_response, pB.stress_responses.shade_response);
  child.physiology.stress_responses.herbivory_response = pickOne(pA.stress_responses.herbivory_response, pB.stress_responses.herbivory_response);

  // Roots blending
  const rA = parentA.roots;
  const rB = parentB.roots;

  child.roots.architecture = pickOne(rA.architecture, rB.architecture);
  child.roots.depth = blendNumber(rA.depth, rB.depth);
  child.roots.spread = blendNumber(rA.spread, rB.spread);
  child.roots.symbionts.mycorrhizae = rA.symbionts.mycorrhizae || rB.symbionts.mycorrhizae;
  child.roots.symbionts.nitrogen_fixers = rA.symbionts.nitrogen_fixers || rB.symbionts.nitrogen_fixers;
  child.roots.clonal_spread = rA.clonal_spread || rB.clonal_spread;

  // Reproduction blending
  const repA = parentA.reproduction;
  const repB = parentB.reproduction;

  child.reproduction.mode = pickOne(repA.mode, repB.mode);
  child.reproduction.pollination_syndrome = pickOne(repA.pollination_syndrome, repB.pollination_syndrome);
  child.reproduction.self_compatible = repA.self_compatible || repB.self_compatible;

  child.reproduction.flowering_time.start_day = Math.round((repA.flowering_time.start_day + repB.flowering_time.start_day) / 2);
  child.reproduction.flowering_time.duration_days = Math.round((repA.flowering_time.duration_days + repB.flowering_time.duration_days) / 2);
  child.reproduction.flowering_time.season = pickOne(repA.flowering_time.season, repB.flowering_time.season);

  child.reproduction.flower_longevity = Math.round((repA.flower_longevity + repB.flower_longevity) / 2);
  child.reproduction.pollen_production = blendNumber(repA.pollen_production, repB.pollen_production);
  child.reproduction.nectar_production = blendNumber(repA.nectar_production, repB.nectar_production);
  child.reproduction.scent_profile = pickOne(repA.scent_profile, repB.scent_profile);

  child.reproduction.fruit_type = pickOne(repA.fruit_type, repB.fruit_type);
  child.reproduction.seed_count_range = [
    Math.round((repA.seed_count_range[0] + repB.seed_count_range[0]) / 2),
    Math.round((repA.seed_count_range[1] + repB.seed_count_range[1]) / 2)
  ];
  child.reproduction.seed_size = pickOne(repA.seed_size, repB.seed_size);
  child.reproduction.seed_dispersal = pickOne(repA.seed_dispersal, repB.seed_dispersal);
  child.reproduction.seed_dormancy = blendNumber(repA.seed_dormancy, repB.seed_dormancy);

  // Ecology blending
  const eA = parentA.ecology;
  const eB = parentB.ecology;

  child.ecology.habitat_preference = Array.from(
    new Set([...eA.habitat_preference, ...eB.habitat_preference])
  );
  child.ecology.light_niche = pickOne(eA.light_niche, eB.light_niche);
  child.ecology.water_niche = pickOne(eA.water_niche, eB.water_niche);
  child.ecology.soil_niche = pickOne(eA.soil_niche, eB.soil_niche);

  child.ecology.temperature_range.min = Math.min(eA.temperature_range.min, eB.temperature_range.min);
  child.ecology.temperature_range.opt = (eA.temperature_range.opt + eB.temperature_range.opt) / 2;
  child.ecology.temperature_range.max = Math.max(eA.temperature_range.max, eB.temperature_range.max);

  child.ecology.competition_style = pickOne(eA.competition_style, eB.competition_style);
  child.ecology.facilitation = Array.from(
    new Set([...eA.facilitation, ...eB.facilitation])
  );

  child.ecology.herbivore_defense.chemical = blendNumber(eA.herbivore_defense.chemical, eB.herbivore_defense.chemical);
  child.ecology.herbivore_defense.structural = blendNumber(eA.herbivore_defense.structural, eB.herbivore_defense.structural);
  child.ecology.herbivore_defense.inducible = eA.herbivore_defense.inducible || eB.herbivore_defense.inducible;

  child.ecology.signaling.stress_voc = eA.signaling.stress_voc || eB.signaling.stress_voc;
  child.ecology.signaling.pollinator_signals = Array.from(
    new Set([...eA.signaling.pollinator_signals, ...eB.signaling.pollinator_signals])
  );

  // Development blending
  const dA = parentA.development;
  const dB = parentB.development;

  child.development.juvenile_form.leaf_shape = pickOne(dA.juvenile_form.leaf_shape, dB.juvenile_form.leaf_shape);
  child.development.juvenile_form.leaf_size = blendNumber(dA.juvenile_form.leaf_size, dB.juvenile_form.leaf_size);
  child.development.juvenile_form.stem_height_factor = blendNumber(dA.juvenile_form.stem_height_factor, dB.juvenile_form.stem_height_factor);
  child.development.juvenile_form.flowers = dA.juvenile_form.flowers || dB.juvenile_form.flowers;

  child.development.adult_form.leaf_shape = pickOne(dA.adult_form.leaf_shape, dB.adult_form.leaf_shape);
  child.development.adult_form.leaf_size = blendNumber(dA.adult_form.leaf_size, dB.adult_form.leaf_size);
  child.development.adult_form.stem_height_factor = blendNumber(dA.adult_form.stem_height_factor, dB.adult_form.stem_height_factor);
  child.development.adult_form.flowers = dA.adult_form.flowers || dB.adult_form.flowers;

  child.development.senescence.onset_age_years = Math.round((dA.senescence.onset_age_years + dB.senescence.onset_age_years) / 2);
  child.development.senescence.traits = Array.from(
    new Set([...dA.senescence.traits, ...dB.senescence.traits])
  );

  child.development.plasticity.shade_leaf_factor = blendNumber(dA.plasticity.shade_leaf_factor, dB.plasticity.shade_leaf_factor);
  child.development.plasticity.drought_leaf_factor = blendNumber(dA.plasticity.drought_leaf_factor, dB.plasticity.drought_leaf_factor);
  child.development.plasticity.wind_stem_factor = blendNumber(dA.plasticity.wind_stem_factor, dB.plasticity.wind_stem_factor);

  return child;
}
