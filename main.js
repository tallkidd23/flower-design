// main.js
// Flower Designer - Main Application

import { initializeExportButton, downloadCurrentFlowerAsSpecies } from './export-integration.js';

// ===== CANVAS SETUP =====

const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== FLOWER DATA =====

let flowerData = {
  petalCount: 5,
  petalLength: 1,
  petalColor: '#ff6b9e',
  stemHeight: 1.5,
  leafSize: 0.7
};

// ===== RENDERING =====

function drawFlower() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 50;

  // Draw stem
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX, centerY + flowerData.stemHeight * 100);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Draw leaves
  const leafY = centerY + flowerData.stemHeight * 50;
  
  // Left leaf
  ctx.beginPath();
  ctx.ellipse(centerX - 30, leafY, 20 * flowerData.leafSize, 10 * flowerData.leafSize, Math.PI / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#27ae60';
  ctx.fill();

  // Right leaf
  ctx.beginPath();
  ctx.ellipse(centerX + 30, leafY, 20 * flowerData.leafSize, 10 * flowerData.leafSize, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#27ae60';
  ctx.fill();

  // Draw petals
  const petalLength = flowerData.petalLength * 40;
  
  for (let i = 0; i < flowerData.petalCount; i++) {
    const angle = (i / flowerData.petalCount) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * petalLength;
    const y = centerY + Math.sin(angle) * petalLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.quadraticCurveTo(
      centerX + Math.cos(angle - 0.3) * petalLength * 0.5,
      centerY + Math.sin(angle - 0.3) * petalLength * 0.5,
      x,
      y
    );
    ctx.quadraticCurveTo(
      centerX + Math.cos(angle + 0.3) * petalLength * 0.5,
      centerY + Math.sin(angle + 0.3) * petalLength * 0.5,
      centerX,
      centerY
    );
    ctx.fillStyle = flowerData.petalColor;
    ctx.fill();
  }

  // Flower center
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#f1c40f';
  ctx.fill();
}

// ===== CONTROLS =====

function initializeControls() {
  const petalCountSlider = document.getElementById('petalCount');
  const petalLengthSlider = document.getElementById('petalLength');
  const petalColorPicker = document.getElementById('petalColor');
  const stemHeightSlider = document.getElementById('stemHeight');
  const leafSizeSlider = document.getElementById('leafSize');

  const petalCountValue = document.getElementById('petalCountValue');
  const petalLengthValue = document.getElementById('petalLengthValue');
  const stemHeightValue = document.getElementById('stemHeightValue');
  const leafSizeValue = document.getElementById('leafSizeValue');

  petalCountSlider.addEventListener('input', (e) => {
    flowerData.petalCount = parseInt(e.target.value, 10);
    petalCountValue.textContent = e.target.value;
    drawFlower();
  });

  petalLengthSlider.addEventListener('input', (e) => {
    flowerData.petalLength = parseFloat(e.target.value);
    petalLengthValue.textContent = e.target.value;
    drawFlower();
  });

  petalColorPicker.addEventListener('input', (e) => {
    flowerData.petalColor = e.target.value;
    drawFlower();
  });

  stemHeightSlider.addEventListener('input', (e) => {
    flowerData.stemHeight = parseFloat(e.target.value);
    stemHeightValue.textContent = e.target.value;
    drawFlower();
  });

  leafSizeSlider.addEventListener('input', (e) => {
    flowerData.leafSize = parseFloat(e.target.value);
    leafSizeValue.textContent = e.target.value;
    drawFlower();
  });
}

// ===== INITIALIZE =====

function initialize() {
  initializeControls();
  initializeExportButton();
  drawFlower();
}

initialize();
