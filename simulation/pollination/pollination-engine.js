// simulation/pollination/pollination-engine.js
// Pollination logic: visit scoring, pollen carry/deposit, seed creation

import { createOffspring } from '../plant/plant-inheritance.js';

export function calculateAttractionScore(pollinator, plant) {
  const { behaviour } = pollinator.species;
  const { flower_preference } = behaviour;
  const { morphology, reproduction } = plant.species;

  let score = 0;

  // Color match
  const flowerColors = [
    morphology.flower.petal_base_color,
    morphology.flower.petal_tip_color
  ].map(c => c.toLowerCase());

  const colorMatches = flower_preference.colors.filter(c =>
    flowerColors.some(fc => fc.includes(c.toLowerCase()))
  ).length;

  score += colorMatches * 2;

  // Scent match
  if (flower_preference.scent.includes(reproduction.scent_profile)) {
    score += 3;
  }

  // Shape match
  const flowerShape = morphology.flower.tube_length > 0.6 ? "tube" :
                      morphology.flower.opening_angle > 0.7 ? "open" : "shallow";

  if (flower_preference.shape.includes(flowerShape)) {
    score += 2;
  }

  // Nectar bonus
  score += reproduction.nectar_production * 2;

  return score;
}

export function pollinatorVisit(pollinator, plant, field, currentDay) {
  const attraction = calculateAttractionScore(pollinator, plant);

  if (attraction < 3) {
    return { success: false, reason: "low_attraction", attraction };
  }

  // Pick up pollen if pollinator is empty
  if (!pollinator.pollen) {
    pollinator.pollen = {
      sourcePlantId: plant.species.id,
      sourceSpecies: plant.species,
      amount: plant.species.reproduction.pollen_production,
      age: currentDay
    };
    return { success: true, action: "picked_up_pollen", attraction };
  }

  // Check if pollen is still viable (max 3 days old)
  if (currentDay - pollinator.pollen.age > 3) {
    pollinator.pollen = null;
    return { success: true, action: "dropped_old_pollen", attraction };
  }

  // Deposit pollen if different plant
  if (pollinator.pollen.sourcePlantId !== plant.species.id) {
    const compatible = areSpeciesCompatible(
      pollinator.pollen.sourceSpecies,
      plant.species,
      field.environment.crossing_rules
    );

    if (compatible) {
      const seed = createSeed(
        pollinator.pollen.sourceSpecies,
        plant.species,
        currentDay
      );

      plant.state.reproductive_output.seeds_produced += seed.count;
      plant.state.reproductive_output.successful_pollinations += 1;

      pollinator.pollen = null;

      return {
        success: true,
        action: "pollinated",
        attraction,
        seed
      };
    } else {
      return { success: true, action: "incompatible", attraction };
    }
  }

  return { success: true, action: "same_plant", attraction };
}

export function areSpeciesCompatible(speciesA, speciesB, crossingRules) {
  if (crossingRules === "any") return true;
  if (crossingRules === "same_species") return speciesA.id === speciesB.id;

  // compatible_species: allow hybrids if genera are similar (simplified: check family traits)
  const sameGrowthForm = speciesA.morphology.growth_form === speciesB.morphology.growth_form;
  const samePollination = speciesA.reproduction.pollination_syndrome === speciesB.reproduction.pollination_syndrome;
  const overlappingHabitat = speciesA.ecology.habitat_preference.some(h =>
    speciesB.ecology.habitat_preference.includes(h)
  );

  return sameGrowthForm || samePollination || overlappingHabitat;
}

export function createSeed(parentA, parentB, currentDay) {
  const offspring = createOffspring(parentA, parentB, `seed-${Date.now()}`, "Unnamed Seed");

  const [minCount, maxCount] = offspring.reproduction.seed_count_range;
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

  return {
    id: offspring.id,
    species: offspring,
    parentA: parentA.id,
    parentB: parentB.id,
    count,
    created_day: currentDay,
    dormancy: offspring.reproduction.seed_dormancy,
    germinated: false
  };
}

export function simulatePollinatorMovement(pollinator, field, deltaTime) {
  const { travel_range, movement } = pollinator.species.behaviour;

  // Simple random walk for now
  const speed = movement === "dart" ? 5 :
                movement === "drift" ? 2 :
                movement === "hover" ? 1 : 3;

  pollinator.position.x += (Math.random() - 0.5) * speed * deltaTime;
  pollinator.position.y += (Math.random() - 0.5) * speed * deltaTime;

  // Keep in bounds
  pollinator.position.x = Math.max(0, Math.min(field.dimensions.width, pollinator.position.x));
  pollinator.position.y = Math.max(0, Math.min(field.dimensions.height, pollinator.position.y));

  // Energy drain
  pollinator.energy -= 0.01 * deltaTime;
  if (pollinator.energy <= 0) {
    pollinator.energy = 0;
    // Could remove pollinator or make it rest
  }
}

export function findNearestFloweringPlant(pollinator, plants, currentDay) {
  let nearest = null;
  let minDistance = Infinity;
  let bestAttraction = 0;

  plants.forEach(plant => {
    const { start_day, duration_days } = plant.species.reproduction.flowering_time;
    if (currentDay < start_day || currentDay > start_day + duration_days) {
      return; // Not in bloom
    }

    const dx = pollinator.position.x - plant.position.x;
    const dy = pollinator.position.y - plant.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > pollinator.species.behaviour.travel_range) {
      return; // Out of range
    }

    const attraction = calculateAttractionScore(pollinator, plant);

    // Weight by distance (closer = better) and attraction
    const score = attraction - (distance * 0.1);

    if (score > bestAttraction) {
      bestAttraction = score;
      nearest = plant;
      minDistance = distance;
    }
  });

  return nearest;
}
