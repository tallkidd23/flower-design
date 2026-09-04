/**
 * Enhanced Flower Design Studio - Main Application
 * Integrates 3D rendering with realistic leaf attachments and textures
 * Preserves all existing genetic inheritance and simulation features
 */

// Canvas setup
const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');

// Initialize 3D renderer
let renderer3D = null;
let use3DRendering = true;

try {
    renderer3D = new PlantRenderer3D(canvas, ctx);
    console.log('✓ 3D Renderer initialized');
} catch (e) {
    console.warn('⚠ 3D Renderer not available, using basic rendering:', e);
    use3DRendering = false;
}

// Current flower state
let currentFlower = null;
let animationFrame = null;

// Genetic data storage
let geneticProfile = {
    petalCount: 5,
    petalLength: 80,
    petalWidth: 40,
    stemLength: 200,
    leafCount: 3,
    colors: {
        petal: '#FF69B4',
        center: '#FFD700',
        stem: '#228B22',
        leaf: '#32CD32'
    }
};

/**
 * Generate procedural leaf texture (fallback if 3D renderer unavailable)
 */
function generateBasicLeafTexture(width, height, color) {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = width;
    textureCanvas.height = height;
    const textureCtx = textureCanvas.getContext('2d');

    // Base gradient
    const gradient = textureCtx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, lightenColor(color, 20));
    gradient.addColorStop(1, color);
    textureCtx.fillStyle = gradient;
    textureCtx.fillRect(0, 0, width, height);

    // Center vein
    textureCtx.strokeStyle = darkenColor(color, 30);
    textureCtx.lineWidth = 2;
    textureCtx.beginPath();
    textureCtx.moveTo(width / 2, 0);
    textureCtx.lineTo(width / 2, height);
    textureCtx.stroke();

    return textureCanvas;
}

/**
 * Draw leaf with 3D rendering if enabled, otherwise basic rendering
 */
function drawLeaf(x, y, angle, stemAngle, leafColor, size = 1) {
    const leafWidth = 20 * size;
    const leafLength = 40 * size;

    if (use3DRendering && renderer3D) {
        // Use enhanced 3D renderer
        const leafData = {
            width: leafWidth,
            length: leafLength,
            angle: angle - stemAngle
        };

        const stemPoint = {
            x: x,
            y: y,
            angle: stemAngle
        };

        renderer3D.draw3DLeaf(leafData, stemPoint, leafColor);
    } else {
        // Fallback to basic 2D rendering
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(stemAngle + angle);

        // Leaf shape
        ctx.beginPath();
        ctx.moveTo(-leafWidth / 2, 0);
        ctx.quadraticCurveTo(-leafWidth / 2, leafLength / 2, 0, leafLength);
        ctx.quadraticCurveTo(leafWidth / 2, leafLength / 2, leafWidth / 2, 0);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, leafLength / 2, 0, 0, leafLength / 2, leafWidth);
        gradient.addColorStop(0, lightenColor(leafColor, 20));
        gradient.addColorStop(1, leafColor);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Center vein
        ctx.strokeStyle = darkenColor(leafColor, 30);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, leafLength);
        ctx.stroke();

        // Petiole
        ctx.strokeStyle = darkenColor(leafColor, 40);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -5);
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Draw petal with 3D rendering if enabled
 */
function drawPetal(x, y, angle, petalColor, edgeColor, width = 30, length = 50) {
    if (use3DRendering && renderer3D) {
        const petalData = {
            x: x,
            y: y,
            angle: angle,
            width: width,
            length: length
        };

        renderer3D.draw3DPetal(petalData, petalColor, edgeColor);
    } else {
        // Basic 2D petal
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, length);
        ctx.quadraticCurveTo(-width / 2, length / 2, 0, 0);
        ctx.quadraticCurveTo(width / 2, length / 2, 0, length);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, length);
        gradient.addColorStop(0, lightenColor(petalColor, 30));
        gradient.addColorStop(1, edgeColor);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Draw stem with leaves using 3D rendering
 */
function drawStemWithLeaves(stemPoints, leaves, stemColor, leafColor) {
    if (use3DRendering && renderer3D) {
        renderer3D.drawStemWithLeaves(stemPoints, leaves, stemColor, leafColor);
    } else {
        // Basic stem drawing
        ctx.beginPath();
        ctx.strokeStyle = stemColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stemPoints.length > 0) {
            ctx.moveTo(stemPoints[0].x, stemPoints[0].y);
            for (let i = 1; i < stemPoints.length; i++) {
                ctx.lineTo(stemPoints[i].x, stemPoints[i].y);
            }
        }
        ctx.stroke();

        // Draw leaves
        leaves.forEach(leaf => {
            drawLeaf(leaf.x, leaf.y, leaf.angle, leaf.stemAngle, leafColor, leaf.size);
        });
    }
}

/**
 * Generate stem points with natural curvature
 */
function generateStemPoints(startX, startY, length, curvature = 0.3) {
    const points = [];
    const segments = 20;
    const totalCurvature = curvature * 30;

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = startX + Math.sin(t * Math.PI * 2) * totalCurvature;
        const y = startY - t * length;
        const angle = Math.atan2(
            (startY - (t + 0.05) * length) - y,
            (startX + Math.sin((t + 0.05) * Math.PI * 2) * totalCurvature) - x
        );

        points.push({ x, y, angle });
    }

    return points;
}

/**
 * Generate leaf positions along stem
 */
function generateLeaves(stemPoints, count) {
    const leaves = [];
    if (count === 0 || stemPoints.length === 0) return leaves;

    const spacing = stemPoints.length / (count + 1);

    for (let i = 1; i <= count; i++) {
        const stemIndex = Math.floor(i * spacing);
        const stemPoint = stemPoints[stemIndex];

        if (stemPoint) {
            const alternateAngle = i % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;

            leaves.push({
                x: stemPoint.x,
                y: stemPoint.y,
                angle: alternateAngle + (Math.random() - 0.5) * 0.3,
                stemAngle: stemPoint.angle,
                stemPosition: { x: stemPoint.x, y: stemPoint.y },
                size: 0.8 + Math.random() * 0.4
            });
        }
    }

    return leaves;
}

/**
 * Draw complete flower
 */
function drawFlower(flower) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.5, '#E0F6FF');
    bgGradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const groundY = canvas.height - 50;

    // Generate stem
    const stemPoints = generateStemPoints(centerX, groundY, flower.stemLength, 0.3);

    // Generate leaves
    const leaves = generateLeaves(stemPoints, flower.leafCount);

    // Draw stem with leaves
    drawStemWithLeaves(stemPoints, leaves, flower.colors.stem, flower.colors.leaf);

    // Draw flower head
    const flowerCenter = stemPoints[0];

    // Draw petals
    const petalCount = flower.petalCount;
    const petalLength = flower.petalLength;
    const petalWidth = flower.petalWidth;
    const edgeColor = darkenColor(flower.colors.petal, 20);

    for (let i = 0; i < petalCount; i++) {
        const angle = (Math.PI * 2 / petalCount) * i;
        const distance = 20;
        const petalX = flowerCenter.x + Math.cos(angle) * distance;
        const petalY = flowerCenter.y + Math.sin(angle) * distance;

        drawPetal(
            petalX,
            petalY,
            angle + Math.PI / 2,
            flower.colors.petal,
            edgeColor,
            petalWidth,
            petalLength
        );
    }

    // Draw center
    ctx.beginPath();
    ctx.arc(flowerCenter.x, flowerCenter.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = flower.colors.center;
    ctx.fill();
    ctx.strokeStyle = darkenColor(flower.colors.center, 20);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Store current flower data
    currentFlower = { ...flower, stemPoints, leaves };
}

/**
 * Color manipulation utilities
 */
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

/**
 * Update flower from controls
 */
function updateFlower() {
    const flower = {
        petalCount: parseInt(document.getElementById('petalCount').value),
        petalLength: parseInt(document.getElementById('petalLength').value),
        petalWidth: parseInt(document.getElementById('petalWidth').value),
        stemLength: parseInt(document.getElementById('stemLength').value),
        leafCount: parseInt(document.getElementById('leafCount').value),
        colors: {
            petal: document.getElementById('petalColor').value,
            center: document.getElementById('centerColor').value,
            stem: document.getElementById('stemColor').value,
            leaf: document.getElementById('leafColor').value
        }
    };

    // Update genetic profile
    geneticProfile = { ...flower };

    drawFlower(flower);
}

/**
 * Randomize genetics
 */
function randomizeGenetics() {
    // Random petal properties
    document.getElementById('petalCount').value = Math.floor(Math.random() * 10) + 4;
    document.getElementById('petalLength').value = Math.floor(Math.random() * 80) + 50;
    document.getElementById('petalWidth').value = Math.floor(Math.random() * 40) + 25;
    document.getElementById('stemLength').value = Math.floor(Math.random() * 150) + 150;
    document.getElementById('leafCount').value = Math.floor(Math.random() * 5) + 2;

    // Random colors
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 30 + Math.random() * 60) % 360;
    document.getElementById('petalColor').value = `hsl(${hue1}, 80%, 60%)`;
    document.getElementById('centerColor').value = `hsl(${(hue1 + 180) % 360}, 70%, 50%)`;
    document.getElementById('stemColor').value = `hsl(${100 + Math.random() * 40}, 60%, 35%)`;
    document.getElementById('leafColor').value = `hsl(${110 + Math.random() * 30}, 70%, 40%)`;

    // Update display values
    updateDisplayValues();
    updateFlower();
}

/**
 * Update display value labels
 */
function updateDisplayValues() {
    document.getElementById('petalCountValue').textContent = document.getElementById('petalCount').value;
    document.getElementById('petalLengthValue').textContent = document.getElementById('petalLength').value;
    document.getElementById('petalWidthValue').textContent = document.getElementById('petalWidth').value;
    document.getElementById('stemLengthValue').textContent = document.getElementById('stemLength').value;
    document.getElementById('leafCountValue').textContent = document.getElementById('leafCount').value;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Control inputs
    ['petalCount', 'petalLength', 'petalWidth', 'stemLength', 'leafCount'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            updateDisplayValues();
            updateFlower();
        });
    });

    // Color inputs
    ['petalColor', 'centerColor', 'stemColor', 'leafColor'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFlower);
    });

    // 3D rendering toggle
    const enable3DCheckbox = document.getElementById('enable3D');
    if (enable3DCheckbox) {
        enable3DCheckbox.addEventListener('change', (e) => {
            use3DRendering = e.target.checked;
            if (use3DRendering && renderer3D) {
                console.log('✓ 3D rendering enabled');
            } else {
                console.log('ℹ Using basic 2D rendering');
            }
            updateFlower();
        });
    }

    // Buttons
    document.getElementById('randomizeBtn').addEventListener('click', randomizeGenetics);

    document.getElementById('saveGeneticsBtn').addEventListener('click', () => {
        console.log('Saving genetics:', geneticProfile);
        alert('Genetic profile saved! (Integration with garden system pending)');
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'flower-design.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    if (document.getElementById('exportBtn')) {
        document.getElementById('exportBtn').addEventListener('click', () => {
            if (typeof exportToSVG !== 'undefined') {
                exportToSVG(currentFlower);
            } else {
                alert('Export functionality loading...');
            }
        });
    }

    if (document.getElementById('simulateBtn')) {
        document.getElementById('simulateBtn').addEventListener('click', () => {
            window.location.href = 'simulation-demo.html';
        });
    }
}

/**
 * Initialize application
 */
function init() {
    console.log('🌸 Flower Design Studio initializing...');

    // Check for 3D renderer
    if (renderer3D) {
        console.log('✓ 3D Plant Renderer available');
        use3DRendering = true;
    } else {
        console.warn('⚠ 3D Plant Renderer not available');
        use3DRendering = false;
    }

    // Initialize controls
    updateDisplayValues();
    initEventListeners();

    // Draw initial flower
    updateFlower();

    console.log('✓ Application ready');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        drawFlower,
        updateFlower,
        randomizeGenetics,
        geneticProfile,
        currentFlower
    };
}
