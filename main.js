/**
 * Flower Design Studio - Enhanced Three.js 3D Editor
 * Professional botanical visualization with realistic rendering
 */

// Scene setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Beautiful gradient background
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 362);
gradient.addColorStop(0, '#2d1b4e');
gradient.addColorStop(0.5, '#1a1a2e');
gradient.addColorStop(1, '#0f0f1e');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

const bgTexture = new THREE.CanvasTexture(canvas);
scene.background = bgTexture;

// Add subtle fog for depth
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.0015);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 180, 450);
camera.lookAt(0, 120, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
container.appendChild(renderer.domElement);

// Enhanced lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

// Main directional light (sun)
const mainLight = new THREE.DirectionalLight(0xfff4e6, 1.1);
mainLight.position.set(150, 280, 150);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 600;
mainLight.shadow.camera.left = -250;
mainLight.shadow.camera.right = 250;
mainLight.shadow.camera.top = 250;
mainLight.shadow.camera.bottom = -250;
scene.add(mainLight);

// Fill light (warm)
const fillLight = new THREE.DirectionalLight(0xffeedd, 0.45);
fillLight.position.set(-100, 120, -100);
scene.add(fillLight);

// Rim light for depth (cool blue)
const rimLight = new THREE.DirectionalLight(0x6699ff, 0.35);
rimLight.position.set(0, 80, -250);
scene.add(rimLight);

// Hemisphere light for natural sky simulation
const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2d4a2d, 0.45);
scene.add(hemiLight);

// Add ground plane for shadows and context
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.1
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -20;
ground.receiveShadow = true;
scene.add(ground);

// Current flower parts
let flowerGroup = new THREE.Group();
scene.add(flowerGroup);

let petalMeshes = [];
let leafMeshes = [];
let stemMesh = null;
let centerMesh = null;
let thornMeshes = [];
let trichomeMeshes = [];

// Genetic profile
let geneticProfile = {
    petalCount: 8,
    petalLength: 80,
    petalWidth: 45,
    stemLength: 220,
    stemWidth: 10,
    stemCurvature: 0.3,
    leafCount: 5,
    phyllotaxisMode: 'spiral',
    colors: {
        petal: '#FF69B4',
        center: '#FFD700',
        stem: '#228B22',
        leaf: '#32CD32'
    },
    features: {
        thorns: false,
        trichomes: false,
        carnivorous: false
    }
};

// Animation state
let time = 0;

/**
 * Generate procedural texture for petals with veining
 */
function createPetalTexture(baseColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
    gradient.addColorStop(0, lightenColor(baseColor, 30));
    gradient.addColorStop(0.6, baseColor);
    gradient.addColorStop(1, darkenColor(baseColor, 20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw veins
    ctx.strokeStyle = lightenColor(baseColor, 15);
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
        const angle = (i / 6) * Math.PI - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(128, 256);
        ctx.lineTo(
            128 + Math.cos(angle) * 100,
            256 - Math.sin(angle) * 200
        );
        ctx.stroke();
    }
    
    // Add subtle noise
    addNoise(ctx, 256, 256, 0.08);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Generate procedural texture for leaves with realistic venation
 */
function createLeafTexture(leafColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, lightenColor(leafColor, 15));
    gradient.addColorStop(1, leafColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Central vein
    ctx.strokeStyle = darkenColor(leafColor, 30);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.stroke();
    
    // Secondary veins (branching pattern)
    ctx.lineWidth = 2;
    for (let i = 1; i <= 6; i++) {
        const y = (i / 7) * 240;
        const angle = Math.PI / 5;
        
        // Left branch
        ctx.beginPath();
        ctx.moveTo(128, y);
        ctx.lineTo(128 - Math.cos(angle) * 80, y - Math.sin(angle) * 40);
        ctx.stroke();
        
        // Right branch
        ctx.beginPath();
        ctx.moveTo(128, y);
        ctx.lineTo(128 + Math.cos(angle) * 80, y - Math.sin(angle) * 40);
        ctx.stroke();
    }
    
    // Add noise for texture
    addNoise(ctx, 256, 256, 0.06);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Add noise to canvas for organic texture
 */
function addNoise(ctx, width, height, opacity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30 * opacity;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Create enhanced 3D petal geometry with natural curvature
 */
function createPetalGeometry(length, width) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-width/2, length/3, -width/3, length/2);
    shape.quadraticCurveTo(-width/6, length*0.8, 0, length);
    shape.quadraticCurveTo(width/6, length*0.8, width/3, length/2);
    shape.quadraticCurveTo(width/2, length/3, 0, 0);
    
    const extrudeSettings = {
        depth: 1.5,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.8,
        bevelThickness: 0.8
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create enhanced leaf geometry with realistic petiole (leaf stalk)
 */
function createLeafGeometry(length, width) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-width/2, length/5, -width/2.5, length/3);
    shape.quadraticCurveTo(-width/3, length/2, -width/4, length*0.7);
    shape.quadraticCurveTo(-width/8, length*0.9, 0, length);
    shape.quadraticCurveTo(width/8, length*0.9, width/4, length*0.7);
    shape.quadraticCurveTo(width/3, length/2, width/2.5, length/3);
    shape.quadraticCurveTo(width/2, length/5, 0, 0);
    
    const extrudeSettings = {
        depth: 0.8,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.4,
        bevelThickness: 0.4
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create petiole (leaf stalk) geometry for realistic attachment
 */
function createPetioleGeometry(length = 8, width = 2.5) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-width/2, length/2, 0, length);
    shape.quadraticCurveTo(width/2, length/2, 0, 0);
    
    const extrudeSettings = {
        depth: width,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelSize: 0.3,
        bevelThickness: 0.3
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create enhanced stem with nodes, striations, and natural variation
 */
function createStemGeometry(length, width, curvature) {
    const points = [];
    const segments = 30;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.sin(t * Math.PI * 2) * curvature * 12 + Math.sin(t * Math.PI * 4) * curvature * 3;
        const y = t * length;
        const z = Math.cos(t * Math.PI * 2) * curvature * 6;
        points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    
    const radii = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const nodeFactor = 1 + 0.15 * Math.sin(t * Math.PI * 4);
        radii.push(width/2 * nodeFactor);
    }
    
    const geometry = new THREE.TubeGeometry(curve, 30, 1, 8, false);
    
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const segmentIndex = Math.floor((i / 3) / (geometry.parameters.tubularSegments * (geometry.parameters.radialSegments + 1)));
        const scale = radii[Math.min(segmentIndex, radii.length - 1)];
        positions[i] *= scale;
        positions[i + 1] *= scale;
    }
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * Create thorn with realistic shape
 */
function createThornGeometry() {
    const geometry = new THREE.ConeGeometry(1.5, 12, 8);
    return geometry;
}

/**
 * Create trichome (plant hair) with natural curve
 */
function createTrichomeGeometry() {
    const points = [];
    for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        points.push(new THREE.Vector3(
            Math.sin(t * Math.PI) * 0.5,
            t * 4,
            0
        ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 5, 0.15, 4, false);
    return geometry;
}

/**
 * Build complete flower with enhanced visuals
 */
function buildFlower() {
    // Clear existing
    while(flowerGroup.children.length > 0){ 
        flowerGroup.remove(flowerGroup.children[0]); 
    }
    petalMeshes = [];
    leafMeshes = [];
    thornMeshes = [];
    trichomeMeshes = [];
    
    const colors = geneticProfile.colors;
    const petalCount = geneticProfile.petalCount;
    const petalLength = geneticProfile.petalLength;
    const petalWidth = geneticProfile.petalWidth;
    const stemLength = geneticProfile.stemLength;
    const stemWidth = geneticProfile.stemWidth;
    const stemCurvature = geneticProfile.stemCurvature;
    const leafCount = geneticProfile.leafCount;
    
    // Create stem with enhanced geometry
    const stemGeometry = createStemGeometry(stemLength, stemWidth, stemCurvature);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.stem,
        roughness: 0.75,
        metalness: 0.05
    });
    stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = -stemLength/2;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    flowerGroup.add(stemMesh);
    
    // Add thorns if enabled
    if (geneticProfile.features.thorns) {
        const thornGeometry = createThornGeometry();
        const thornMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < 10; i++) {
            const thorn = new THREE.Mesh(thornGeometry, thornMaterial);
            const t = 0.25 + (i / 10) * 0.65;
            const angle = (i / 10) * Math.PI * 2 + Math.PI / 8;
            const radius = stemWidth/2 + 1.5;
            
            thorn.position.set(
                Math.cos(angle) * radius,
                -stemLength * t + stemLength/2,
                Math.sin(angle) * radius
            );
            thorn.rotation.z = Math.PI / 2 + angle;
            thorn.rotation.y = angle;
            thorn.rotation.x = (Math.random() - 0.5) * 0.3;
            thorn.castShadow = true;
            flowerGroup.add(thorn);
            thornMeshes.push(thorn);
        }
    }
    
    // Add trichomes if enabled
    if (geneticProfile.features.trichomes) {
        const trichomeGeometry = createTrichomeGeometry();
        const trichomeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            roughness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 30; i++) {
            const trichome = new THREE.Mesh(trichomeGeometry, trichomeMaterial);
            const t = 0.15 + (i / 30) * 0.75;
            const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.8;
            const radius = stemWidth/2 + 0.8;
            
            trichome.position.set(
                Math.cos(angle) * radius,
                -stemLength * t + stemLength/2,
                Math.sin(angle) * radius
            );
            trichome.rotation.z = Math.PI / 3 + (Math.random() - 0.5) * 0.3;
            trichome.rotation.y = angle + Math.PI;
            trichome.castShadow = false;
            flowerGroup.add(trichome);
            trichomeMeshes.push(trichome);
        }
    }
    
    // Create leaves with realistic petioles
    const leafGeometry = createLeafGeometry(45, 22);
    const petioleGeometry = createPetioleGeometry(10, 3);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.leaf,
        roughness: 0.65,
        metalness: 0.03,
        side: THREE.DoubleSide,
        map: createLeafTexture(colors.leaf)
    });
    
    for (let i = 0; i < leafCount; i++) {
        const leafGroup = new THREE.Group();
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.rotation.x = Math.PI / 2;
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        leafGroup.add(leaf);
        
        const petiole = new THREE.Mesh(petioleGeometry, leafMaterial);
        petiole.position.z = -5;
        petiole.rotation.x = -Math.PI / 2;
        petiole.castShadow = true;
        leafGroup.add(petiole);
        
        const t = 0.35 + (i / leafCount) * 0.5;
        const angle = (i / leafCount) * Math.PI * 2;
        const radius = stemWidth + 8;
        
        leafGroup.position.set(
            Math.cos(angle) * radius,
            -stemLength * t + stemLength/2,
            Math.sin(angle) * radius
        );
        leafGroup.rotation.y = -angle;
        leafGroup.rotation.x = Math.PI / 3.5;
        leafGroup.rotation.z = (Math.random() - 0.5) * 0.2;
        
        flowerGroup.add(leafGroup);
        leafMeshes.push(leafGroup);
    }
    
    // Create petals with enhanced geometry and textures
    const petalGeometry = createPetalGeometry(petalLength, petalWidth);
    const petalTexture = createPetalTexture(colors.petal);
    const petalMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.petal,
        roughness: 0.55,
        metalness: 0.08,
        side: THREE.DoubleSide,
        map: petalTexture,
        transparent: true,
        opacity: 0.95
    });
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < petalCount; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        
        let angle, radius, heightOffset;
        
        if (geneticProfile.phyllotaxisMode === 'spiral') {
            angle = i * goldenAngle;
            radius = 18 * Math.sqrt(i + 1);
            heightOffset = -Math.sqrt(i + 1) * 1.5;
        } else if (geneticProfile.phyllotaxisMode === 'whorled') {
            const whorlSize = 5;
            const whorl = Math.floor(i / whorlSize);
            const inWhorl = i % whorlSize;
            angle = (inWhorl / whorlSize) * Math.PI * 2 + whorl * 0.35;
            radius = 18 + whorl * 10;
            heightOffset = -whorl * 3;
        } else if (geneticProfile.phyllotaxisMode === 'opposite') {
            angle = (i % 2) * Math.PI + Math.floor(i / 2) * 0.25;
            radius = 18 + Math.floor(i / 2) * 12;
            heightOffset = -Math.floor(i / 2) * 4;
        } else {
            angle = i * 1.9;
            radius = 18 + i * 6;
            heightOffset = -i * 2;
        }
        
        petal.position.set(
            Math.cos(angle) * radius,
            stemLength/2 + 12 + heightOffset,
            Math.sin(angle) * radius
        );
        petal.rotation.y = -angle;
        petal.rotation.x = Math.PI / 5 + (i / petalCount) * 0.15;
        petal.rotation.z = (Math.random() - 0.5) * 0.15;
        petal.castShadow = true;
        petal.receiveShadow = true;
        flowerGroup.add(petal);
        petalMeshes.push(petal);
    }
    
    // Create flower center with detail
    const centerGeometry = new THREE.SphereGeometry(18, 24, 24);
    const centerMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.center,
        roughness: 0.85,
        metalness: 0.02
    });
    centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMesh.position.y = stemLength/2 + 8;
    centerMesh.castShadow = true;
    centerMesh.receiveShadow = true;
    flowerGroup.add(centerMesh);
    
    // Add stamen/pistil details
    const stamenCount = 12;
    const stamenGeometry = new THREE.CylinderGeometry(0.5, 0.8, 12, 6);
    const stamenMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    
    for (let i = 0; i < stamenCount; i++) {
        const stamen = new THREE.Mesh(stamenGeometry, stamenMaterial);
        const angle = (i / stamenCount) * Math.PI * 2;
        const radius = 8;
        
        stamen.position.set(
            Math.cos(angle) * radius,
            stemLength/2 + 15,
            Math.sin(angle) * radius
        );
        stamen.rotation.x = Math.PI / 6;
        stamen.rotation.z = -angle;
        stamen.castShadow = true;
        flowerGroup.add(stamen);
    }
    
    // Position entire flower group
    flowerGroup.position.y = 50;
}


/**
 * Update from controls
 */
function updateFlower() {
    geneticProfile.petalCount = parseInt(document.getElementById('petalCount').value);
    geneticProfile.petalLength = parseInt(document.getElementById('petalLength').value);
    geneticProfile.petalWidth = parseInt(document.getElementById('petalWidth').value);
    geneticProfile.stemLength = parseInt(document.getElementById('stemLength').value);
    geneticProfile.stemWidth = parseInt(document.getElementById('stemWidth').value);
    geneticProfile.stemCurvature = parseFloat(document.getElementById('stemCurvature').value);
    geneticProfile.leafCount = parseInt(document.getElementById('leafCount').value);
    geneticProfile.phyllotaxisMode = document.getElementById('phyllotaxisMode').value;
    geneticProfile.colors.petal = document.getElementById('petalColor').value;
    geneticProfile.colors.center = document.getElementById('centerColor').value;
    geneticProfile.colors.stem = document.getElementById('stemColor').value;
    geneticProfile.colors.leaf = document.getElementById('leafColor').value;
    geneticProfile.features.thorns = document.getElementById('showThorns').checked;
    geneticProfile.features.trichomes = document.getElementById('showTrichomes').checked;
    geneticProfile.features.carnivorous = document.getElementById('carnivorous').checked;
    
    document.getElementById('petalCountValue').textContent = geneticProfile.petalCount;
    document.getElementById('petalLengthValue').textContent = geneticProfile.petalLength;
    document.getElementById('petalWidthValue').textContent = geneticProfile.petalWidth;
    document.getElementById('stemLengthValue').textContent = geneticProfile.stemLength;
    document.getElementById('stemWidthValue').textContent = geneticProfile.stemWidth;
    document.getElementById('stemCurvatureValue').textContent = geneticProfile.stemCurvature;
    document.getElementById('leafCountValue').textContent = geneticProfile.leafCount;
    
    buildFlower();
}

/**
 * Randomize genetics
 */
function randomizeGenetics() {
    document.getElementById('petalCount').value = Math.floor(Math.random() * 20) + 6;
    document.getElementById('petalLength').value = Math.floor(Math.random() * 70) + 60;
    document.getElementById('petalWidth').value = Math.floor(Math.random() * 35) + 30;
    document.getElementById('stemLength').value = Math.floor(Math.random() * 140) + 160;
    document.getElementById('stemWidth').value = Math.floor(Math.random() * 10) + 6;
    document.getElementById('stemCurvature').value = (Math.random() * 0.6).toFixed(1);
    document.getElementById('leafCount').value = Math.floor(Math.random() * 7) + 3;
    
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 160 + Math.random() * 40) % 360;
    document.getElementById('petalColor').value = `hsl(${hue1}, 75%, ${55 + Math.random() * 10}%)`;
    document.getElementById('centerColor').value = `hsl(${hue2}, 65%, ${50 + Math.random() * 10}%)`;
    document.getElementById('stemColor').value = `hsl(${95 + Math.random() * 30}, ${55 + Math.random() * 15}%, ${30 + Math.random() * 10}%)`;
    document.getElementById('leafColor').value = `hsl(${105 + Math.random() * 25}, ${60 + Math.random() * 15}%, ${35 + Math.random() * 10}%)`;
    
    updateFlower();
}

/**
 * Initialize controls
 */
function initControls() {
    ['petalCount', 'petalLength', 'petalWidth', 'stemLength', 'stemWidth', 'stemCurvature', 'leafCount'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFlower);
    });
    
    document.getElementById('phyllotaxisMode').addEventListener('change', updateFlower);
    
    ['petalColor', 'centerColor', 'stemColor', 'leafColor'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFlower);
    });
    
    ['showThorns', 'showTrichomes', 'carnivorous'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateFlower);
    });
    
    document.getElementById('randomizeBtn').addEventListener('click', randomizeGenetics);
    
    document.getElementById('saveBtn').addEventListener('click', () => {
        renderer.render(scene, camera);
        const link = document.createElement('a');
        link.download = 'flower-design.png';
        link.href = renderer.domElement.toDataURL('image/png');
        link.click();
    });
    
    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = JSON.stringify(geneticProfile, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const link = document.createElement('a');
        link.download = 'flower-genetics.json';
        link.href = URL.createObjectURL(blob);
        link.click();
    });
    
    document.getElementById('simulateBtn').addEventListener('click', () => {
        window.location.href = 'simulation-demo.html';
    });
}

/**
 * Animation loop with subtle wind movement
 */
function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    leafMeshes.forEach((leaf, i) => {
        leaf.rotation.x = Math.PI / 3.5 + Math.sin(time + i) * 0.05;
        leaf.rotation.z = (i / leafMeshes.length - 0.5) * 0.2 + Math.cos(time * 0.8 + i * 0.5) * 0.03;
    });
    
    petalMeshes.forEach((petal, i) => {
        petal.rotation.x += Math.sin(time * 0.5 + i) * 0.002;
    });
    
    flowerGroup.rotation.y += 0.0015;
    
    renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize', onWindowResize);

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

initControls();
buildFlower();
animate();

console.log('🌸 Enhanced Flower Design Studio initialized');
console.log('Features: Realistic leaf attachments, procedural textures, wind animation, ground plane');
