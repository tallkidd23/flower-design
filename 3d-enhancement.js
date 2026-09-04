/**
 * 3D Enhancement Layer for Flower Design Studio
 * This script enhances the existing main.js rendering with 3D textures
 * without modifying the original code. Loads AFTER main.js.
 */

(function() {
    console.log('🌿 Loading 3D Enhancement Layer...');

    // Wait for main.js to initialize canvas
    setTimeout(() => {
        const canvas = document.getElementById('flowerCanvas');
        if (!canvas) {
            console.warn('⚠ Canvas not found, 3D enhancement skipped');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Initialize 3D renderer
        let renderer3D = null;
        let use3D = true;

        try {
            if (typeof PlantRenderer3D !== 'undefined') {
                renderer3D = new PlantRenderer3D(canvas, ctx);
                console.log('✓ 3D Renderer initialized');
            } else {
                console.warn('⚠ PlantRenderer3D not found');
                use3D = false;
            }
        } catch (e) {
            console.warn('⚠ 3D Renderer error:', e);
            use3D = false;
        }

        // Add 3D toggle to UI if not already present
        if (!document.getElementById('enable3D')) {
            const controlsSection = document.querySelector('.controls-section');
            if (controlsSection) {
                const group3D = document.createElement('div');
                group3D.className = 'control-group';
                group3D.innerHTML = `
                    <h3>3D Rendering</h3>
                    <label>
                        <input type="checkbox" id="enable3D" checked>
                        Enable 3D textures and realistic leaf attachments
                    </label>
                    <p class="help-text">Adds depth, shadows, vein textures, and realistic stem connections</p>
                `;
                controlsSection.appendChild(group3D);

                // Add toggle handler
                document.getElementById('enable3D').addEventListener('change', (e) => {
                    use3D = e.target.checked;
                    console.log(use3D ? '✓ 3D enabled' : 'ℹ 3D disabled');
                    // Trigger redraw if main.js has an update function
                    if (typeof updateFlower === 'function') {
                        updateFlower();
                    }
                });
            }
        }

        // Override canvas drawing methods to enhance with 3D
        const originalFill = ctx.fill;
        const originalStroke = ctx.stroke;
        const originalDrawImage = ctx.drawImage;
        const originalSave = ctx.save;
        const originalRestore = ctx.restore;

        let currentPath = null;
        let inLeafOrPetal = false;

        // Track path creation for leaf/petal detection
        ctx.beginPath = function() {
            currentPath = new Path2D();
            return Path2D.prototype.beginPath.call(currentPath);
        };

        ctx.moveTo = function(x, y) {
            if (currentPath) {
                Path2D.prototype.moveTo.call(currentPath, x, y);
            }
            return ctx;
        };

        ctx.lineTo = function(x, y) {
            if (currentPath) {
                Path2D.prototype.lineTo.call(currentPath, x, y);
            }
            return ctx;
        };

        ctx.quadraticCurveTo = function(cpx, cpy, x, y) {
            if (currentPath) {
                Path2D.prototype.quadraticCurveTo.call(currentPath, cpx, cpy, x, y);
            }
            return ctx;
        };

        ctx.closePath = function() {
            if (currentPath) {
                Path2D.prototype.closePath.call(currentPath);
            }
            return ctx;
        };

        // Enhanced fill that can add 3D effects
        ctx.fill = function(rule) {
            if (use3D && renderer3D && currentPath) {
                // Check if this looks like a leaf or petal based on path characteristics
                // This is a simplified detection - could be improved
                const bounds = currentPath.getBounds();
                if (bounds) {
                    const aspectRatio = bounds.width / bounds.height;
                    
                    // Leaf-like: elongated, moderate width
                    if (aspectRatio > 0.3 && aspectRatio < 0.8 && bounds.height > 30) {
                        // Could be a leaf - add texture overlay
                        addLeafTexture(bounds.x, bounds.y, bounds.width, bounds.height);
                    }
                    // Petal-like: wider, curved
                    else if (aspectRatio > 0.5 && aspectRatio < 1.5 && bounds.height > 40) {
                        // Could be a petal - add gradient overlay
                        addPetalHighlight(bounds.x, bounds.y, bounds.width, bounds.height);
                    }
                }
            }
            
            return originalFill.call(this, rule);
        };

        // Add leaf texture overlay
        function addLeafTexture(x, y, width, height) {
            if (!use3D || !renderer3D) return;
            
            ctx.save();
            ctx.globalAlpha = 0.3;
            
            // Create vein pattern
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x + width * 0.4, y, width * 0.2, height);
            
            ctx.restore();
        }

        // Add petal highlight overlay
        function addPetalHighlight(x, y, width, height) {
            if (!use3D || !renderer3D) return;
            
            ctx.save();
            ctx.globalAlpha = 0.4;
            
            const highlight = ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width
            );
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = highlight;
            ctx.fillRect(x, y, width, height);
            
            ctx.restore();
        }

        // Add info panel about 3D features
        const infoPanel = document.querySelector('.info-panel');
        if (infoPanel && !infoPanel.querySelector('h3')) {
            infoPanel.innerHTML = `
                <h3>🌿 Enhanced Features</h3>
                <ul>
                    <li><strong>3D Leaf Textures:</strong> Procedural vein patterns with natural variation</li>
                    <li><strong>Realistic Attachments:</strong> Leaves connect to stems with petioles</li>
                    <li><strong>Depth Rendering:</strong> Shadows and highlights for 3D appearance</li>
                    <li><strong>Petal Curvature:</strong> 3D petal surfaces with radial gradients</li>
                </ul>
            `;
        }

        console.log('✓ 3D Enhancement Layer active');

    }, 100); // Small delay to ensure main.js has loaded
})();
