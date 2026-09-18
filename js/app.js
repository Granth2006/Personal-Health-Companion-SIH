/* ══════════════════════════════════════════
   PHC APP — Main logic v2
   All bugs fixed, redesigned renderers
══════════════════════════════════════════ */
'use strict';

/* ── SVG ICONS ── */
const ICONS = {
  home:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
  health: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  heart:  `<svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  o2:     `<svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  temp:   `<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>`,
  resp:   `<svg viewBox="0 0 24 24" fill="none" stroke="#0D5C5C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4 4 4 0 014 4 6 6 0 01-6 6H10A6 6 0 014 10a4 4 0 014-4 4 4 0 014-4z"/></svg>`,
  watch:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 6V4M15 6V4M9 18v2M15 18v2M12 10v4M10 12h4"/></svg>`,
  wifi:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  sparkline: (pts) => {
    const w=60, h=20, mn=Math.min(...pts), mx=Math.max(...pts), range=mx-mn||1;
    const coords = pts.map((v,i) => ({ x: i/(pts.length-1)*w, y: h-(v-mn)/range*(h-2)-1 }));
    let d = `M${coords[0].x},${coords[0].y}`;
    coords.slice(1).forEach(c => d += ` L${c.x},${c.y}`);
    return `<svg viewBox="0 0 ${w} ${h}" class="risk-sparkline" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="#5DDBA0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  },
};

/* ── METRIC CONFIG ── (fixes the `undefined` icon bug) */
const METRIC_CONFIG = {
  hr:   { label: 'Heart Rate',   icon: 'heart', color: '#DC2626', dotColor: '#DC2626' },
  spo2: { label: 'Blood Oxygen', icon: 'o2',    color: '#2563EB', dotColor: '#2563EB' },
  temp: { label: 'Temperature',  icon: 'temp',  color: '#D97706', dotColor: '#D97706' },
  resp: { label: 'Respiration',  icon: 'resp',  color: '#0D5C5C', dotColor: '#0D5C5C' },
};

/* ── STATE ── */
const state = {
  activeScreen: null,
  prevScreen:   null,
  actions:      PHC.actions.map(a => ({ ...a })),
  alertMetric:  PHC.activeMetric,
  alertRange:   PHC.activeRange,
  sosActive:    false,
  sosDispatched:false,
  sosTimer:     null,
  sosCount:     30,
  vitalTick:    null,
};

/* ── UTILS ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function showToast(msg, icon = '✓') {
  const t = $('#toast');
  t.querySelector('.toast__icon').textContent = icon;
  t.querySelector('.toast__msg').textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2600);
}

function animateNumber(el, target, duration = 500) {
  const start = parseFloat(el.textContent) || 0;
  const diff = target - start;
  const s = performance.now();
  const step = now => {
    const p = Math.min((now - s) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Number.isInteger(target)
      ? Math.round(start + diff * ease)
      : (start + diff * ease).toFixed(1);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── NAVIGATION ── */
function navigate(id) {
  if (id === state.activeScreen) return;
  const prev = state.activeScreen ? $('#screen-' + state.activeScreen) : null;
  const next = $('#screen-' + id);
  if (!next) return;

  if (prev) {
    prev.classList.remove('active');
    prev.classList.add('exit');
    setTimeout(() => prev.classList.remove('exit'), 380);
  }
  next.classList.add('active');
  state.prevScreen = state.activeScreen;
  state.activeScreen = id;

  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.screen === id));

  if (id === 'health')  renderHealthChart(true);
  if (id === 'home')    startVitalUpdates();
  if (id !== 'home')    clearInterval(state.vitalTick);

  staggerFadeIn(next);
}

function staggerFadeIn(screen) {
  const els = $$('.fade-in-up', screen);
  els.forEach((el, i) => {
    el.classList.remove('visible');
    requestAnimationFrame(() =>
      setTimeout(() => el.classList.add('visible'), i * 55)
    );
  });
}

/* ═══════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════ */

function renderHome() {
  const el = $('#screen-home');
  const trendPts = [27, 28, 26, 24, 25, 23, 24];
  const a = PHC.riskIndex;
  const env = PHC.environmental;

  el.innerHTML = `
    <div class="home-header fade-in-up">
      <div>
        <div class="home-header__greeting">${getGreeting()},<br>${PHC.user.name}</div>
        <div class="home-header__sub" id="sys-status">All systems operational</div>
      </div>
      <div class="home-header__avatar" onclick="navigate('profile')">${PHC.user.name[0]}</div>
    </div>

    <div class="conn-strip fade-in-up">
      <div class="conn-strip__dot"></div>
      <span>Connected to</span>
      <span class="conn-strip__name">PHC Field Band</span>
      <span class="conn-strip__sync">Synced now</span>
    </div>

    <!-- Bio-Risk Panel -->
    <div class="risk-panel fade-in-up">
      <div class="risk-panel__label">Bio-Risk Index</div>
      <div class="risk-panel__main">
        <div class="risk-panel__score">${a.score}</div>
        <div class="risk-panel__right">
          <div class="risk-panel__status">${a.status}</div>
          <div class="risk-panel__desc">${a.desc}</div>
        </div>
      </div>
      <div class="risk-panel__trend">
        <span class="risk-panel__trend-val">↓ ${Math.abs(a.trend)} from yesterday</span>
        <span>&nbsp;— improving</span>
        ${ICONS.sparkline(trendPts)}
      </div>
    </div>

    <!-- Live Telemetry -->
    <div class="section-header fade-in-up">
      <span class="section-header__title">Live Telemetry</span>
      <span class="section-header__action" onclick="navigate('health')">View all →</span>
    </div>

    <div class="vitals-grid fade-in-up">
      ${Object.entries(PHC.vitals).map(([key, v]) => `
        <div class="metric-card" onclick="navigate('health'); setTimeout(()=>setMetric('${key}'),250)">
          <div class="metric-card__top">
            <div class="metric-card__icon-wrap metric-card__icon-wrap--${key}">
              ${ICONS[METRIC_CONFIG[key].icon] || ''}
            </div>
            ${key === 'hr' ? '<div class="metric-card__live"><div class="live-dot"></div></div>' : ''}
          </div>
          <div class="metric-card__label">${v.label}</div>
          <div class="metric-card__value-row">
            <span class="metric-card__value" data-vital="${key}">${v.value}</span>
            <span class="metric-card__unit">${v.unit}</span>
          </div>
          <div class="metric-card__trend metric-card__trend--${v.status}">
            ${v.trend > 0 ? '↑' : v.trend < 0 ? '↓' : '→'} ${v.status === 'ok' ? 'Normal' : 'Slightly elevated'}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Environmental Risk -->
    <div class="section-header fade-in-up">
      <span class="section-header__title">Environmental Risk</span>
    </div>
    <div class="env-list fade-in-up">
      ${env.map(e => `
        <div class="env-row">
          <div class="env-row__icon" style="background:${e.status==='critical'?'var(--c-critical-light)':e.status==='warn'?'var(--c-warn-light)':'var(--c-ok-light)'}">
            ${e.icon}
          </div>
          <span class="env-row__label">${e.label}</span>
          <div class="env-bar-wrap">
            <div class="env-bar" style="width:${e.value}%;background:${e.status==='critical'?'var(--c-critical)':e.status==='warn'?'var(--c-warn)':'var(--c-ok)'}"></div>
          </div>
          <span class="env-row__status" style="color:${e.status==='critical'?'var(--c-critical)':e.status==='warn'?'var(--c-warn)':'var(--c-ok)'}">${e.statusLabel}</span>
        </div>
      `).join('')}
    </div>

    <!-- Recommended Actions -->
    <div class="section-header fade-in-up">
      <span class="section-header__title">Recommended Actions</span>
      <span class="badge badge--warn" id="actions-pending">${state.actions.filter(a=>!a.done).length} pending</span>
    </div>
    <div class="actions-list fade-in-up" id="actions-list">
      ${state.actions.map(renderActionRow).join('')}
    </div>
  `;

  staggerFadeIn(el);
  bindActionRows();
  startVitalUpdates();
}

function renderActionRow(a) {
  return `
    <div class="action-row ${a.done ? 'done' : ''}" data-action="${a.id}">
      <div class="action-row__check" onclick="toggleAction('${a.id}', event)">
        <svg class="action-row__check-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="action-row__body">
        <div class="action-row__cat">${a.category}</div>
        <div class="action-row__title">${a.title}</div>
        <div class="action-row__desc">${a.desc}</div>
      </div>
    </div>
  `;
}

function bindActionRows() {
  $$('[data-action]').forEach(el => {
    el.addEventListener('click', e => {
      if (!e.target.closest('.action-row__check')) toggleAction(el.dataset.action, e);
    });
  });
}

function toggleAction(id, e) {
  e?.stopPropagation();
  const a = state.actions.find(a => a.id === id);
  if (!a) return;
  a.done = !a.done;
  const el = $(`[data-action="${id}"]`);
  if (el) el.classList.toggle('done', a.done);
  const pending = $('#actions-pending');
  if (pending) pending.textContent = `${state.actions.filter(a=>!a.done).length} pending`;
  if (a.done) showToast('Action marked complete');
}

function startVitalUpdates() {
  clearInterval(state.vitalTick);
  state.vitalTick = setInterval(() => {
    const hrEl = $('[data-vital="hr"]');
    if (!hrEl || !$('#screen-home.active')) { clearInterval(state.vitalTick); return; }
    const cur = parseInt(hrEl.textContent);
    const delta = Math.random() > 0.5 ? 1 : -1;
    animateNumber(hrEl, Math.max(72, Math.min(84, cur + delta)), 900);
  }, 3200);
}

/* ═══════════════════════════════════════════
   HEALTH SCREEN
═══════════════════════════════════════════ */

function renderHealth() {
  const el = $('#screen-health');

  el.innerHTML = `
    <div class="health-header fade-in-up">
      <div class="health-header__title">Health</div>
      <div class="metric-tabs" id="metric-tabs">
        ${Object.entries(METRIC_CONFIG).map(([key, cfg]) => `
          <div class="metric-tab ${key === state.alertMetric ? 'active' : ''}" data-metric="${key}" onclick="setMetric('${key}')">
            <div class="metric-tab__dot" style="--dot-color:${cfg.dotColor}; background:${key===state.alertMetric?'rgba(255,255,255,0.8)':cfg.dotColor}"></div>
            ${cfg.label}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="chart-card fade-in-up">
      <div class="chart-card__hero">
        <div>
          <div class="chart-card__num" id="chart-cur-val">—</div>
          <div class="chart-card__unit" id="chart-cur-unit">—</div>
        </div>
        <div id="chart-cur-status"></div>
      </div>
      <div class="range-tabs" id="range-tabs">
        ${['1H','6H','24H','7D'].map(r => `
          <div class="range-tab ${r===state.alertRange?'active':''}" data-range="${r}" onclick="setRange('${r}')">${r}</div>
        `).join('')}
      </div>
      <div class="chart-area">
        <svg id="chart-svg" class="chart-area__svg" viewBox="0 0 340 130" preserveAspectRatio="none"></svg>
        <div class="chart-tooltip" id="chart-tooltip">
          <div class="chart-tooltip__time"></div>
          <div class="chart-tooltip__val"></div>
        </div>
        <div class="chart-area__x-axis" id="chart-xaxis">
          <span>T−60m</span><span>T−30m</span><span>Now</span>
        </div>
      </div>
      <div class="stats-strip">
        <div class="stat-cell lo"><span class="stat-cell__val" id="stat-min">—</span><span class="stat-cell__label">Min</span></div>
        <div class="stat-cell hi"><span class="stat-cell__val" id="stat-max">—</span><span class="stat-cell__label">Max</span></div>
        <div class="stat-cell"><span class="stat-cell__val" id="stat-avg">—</span><span class="stat-cell__label">Avg</span></div>
        <div class="stat-cell"><span class="stat-cell__val" id="stat-base">—</span><span class="stat-cell__label">Baseline</span></div>
      </div>
    </div>

    <div class="assessment fade-in-up" id="assessment">
      <div class="assessment__label">Assessment</div>
      <div class="assessment__text" id="assessment-text">—</div>
    </div>
  `;

  staggerFadeIn(el);
  renderHealthChart(true);
}

function setMetric(key) {
  state.alertMetric = key;
  $$('.metric-tab').forEach(el => {
    const isActive = el.dataset.metric === key;
    el.classList.toggle('active', isActive);
    const dot = el.querySelector('.metric-tab__dot');
    if (dot) {
      const cfg = METRIC_CONFIG[el.dataset.metric];
      dot.style.background = isActive ? 'rgba(255,255,255,0.8)' : cfg.dotColor;
    }
  });
  renderHealthChart(true);
}

function setRange(r) {
  state.alertRange = r;
  $$('.range-tab').forEach(el => el.classList.toggle('active', el.dataset.range === r));
  renderHealthChart(true);
}

function renderHealthChart(animate = false) {
  const m = state.alertMetric;
  const r = state.alertRange;
  const data = PHC.chartData[m]?.[r];
  if (!data) return;

  const svgEl = $('#chart-svg');
  const tipEl = $('#chart-tooltip');
  if (!svgEl) return;

  Chart.render(svgEl, tipEl, data.points, METRIC_CONFIG[m].color, animate);

  const setEl = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  setEl('#chart-cur-val', PHC.vitals[m].value);
  setEl('#chart-cur-unit', data.unit);
  setEl('#stat-min', data.min);
  setEl('#stat-max', data.max);
  setEl('#stat-avg', data.avg);
  setEl('#stat-base', data.baseline);

  const statusEl = $('#chart-cur-status');
  if (statusEl) {
    const v = PHC.vitals[m];
    statusEl.innerHTML = `<span class="badge badge--${v.status === 'ok' ? 'ok' : 'warn'}">${v.status === 'ok' ? 'Normal' : 'Elevated'}</span>`;
  }

  const assessEl = $('#assessment-text');
  if (assessEl) assessEl.textContent = data.assessment;

  const xLabels = {
    '1H':  ['T−60m', 'T−30m', 'Now'],
    '6H':  ['T−6h',  'T−3h',  'Now'],
    '24H': ['Yesterday', 'T−12h', 'Now'],
    '7D':  ['7 days ago', 'T−3d', 'Now'],
  };
  const xEl = $('#chart-xaxis');
  if (xEl && xLabels[r]) {
    const [a,b,c] = xLabels[r];
    xEl.innerHTML = `<span>${a}</span><span>${b}</span><span>${c}</span>`;
  }
}

/* ═══════════════════════════════════════════
   ALERTS SCREEN
═══════════════════════════════════════════ */

function renderAlerts() {
  const el = $('#screen-alerts');
  const alerts = PHC.alerts;

  el.innerHTML = `
    <div class="alerts-header fade-in-up">
      <div class="alerts-header__title">Alerts</div>
      <span class="badge badge--critical">
        <span class="badge__dot"></span>
        ${alerts.filter(a => a.severity === 'critical').length} critical
      </span>
    </div>
    <div class="alert-list fade-in-up">
      ${alerts.map(renderAlertCard).join('')}
    </div>
  `;

  staggerFadeIn(el);
}

function renderAlertCard(a) {
  const sevMap = { critical: 'critical', warning: 'warning', info: 'info' };
  return `
    <div class="alert-card ${sevMap[a.severity] || a.severity}">
      <div class="alert-card__body">
        <div class="alert-card__top">
          <div class="alert-card__sev">
            <div class="alert-card__sev-dot"></div>
            ${a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
          </div>
          <span class="alert-card__time">${a.time}</span>
        </div>
        <div class="alert-card__title">${a.title}</div>
        <div class="alert-card__sub">${a.sub}</div>
        <div class="alert-card__desc">${a.desc}</div>
        <div class="alert-card__chips">
          ${a.chips.map(c => `<span class="chip">${c}</span>`).join('')}
        </div>
        <div class="alert-card__actions">
          <button class="btn btn--ghost btn--sm" onclick="showToast('Opening details…','📊')">${a.action}</button>
          ${a.severity === 'critical' ? `<button class="btn btn--danger btn--sm" onclick="triggerSOS()">Emergency SOS</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════
   DEVICES SCREEN
═══════════════════════════════════════════ */

const DEVICE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 6V4M15 6V4M9 18v2M15 18v2M12 10v4M10 12h4"/></svg>`;

function renderDevices() {
  const el = $('#screen-devices');

  el.innerHTML = `
    <div class="devices-header fade-in-up">
      <div class="devices-header__title">Devices</div>
      <div class="devices-header__sub">Manage connected hardware</div>
    </div>

    ${PHC.devices.map(d => renderDeviceCard(d)).join('')}

    <div class="section-header fade-in-up px">
      <span class="section-header__title">Discover nearby</span>
    </div>
    <div class="scan-indicator fade-in-up">
      <div class="scan-ring">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0D5C5C" stroke-width="1.8" width="26" height="26" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/>
          <path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
      </div>
      <div class="scan-label">Scanning for BLE devices</div>
      <div class="scan-sub">3 protocols active · Range 10m</div>
    </div>
  `;

  staggerFadeIn(el);
}

function renderDeviceCard(d) {
  const isLinked = d.status === 'linked';
  const bars = [1,2,3,4].map(i =>
    `<div class="signal-bar ${i <= d.signal ? 'filled' : ''}"></div>`
  ).join('');

  return `
    <div class="device-card fade-in-up" id="device-${d.id}">
      <div class="device-card__main">
        <div class="device-card__icon-wrap">${DEVICE_SVG}</div>
        <div class="device-card__info">
          <div class="device-card__name">${d.name}</div>
          <div class="device-card__meta">
            <span>${isLinked ? 'Connected' : 'Available'}</span>
            <span>${d.battery}% battery</span>
            <span>${d.firmware}</span>
          </div>
        </div>
        <div class="device-card__right">
          ${isLinked
            ? `<span class="badge badge--ok">Active</span>`
            : `<span class="badge badge--neutral">Available</span>`}
        </div>
      </div>
      <div class="device-details">
        <div class="device-detail-row">
          <span class="device-detail-row__key">Last sync</span>
          <span class="device-detail-row__val">${d.lastSync}</span>
        </div>
        <div class="device-detail-row">
          <span class="device-detail-row__key">Battery</span>
          <span class="device-detail-row__val">${d.battery}%</span>
        </div>
        <div class="device-detail-row">
          <span class="device-detail-row__key">Signal</span>
          <span class="device-detail-row__val"><div class="signal-strength">${bars}</div></span>
        </div>
        ${!isLinked ? `
        <div class="device-detail-row">
          <span class="device-detail-row__key"></span>
          <button class="btn btn--primary btn--sm" onclick="simulatePairing('${d.id}')">Connect</button>
        </div>` : ''}
      </div>
    </div>
  `;
}

function simulatePairing(id) {
  const card = $(`#device-${id}`);
  if (!card) return;
  const btn = card.querySelector('button');
  if (!btn) return;
  btn.disabled = true;
  const steps = ['Scanning…', 'Found device', 'Connecting…', 'Authenticating…', 'Connected ✓'];
  let i = 0;
  const iv = setInterval(() => {
    if (i >= steps.length) { clearInterval(iv); showToast('Device connected', '✓'); setTimeout(renderDevices, 500); return; }
    btn.textContent = steps[i++];
  }, 700);
}

/* ═══════════════════════════════════════════
   PROFILE SCREEN
═══════════════════════════════════════════ */

function renderProfile() {
  const el = $('#screen-profile');
  const u = PHC.user;

  el.innerHTML = `
    <div class="profile-header fade-in-up">
      <div class="profile-avatar">${u.name[0]}</div>
      <div>
        <div class="profile-name">${u.name} ${u.lastName}</div>
        <div class="profile-sub">Age ${u.age} · ${u.weight}</div>
      </div>
    </div>

    <!-- Health chips -->
    <div class="health-chips fade-in-up">
      <div class="health-chip"><span class="health-chip__icon">🩸</span>${u.bloodGroup}</div>
      <div class="health-chip"><span class="health-chip__icon">⚖️</span>${u.weight}</div>
      <div class="health-chip"><span class="health-chip__icon">🎂</span>Age ${u.age}</div>
      <div class="health-chip"><span class="health-chip__icon">⚠️</span>${u.allergies === 'None' ? 'No allergies' : u.allergies}</div>
    </div>

    <!-- Medical ID card -->
    <div class="med-id-card fade-in-up">
      <div class="med-id-card__label">
        <span class="med-id-card__label-icon">🏥</span>
        Medical ID
      </div>
      <div class="med-id-card__grid">
        <div>
          <div class="med-id-card__field-label">Full Name</div>
          <div class="med-id-card__field-val">${u.name} ${u.lastName}</div>
        </div>
        <div>
          <div class="med-id-card__field-label">Blood Type</div>
          <div class="med-id-card__field-val">${u.bloodGroup}</div>
        </div>
        <div>
          <div class="med-id-card__field-label">Allergies</div>
          <div class="med-id-card__field-val">${u.allergies}</div>
        </div>
        <div>
          <div class="med-id-card__field-label">Age & Weight</div>
          <div class="med-id-card__field-val">${u.age}y · ${u.weight}</div>
        </div>
        <div style="grid-column:1/-1">
          <div class="med-id-card__field-label">Emergency Contact</div>
          <div class="med-id-card__field-val">${u.emergencyContact}</div>
        </div>
      </div>
    </div>

    <div class="section-header px fade-in-up">
      <span class="section-header__title">Preferences</span>
    </div>
    <div class="settings-group fade-in-up">
      <div class="settings-row">
        <div class="settings-row__icon">🔔</div>
        <span class="settings-row__label">Notifications</span>
        <span class="settings-row__value">On</span>
        <span class="settings-row__arrow">›</span>
      </div>
      <div class="settings-row">
        <div class="settings-row__icon">📍</div>
        <span class="settings-row__label">Location Sharing</span>
        <span class="settings-row__value">Emergency only</span>
        <span class="settings-row__arrow">›</span>
      </div>
      <div class="settings-row">
        <div class="settings-row__icon">🔒</div>
        <span class="settings-row__label">Data Privacy</span>
        <span class="settings-row__value">On-device</span>
        <span class="settings-row__arrow">›</span>
      </div>
      <div class="settings-row" onclick="navigate('devices')">
        <div class="settings-row__icon">⌚</div>
        <span class="settings-row__label">Connected Devices</span>
        <span class="settings-row__value">${PHC.devices.filter(d=>d.status==='linked').length} active</span>
        <span class="settings-row__arrow">›</span>
      </div>
    </div>

    <div style="padding:var(--sp-4) var(--px) var(--sp-8);text-align:center" class="fade-in-up">
      <div style="font-size:11px;color:var(--c-text-disabled)">PHC v2.0 · SIH 2026 · All health data stays on-device</div>
    </div>
  `;

  staggerFadeIn(el);
}

/* ═══════════════════════════════════════════
   SOS / EMERGENCY OVERLAY
═══════════════════════════════════════════ */

function triggerSOS() {
  if (state.sosActive) return;
  state.sosActive = true;
  state.sosCount = 30;
  state.sosDispatched = false;
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  const overlay = $('#sos-overlay');
  overlay.innerHTML = buildSOSCountdown();
  overlay.classList.add('active');

  state.sosTimer = setInterval(() => {
    state.sosCount--;
    const numEl = $('#sos-num');
    if (numEl) {
      numEl.style.transform = 'scale(1.08)';
      setTimeout(() => { if (numEl) numEl.style.transform = 'scale(1)'; }, 120);
      numEl.textContent = state.sosCount;
      if (navigator.vibrate) navigator.vibrate(40);
    }
    if (state.sosCount <= 0) dispatchSOS();
  }, 1000);
}

function buildSOSCountdown() {
  const u = PHC.user;
  return `
    <div class="sos-ripple-wrap">
      <div class="sos-ripple"><div class="sos-ripple__inner">⚠️</div></div>
    </div>
    <div class="sos-event-label">Fall Detected</div>
    <div class="sos-heading">Emergency<br>Protocol</div>
    <div class="sos-timer-block">
      <div class="sos-timer-pre">Responding in</div>
      <div class="sos-timer-num" id="sos-num">${state.sosCount}</div>
      <div class="sos-timer-sub">seconds</div>
    </div>
    <div class="sos-explain">Emergency contacts and local services will be notified automatically.</div>
    <div class="sos-med-id">
      <div class="sos-med-row"><span class="sos-med-key">Name</span><span class="sos-med-val">${u.name} ${u.lastName}</span></div>
      <div class="sos-med-row"><span class="sos-med-key">Blood</span><span class="sos-med-val">${u.bloodGroup}</span></div>
      <div class="sos-med-row"><span class="sos-med-key">Allergies</span><span class="sos-med-val">${u.allergies}</span></div>
      <div class="sos-med-row"><span class="sos-med-key">Emergency</span><span class="sos-med-val">${u.emergencyContact}</span></div>
    </div>
    <button class="btn btn--danger" style="margin-bottom:var(--sp-3)" onclick="dispatchSOS()">📞 Call 112 Now</button>
    <button class="btn btn--danger-ghost" onclick="cancelSOS()">Cancel — I'm safe</button>
  `;
}

function dispatchSOS() {
  if (state.sosDispatched) return;
  state.sosDispatched = true;
  clearInterval(state.sosTimer);
  if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 600]);

  const overlay = $('#sos-overlay');
  overlay.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-4)">
      <div style="font-size:56px">📡</div>
      <div style="font-size:var(--t-2xl);font-weight:var(--fw-extrabold);color:#fff;text-align:center;letter-spacing:-0.03em;line-height:1.2">Emergency<br>response active</div>
      <div style="font-size:var(--t-sm);color:rgba(255,255,255,0.5)">Services have been alerted</div>
    </div>
    <div class="dispatch-list">
      <div class="dispatch-row"><div class="dispatch-row__check" id="dc1">✓</div><div class="dispatch-row__label">GPS location broadcast</div></div>
      <div class="dispatch-row"><div class="dispatch-row__check" id="dc2">✓</div><div class="dispatch-row__label">Emergency contact notified</div></div>
      <div class="dispatch-row"><div class="dispatch-row__check" id="dc3">✓</div><div class="dispatch-row__label">Emergency services contacted</div></div>
    </div>
    <button class="btn btn--danger-ghost" onclick="cancelSOS()">Cancel emergency</button>
  `;

  ['dc1','dc2','dc3'].forEach((id, i) => {
    setTimeout(() => {
      const e = document.getElementById(id);
      if (e) e.classList.add('done');
    }, (i + 1) * 700);
  });
}

function cancelSOS() {
  clearInterval(state.sosTimer);
  state.sosActive = false;
  state.sosDispatched = false;
  const overlay = $('#sos-overlay');
  overlay.classList.remove('active');
  showToast('Emergency cancelled', '✓');
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */

function init() {
  // Render all screens upfront
  renderHome();
  renderHealth();
  renderAlerts();
  renderDevices();
  renderProfile();

  // Nav tab clicks
  $$('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.screen));
  });

  // SOS nav button
  const sosBtn = $('#sos-nav-btn');
  if (sosBtn) sosBtn.addEventListener('click', triggerSOS);

  // PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Alerts dot
  const alertDot = $('#alerts-dot');
  if (alertDot) alertDot.classList.add('visible');

  // Navigate to home to start
  navigate('home');
}

document.addEventListener('DOMContentLoaded', init);
