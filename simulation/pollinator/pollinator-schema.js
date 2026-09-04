// simulation/pollinator/pollinator-schema.js
// Pollinator species blueprint: body, wings, behaviour, preferences

export const defaultPollinatorSpecies = {
  id: "pollinator-001",
  name: "Generic Bee",
  type: "pollinator",

  body: {
    shape: "round",
    color: "#f4c542",
    size: 0.3
  },

  wings: {
    count: 4,
    shape: "soft_triangle",
    color: "#ffffff",
    pattern: "none",
    beat_speed: "medium"
  },

  behaviour: {
    active_period: "day",
    movement: "dart",
    travel_range: 15,
    flower_preference: {
      colors: ["yellow", "white", "pink"],
      scent: ["sweet", "floral"],
      shape: ["open", "shallow"]
    },
    pollen_capacity: 0.7
  }
};

export function clonePollinator(species) {
  return JSON.parse(JSON.stringify(species));
}

export function createPollinatorFromTemplate(template = defaultPollinatorSpecies, overrides = {}) {
  const species = clonePollinator(template);
  Object.assign(species, overrides);
  return species;
}

export const pollinatorPresets = {
  bee: {
    id: "bee-001",
    name: "Amber Bee",
    type: "pollinator",

    body: {
      shape: "round",
      color: "#f4c542",
      size: 0.3
    },

    wings: {
      count: 4,
      shape: "soft_triangle",
      color: "#ffffff",
      pattern: "none",
      beat_speed: "medium"
    },

    behaviour: {
      active_period: "day",
      movement: "dart",
      travel_range: 15,
      flower_preference: {
        colors: ["yellow", "white", "pink"],
        scent: ["sweet", "floral"],
        shape: ["open", "shallow"]
      },
      pollen_capacity: 0.7
    }
  },

  butterfly: {
    id: "butterfly-001",
    name: "Painted Drift",
    type: "pollinator",

    body: {
      shape: "slender",
      color: "#e67e22",
      size: 0.4
    },

    wings: {
      count: 4,
      shape: "broad_rounded",
      color: "#e74c3c",
      pattern: "spots",
      beat_speed: "slow"
    },

    behaviour: {
      active_period: "day",
      movement: "drift",
      travel_range: 25,
      flower_preference: {
        colors: ["red", "orange", "purple"],
        scent: ["sweet", "spiced"],
        shape: ["open", "flat"]
      },
      pollen_capacity: 0.5
    }
  },

  moth: {
    id: "moth-001",
    name: "Violet Lantern Moth",
    type: "pollinator",

    body: {
      shape: "slender",
      color: "#e6ddff",
      size: 0.35
    },

    wings: {
      count: 4,
      shape: "soft_triangle",
      color: "#a178ff",
      pattern: "moonspots",
      beat_speed: "slow"
    },

    behaviour: {
      active_period: "night",
      movement: "drift",
      travel_range: 22,
      flower_preference: {
        colors: ["white", "violet", "blue"],
        scent: ["sweet-night", "spiced"],
        shape: ["lantern", "tube"]
      },
      pollen_capacity: 0.6
    }
  },

  hummingbird: {
    id: "hummingbird-001",
    name: "Crimson Hover",
    type: "pollinator",

    body: {
      shape: "hummingbird",
      color: "#c0392b",
      size: 0.5
    },

    wings: {
      count: 2,
      shape: "blurred_oval",
      color: "#7f8c8d",
      pattern: "none",
      beat_speed: "very_fast"
    },

    behaviour: {
      active_period: "day",
      movement: "hover",
      travel_range: 30,
      flower_preference: {
        colors: ["red", "orange", "pink"],
        scent: ["light", "none"],
        shape: ["tube", "lantern"]
      },
      pollen_capacity: 0.8
    }
  },

  beetle: {
    id: "beetle-001",
    name: "Bronze Scarab",
    type: "pollinator",

    body: {
      shape: "beetle",
      color: "#cd7f32",
      size: 0.4
    },

    wings: {
      count: 4,
      shape: "hard_shield",
      color: "#8e44ad",
      pattern: "metallic",
      beat_speed: "slow"
    },

    behaviour: {
      active_period: "day",
      movement: "crawl",
      travel_range: 10,
      flower_preference: {
        colors: ["white", "cream", "green"],
        scent: ["fermented", "fruity"],
        shape: ["open", "bowl"]
      },
      pollen_capacity: 0.4
    }
  }
};
