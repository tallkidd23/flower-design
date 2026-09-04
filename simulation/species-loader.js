// simulation/species-loader.js
// Load/export plant species from JSON files

export function validateSpecies(species) {
  const required = ['id', 'name', 'morphology', 'reproduction'];
  const missing = required.filter(key => !species[key]);
  
  if (missing.length > 0) {
    throw new Error(`Invalid species: missing fields: ${missing.join(', ')}`);
  }
  
  return true;
}

export function loadSpeciesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const species = JSON.parse(event.target.result);
        validateSpecies(species);
        resolve(species);
      } catch (error) {
        reject(new Error(`Invalid JSON: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
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
    
    getAll() {
      return this.species;
    }
  };
}
