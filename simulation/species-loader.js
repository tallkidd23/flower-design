// simulation/species-loader.js
// Load/export plant species from JSON files

import { createSpeciesFromTemplate, defaultPlantSpecies } from './plant/plant-schema.js';

export function validateSpecies(species) {
  const required = ['id', 'name', 'morphology', 'physiology', 'roots', 'reproduction', 'ecology', 'development'];
  const missing = required.filter(key => !species[key]);

  if (missing.length > 0) {
    throw new Error(`Invalid species: missing fields: ${missing.join(', ')}`);
  }

  return true;
}

export function exportSpecies(species) {
  return JSON.stringify(species, null, 2);
}

export function importSpecies(jsonString) {
  try {
    const species = JSON.parse(jsonString);
    validateSpecies(species);
    return species;
  } catch (error) {
    console.error('Failed to import species:', error);
    throw error;
  }
}

export function loadSpeciesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const species = importSpecies(event.target.result);
        resolve(species);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function downloadSpecies(species, filename = null) {
  const json = exportSpecies(species);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${species.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createSpeciesFromFlowerData(flowerData, overrides = {}) {
  // Convert simple flower editor data to full species schema
  const species = createSpeciesFromTemplate(defaultPlantSpecies, {
    id: `custom-${Date.now()}`,
    name: "Custom Species",
    morphology: {
      ...defaultPlantSpecies.morphology,
      flower: {
        ...defaultPlantSpecies.morphology.flower,
        petal_count: flowerData.petalCount || 5,
        petal_shape: flowerData.petalShape || "round",
        petal_edge: flowerData.petalEdge || "smooth",
        petal_layers: flowerData.petalLayers || "single",
        petal_base_color: flowerData.petalColor || "#ff6b9e",
        petal_tip_color: flowerData.petalTipColor || "#ffb3d1",
        tube_length: flowerData.tubeLength || 0.3,
        opening_angle: flowerData.openingAngle || 0.8
      },
      stem: {
        ...defaultPlantSpecies.morphology.stem,
        height: flowerData.stemHeight || 1.5
      },
      leaves: {
        ...defaultPlantSpecies.morphology.leaves,
        size: flowerData.leafSize || 0.7,
        shape: flowerData.leafShape || "lanceolate"
      }
    },
    ...overrides
  });

  return species;
}

export function createSpeciesLibrary() {
  return {
    species: [],

    add(species) {
      this.species.push(species);
    },

    getById(id) {
      return this.species.find(s => s.id === id);
    },

    getByName(name) {
      return this.species.find(s => s.name === name);
    },

    getAll() {
      return this.species;
    },

    export() {
      return JSON.stringify(this.species, null, 2);
    },

    import(jsonString) {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        imported.forEach(s => {
          validateSpecies(s);
          this.species.push(s);
        });
      } else {
        validateSpecies(imported);
        this.species.push(imported);
      }
    }
  };
}
