// export-integration.js
// Read detailed Abstract Bloom Lab design and send directly to the living simulation

export function readCurrentDesignParams() {
  const $ = (id) => document.getElementById(id);
  
  return {
    petalCount: parseInt($("petalCount")?.value || "9", 10),
    petalLength: parseFloat($("petalLength")?.value || "1.8", 10),
    petalWidth: parseFloat($("petalWidth")?.value || "0.42", 10),
    petalCurl: parseFloat($("petalCurl")?.value || "0.35", 10),
    bloomOpenness: parseFloat($("bloomOpenness")?.value || "0.78", 10),
    petalShape: $("petalShape")?.value || "long",
    petalEdge: $("petalEdge")?.value || "ruffled",
    petalLayers: $("petalLayers")?.value || "double",
    colorBase: $("colorBase")?.value || "#3a1670",
    colorTip: $("colorTip")?.value || "#da9cff",
    stemHeight: parseFloat($("stemHeight")?.value || "2.1", 10),
    stemColor: $("stemColor")?.value || "#28643a",
    leafCount: parseInt($("leafCount")?.value || "7", 10),
    leafLength: parseFloat($("leafLength")?.value || "0.72", 10),
    leafWidth: parseFloat($("leafWidth")?.value || "0.24", 10),
    leafEdge: $("leafEdge")?.value || "jagged",
    leafPattern: $("leafPattern")?.value || "variegated",
    leafColor: $("leafColor")?.value || "#1b5b35",
    variegationColor: $("variegationColor")?.value || "#d2e6ab",
    stamenCount: parseInt($("stamenCount")?.value || "12", 10),
    stamenHeight: parseFloat($("stamenHeight")?.value || "0.66", 10),
    filamentColor: $("filamentColor")?.value || "#f3e9ff",
    antherColor: $("antherColor")?.value || "#d78b18",
    pollenAmount: parseInt($("pollenAmount")?.value || "38", 10),
    pollenSize: parseFloat($("pollenSize")?.value || "0.025", 10),
    pollenColor: $("pollenColor")?.value || "#ffe06d",
    
    // Defenses
    thornPresence: $("thornPresence")?.value || "false",
    thornDensity: parseFloat($("thornDensity")?.value || "0.5", 10),
    thornLength: parseFloat($("thornLength")?.value || "0.3", 10),
    thornShape: $("thornShape")?.value || "straight",
    thornColor: $("thornColor")?.value || "#8b4513",
    trichomeDensity: parseFloat($("trichomeDensity")?.value || "0.2", 10),
    surfaceTexture: $("surfaceTexture")?.value || "smooth",
    
    // Carnivorous
    carnivorousMode: $("carnivorousMode")?.value || "false",
    trapType: $("trapType")?.value || "snap",
    trapSize: parseFloat($("trapSize")?.value || "0.5", 10),
    lureColor: $("lureColor")?.value || "#ff1493",
    nectarGlow: parseFloat($("nectarGlow")?.value || "0.6", 10),
    digestiveFluidColor: $("digestiveFluidColor")?.value || "#8b0000",
    captureSpeed: parseFloat($("captureSpeed")?.value || "0.5", 10),
    
    // Advanced physiology
    scentProfile: $("scentProfile")?.value || "sweet",
    uvPattern: parseFloat($("uvPattern")?.value || "0.4", 10),
    nectarGuides: $("nectarGuides")?.value || "none",
    photosynthesisEfficiency: parseFloat($("photosynthesisEfficiency")?.value || "0.6", 10),
    waterDemand: parseFloat($("waterDemand")?.value || "0.5", 10),
    growthPace: $("growthPace")?.value || "moderate"
  };
}

export function createSpeciesFromCurrentDesign(name = null) {
  const p = readCurrentDesignParams();
  
  return {
    id: `species-${Date.now()}`,
    name: name || `Custom Crest ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    generation: 0,
    parents: [],
    lineage_notes: "Crafted in Abstract Bloom Lab",

    morphology: {
      growth_form: "erect_herb",
      stem: {
        height: p.stemHeight,
        thickness: 0.35,
        branching: "sparse",
        flexibility: 0.5
      },
      leaves: {
        arrangement: "alternate",
        shape: "lanceolate",
        edge: p.leafEdge,
        size: p.leafLength * 0.7,
        thickness: 0.4,
        variegation: p.leafPattern === "variegated",
        pattern: p.leafPattern === "variegated" ? "mottled" : "none",
        orientation: "horizontal"
      },
      bud: {
        shape: "pointed",
        surface: "smooth",
        color: p.stemColor
      },
      flower: {
        symmetry: "radial",
        petal_count: p.petalCount,
        petal_shape: p.petalShape,
        petal_edge: p.petalEdge,
        petal_layers: p.petalLayers,
        petal_base_color: p.colorBase,
        petal_tip_color: p.colorTip,
        tube_length: 0.3 + (1 - Math.min(1, p.bloomOpenness)) * 0.4,
        opening_angle: p.bloomOpenness,
        uv_pattern: p.uvPattern
      },
      reproductive_organs: {
        stamen_count: p.stamenCount,
        stamen_length: p.stamenHeight,
        stigma_shape: "knob",
        stigma_height: 0.5
      },
      defenses: {
        thorn_presence: p.thornPresence === "true" || p.thornPresence === true,
        thorn_shape: p.thornShape,
        thorn_density: p.thornDensity,
        hairiness: p.trichomeDensity,
        surface_texture: p.surfaceTexture
      }
    },

    physiology: {
      photosynthesis: {
        efficiency: p.photosynthesisEfficiency,
        light_optimum: "partial_shade",
        leaf_longevity: "seasonal"
      },
      water: {
        demand: p.waterDemand,
        storage: 0.3,
        wilting_point: 0.25
      },
      nutrients: {
        nitrogen_demand: 0.5,
        phosphorus_demand: 0.5,
        special_strategy: p.carnivorousMode === "true" ? "carnivorous" : "none"
      },
      growth_strategy: {
        pace: p.growthPace,
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
        herbivory_response: p.thornPresence === "true" ? "structural" : "chemical"
      }
    },

    roots: {
      architecture: "fibrous",
      depth: 0.5,
      spread: 0.6,
      symbionts: { mycorrhizae: true, nitrogen_fixers: false },
      clonal_spread: false
    },

    reproduction: {
      mode: "sexual",
      pollination_syndrome: "generalist",
      self_compatible: true,
      flowering_time: {
        start_day: 0,
        duration_days: 90,
        season: "late_spring"
      },
      flower_longevity: 10,
      pollen_production: Math.min(1, p.pollenAmount / 60),
      nectar_production: 0.6 + p.bloomOpenness * 0.25,
      scent_profile: p.scentProfile,
      fruit_type: "capsule",
      seed_count_range: [20 + p.stamenCount, 50 + p.stamenCount * 2],
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
        chemical: p.thornPresence === "true" ? 0.2 : 0.4,
        structural: p.thornPresence === "true" ? 0.6 : 0.2,
        inducible: false
      },
      signaling: {
        stress_voc: p.scentProfile !== "none",
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
      enabled: p.carnivorousMode === "true",
      trap_type: p.trapType,
      trap_size: p.trapSize,
      lure_color: p.lureColor,
      nectar_glow: p.nectarGlow,
      digestive_fluid_color: p.digestiveFluidColor,
      capture_speed: p.captureSpeed
    }
  };
}

export function exportAndLaunchSimulation() {
  const species = createSpeciesFromCurrentDesign();
  
  // Store directly in localStorage for instant seamless pickup
  try {
    const existing = JSON.parse(localStorage.getItem('bloom_custom_species') || '[]');
    existing.push(species);
    localStorage.setItem('bloom_custom_species', JSON.stringify(existing));
    
    // Also save as the active direct-transfer species
    localStorage.setItem('bloom_active_species', JSON.stringify(species));
  } catch (e) {
    console.warn("Storage error:", e);
  }

  // Also trigger file download as backup
  try {
    const blob = new Blob([JSON.stringify(species, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${species.name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {}

  // Automatically navigate right into the living simulation
  window.location.href = "simulation-demo.html?autoplay=true";
}

export function initializeExportButton() {
  const exportBtn = document.getElementById("exportSpeciesBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportAndLaunchSimulation();
    });
  }
}
