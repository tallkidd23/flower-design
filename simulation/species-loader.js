// simulation/species-loader.js
// Flexible parser for both Abstract Bloom Lab design JSON and Species Schema JSON

export function normalizeSpecies(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid file content: not a JSON object");
  }

  // Case 1: Already full species schema
  if (data.morphology && data.reproduction) {
    return data;
  }

  // Case 2: Abstract Bloom Lab save file format
  const name = data.name || "Imported Bloom";
  const petalCount = Number(data.petalCount) || 9;
  const petalLength = Number(data.petalLength) || 1.8;
  const petalWidth = Number(data.petalWidth) || 0.42;
  const bloomOpenness = Number(data.bloomOpenness) || 0.78;
  const petalShape = data.petalShape || "long";
  const petalEdge = data.petalEdge || "ruffled";
  const petalLayers = data.petalLayers || "double";
  const colorBase = data.colorBase || "#3a1670";
  const colorTip = data.colorTip || "#da9cff";
  const stemHeight = Number(data.stemHeight) || 2.1;
  const stemColor = data.stemColor || "#28643a";
  const leafCount = Number(data.leafCount) || 7;
  const leafLength = Number(data.leafLength) || 0.72;
  const leafEdge = data.leafEdge || "jagged";
  const leafPattern = data.leafPattern || "variegated";
  const stamenCount = Number(data.stamenCount) || 12;
  const stamenHeight = Number(data.stamenHeight) || 0.66;
  const pollenAmount = Number(data.pollenAmount) || 38;
  const thornPresence = data.thornPresence === "true" || data.thornPresence === true;
  const thornShape = data.thornShape || "straight";
  const thornDensity = Number(data.thornDensity) || 0;
  const trichomeDensity = Number(data.trichomeDensity) || 0.2;
  const carnivorousMode = data.carnivorousMode === "true" || data.carnivorousMode === true;
  const trapType = data.trapType || "snap";
  const trapSize = Number(data.trapSize) || 0.5;
  const lureColor = data.lureColor || "#ff1493";
  const scentProfile = data.scentProfile || "sweet";
  const uvPattern = Number(data.uvPattern) || 0.4;

  return {
    id: data.id || `species-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name,
    generation: Number(data.generation) || 0,
    parents: data.parents || [],
    lineage_notes: data.lineage_notes || "Imported from Abstract Bloom design",

    morphology: {
      growth_form: "erect_herb",
      stem: {
        height: stemHeight,
        thickness: 0.35,
        branching: "sparse",
        flexibility: 0.5
      },
      leaves: {
        arrangement: "alternate",
        shape: "lanceolate",
        edge: leafEdge,
        size: leafLength * 0.7,
        thickness: 0.4,
        variegation: leafPattern === "variegated",
        pattern: leafPattern === "variegated" ? "mottled" : "none",
        orientation: "horizontal"
      },
      bud: {
        shape: "pointed",
        surface: "smooth",
        color: stemColor
      },
      flower: {
        symmetry: "radial",
        petal_count: petalCount,
        petal_shape: petalShape,
        petal_edge: petalEdge,
        petal_layers: petalLayers,
        petal_base_color: colorBase,
        petal_tip_color: colorTip,
        tube_length: 0.3 + (1 - Math.min(1, bloomOpenness)) * 0.4,
        opening_angle: bloomOpenness,
        uv_pattern: uvPattern
      },
      reproductive_organs: {
        stamen_count: stamenCount,
        stamen_length: stamenHeight,
        stigma_shape: "knob",
        stigma_height: 0.5
      },
      defenses: {
        thorn_presence: thornPresence,
        thorn_shape: thornShape,
        thorn_density: thornDensity,
        hairiness: trichomeDensity,
        surface_texture: data.surfaceTexture || "smooth"
      }
    },

    physiology: {
      photosynthesis: {
        efficiency: Number(data.photosynthesisEfficiency) || 0.6,
        light_optimum: "partial_shade",
        leaf_longevity: "seasonal"
      },
      water: {
        demand: Number(data.waterDemand) || 0.5,
        storage: 0.3,
        wilting_point: 0.25
      },
      nutrients: {
        nitrogen_demand: 0.5,
        phosphorus_demand: 0.5,
        special_strategy: carnivorousMode ? "carnivorous" : "none"
      },
      growth_strategy: {
        pace: data.growthPace || "moderate",
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
        herbivory_response: thornPresence ? "structural" : "chemical"
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
        start_day: 10,
        duration_days: 60,
        season: "late_spring"
      },
      flower_longevity: 8,
      pollen_production: Math.min(1, pollenAmount / 80),
      nectar_production: 0.6 + bloomOpenness * 0.2,
      scent_profile: scentProfile,
      fruit_type: "capsule",
      seed_count_range: [20 + stamenCount, 50 + stamenCount * 2],
      seed_size: "small",
      seed_dispersal: "wind",
      seed_dormancy: 0.2
    },

    ecology: {
      habitat_preference: ["meadow", "forest_edge"],
      light_niche: "partial_shade",
      water_niche: "moderate",
      soil_niche: "well_drained",
      temperature_range: { min: 5, opt: 20, max: 30 },
      competition_style: "moderate",
      facilitation: [],
      herbivore_defense: {
        chemical: thornPresence ? 0.2 : 0.4,
        structural: thornPresence ? 0.6 : 0.2,
        inducible: false
      },
      signaling: {
        stress_voc: scentProfile !== "none",
        pollinator_signals: ["visual", "scent"]
      }
    },

    development: {
      juvenile_form: { leaf_shape: "rounded", leaf_size: 0.5, stem_height_factor: 0.6, flowers: false },
      adult_form: { leaf_shape: "lanceolate", leaf_size: 1.0, stem_height_factor: 1.0, flowers: true },
      senescence: { onset_age_years: 5, traits: ["leaf_yellowing", "reduced_bloom"] },
      plasticity: { shade_leaf_factor: 1.2, drought_leaf_factor: 0.8, wind_stem_factor: 0.9 }
    },

    carnivorous: {
      enabled: carnivorousMode,
      trap_type: trapType,
      trap_size: trapSize,
      lure_color: lureColor,
      nectar_glow: Number(data.nectarGlow) || 0.6,
      digestive_fluid_color: data.digestiveFluidColor || "#8b0000",
      capture_speed: Number(data.captureSpeed) || 0.5
    }
  };
}

export function loadSpeciesFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const normalized = normalizeSpecies(parsed);
        resolve(normalized);
      } catch (err) {
        reject(new Error(`Failed to read JSON: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("File read error"));
    };

    reader.readAsText(file);
  });
}

export function createSpeciesLibrary() {
  return {
    species: [],
    add(sp) {
      this.species.push(sp);
    },
    getById(id) {
      return this.species.find((s) => s.id === id);
    },
    getAll() {
      return this.species;
    }
  };
}
