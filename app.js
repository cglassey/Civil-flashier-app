/*
 * Civil Engineering Calculators web app
 * This script wires up the UI, performs calculations for various civil engineering equations,
 * and draws simple visualizations on canvases to help users understand how changing
 * parameters impacts each calculation. All computations are client-side, making the app
 * functional offline (especially when installed as a PWA with the provided service worker).
 */

// Navigation setup: toggles sections based on selected discipline
document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('nav button');
  const sections = document.querySelectorAll('.calculator-section');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = 'section-' + btn.id.replace('nav-', '');
      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      });
    });
  });

  // Initialize calculators
  initSiteCalculator();
  initGeotechCalculator();
  initStructuralCalculator();
  initTransportCalculator();
  initEnvironmentCalculator();
  initHydraulicsCalculator();
  initConstructionCalculator();

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  }
});

// ---------------------- Site/Civil ----------------------
function initSiteCalculator() {
  const a1Input = document.getElementById('site-a1');
  const a2Input = document.getElementById('site-a2');
  const lengthInput = document.getElementById('site-length');
  const methodSelect = document.getElementById('site-method');
  const volumeOutput = document.getElementById('site-volume');
  const canvas = document.getElementById('site-canvas');
  const ctx = canvas.getContext('2d');

  function updateVolume() {
    const A1 = parseFloat(a1Input.value);
    const A2 = parseFloat(a2Input.value);
    const L = parseFloat(lengthInput.value);
    if (isNaN(A1) || isNaN(A2) || isNaN(L) || L <= 0) {
      volumeOutput.textContent = '—';
      clearCanvas(ctx, canvas);
      return;
    }
    const method = methodSelect.value;
    let volume;
    if (method === 'avg') {
      volume = (A1 + A2) / 2 * L;
    } else {
      // prismoidal formula with midpoint area approximated by average
      const Am = (A1 + A2) / 2;
      volume = L / 6 * (A1 + 4 * Am + A2);
    }
    volumeOutput.textContent = volume.toFixed(2) + ' m³';
    drawSiteVolume(ctx, canvas, A1, A2);
  }
  [a1Input, a2Input, lengthInput, methodSelect].forEach(el => {
    el.addEventListener('input', updateVolume);
  });

  // Rational method
  const cInput = document.getElementById('runoff-c');
  const iInput = document.getElementById('runoff-i');
  const aInput = document.getElementById('runoff-a');
  const qOutput = document.getElementById('runoff-q');
  const runoffCanvas = document.getElementById('runoff-canvas');
  const runoffCtx = runoffCanvas.getContext('2d');
  function updateRunoff() {
    const C = parseFloat(cInput.value);
    const I = parseFloat(iInput.value);
    const A = parseFloat(aInput.value);
    if (isNaN(C) || isNaN(I) || isNaN(A) || C < 0 || I < 0 || A < 0) {
      qOutput.textContent = '—';
      clearCanvas(runoffCtx, runoffCanvas);
      return;
    }
    // Q = C * I (mm/h) * A (ha) * conversion (m³/s)
    const Q = C * I * A * 0.00277777778; // m³/s
    qOutput.textContent = Q.toFixed(3) + ' m³/s';
    drawRunoffBar(runoffCtx, runoffCanvas, Q);
  }
  [cInput, iInput, aInput].forEach(el => {
    el.addEventListener('input', updateRunoff);
  });
}

function drawSiteVolume(ctx, canvas, A1, A2) {
  clearCanvas(ctx, canvas);
  // Draw trapezoid representing cross-section variation
  const maxA = Math.max(A1, A2, 1);
  const heightScale = (canvas.height - 20) / maxA;
  const baseY = canvas.height - 10;
  // Points for cross-sectional heights at start and end
  const x0 = 20;
  const x1 = canvas.width - 20;
  const y0 = baseY - A1 * heightScale;
  const y1 = baseY - A2 * heightScale;
  ctx.fillStyle = '#6fa8dc';
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a253a';
  ctx.stroke();
  // draw labels
  ctx.fillStyle = '#0a253a';
  ctx.font = '12px Arial';
  ctx.fillText('A1', x0 - 15, y0 - 5);
  ctx.fillText('A2', x1 + 5, y1 - 5);
}

function drawRunoffBar(ctx, canvas, Q) {
  clearCanvas(ctx, canvas);
  const maxQ = 10; // m³/s reference scale
  const barWidth = Math.min(canvas.width - 40, (Q / maxQ) * (canvas.width - 40));
  ctx.fillStyle = '#8fce00';
  ctx.fillRect(20, canvas.height / 2 - 15, barWidth, 30);
  ctx.strokeStyle = '#0a253a';
  ctx.strokeRect(20, canvas.height / 2 - 15, canvas.width - 40, 30);
  ctx.fillStyle = '#0a253a';
  ctx.font = '12px Arial';
  ctx.fillText(Q.toFixed(2) + ' m³/s', 25, canvas.height / 2 + 30);
}

// ---------------------- Geotechnical ----------------------
function initGeotechCalculator() {
  // Shear strength
  const cInput = document.getElementById('geotech-c');
  const sigmaInput = document.getElementById('geotech-sigma');
  const phiInput = document.getElementById('geotech-phi');
  const tauOutput = document.getElementById('geotech-tau');
  const shearCanvas = document.getElementById('geotech-canvas');
  const shearCtx = shearCanvas.getContext('2d');
  function updateShear() {
    const c = parseFloat(cInput.value);
    const sigma = parseFloat(sigmaInput.value);
    const phi = parseFloat(phiInput.value);
    if (isNaN(c) || isNaN(sigma) || isNaN(phi)) {
      tauOutput.textContent = '—';
      clearCanvas(shearCtx, shearCanvas);
      return;
    }
    const phiRad = (phi * Math.PI) / 180;
    const tau = c + sigma * Math.tan(phiRad);
    tauOutput.textContent = tau.toFixed(2) + ' kPa';
    drawShearDiagram(shearCtx, shearCanvas, c, phiRad);
  }
  [cInput, sigmaInput, phiInput].forEach(el => {
    el.addEventListener('input', updateShear);
  });
  // Bearing capacity
  const bcInputs = {
    c: document.getElementById('bear-c'),
    q: document.getElementById('bear-q'),
    gamma: document.getElementById('bear-gamma'),
    B: document.getElementById('bear-b'),
    phi: document.getElementById('bear-phi'),
  };
  const qultOutput = document.getElementById('bear-qult');
  const bearCanvas = document.getElementById('bear-canvas');
  const bearCtx = bearCanvas.getContext('2d');
  function updateBearing() {
    const c = parseFloat(bcInputs.c.value);
    const q = parseFloat(bcInputs.q.value);
    const gamma = parseFloat(bcInputs.gamma.value);
    const B = parseFloat(bcInputs.B.value);
    const phi = parseFloat(bcInputs.phi.value);
    if ([c, q, gamma, B, phi].some(x => isNaN(x) || B <= 0)) {
      qultOutput.textContent = '—';
      clearCanvas(bearCtx, bearCanvas);
      return;
    }
    const phiRad = (phi * Math.PI) / 180;
    // Bearing capacity factors
    const Nq = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
    const Nc = (Nq - 1) / Math.tan(phiRad || 1e-6);
    const Ngamma = 2 * (Nq + 1) * Math.tan(phiRad);
    const qult = c * Nc + q * Nq + 0.5 * gamma * B * Ngamma; // kPa
    qultOutput.textContent = qult.toFixed(2) + ' kPa';
    drawBearingBar(bearCtx, bearCanvas, c * Nc, q * Nq, 0.5 * gamma * B * Ngamma);
  }
  Object.values(bcInputs).forEach(el => {
    el.addEventListener('input', updateBearing);
  });
}

function drawShearDiagram(ctx, canvas, c, phiRad) {
  clearCanvas(ctx, canvas);
  // Draw axes
  const margin = 30;
  const axisX0 = margin;
  const axisY0 = canvas.height - margin;
  const axisX1 = canvas.width - margin;
  const axisY1 = margin;
  ctx.strokeStyle = '#0a253a';
  ctx.lineWidth = 1;
  // x-axis
  ctx.beginPath();
  ctx.moveTo(axisX0, axisY0);
  ctx.lineTo(axisX1, axisY0);
  ctx.stroke();
  // y-axis
  ctx.beginPath();
  ctx.moveTo(axisX0, axisY0);
  ctx.lineTo(axisX0, axisY1);
  ctx.stroke();
  // Plot line τ = c + σ tan φ
  const maxSigma = 100; // kPa scale
  const maxTau = c + maxSigma * Math.tan(phiRad);
  // Map function to pixel coords
  function xCoord(sigma) {
    return axisX0 + (sigma / maxSigma) * (axisX1 - axisX0);
  }
  function yCoord(tau) {
    return axisY0 - (tau / Math.max(maxTau, 1)) * (axisY0 - axisY1);
  }
  ctx.strokeStyle = '#6fa8dc';
  ctx.beginPath();
  ctx.moveTo(xCoord(0), yCoord(c));
  ctx.lineTo(xCoord(maxSigma), yCoord(c + maxSigma * Math.tan(phiRad)));
  ctx.stroke();
  // Labels
  ctx.fillStyle = '#0a253a';
  ctx.font = '10px Arial';
  ctx.fillText('σ (kPa)', axisX1 - 40, axisY0 + 15);
  ctx.fillText('τ (kPa)', axisX0 - 25, axisY1 + 10);
  // Tick marks and numbers
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const sigmaVal = (maxSigma / ticks) * i;
    const tauVal = (maxTau / ticks) * i;
    const x = xCoord(sigmaVal);
    const y = yCoord(tauVal);
    // x ticks
    ctx.beginPath();
    ctx.moveTo(x, axisY0);
    ctx.lineTo(x, axisY0 - 5);
    ctx.stroke();
    ctx.fillText(sigmaVal.toFixed(0), x - 10, axisY0 + 12);
    // y ticks
    ctx.beginPath();
    ctx.moveTo(axisX0, y);
    ctx.lineTo(axisX0 + 5, y);
    ctx.stroke();
    ctx.fillText(tauVal.toFixed(0), axisX0 - 25, y + 3);
  }
}

function drawBearingBar(ctx, canvas, termC, termQ, termGamma) {
  clearCanvas(ctx, canvas);
  const total = termC + termQ + termGamma;
  if (total <= 0) return;
  // Represent each term as stacked bar heights
  const barWidth = canvas.width / 4;
  let y = canvas.height;
  ctx.fillStyle = '#f6b26b';
  const hC = (termC / total) * (canvas.height - 20);
  y -= hC;
  ctx.fillRect(20, y, barWidth, hC);
  ctx.fillStyle = '#6fa8dc';
  const hQ = (termQ / total) * (canvas.height - 20);
  y -= hQ;
  ctx.fillRect(20, y, barWidth, hQ);
  ctx.fillStyle = '#93c47d';
  const hG = (termGamma / total) * (canvas.height - 20);
  y -= hG;
  ctx.fillRect(20, y, barWidth, hG);
  ctx.strokeStyle = '#0a253a';
  ctx.strokeRect(20, 10, barWidth, canvas.height - 20);
  ctx.fillStyle = '#0a253a';
  ctx.font = '10px Arial';
  ctx.fillText('c′N_c', 25 + barWidth, canvas.height - hC / 2);
  ctx.fillText('q′N_q', 25 + barWidth, canvas.height - hC - hQ / 2);
  ctx.fillText('0.5γ′BN_γ', 25 + barWidth, canvas.height - hC - hQ - hG / 2);
}

// ---------------------- Structural ----------------------
function initStructuralCalculator() {
  // Beam bending
  const bw = document.getElementById('beam-w');
  const bl = document.getElementById('beam-l');
  const bE = document.getElementById('beam-e');
  const bI = document.getElementById('beam-i');
  const stressOut = document.getElementById('beam-stress');
  const deflectOut = document.getElementById('beam-deflection');
  const beamCanvas = document.getElementById('beam-canvas');
  const beamCtx = beamCanvas.getContext('2d');
  function updateBeam() {
    const w = parseFloat(bw.value);
    const L = parseFloat(bl.value);
    const E = parseFloat(bE.value);
    const I = parseFloat(bI.value);
    if ([w, L, E, I].some(x => isNaN(x) || x <= 0)) {
      stressOut.textContent = '—';
      deflectOut.textContent = '—';
      clearCanvas(beamCtx, beamCanvas);
      return;
    }
    // Maximum bending moment (kN*m)
    const M = w * L * L / 8;
    // Stress ratio: M / I (kN*m / m^4 -> kPa*m)
    const stressRatio = (M * 1000) / I; // kN*m -> N*m = *1000, result N/m^3; unrealistic units, but demonstrate ratio
    // Maximum deflection (m)
    const wN = w * 1000; // kN/m to N/m
    const EPa = E * 1e9; // GPa to Pa
    const deflect = (5 * wN * Math.pow(L, 4)) / (384 * EPa * I);
    stressOut.textContent = 'M/I: ' + stressRatio.toFixed(2) + ' 1/m³';
    deflectOut.textContent = 'δ_max: ' + deflect.toFixed(4) + ' m';
    drawBeamDeflection(beamCtx, beamCanvas, wN, L, EPa, I);
  }
  [bw, bl, bE, bI].forEach(el => {
    el.addEventListener('input', updateBeam);
  });
  // Buckling
  const bucklingE = document.getElementById('buckling-e');
  const bucklingI = document.getElementById('buckling-i');
  const bucklingL = document.getElementById('buckling-l');
  const bucklingK = document.getElementById('buckling-k');
  const pcrOut = document.getElementById('buckling-pcr');
  const bucklingCanvas = document.getElementById('buckling-canvas');
  const bucklingCtx = bucklingCanvas.getContext('2d');
  function updateBuckling() {
    const E = parseFloat(bucklingE.value);
    const I = parseFloat(bucklingI.value);
    const L = parseFloat(bucklingL.value);
    const K = parseFloat(bucklingK.value);
    if ([E, I, L, K].some(x => isNaN(x) || x <= 0)) {
      pcrOut.textContent = '—';
      clearCanvas(bucklingCtx, bucklingCanvas);
      return;
    }
    const EPa = E * 1e9;
    const Pcr = (Math.PI * Math.PI * EPa * I) / Math.pow(K * L, 2); // Newtons
    const PcrkN = Pcr / 1000; // to kN
    pcrOut.textContent = PcrkN.toFixed(2) + ' kN';
    drawBucklingColumn(bucklingCtx, bucklingCanvas, PcrkN);
  }
  [bucklingE, bucklingI, bucklingL, bucklingK].forEach(el => {
    el.addEventListener('input', updateBuckling);
  });
}

function drawBeamDeflection(ctx, canvas, w, L, E, I) {
  clearCanvas(ctx, canvas);
  // Draw baseline
  ctx.strokeStyle = '#0a253a';
  ctx.beginPath();
  ctx.moveTo(10, canvas.height / 2);
  ctx.lineTo(canvas.width - 10, canvas.height / 2);
  ctx.stroke();
  // Compute deflection curve at discrete points
  const n = 50;
  const scaleX = (canvas.width - 20) / L;
  // Find max deflection to scale y
  let yMax = 0;
  const ys = [];
  for (let i = 0; i <= n; i++) {
    const x = (L / n) * i;
    // deflection of simply supported beam with UDL: y(x) = w x (L^3 - 2L x^2 + x^3) / (24 E I)
    const y = (w * x * (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3))) / (24 * E * I);
    ys.push(y);
    if (Math.abs(y) > yMax) yMax = Math.abs(y);
  }
  const scaleY = yMax > 0 ? (canvas.height / 4) / yMax : 1;
  // Draw deflection curve
  ctx.strokeStyle = '#6fa8dc';
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = (L / n) * i;
    const px = 10 + x * scaleX;
    const py = canvas.height / 2 - ys[i] * scaleY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawBucklingColumn(ctx, canvas, PcrkN) {
  clearCanvas(ctx, canvas);
  // Draw column
  const colX = canvas.width / 2 - 20;
  const colYTop = 20;
  const colYBot = canvas.height - 40;
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(colX, colYTop, 40, colYBot - colYTop);
  ctx.strokeStyle = '#0a253a';
  ctx.strokeRect(colX, colYTop, 40, colYBot - colYTop);
  // Draw arrow representing load magnitude (scaled)
  const arrowHeight = Math.min((PcrkN / 1000) * 20, 100); // scale; saturate
  const arrowY = colYTop - arrowHeight - 10;
  const arrowX = colX + 20;
  ctx.strokeStyle = '#6fa8dc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(arrowX, colYTop);
  ctx.lineTo(arrowX, arrowY);
  ctx.stroke();
  // arrow head
  ctx.beginPath();
  ctx.moveTo(arrowX - 5, arrowY + 10);
  ctx.lineTo(arrowX, arrowY);
  ctx.lineTo(arrowX + 5, arrowY + 10);
  ctx.stroke();
  // Label
  ctx.fillStyle = '#0a253a';
  ctx.font = '12px Arial';
  ctx.fillText(PcrkN.toFixed(1) + ' kN', arrowX + 10, arrowY + 20);
}

// ---------------------- Transportation ----------------------
function initTransportCalculator() {
  // Fundamental diagram
  const vfInput = document.getElementById('flow-vf');
  const kjInput = document.getElementById('flow-kj');
  const flowCanvas = document.getElementById('flow-canvas');
  const flowCtx = flowCanvas.getContext('2d');
  function updateFlow() {
    const vf = parseFloat(vfInput.value);
    const kj = parseFloat(kjInput.value);
    if (isNaN(vf) || isNaN(kj) || vf <= 0 || kj <= 0) {
      clearCanvas(flowCtx, flowCanvas);
      return;
    }
    drawFundamentalDiagram(flowCtx, flowCanvas, vf, kj);
  }
  [vfInput, kjInput].forEach(el => {
    el.addEventListener('input', updateFlow);
  });
  // Stopping sight distance
  const ssdV = document.getElementById('ssd-v');
  const ssdTr = document.getElementById('ssd-tr');
  const ssdF = document.getElementById('ssd-f');
  const ssdG = document.getElementById('ssd-g');
  const ssdOutput = document.getElementById('ssd-distance');
  const ssdCanvas = document.getElementById('ssd-canvas');
  const ssdCtx = ssdCanvas.getContext('2d');
  function updateSSD() {
    const v = parseFloat(ssdV.value);
    const tr = parseFloat(ssdTr.value);
    const f = parseFloat(ssdF.value);
    const G = parseFloat(ssdG.value);
    if ([v, tr, f, G].some(x => isNaN(x) || v <= 0 || tr <= 0)) {
      ssdOutput.textContent = '—';
      clearCanvas(ssdCtx, ssdCanvas);
      return;
    }
    const v_ms = 0.278 * v;
    const denom = 19.6 * (f + G);
    if (denom <= 0) {
      ssdOutput.textContent = 'Invalid parameters';
      clearCanvas(ssdCtx, ssdCanvas);
      return;
    }
    const ds = 0.278 * tr * v + (v_ms * v_ms) / denom;
    ssdOutput.textContent = ds.toFixed(1) + ' m';
    drawStoppingDistance(ssdCtx, ssdCanvas, ds);
  }
  [ssdV, ssdTr, ssdF, ssdG].forEach(el => {
    el.addEventListener('input', updateSSD);
  });
}

function drawFundamentalDiagram(ctx, canvas, vf, kj) {
  clearCanvas(ctx, canvas);
  // Axes
  const margin = 30;
  const x0 = margin;
  const y0 = canvas.height - margin;
  const x1 = canvas.width - margin;
  const y1 = margin;
  ctx.strokeStyle = '#0a253a';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.stroke();
  // Plot q = vf k (1 - k/kj)
  const n = 50;
  const maxQ = (vf * kj) / 4;
  ctx.strokeStyle = '#6fa8dc';
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const k = (kj / n) * i;
    const q = vf * k * (1 - k / kj);
    const px = x0 + (k / kj) * (x1 - x0);
    const py = y0 - (q / maxQ) * (y0 - y1);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Labels
  ctx.fillStyle = '#0a253a';
  ctx.font = '10px Arial';
  ctx.fillText('Density (k)', x1 - 50, y0 + 15);
  ctx.fillText('Flow (q)', x0 - 25, y1);
}

function drawStoppingDistance(ctx, canvas, ds) {
  clearCanvas(ctx, canvas);
  const margin = 20;
  const trackLength = canvas.width - 2 * margin;
  const maxDS = 200; // 200 m reference
  const carX = margin;
  const barLength = Math.min(trackLength, (ds / maxDS) * trackLength);
  // Draw road
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(margin, canvas.height / 2 - 10, trackLength, 20);
  ctx.fillStyle = '#6fa8dc';
  ctx.fillRect(carX, canvas.height / 2 - 10, barLength, 20);
  // Car rectangle
  ctx.fillStyle = '#f6b26b';
  ctx.fillRect(carX - 10, canvas.height / 2 - 15, 20, 15);
  // Arrow head at end
  ctx.fillStyle = '#6fa8dc';
  const arrowX = carX + barLength;
  ctx.beginPath();
  ctx.moveTo(arrowX, canvas.height / 2);
  ctx.lineTo(arrowX - 8, canvas.height / 2 - 5);
  ctx.lineTo(arrowX - 8, canvas.height / 2 + 5);
  ctx.closePath();
  ctx.fill();
  // Label distance
  ctx.fillStyle = '#0a253a';
  ctx.font = '12px Arial';
  ctx.fillText(ds.toFixed(1) + ' m', margin, canvas.height / 2 + 35);
}

// ---------------------- Environmental ----------------------
function initEnvironmentCalculator() {
  const k1Input = document.getElementById('do-k1');
  const k2Input = document.getElementById('do-k2');
  const laInput = document.getElementById('do-la');
  const daInput = document.getElementById('do-da');
  const doCanvas = document.getElementById('do-canvas');
  const doCtx = doCanvas.getContext('2d');
  function updateDO() {
    const k1 = parseFloat(k1Input.value);
    const k2 = parseFloat(k2Input.value);
    const La = parseFloat(laInput.value);
    const Da = parseFloat(daInput.value);
    if ([k1, k2, La, Da].some(x => isNaN(x) || x < 0) || k1 === k2) {
      clearCanvas(doCtx, doCanvas);
      return;
    }
    drawDOSag(doCtx, doCanvas, k1, k2, La, Da);
  }
  [k1Input, k2Input, laInput, daInput].forEach(el => {
    el.addEventListener('input', updateDO);
  });
}

function drawDOSag(ctx, canvas, k1, k2, La, Da) {
  clearCanvas(ctx, canvas);
  // Time scale (days)
  const n = 50;
  const tMax = 10;
  // Compute DO deficit over time
  const values = [];
  let maxD = 0;
  for (let i = 0; i <= n; i++) {
    const t = (tMax / n) * i;
    const D = (k1 * La) / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t)) + Da * Math.exp(-k2 * t);
    values.push({ t, D });
    if (D > maxD) maxD = D;
  }
  // Axes
  const margin = 30;
  const x0 = margin;
  const y0 = canvas.height - margin;
  const x1 = canvas.width - margin;
  const y1 = margin;
  ctx.strokeStyle = '#0a253a';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.stroke();
  // Plot curve
  ctx.strokeStyle = '#6fa8dc';
  ctx.beginPath();
  values.forEach((pt, i) => {
    const px = x0 + (pt.t / tMax) * (x1 - x0);
    const py = y0 - (pt.D / Math.max(maxD, 1e-6)) * (y0 - y1);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  // Labels
  ctx.fillStyle = '#0a253a';
  ctx.font = '10px Arial';
  ctx.fillText('Time (days)', x1 - 50, y0 + 15);
  ctx.fillText('DO deficit', x0 - 25, y1);
}

// ---------------------- Hydraulics ----------------------
function initHydraulicsCalculator() {
  const bInput = document.getElementById('manning-b');
  const dInput = document.getElementById('manning-d');
  const sInput = document.getElementById('manning-s');
  const nInput = document.getElementById('manning-n');
  const qOutput = document.getElementById('manning-q');
  const canvas = document.getElementById('manning-canvas');
  const ctx = canvas.getContext('2d');
  function updateManning() {
    const b = parseFloat(bInput.value);
    const d = parseFloat(dInput.value);
    const S = parseFloat(sInput.value);
    const n = parseFloat(nInput.value);
    if ([b, d, S, n].some(x => isNaN(x) || x <= 0)) {
      qOutput.textContent = '—';
      clearCanvas(ctx, canvas);
      return;
    }
    const A = b * d;
    const P = b + 2 * d;
    const Rh = A / P;
    const Q = (1 / n) * A * Math.pow(Rh, 2 / 3) * Math.sqrt(S);
    qOutput.textContent = Q.toFixed(3) + ' m³/s';
    drawManningChannel(ctx, canvas, b, d, Q);
  }
  [bInput, dInput, sInput, nInput].forEach(el => {
    el.addEventListener('input', updateManning);
  });
}

function drawManningChannel(ctx, canvas, b, d, Q) {
  clearCanvas(ctx, canvas);
  // Scale width and depth to canvas
  const margin = 20;
  const maxDim = Math.max(b, d);
  const scale = (canvas.height - 2 * margin) / (maxDim * 1.5);
  const width = b * scale;
  const depth = d * scale;
  const startX = (canvas.width - width) / 2;
  const waterY = canvas.height - margin;
  // Draw channel walls
  ctx.strokeStyle = '#0a253a';
  ctx.fillStyle = '#ffffff';
  ctx.strokeRect(startX, waterY - depth, width, depth);
  // Draw water
  ctx.fillStyle = '#6fa8dc';
  ctx.fillRect(startX, waterY - depth, width, depth);
  ctx.strokeRect(startX, waterY - depth, width, depth);
  // Flow arrow length scaled by Q
  const arrowLength = Math.min(width * 0.8, (Q / 10) * (width * 0.8));
  ctx.strokeStyle = '#f6b26b';
  ctx.lineWidth = 3;
  const arrowY = waterY - depth / 2;
  ctx.beginPath();
  ctx.moveTo(startX + width * 0.1, arrowY);
  ctx.lineTo(startX + width * 0.1 + arrowLength, arrowY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(startX + width * 0.1 + arrowLength, arrowY);
  ctx.lineTo(startX + width * 0.1 + arrowLength - 5, arrowY - 5);
  ctx.lineTo(startX + width * 0.1 + arrowLength - 5, arrowY + 5);
  ctx.closePath();
  ctx.fillStyle = '#f6b26b';
  ctx.fill();
  // Label Q
  ctx.fillStyle = '#0a253a';
  ctx.font = '12px Arial';
  ctx.fillText(Q.toFixed(2) + ' m³/s', startX + 5, waterY - depth - 5);
}

// ---------------------- Construction/PM ----------------------
function initConstructionCalculator() {
  const ev = document.getElementById('evm-ev');
  const pv = document.getElementById('evm-pv');
  const ac = document.getElementById('evm-ac');
  const bac = document.getElementById('evm-bac');
  const spiOut = document.getElementById('evm-spi');
  const cpiOut = document.getElementById('evm-cpi');
  const eacOut = document.getElementById('evm-eac');
  const canvas = document.getElementById('evm-canvas');
  const ctx = canvas.getContext('2d');
  function updateEVM() {
    const EV = parseFloat(ev.value);
    const PV = parseFloat(pv.value);
    const AC = parseFloat(ac.value);
    const BAC = parseFloat(bac.value);
    if ([EV, PV, AC, BAC].some(x => isNaN(x) || x <= 0)) {
      spiOut.textContent = 'SPI: —';
      cpiOut.textContent = 'CPI: —';
      eacOut.textContent = 'EAC: —';
      clearCanvas(ctx, canvas);
      return;
    }
    const SPI = EV / PV;
    const CPI = EV / AC;
    const EAC = BAC / CPI;
    spiOut.textContent = 'SPI: ' + SPI.toFixed(2);
    cpiOut.textContent = 'CPI: ' + CPI.toFixed(2);
    eacOut.textContent = 'EAC: ' + EAC.toFixed(2);
    drawEVMGauges(ctx, canvas, SPI, CPI);
  }
  [ev, pv, ac, bac].forEach(el => {
    el.addEventListener('input', updateEVM);
  });
}

function drawEVMGauges(ctx, canvas, SPI, CPI) {
  clearCanvas(ctx, canvas);
  // Draw two semi-circular gauges side by side
  const cx1 = canvas.width / 3;
  const cx2 = (canvas.width / 3) * 2;
  const cy = canvas.height - 10;
  const radius = Math.min(canvas.width / 4, canvas.height - 20);
  function drawGauge(cx, value, label) {
    // Draw arc background
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    // Draw value arc
    const angle = Math.PI * value; // value 0-2 maps 0-2π? Actually we want 0 to 2 for 0-2; restrict to 0-2; each 1 = pi/2? Wait: full semicircle (π) corresponds to value 2? Use (value/2)*π
    const endAngle = Math.PI + Math.min(value / 2, 1) * Math.PI;
    ctx.strokeStyle = '#6fa8dc';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, endAngle);
    ctx.stroke();
    // Draw needle
    const needleAngle = Math.PI + Math.min(value / 2, 1) * Math.PI;
    const nx = cx + radius * Math.cos(needleAngle);
    const ny = cy + radius * Math.sin(needleAngle);
    ctx.strokeStyle = '#f6b26b';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    // Draw center circle
    ctx.fillStyle = '#0a253a';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fill();
    // Label
    ctx.fillStyle = '#0a253a';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 15);
    ctx.fillText(value.toFixed(2), cx, cy + 30);
  }
  drawGauge(cx1, SPI, 'SPI');
  drawGauge(cx2, CPI, 'CPI');
}

// Utility: clear canvas
function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}