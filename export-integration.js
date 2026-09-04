// export-integration.js
// Export current flower design as species JSON for simulation

export function getCurrentFlowerData() {
  // Read current values from your existing sliders
  // Adjust these IDs to match your actual slider IDs
  const petalCount = parseInt(document.getElementById('petalCount')?.value || '5', 10);
  const petalLength = parseFloat(document.getElementById('petalLength')?.value || '1', 10);
  const petalColor = document.getElementById('petalColor')?.value || '#ff6b9e';
  const stemHeight = parseFloat(document.getElementById('stemHeight')?.value || '1.5', 10);
  const leafSize = parseFloat(document.getElementById('leafSize')?.value || '0.7', 10);

  return {
    petalCount,
    petalLength,
    petalColor,
    stemHeight,
    leafSize
  };
}

export function createSpeciesFromCurrentFlower(name = null) {
  const flowerData = getCurrentFlowerData();

  const species = {
    id: `custom-${Date.now()}`,
    name: name || `Custom Flower ${new Date().toLocaleTimeString()}`,
    generation: 0,
    parents: [],
    lineage_notes: "Exported from flower designer",

    morphology: {
      growth_form: "erect_herb",

      stem: {
        height: flowerData.stemHeight,
        thickness: 0.3,
        branching: "sparse",
        flexibility: 0.5
      },

      leaves: {
        arrangement: "alternate",
        shape: "lanceolate",
        edge: "smooth",
        size: flowerData.leafSize,
        thickness: 0.4,
        variegation: false,
        pattern: "none",
        orientation: "horizontal"
      },

      bud: {
        shape: "pointed",
        surface: "smooth",
        color: "#4a7c3a"
      },

      flower: {
        symmetry: "radial",
        petal_count: flowerData.petalCount,
        petal_shape: "round",
        petal_edge: "smooth",
        petal_layers: "single",
        petal_base_color: flowerData.petalColor,
        petal_tip_color: flowerData.petalColor,
        tube_length: 0.3,
        opening_angle: 0.8,
        uv_pattern: 0.3
      },

      reproductive_organs: {
        stamen_count: flowerData.petalCount * 2,
        stamen_length: 0.5,
        stigma_shape: "knob",
        stigma_height: 0.4
      },

      defenses: {
        thorn_presence: false,
        thorn_shape: "straight",
        thorn_density: 0.0,
        hairiness: 0.2,
        surface_texture: "smooth"
      }
    },

    physiology: {
      photosynthesis: {
        efficiency: 0.6,
        light_optimum: "partial_shade",
        leaf_longevity: "seasonal"
      },

      water: {
        demand: 0.5,
        storage: 0.3,
        wilting_point: 0.25
      },

      nutrients: {
        nitrogen_demand: 0.5,
        phosphorus_demand: 0.5,
        special_strategy: "none"
      },

      growth_strategy: {
        pace: "moderate",
        longevity: "perennial",
        allocation: {
          to_leaves: 0.4,
          to_stem: 0.3,
          to_roots: 0.2,
          to_reproduction: 0.1
        }
      },

      stress_responses: {
        drought_response: "leaf_reduce",
        shade_response: "enlarge_leaves",
        herbivory_response: "chemical"
      }
    },

    roots: {
      architecture: "fibrous",
      depth: 0.5,
      spread: 0.6,
      symbionts: {
        mycorrhizae: true,
        nitrogen_fixers: false
      },
      clonal_spread: false
    },

    reproduction: {
      mode: "sexual",
      pollination_syndrome: "generalist",
      self_compatible: true,

      flowering_time: {
        start_day: 60,
        duration_days: 30,
        season: "late_spring"
      },

      flower_longevity: 5,
      pollen_production: 0.6,
      nectar_production: 0.6,
      scent_profile: "sweet",

      fruit_type: "capsule",
      seed_count_range: [20, 50],
      seed_size: "small",
      seed_dispersal: "wind",
      seed_dormancy: 0.2
    },

    ecology: {
      habitat_preference: ["meadow", "forest_edge"],
      light_niche: "partial_shade",
      water_niche: "moderate",
      soil_niche: "well_drained",

      temperature_range: {
        min: 5,
        opt: 20,
        max: 30
      },

      competition_style: "moderate",
      facilitation: [],

      herbivore_defense: {
        chemical: 0.3,
        structural: 0.3,
        inducible: false
      },

      signaling: {
        stress_voc: false,
        pollinator_signals: ["visual", "scent"]
      }
    },

    development: {
      juvenile_form: {
        leaf_shape: "rounded",
        leaf_size: 0.5,
        stem_height_factor: 0.6,
        flowers: false
      },

      adult_form: {
        leaf_shape: "lanceolate",
        leaf_size: 1.0,
        stem_height_factor: 1.0,
        flowers: true
      },

      senescence: {
        onset_age_years: 5,
        traits: ["leaf_yellowing", "reduced_bloom"]
      },

      plasticity: {
        shade_leaf_factor: 1.2,
        drought_leaf_factor: 0.8,
        wind_stem_factor: 0.9
      }
    }
  };

  return species;
}

export function downloadCurrentFlowerAsSpecies() {
  const species = createSpeciesFromCurrentFlower();
  const json = JSON.stringify(species, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${species.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show feedback
  alert(`Exported "${species.name}" as ${a.download}\n\nUpload this file to simulation-demo.html to use it in the ecosystem!`);
}

export function initializeExportButton() {
  const exportBtn = document.getElementById('exportSpeciesBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadCurrentFlowerAsSpecies();
    });
  }
}
