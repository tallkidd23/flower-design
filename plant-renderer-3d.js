/**
 * Enhanced 3D Plant Renderer with Realistic Leaf Attachments
 * Adds depth, textures, and realistic stem connections to leaves and petals
 */

class PlantRenderer3D {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.textureCache = new Map();
  }

  /**
   * Generate procedural vein texture for leaves
   * Creates realistic vein patterns with varying thickness
   */
  generateLeafTexture(width, height, color, veinColor) {
    const key = `${width}-${height}-${color}-${veinColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = width;
    textureCanvas.height = height;
    const textureCtx = textureCanvas.getContext('2d');

    // Base color with gradient
    const gradient = textureCtx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);
    textureCtx.fillStyle = gradient;
    textureCtx.fillRect(0, 0, width, height);

    // Draw main vein (center)
    textureCtx.strokeStyle = veinColor;
    textureCtx.lineWidth = 2;
    textureCtx.beginPath();
    textureCtx.moveTo(width / 2, 0);
    textureCtx.lineTo(width / 2, height);
    textureCtx.stroke();

    // Draw secondary veins (branching pattern)
    const veinCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= veinCount; i++) {
      const yPos = (height / (veinCount + 1)) * i;
      const angle = (Math.PI / 6) * (Math.random() * 0.4 + 0.8);
      
      // Left vein
      textureCtx.beginPath();
      textureCtx.moveTo(width / 2, yPos);
      textureCtx.lineTo(
        width / 2 - Math.cos(angle) * (width / 3),
        yPos + Math.sin(angle) * (height / 4)
      );
      textureCtx.strokeStyle = this.lightenColor(veinColor, 10);
      textureCtx.lineWidth = 1.5;
      textureCtx.stroke();

      // Right vein
      textureCtx.beginPath();
      textureCtx.moveTo(width / 2, yPos);
      textureCtx.lineTo(
        width / 2 + Math.cos(angle) * (width / 3),
        yPos + Math.sin(angle) * (height / 4)
      );
      textureCtx.stroke();
    }

    // Add subtle noise for texture
    this.addNoise(textureCtx, width, height, 0.05);

    const texture = textureCanvas;
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Generate petal texture with gradient and subtle veins
   */
  generatePetalTexture(width, height, baseColor, edgeColor) {
    const key = `petal-${width}-${height}-${baseColor}-${edgeColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = width;
    textureCanvas.height = height;
    const textureCtx = textureCanvas.getContext('2d');

    // Radial gradient from center
    const gradient = textureCtx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, this.lightenColor(baseColor, 30));
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, edgeColor);
    textureCtx.fillStyle = gradient;
    textureCtx.fillRect(0, 0, width, height);

    // Subtle petal veins (radial from base)
    textureCtx.strokeStyle = this.lightenColor(baseColor, 15);
    textureCtx.lineWidth = 1;
    const veinCount = 7;
    for (let i = 0; i < veinCount; i++) {
      const angle = (Math.PI / (veinCount - 1)) * i;
      textureCtx.beginPath();
      textureCtx.moveTo(width / 2, height);
      textureCtx.lineTo(
        width / 2 + Math.cos(angle) * (width / 2),
        height - Math.sin(angle) * (height / 2)
      );
      textureCtx.stroke();
    }

    const texture = textureCanvas;
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Draw a 3D leaf with realistic stem attachment
   * @param {Object} leaf - Leaf data with position, size, angle
   * @param {Object} stem - Stem attachment point
   * @param {String} leafColor - Base color of leaf
   */
  draw3DLeaf(leaf, stem, leafColor) {
    const ctx = this.ctx;
    const veinColor = this.darkenColor(leafColor, 30);
    
    ctx.save();
    
    // Position at stem attachment point
    ctx.translate(stem.x, stem.y);
    
    // Rotate to match stem angle + leaf angle offset
    ctx.rotate(stem.angle + leaf.angle);
    
    // Calculate leaf dimensions
    const leafWidth = leaf.width || 20;
    const leafLength = leaf.length || 40;
    
    // Create 3D curvature effect with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw leaf shape (elliptical with pointed tip)
    const texture = this.generateLeafTexture(leafWidth * 2, leafLength, leafColor, veinColor);
    
    ctx.beginPath();
    // Leaf base (attached to stem)
    ctx.moveTo(-leafWidth / 2, 0);
    // Left curve
    ctx.quadraticCurveTo(-leafWidth / 2, leafLength / 2, 0, leafLength);
    // Right curve
    ctx.quadraticCurveTo(leafWidth / 2, leafLength / 2, leafWidth / 2, 0);
    // Back to base
    ctx.closePath();
    
    // Clip and fill with texture
    ctx.clip();
    ctx.drawImage(texture, -leafWidth, 0, leafWidth * 2, leafLength);
    
    // Add 3D highlight along center vein
    ctx.shadowColor = 'transparent';
    const highlightGradient = ctx.createLinearGradient(0, 0, 0, leafLength);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(-leafWidth / 4, 0, leafWidth / 2, leafLength);
    
    // Draw petiole (leaf stalk) connecting to stem
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = this.darkenColor(leafColor, 40);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); // Attach at stem
    ctx.lineTo(0, -5); // Short petiole
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Draw a 3D petal with curvature and depth
   * @param {Object} petal - Petal data with position, size, angle
   * @param {String} baseColor - Base color
   * @param {String} edgeColor - Edge color for gradient
   */
  draw3DPetal(petal, baseColor, edgeColor) {
    const ctx = this.ctx;
    
    ctx.save();
    
    // Position and rotate
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.angle);
    
    const petalWidth = petal.width || 30;
    const petalLength = petal.length || 50;
    
    // 3D shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Generate and apply texture
    const texture = this.generatePetalTexture(petalWidth * 2, petalLength, baseColor, edgeColor);
    
    ctx.beginPath();
    // Petal base (narrow)
    ctx.moveTo(0, petalLength);
    // Left curve
    ctx.quadraticCurveTo(-petalWidth / 2, petalLength / 2, 0, 0);
    // Right curve
    ctx.quadraticCurveTo(petalWidth / 2, petalLength / 2, 0, petalLength);
    ctx.closePath();
    
    ctx.clip();
    ctx.drawImage(texture, -petalWidth, 0, petalWidth * 2, petalLength);
    
    // Add 3D curvature highlight
    ctx.shadowColor = 'transparent';
    const curveHighlight = ctx.createRadialGradient(
      0, petalLength / 2, 0,
      0, petalLength / 2, petalWidth
    );
    curveHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    curveHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = curveHighlight;
    ctx.fillRect(-petalWidth / 2, 0, petalWidth, petalLength);
    
    ctx.restore();
  }

  /**
   * Draw stem with realistic leaf attachments
   * Leaves connect naturally with proper petiole positioning
   */
  drawStemWithLeaves(stemPoints, leaves, stemColor, leafColor) {
    const ctx = this.ctx;
    
    // Draw main stem
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
    
    // Add stem texture/highlight
    ctx.strokeStyle = this.lightenColor(stemColor, 20);
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (stemPoints.length > 0) {
      ctx.moveTo(stemPoints[0].x - 2, stemPoints[0].y);
      for (let i = 1; i < stemPoints.length; i++) {
        ctx.lineTo(stemPoints[i].x - 2, stemPoints[i].y);
      }
    }
    ctx.stroke();
    
    // Draw leaves attached to stem
    leaves.forEach(leaf => {
      // Find closest stem segment for attachment
      const attachmentPoint = this.findClosestStemPoint(stemPoints, leaf.stemPosition);
      if (attachmentPoint) {
        this.draw3DLeaf(leaf, attachmentPoint, leafColor);
      }
    });
  }

  /**
   * Find the closest point on stem for leaf attachment
   */
  findClosestStemPoint(stemPoints, position) {
    if (!stemPoints || stemPoints.length === 0) return null;
    
    let closest = stemPoints[0];
    let minDist = Infinity;
    
    for (const point of stemPoints) {
      const dist = Math.sqrt(
        Math.pow(point.x - position.x, 2) + 
        Math.pow(point.y - position.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }
    
    return closest;
  }

  /**
   * Add noise texture for natural surface variation
   */
  addNoise(ctx, width, height, opacity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20 * opacity;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Color manipulation utilities
   */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlantRenderer3D;
}
