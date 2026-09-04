# 🌸 Flower Design Studio

An interactive flower design application with genetic inheritance, pollination simulation, and **enhanced 3D rendering** for realistic leaves and petals.

## ✨ Features

### Core Features
- **Genetic Flower Design**: Create unique flowers with customizable genetics
- **Pollination Simulation**: Watch your flowers reproduce with realistic pollinator behavior
- **Export & Share**: Save designs as PNG or SVG
- **Responsive Design**: Works on desktop and mobile

### 🌿 Enhanced 3D Rendering (NEW!)

The latest update adds realistic 3D rendering for leaves and petals:

- **Procedural Leaf Textures**: Algorithmically generated vein patterns with natural variation
- **Realistic Stem Attachments**: Leaves connect to stems with proper petioles (leaf stalks)
- **3D Depth Effects**: Shadows, highlights, and curvature for realistic appearance
- **Petal Textures**: Radial gradients and subtle vein patterns on petals
- **Toggle Control**: Enable/disable 3D rendering with a checkbox

## 🚀 Usage

### Basic Controls
1. **Flower Properties**: Adjust petal count, length, width, stem length, and leaf count
2. **Colors**: Customize petal, center, stem, and leaf colors
3. **3D Rendering**: Toggle enhanced 3D textures and attachments (default: ON)
4. **Genetics**: Randomize or save genetic profiles

### 3D Rendering Features

The `PlantRenderer3D` class provides:

```javascript
// Initialize renderer
const renderer3D = new PlantRenderer3D(canvas, ctx);

// Draw 3D leaf with realistic stem attachment
renderer3D.draw3DLeaf(leafData, stemPoint, leafColor);

// Draw 3D petal with curvature
renderer3D.draw3DPetal(petalData, baseColor, edgeColor);

// Draw complete stem with attached leaves
renderer3D.drawStemWithLeaves(stemPoints, leaves, stemColor, leafColor);
```

### Leaf Attachment System

Leaves now attach to stems realistically:

- **Petiole Connection**: Small stalk connects leaf base to stem
- **Proper Rotation**: Leaves angle naturally from stem surface
- **Depth Layering**: Stems → Petioles → Leaves for correct z-order
- **Texture Mapping**: Veins align with leaf curvature

## 📁 File Structure

```
flower-design/
├── index.html              # Main application page
├── main-enhanced.js        # Enhanced app with 3D rendering
├── plant-renderer-3d.js    # 3D rendering module
├── export-integration.js   # SVG/PNG export functionality
├── style.css               # Application styles
├── simulation-demo.html    # Pollination simulation demo
├── simulation-demo.js      # Simulation logic
└── simulation/             # Simulation modules
    ├── field/              # Field configuration
    ├── plant/              # Plant genetics and inheritance
    ├── pollination/        # Pollination engine
    ├── pollinator/         # Pollinator behavior
    └── seed/               # Seed dispersal
```

## 🔧 Integration Guide

### Adding 3D Rendering to Your Project

1. **Include the renderer**:
```html
<script src="plant-renderer-3d.js"></script>
```

2. **Initialize in your code**:
```javascript
const renderer3D = new PlantRenderer3D(canvas, ctx);
```

3. **Use enhanced drawing functions**:
```javascript
// For leaves
renderer3D.draw3DLeaf(leafData, stemAttachment, color);

// For petals
renderer3D.draw3DPetal(petalData, baseColor, edgeColor);
```

### Leaf Data Structure

```javascript
const leafData = {
    width: 20,           // Leaf width in pixels
    length: 40,          // Leaf length in pixels
    angle: Math.PI / 4   // Angle relative to stem
};

const stemAttachment = {
    x: 100,              // X position on stem
    y: 200,              // Y position on stem
    angle: 0             // Stem angle at attachment point
};
```

## 🎨 Color Manipulation

The renderer includes utilities for natural color variation:

```javascript
renderer3D.lightenColor('#228B22', 20);  // Lighten by 20%
renderer3D.darkenColor('#32CD32', 30);   // Darken by 30%
```

## 🌱 Genetic System

Flowers have inheritable traits:
- Petal count, length, and width
- Stem length and curvature
- Leaf count and arrangement
- Color profiles

## 🐝 Pollination Simulation

The simulation includes:
- Pollinator AI (bees, butterflies)
- Cross-pollination between flowers
- Genetic trait inheritance
- Seed dispersal mechanics

## 📸 Screenshots

The enhanced 3D rendering shows:
- Visible vein patterns on leaves
- Realistic leaf-to-stem connections
- 3D petal curvature with highlights
- Natural shadow depth

## 🛠 Development

### Running Locally

1. Clone the repository
2. Open `index.html` in a browser
3. No build step required!

### Modifying the Renderer

Edit `plant-renderer-3d.js` to:
- Add new texture patterns
- Modify leaf shapes
- Adjust 3D effects
- Change attachment mechanics

## 📄 License

Open source for educational and creative use.

## 🙏 Acknowledgments

Built with:
- HTML5 Canvas API
- Procedural texture generation
- Genetic algorithms
- Pollination ecology research

---

**Enjoy creating beautiful flowers!** 🌺🌻🌷
