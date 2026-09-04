/**
 * Flower Design Studio - Three.js 3D Editor
 * Full plant modification system with advanced botanical features
 */

// Scene setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 100, 300);
camera.lookAt(0, 100, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(100, 200, 100);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
fillLight.position.set(-100, 100, -100);
scene.add(fillLight);

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
    petalCount: 5,
    petalLength: 80,
    petalWidth: 40,
    stemLength: 200,
    stemWidth: 8,
    stemCurvature: 0.3,
    leafCount: 3,
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

/**
 * Create 3D petal geometry with tapering and curvature
 */
function createPetalGeometry(length, width) {
    const shape = new THREE.Shape();
    
    // Tapered petal shape
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-width/2, length/3, -width/4, length/2);
    shape.quadraticCurveTo(-width/8, length*0.75, 0, length);
    shape.quadraticCurveTo(width/8, length*0.75, width/4, length/2);
    shape.quadraticCurveTo(width/2, length/3, 0, 0);
    
    const extrudeSettings = {
        depth: 2,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.5,
        bevelThickness: 0.5
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create leaf geometry with realistic venation
 */
function createLeafGeometry(length, width) {
    const shape = new THREE.Shape();
    
    // Leaf shape (lanceolate)
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-width/2, length/4, -width/3, length/2);
    shape.quadraticCurveTo(-width/4, length*0.75, 0, length);
    shape.quadraticCurveTo(width/4, length*0.75, width/3, length/2);
    shape.quadraticCurveTo(width/2, length/4, 0, 0);
    
    const extrudeSettings = {
        depth: 1,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelSize: 0.3,
        bevelThickness: 0.3
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create stem with natural curvature
 */
function createStemGeometry(length, width, curvature) {
    const points = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.sin(t * Math.PI * 2) * curvature * 10;
        const y = t * length;
        const z = Math.cos(t * Math.PI * 2) * curvature * 5;
        points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    
    const geometry = new THREE.TubeGeometry(curve, 20, width/2, 6, false);
    return geometry;
}

/**
 * Create thorn geometry
 */
function createThornGeometry() {
    const geometry = new THREE.ConeGeometry(1, 8, 8);
    return geometry;
}

/**
 * Create trichome (hair) geometry
 */
function createTrichomeGeometry() {
    const geometry = new THREE.CylinderGeometry(0.1, 0.2, 3, 6);
    return geometry;
}

/**
 * Build complete flower
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
    
    // Create stem
    const stemGeometry = createStemGeometry(stemLength, stemWidth, stemCurvature);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.stem,
        roughness: 0.8,
        metalness: 0.1
    });
    stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = -stemLength/2;
    stemMesh.castShadow = true;
    flowerGroup.add(stemMesh);
    
    // Add thorns if enabled
    if (geneticProfile.features.thorns) {
        const thornGeometry = createThornGeometry();
        const thornMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        
        for (let i = 0; i < 8; i++) {
            const thorn = new THREE.Mesh(thornGeometry, thornMaterial);
            const t = 0.3 + (i / 8) * 0.6;
            const angle = (i / 8) * Math.PI * 2;
            const radius = stemWidth/2 + 1;
            
            thorn.position.set(
                Math.cos(angle) * radius,
                -stemLength * t + stemLength/2,
                Math.sin(angle) * radius
            );
            thorn.rotation.z = Math.PI / 2 + angle;
            thorn.rotation.y = angle;
            thorn.castShadow = true;
            flowerGroup.add(thorn);
            thornMeshes.push(thorn);
        }
    }
    
    // Add trichomes if enabled
    if (geneticProfile.features.trichomes) {
        const trichomeGeometry = createTrichomeGeometry();
        const trichomeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        
        for (let i = 0; i < 20; i++) {
            const trichome = new THREE.Mesh(trichomeGeometry, trichomeMaterial);
            const t = 0.2 + (i / 20) * 0.7;
            const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
            const radius = stemWidth/2 + 0.5;
            
            trichome.position.set(
                Math.cos(angle) * radius,
                -stemLength * t + stemLength/2,
                Math.sin(angle) * radius
            );
            trichome.rotation.z = Math.PI / 3;
            trichome.castShadow = false;
            flowerGroup.add(trichome);
            trichomeMeshes.push(trichome);
        }
    }
    
    // Create leaves
    const leafGeometry = createLeafGeometry(40, 20);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.leaf,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < leafCount; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        const t = 0.3 + (i / leafCount) * 0.5;
        const angle = (i / leafCount) * Math.PI * 2;
        const radius = stemWidth + 5;
        
        leaf.position.set(
            Math.cos(angle) * radius,
            -stemLength * t + stemLength/2,
            Math.sin(angle) * radius
        );
        leaf.rotation.y = -angle;
        leaf.rotation.x = Math.PI / 4;
        leaf.castShadow = true;
        flowerGroup.add(leaf);
        leafMeshes.push(leaf);
    }
    
    // Create petals using phyllotaxis
    const petalGeometry = createPetalGeometry(petalLength, petalWidth);
    const petalMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.petal,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.5 degrees
    
    for (let i = 0; i < petalCount; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        
        let angle, radius;
        
        if (geneticProfile.phyllotaxisMode === 'spiral') {
            // Fibonacci spiral
            angle = i * goldenAngle;
            radius = 15 * Math.sqrt(i + 1);
        } else if (geneticProfile.phyllotaxisMode === 'whorled') {
            // Whorled arrangement
            const whorlSize = 5;
            const whorl = Math.floor(i / whorlSize);
            const inWhorl = i % whorlSize;
            angle = (inWhorl / whorlSize) * Math.PI * 2 + whorl * 0.3;
            radius = 15 + whorl * 8;
        } else if (geneticProfile.phyllotaxisMode === 'opposite') {
            // Opposite pairs
            angle = (i % 2) * Math.PI + Math.floor(i / 2) * 0.2;
            radius = 15 + Math.floor(i / 2) * 10;
        } else {
            // Alternate
            angle = i * 1.8;
            radius = 15 + i * 5;
        }
        
        petal.position.set(
            Math.cos(angle) * radius,
            stemLength/2 + 10,
            Math.sin(angle) * radius
        );
        petal.rotation.y = -angle;
        petal.rotation.x = Math.PI / 6;
        petal.castShadow = true;
        flowerGroup.add(petal);
        petalMeshes.push(petal);
    }
    
    // Create flower center
    const centerGeometry = new THREE.SphereGeometry(15, 16, 16);
    const centerMaterial = new THREE.MeshStandardMaterial({ 
        color: colors.center,
        roughness: 0.9,
        metalness: 0.0
    });
    centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMesh.position.y = stemLength/2 + 5;
    centerMesh.castShadow = true;
    flowerGroup.add(centerMesh);
    
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
    
    // Update display values
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
    document.getElementById('petalCount').value = Math.floor(Math.random() * 20) + 5;
    document.getElementById('petalLength').value = Math.floor(Math.random() * 80) + 50;
    document.getElementById('petalWidth').value = Math.floor(Math.random() * 40) + 25;
    document.getElementById('stemLength').value = Math.floor(Math.random() * 150) + 150;
    document.getElementById('stemWidth').value = Math.floor(Math.random() * 12) + 4;
    document.getElementById('stemCurvature').value = Math.random().toFixed(1);
    document.getElementById('leafCount').value = Math.floor(Math.random() * 8) + 2;
    
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 180) % 360;
    document.getElementById('petalColor').value = `hsl(${hue1}, 80%, 60%)`;
    document.getElementById('centerColor').value = `hsl(${hue2}, 70%, 50%)`;
    document.getElementById('stemColor').value = `hsl(${100 + Math.random() * 40}, 60%, 35%)`;
    document.getElementById('leafColor').value = `hsl(${110 + Math.random() * 30}, 70%, 40%)`;
    
    updateFlower();
}

/**
 * Initialize controls
 */
function initControls() {
    // Sliders
    ['petalCount', 'petalLength', 'petalWidth', 'stemLength', 'stemWidth', 'stemCurvature', 'leafCount'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFlower);
    });
    
    // Dropdown
    document.getElementById('phyllotaxisMode').addEventListener('change', updateFlower);
    
    // Colors
    ['petalColor', 'centerColor', 'stemColor', 'leafColor'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFlower);
    });
    
    // Checkboxes
    ['showThorns', 'showTrichomes', 'carnivorous'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateFlower);
    });
    
    // Buttons
    document.getElementById('randomizeBtn').addEventListener('click', randomizeGenetics);
    
    document.getElementById('saveBtn').addEventListener('click', () => {
        renderer.render(scene, camera);
        const link = document.createElement('a');
        link.download = 'flower-design.png';
        link.href = renderer.domElement.toDataURL('image/png');
        link.click();
    });
    
    document.getElementById('exportBtn').addEventListener('click', () => {
        if (typeof exportToJSON !== 'undefined') {
            exportToJSON(geneticProfile);
        } else {
            const dataStr = JSON.stringify(geneticProfile, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const link = document.createElement('a');
            link.download = 'flower-genetics.json';
            link.href = URL.createObjectURL(blob);
            link.click();
        }
    });
    
    document.getElementById('simulateBtn').addEventListener('click', () => {
        window.location.href = 'simulation-demo.html';
    });
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Slow rotation
    flowerGroup.rotation.y += 0.002;
    
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

// Initialize
initControls();
buildFlower();
animate();

console.log('🌸 Flower Design Studio initialized with Three.js');
console.log('Genetic profile:', geneticProfile);
