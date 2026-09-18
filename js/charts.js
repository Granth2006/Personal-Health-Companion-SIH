/* ══════════════════════════════════════════
   PHC CHART ENGINE
   Animated SVG chart with tooltip
══════════════════════════════════════════ */

const Chart = (() => {
  const W = 340, H = 130, PAD = { top: 12, bottom: 10, left: 8, right: 8 };

  function normalise(pts) {
    const mn = Math.min(...pts), mx = Math.max(...pts);
    const range = mx - mn || 1;
    return pts.map(v => ((v - mn) / range));
  }

  function toSvgCoords(pts) {
    const norm = normalise(pts);
    const pw = W - PAD.left - PAD.right;
    const ph = H - PAD.top - PAD.bottom;
    return norm.map((n, i) => ({
      x: PAD.left + (i / (pts.length - 1)) * pw,
      y: PAD.top + ph - n * ph,
      raw: pts[i],
    }));
  }

  function smoothLine(coords) {
    if (coords.length < 2) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1], curr = coords[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  function areaPath(coords) {
    const line = smoothLine(coords);
    const last = coords[coords.length - 1];
    return `${line} L ${last.x} ${H} L ${PAD.left} ${H} Z`;
  }

  function render(svgEl, tooltipEl, pts, color = '#0D5C5C', animate = true) {
    const coords = toSvgCoords(pts);
    const line = smoothLine(coords);
    const area = areaPath(coords);
    const mn = Math.min(...pts), mx = Math.max(...pts);
    const peakIdx = pts.indexOf(mx);
    const peak = coords[peakIdx];

    svgEl.innerHTML = `
      <defs>
        <linearGradient id="cg-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="cg-clip">
          <rect x="0" y="0" width="${W}" height="${H}"/>
        </clipPath>
      </defs>

      <!-- Grid -->
      <line x1="${PAD.left}" y1="${H*0.25}" x2="${W-PAD.right}" y2="${H*0.25}" stroke="#E4E1DC" stroke-width="1"/>
      <line x1="${PAD.left}" y1="${H*0.5}"  x2="${W-PAD.right}" y2="${H*0.5}"  stroke="#E4E1DC" stroke-width="1"/>
      <line x1="${PAD.left}" y1="${H*0.75}" x2="${W-PAD.right}" y2="${H*0.75}" stroke="#E4E1DC" stroke-width="1"/>

      <!-- Area fill -->
      <path d="${area}" fill="url(#cg-area)" clip-path="url(#cg-clip)"/>

      <!-- Line -->
      <path id="chart-line" d="${line}" fill="none" stroke="${color}" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Peak marker -->
      <circle cx="${peak.x}" cy="${peak.y}" r="10" fill="${color}" opacity="0.10"/>
      <circle cx="${peak.x}" cy="${peak.y}" r="4.5" fill="#fff" stroke="${color}" stroke-width="2"/>

      <!-- Hover scrubber -->
      <line id="chart-scrubber" x1="0" y1="${PAD.top}" x2="0" y2="${H-PAD.bottom}"
            stroke="${color}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0"/>
      <circle id="chart-cursor" cx="0" cy="0" r="5" fill="${color}" opacity="0"/>

      <!-- Touch area -->
      <rect id="chart-hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
    `;

    // Draw animation
    if (animate) {
      const pathEl = svgEl.querySelector('#chart-line');
      const len = pathEl.getTotalLength?.() || 400;
      pathEl.style.strokeDasharray = len;
      pathEl.style.strokeDashoffset = len;
      pathEl.style.transition = 'none';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pathEl.style.transition = 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)';
          pathEl.style.strokeDashoffset = '0';
        });
      });
    }

    // Tooltip interaction
    const hitEl     = svgEl.querySelector('#chart-hit');
    const scrubber  = svgEl.querySelector('#chart-scrubber');
    const cursor    = svgEl.querySelector('#chart-cursor');

    function updateTooltip(clientX) {
      const rect = svgEl.getBoundingClientRect();
      const relX = (clientX - rect.left) * (W / rect.width);
      const clamped = Math.max(PAD.left, Math.min(W - PAD.right, relX));
      const pw = W - PAD.left - PAD.right;
      const t = (clamped - PAD.left) / pw;
      const idx = Math.round(t * (coords.length - 1));
      const pt = coords[Math.max(0, Math.min(coords.length - 1, idx))];

      scrubber.setAttribute('x1', pt.x);
      scrubber.setAttribute('x2', pt.x);
      scrubber.setAttribute('opacity', '0.6');
      cursor.setAttribute('cx', pt.x);
      cursor.setAttribute('cy', pt.y);
      cursor.setAttribute('opacity', '1');

      if (tooltipEl) {
        const svgRect = svgEl.closest('.chart-area').getBoundingClientRect();
        const pxX = pt.x / W * svgRect.width;
        const pxY = pt.y / H * svgRect.height;
        tooltipEl.style.left = pxX + 'px';
        tooltipEl.style.top  = pxY + 'px';

        const mins = Math.round((1 - t) * 60);
        const timeLabel = mins === 0 ? 'Now' : `${mins}m ago`;
        tooltipEl.querySelector('.chart-tooltip__time').textContent = timeLabel;
        tooltipEl.querySelector('.chart-tooltip__val').textContent  = pt.raw;
        tooltipEl.classList.add('visible');
      }
    }

    hitEl.addEventListener('mousemove', e => updateTooltip(e.clientX));
    hitEl.addEventListener('mouseleave', () => {
      scrubber.setAttribute('opacity', '0');
      cursor.setAttribute('opacity', '0');
      tooltipEl?.classList.remove('visible');
    });
    hitEl.addEventListener('touchmove', e => { e.preventDefault(); updateTooltip(e.touches[0].clientX); }, { passive: false });
    hitEl.addEventListener('touchend', () => {
      scrubber.setAttribute('opacity', '0');
      cursor.setAttribute('opacity', '0');
      tooltipEl?.classList.remove('visible');
    });
  }

  return { render };
})();
