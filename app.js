/* =============================================
   KURBANI CALCULATOR – app.js  (Full v2)
   Eid al-Adha 2026
   ============================================= */
'use strict';

/* ── CONFIG ── */
const ANIMALS = {
  cow:   { label: 'Cow / Buffalo', shares: 7,  emoji: '🐄', meatKg: 180 },
  goat:  { label: 'Goat / Sheep',  shares: 1,  emoji: '🐐', meatKg: 20  },
  camel: { label: 'Camel',         shares: 7,  emoji: '🐪', meatKg: 250 },
};
const PRICE_PRESETS = {
  cow:   [{ label: '৳ 50,000', val: 50000 }, { label: '৳ 80,000', val: 80000 },
          { label: '৳ 1,20,000', val: 120000 }, { label: '৳ 1,80,000', val: 180000 }],
  goat:  [{ label: '৳ 8,000', val: 8000 }, { label: '৳ 15,000', val: 15000 },
          { label: '৳ 25,000', val: 25000 }, { label: '৳ 40,000', val: 40000 }],
  camel: [{ label: '৳ 1,50,000', val: 150000 }, { label: '৳ 3,00,000', val: 300000 },
          { label: '৳ 5,00,000', val: 500000 }],
};
const SILVER_NISAB_BDT = 67360;
const GOLD_NISAB_BDT   = 831060;
const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', rate: 0.0083, symbol: '$'  },
  { code: 'SAR', flag: '🇸🇦', rate: 0.031,  symbol: '﷼'  },
  { code: 'GBP', flag: '🇬🇧', rate: 0.0066, symbol: '£'  },
  { code: 'EUR', flag: '🇪🇺', rate: 0.0077, symbol: '€'  },
];
const EID_DATE   = new Date('2026-05-28T00:00:00+06:00');
const HISTORY_KEY = 'kurbani_history_2026';

/* ── STATE ── */
let selectedAnimal   = 'cow';
let participantCount = 1;
let selectedPrice    = null;
let weightMode       = 'auto';
let yieldPct         = 38;
let participantNames = [];
let lastResult       = null;
let calcMode         = 'share';

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildStarField();
  setNisabValues();
  buildPricePresets('cow');
  wireNisabInput();
  wireAnimalButtons();
  wireCustomPrice();
  wireManualWeightInput();
  startCountdown();
  loadHistory();

  // Dismiss preloader after page is fully ready
  const preloader = document.getElementById('appPreloader');
  if (preloader) {
    // Wait for progress bar animation (1.2s) + a small buffer, then fade out
    setTimeout(() => {
      preloader.classList.add('fade-out');
      // Remove from DOM after transition ends so it doesn't block interaction
      preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
    }, 1400);
  }
});

/* ── THEME SWITCHER ── */
function initTheme() {
  const saved = localStorage.getItem('kurbani_theme') || 'dark';
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = '🌙';
  } else {
    document.body.classList.remove('light-mode');
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = '☀️';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('kurbani_theme', isLight ? 'light' : 'dark');
  const icon = document.getElementById('themeToggleIcon');
  if (icon) icon.textContent = isLight ? '🌙' : '☀️';
  showToast(isLight ? '☀️ Light theme activated' : '🌙 Dark theme activated');
}

/* ── STAR FIELD ── */
function buildStarField() {
  const field = document.getElementById('starField');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    const sz = Math.random() * 2.2 + 0.4;
    s.className = 'star';
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*4+2).toFixed(1)}s;--delay:-${(Math.random()*6).toFixed(1)}s;opacity:${(Math.random()*0.5+0.1).toFixed(2)};`;
    field.appendChild(s);
  }
}

/* ── EID COUNTDOWN ── */
function startCountdown() {
  function tick() {
    const now  = new Date();
    const diff = EID_DATE - now;
    if (diff <= 0) {
      document.getElementById('countdownBar').innerHTML =
        '<span class="countdown-past">🌙 Eid al-Adha is here! Eid Mubarak! 🎉</span>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cdDays').textContent  = String(d).padStart(2,'0');
    document.getElementById('cdHours').textContent = String(h).padStart(2,'0');
    document.getElementById('cdMins').textContent  = String(m).padStart(2,'0');
    document.getElementById('cdSecs').textContent  = String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

/* ── NISAB ── */
function setNisabValues() {
  document.getElementById('silverNisabVal').textContent = '৳ ' + fmt(SILVER_NISAB_BDT);
  document.getElementById('goldNisabVal').textContent   = '৳ ' + fmt(GOLD_NISAB_BDT);
}
function wireNisabInput() {
  document.getElementById('netWorth').addEventListener('input', checkNisab);
}
function checkNisab() {
  const worth  = parseFloat(document.getElementById('netWorth').value) || 0;
  const result = document.getElementById('nisabResult');
  if (worth <= 0) { result.className = 'nisab-result'; result.textContent = ''; return; }
  if (worth >= SILVER_NISAB_BDT) {
    result.className = 'nisab-result obligatory';
    result.innerHTML = `✅ <strong>Kurbani is obligatory (Wajib) for you.</strong><br>Your assets of ৳ ${fmt(worth)} meet or exceed the Silver Nisab of ৳ ${fmt(SILVER_NISAB_BDT)}.`;
  } else {
    result.className = 'nisab-result not-obligatory';
    result.innerHTML = `ℹ️ <strong>Kurbani is not obligatory</strong> based on your assets.<br>You need ৳ ${fmt(SILVER_NISAB_BDT - worth)} more to reach Nisab. You may still give Kurbani voluntarily.`;
  }
}

/* ── ANIMAL BUTTONS ── */
function wireAnimalButtons() {
  document.querySelectorAll('.animal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAnimal = btn.dataset.animal;
      selectedPrice  = null;
      buildPricePresets(selectedAnimal);
      document.getElementById('customPrice').value = '';
      
      const step2b = document.getElementById('calcModeStep');
      if (selectedAnimal === 'goat') {
        step2b.style.display = 'none';
      } else {
        step2b.style.display = 'block';
      }
      
      hideResult();
    });
  });
}

/* ── COUNTER ── */
function changeCount(delta) {
  const v = participantCount + delta;
  if (v < 1 || v > 200) return;
  participantCount = v;
  animateCounter();
}
function setCount(n) { participantCount = n; animateCounter(); }
function animateCounter() {
  const el = document.getElementById('participantCount');
  el.style.transform = 'scale(1.35)';
  el.textContent = participantCount;
  setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);

  // Sync names array if count is reduced below name count
  if (participantNames.length > participantCount) {
    participantNames = participantNames.slice(0, participantCount);
  }
  renderNameTags();

  hideResult();
}

/* ── PRICE PRESETS ── */
function buildPricePresets(animal) {
  const c = document.getElementById('pricePresets');
  c.innerHTML = '';
  PRICE_PRESETS[animal].forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      c.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPrice = p.val;
      document.getElementById('customPrice').value = '';
      hideResult();
    });
    c.appendChild(btn);
  });
}
function wireCustomPrice() {
  document.getElementById('customPrice').addEventListener('input', () => {
    document.querySelectorAll('#pricePresets .preset-btn').forEach(b => b.classList.remove('active'));
    selectedPrice = null;
    hideResult();
  });
}

/* ── CALCULATION MODE ── */
function setCalcMode(mode) {
  calcMode = mode;
  const btnShare = document.getElementById('modeBtnShare');
  const btnWhole = document.getElementById('modeBtnWhole');
  if (mode === 'share') {
    btnShare.classList.add('active');
    btnWhole.classList.remove('active');
  } else {
    btnWhole.classList.add('active');
    btnShare.classList.remove('active');
  }
  hideResult();
}

/* ── WEIGHT MODE ── */
function setWeightMode(mode) {
  weightMode = mode;
  document.getElementById('manualWeightGroup').style.display = mode === 'manual' ? 'flex' : 'none';
  if (mode === 'manual') document.getElementById('manualWeightGroup').style.flexDirection = 'column';
  document.getElementById('liveWeightGroup').style.display  = mode === 'live'   ? 'block' : 'none';
  ['weightModeAuto','weightModeManual','weightModeLive'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  const map = { auto: 'weightModeAuto', manual: 'weightModeManual', live: 'weightModeLive' };
  document.getElementById(map[mode]).classList.add('active');
  if (mode !== 'manual') document.getElementById('manualMeatKg').value = '';
  if (mode !== 'live')   { document.getElementById('liveWeightKg').value = ''; updateLiveResult(); }
  hideResult();
}
function wireManualWeightInput() {
  document.getElementById('manualMeatKg').addEventListener('input', hideResult);
  document.getElementById('liveWeightKg').addEventListener('input', () => { updateLiveResult(); hideResult(); });
  document.getElementById('yieldPct').addEventListener('input', () => { updateLiveResult(); hideResult(); });
}
function setYield(btn, val) {
  document.querySelectorAll('.yield-presets .preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (val === 'custom') {
    document.getElementById('yieldPct').removeAttribute('readonly');
  } else {
    document.getElementById('yieldPct').value = val;
    yieldPct = val;
    document.getElementById('yieldPct').setAttribute('readonly', true);
  }
  updateLiveResult();
}
function updateLiveResult() {
  const lw  = parseFloat(document.getElementById('liveWeightKg').value) || 0;
  const yp  = parseFloat(document.getElementById('yieldPct').value) || 38;
  const res = document.getElementById('liveWeightResult');
  if (lw > 0) {
    const meat = (lw * yp / 100).toFixed(1);
    res.className = 'live-weight-result show';
    res.innerHTML = `🥩 Estimated clean meat: <strong>${meat} kg</strong> (${lw} kg live × ${yp}% yield)`;
  } else {
    res.className = 'live-weight-result';
  }
}

/* ── PARTICIPANT NAMES ── */
function addName() {
  const input = document.getElementById('nameInput');
  const name  = input.value.trim();
  if (!name) return;
  if (participantNames.length >= participantCount) {
    showToast(`⚠️ Already have ${participantCount} names. Increase participants first.`);
    return;
  }
  participantNames.push(name);
  input.value = '';
  renderNameTags();
  hideResult();
}
function removeName(idx) {
  participantNames.splice(idx, 1);
  renderNameTags();
  hideResult();
}
function renderNameTags() {
  const container = document.getElementById('nameTags');
  const hint      = document.getElementById('nameHint');
  container.innerHTML = participantNames.map((n, i) =>
    `<span class="name-tag">${n}<button onclick="removeName(${i})" title="Remove">×</button></span>`
  ).join('');
  const remaining = participantCount - participantNames.length;
  hint.textContent = participantNames.length === 0
    ? 'Add names of participants. The per-person cost breakdown will appear in results.'
    : remaining > 0
      ? `${participantNames.length} added. ${remaining} more slot(s) available.`
      : '✅ All participants named!';
}

/* ── CALCULATE ── */
function calculate(isLoading = false) {
  const customP = parseFloat(document.getElementById('customPrice').value);
  const price   = customP > 0 ? customP : selectedPrice;
  if (!price || price <= 0) { showToast('⚠️ Please select or enter a price per animal.'); return; }

  const animal       = ANIMALS[selectedAnimal];
  const sharesPerAni = animal.shares;
  const people       = participantCount;

  // Meat per animal calculation
  let meatPerAnimal, meatSource;
  if (weightMode === 'manual') {
    const v = parseFloat(document.getElementById('manualMeatKg').value);
    if (!v || v <= 0) { showToast('⚠️ Please enter the clean meat weight per animal (KG).'); return; }
    meatPerAnimal = v;
    meatSource    = `Manual (${v} kg/animal)`;
  } else if (weightMode === 'live') {
    const lw = parseFloat(document.getElementById('liveWeightKg').value);
    const yp = parseFloat(document.getElementById('yieldPct').value) || 38;
    if (!lw || lw <= 0) { showToast('⚠️ Please enter the live weight per animal (KG).'); return; }
    meatPerAnimal = parseFloat((lw * yp / 100).toFixed(1));
    meatSource    = `Live weight ${lw} kg × ${yp}% yield`;
  } else {
    meatPerAnimal = animal.meatKg;
    meatSource    = `Average estimate (${meatPerAnimal} kg/animal)`;
  }

  let totalAnimals, totalShares, extraShares, totalCost, yourCost, totalMeatKg, meatPerPerson;

  if (calcMode === 'share' && selectedAnimal !== 'goat') {
    totalAnimals  = Math.ceil(people / sharesPerAni);
    totalShares   = totalAnimals * sharesPerAni;
    extraShares   = totalShares - people;
    yourCost      = Math.round(price / sharesPerAni);
    totalCost     = people * yourCost;
    meatPerPerson = +(meatPerAnimal / sharesPerAni).toFixed(1);
    totalMeatKg   = +(people * meatPerPerson).toFixed(1);
  } else {
    // Whole animal split (or goat calculation where shares = 1)
    totalAnimals  = Math.ceil(people / sharesPerAni);
    totalShares   = totalAnimals * sharesPerAni;
    extraShares   = totalShares - people;
    totalCost     = totalAnimals * price;
    yourCost      = Math.round(totalCost / people);
    meatPerPerson = +( (totalAnimals * meatPerAnimal) / people ).toFixed(1);
    totalMeatKg   = +(people * meatPerPerson).toFixed(1);
  }

  lastResult = {
    animal, people, totalAnimals, totalShares, extraShares,
    totalCost, yourCost, price, sharesPerAni,
    totalMeatKg, meatPerPerson, meatSource, calcMode,
    names: [...participantNames],
    date: new Date().toLocaleString('en-BD'),
  };
  renderResult(lastResult);
  
  if (!isLoading) {
    saveToHistory(true);
  }
}

/* ── RENDER RESULT ── */
function renderResult(r) {
  const card = document.getElementById('resultCard');

  // Dynamic, user-friendly labels based on mode
  const animalsLabel = r.calcMode === 'share' ? 'Animals Shared' : 'Whole Animals';
  const totalCostLabel = r.calcMode === 'share' ? 'Group Total Cost' : 'Whole Animal(s) Cost';

  // Grid with animated values
  document.getElementById('resultGrid').innerHTML = `
    <div class="result-item"><div class="result-num">${r.animal.emoji} ${r.totalAnimals}</div><div class="result-label">${animalsLabel}</div></div>
    <div class="result-item"><div class="result-num">${r.people}</div><div class="result-label">Participants</div></div>
    <div class="result-item"><div class="result-num">৳ <span id="animYourCost">0</span></div><div class="result-label">Cost per Person</div></div>
    <div class="result-item"><div class="result-num">৳ <span id="animTotalCost">0</span></div><div class="result-label">${totalCostLabel}</div></div>
  `;

  animateValue(document.getElementById('animYourCost'), 0, r.yourCost, 600);
  animateValue(document.getElementById('animTotalCost'), 0, r.totalCost, 600);

  // Currency
  const cr = document.getElementById('currencyRow');
  cr.innerHTML = CURRENCIES.map(c => `
    <div class="currency-badge">
      <span class="currency-flag">${c.flag}</span>
      <span class="currency-val">${c.symbol}${fmt(Math.round(r.totalCost * c.rate))}</span>
      <span class="currency-code">${c.code} Total</span>
    </div>`).join('');

  // Breakdown
  const extraRow = r.extraShares > 0 && r.calcMode !== 'share'
    ? `<div class="share-row"><span class="slabel">Unfilled shares (donate)</span><span class="sval highlight">${r.extraShares}</span></div>` : '';
  const groupLabel = r.calcMode === 'share' ? 'Group Shares' : 'Total Group';
  
  document.getElementById('shareBreakdown').innerHTML = `
    <h4>🧮 Full Breakdown</h4>
    <div class="share-row"><span class="slabel">Calculation Mode</span><span class="sval highlight">${r.calcMode === 'share' ? 'Buy by Shares (অংশ)' : 'Split Whole Animal (ভাগাভাগি)'}</span></div>
    <div class="share-row"><span class="slabel">Animal</span><span class="sval">${r.animal.emoji} ${r.animal.label}</span></div>
    <div class="share-row"><span class="slabel">Shares / Animal</span><span class="sval">${r.sharesPerAni}</span></div>
    <div class="share-row"><span class="slabel">Participants</span><span class="sval">${r.people}</span></div>
    ${extraRow}
    <div class="share-row"><span class="slabel">Price / Animal</span><span class="sval">৳ ${fmt(r.price)}</span></div>
    <div class="share-row"><span class="slabel">Cost / Share</span><span class="sval">৳ ${fmt(Math.round(r.price / r.sharesPerAni))}</span></div>
    <div class="share-row"><span class="slabel">Weight Source</span><span class="sval" style="font-size:.8rem">${r.meatSource}</span></div>
    <div class="share-row"><span class="slabel">${groupLabel} Meat</span><span class="sval highlight">~${r.totalMeatKg} kg</span></div>
    <div class="share-row"><span class="slabel">Meat / Person</span><span class="sval highlight">~${r.meatPerPerson} kg</span></div>
    <div class="share-row"><span class="slabel">⅓ Family</span><span class="sval">~${(r.meatPerPerson/3).toFixed(1)} kg</span></div>
    <div class="share-row"><span class="slabel">⅓ Neighbours</span><span class="sval">~${(r.meatPerPerson/3).toFixed(1)} kg</span></div>
    <div class="share-row"><span class="slabel">⅓ Poor</span><span class="sval">~${(r.meatPerPerson/3).toFixed(1)} kg</span></div>
  `;

  // Names per-person table
  const nb = document.getElementById('namesBreakdown');
  if (r.names && r.names.length > 0) {
    const rows = r.names.map((n, i) => `
      <tr><td><span class="person-num">${i+1}</span>${n}</td>
      <td>৳ ${fmt(Math.round(r.yourCost))}</td>
      <td>~${r.meatPerPerson} kg</td></tr>`).join('');
    nb.innerHTML = `
      <table class="names-table">
        <thead><tr><th>Participant</th><th>Share Cost</th><th>Meat Share</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else { nb.innerHTML = ''; }

  // Subtitle
  document.getElementById('resultSubtitle').textContent =
    `${r.animal.label} • ${r.people} people • Calculated ${r.date}`;

  // Add QR button if not already there
  const actions = document.querySelector('#resultCard .result-actions');
  if (actions && !document.getElementById('qrBtn')) {
    const qrBtn = document.createElement('button');
    qrBtn.id = 'qrBtn';
    qrBtn.className = 'action-btn';
    qrBtn.style.cssText = 'background:rgba(212,168,67,0.1);border:1px solid rgba(212,168,67,0.3);color:var(--gold-light);';
    qrBtn.innerHTML = '📷 QR Code';
    qrBtn.onclick = generateQR;
    actions.appendChild(qrBtn);
  }

  card.style.display = 'block';
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'fadeSlide 0.5s ease both';
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  showToast('✅ Kurbani calculation complete!');
}

function hideResult() {
  document.getElementById('resultCard').style.display = 'none';
}

/* ── SHARE ── */
function shareResult() {
  if (!lastResult) return;
  const r = lastResult;
  const label = r.calcMode === 'share' ? 'Group Total' : 'Whole Animal';
  const text = `🕌 My Kurbani Summary 🕌\n`
    + `-------------------------------\n`
    + `Animal: ${r.animal.emoji} ${r.animal.label}\n`
    + `Mode: ${r.calcMode === 'share' ? 'Buy by Shares' : 'Split Whole Animal'}\n`
    + `Animals: ${r.totalAnimals} | Participants: ${r.people}\n`
    + `Cost per Person: ৳ ${fmt(r.yourCost)} | ${label}: ৳ ${fmt(r.totalCost)}\n`
    + `Est. Meat: ~${r.totalMeatKg} kg (~${r.meatPerPerson} kg/person)\n\n`
    + `Calculated with Kurbani Calculator 🕌\nEid Mubarak! بِسْمِ اللَّهِ`;
  if (navigator.share) {
    navigator.share({ title: 'My Kurbani Summary', text }).catch(() => copyText(text));
  } else { copyText(text); }
}
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Summary copied to clipboard!'))
    .catch(() => showToast('⚠️ Could not copy.'));
}

/* ── PRINT ── */
function printResult() {
  if (!lastResult) return;
  const r = lastResult;
  const animalsLabel = r.calcMode === 'share' ? 'Animals Shared' : 'Whole Animals';
  const totalCostLabel = r.calcMode === 'share' ? 'Group Total' : 'Whole Animal(s)';
  
  const nameRows = r.names.length > 0
    ? `<table><thead><tr><th>#</th><th>Name</th><th>Cost per Person</th><th>Meat Share</th></tr></thead><tbody>`
      + r.names.map((n,i) => `<tr><td>${i+1}</td><td>${n}</td><td>৳ ${fmt(r.yourCost)}</td><td>~${r.meatPerPerson} kg</td></tr>`).join('')
      + `</tbody></table>` : '';
  document.getElementById('printArea').innerHTML = `
    <h2>☪ Kurbani Summary – Eid al-Adha 2026</h2>
    <p class="print-subtitle">${r.animal.emoji} ${r.animal.label} | ${r.people} Participants | ${r.date}</p>
    <div class="print-grid">
      <div class="print-box"><div class="print-num">${r.animal.emoji} ${r.totalAnimals}</div><div class="print-lbl">${animalsLabel}</div></div>
      <div class="print-box"><div class="print-num">${r.people}</div><div class="print-lbl">Participants</div></div>
      <div class="print-box"><div class="print-num">৳ ${fmt(r.yourCost)}</div><div class="print-lbl">Cost per Person</div></div>
      <div class="print-box"><div class="print-num">৳ ${fmt(r.totalCost)}</div><div class="print-lbl">${totalCostLabel}</div></div>
    </div>
    <table>
      <thead><tr><th>Detail</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Meat Source</td><td>${r.meatSource}</td></tr>
        <tr><td>Total Meat</td><td>~${r.totalMeatKg} kg</td></tr>
        <tr><td>Meat per Person</td><td>~${r.meatPerPerson} kg</td></tr>
        <tr><td>⅓ Family</td><td>~${(r.meatPerPerson/3).toFixed(1)} kg</td></tr>
        <tr><td>⅓ Neighbours</td><td>~${(r.meatPerPerson/3).toFixed(1)} kg</td></tr>
        <tr><td>⅓ Poor</td><td>~${(r.meatPerPerson/3).toFixed(1)} kg</td></tr>
      </tbody>
    </table>
    ${nameRows}
    <div class="print-dua">بِسْمِ اللَّهِ اللَّهُمَّ تَقَبَّلْ مِنِّي</div>
    <div class="print-footer">Kurbani Calculator | Eid Mubarak 🌙 | Crafted by Jarif Ovi</div>
  `;
  window.print();
}

/* ── HISTORY ── */
function scrollToHistory() {
  const section = document.getElementById('historySection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function saveToHistory(silent = false) {
  if (!lastResult) return;
  const r = lastResult;
  const entry = {
    animal: selectedAnimal,
    emoji: r.animal.emoji,
    label: r.animal.label,
    people: r.people,
    animals: r.totalAnimals,
    totalCost: r.totalCost,
    yourCost: Math.round(r.yourCost),
    date: r.date,
    selectedAnimal: selectedAnimal,
    price: r.price,
    calcMode: r.calcMode,
    weightMode: weightMode,
    yieldPct: yieldPct,
    manualMeatKg: parseFloat(document.getElementById('manualMeatKg').value) || null,
    liveWeightKg: parseFloat(document.getElementById('liveWeightKg').value) || null,
    names: [...r.names]
  };
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  
  // Check if we already have an identical recent entry to avoid duplicate spamming
  const isDuplicate = history.length > 0 && 
    history[0].selectedAnimal === entry.selectedAnimal &&
    history[0].people === entry.people &&
    history[0].price === entry.price &&
    history[0].calcMode === entry.calcMode &&
    history[0].weightMode === entry.weightMode &&
    JSON.stringify(history[0].names) === JSON.stringify(entry.names);
    
  if (isDuplicate) {
    history[0].date = entry.date;
  } else {
    history.unshift(entry);
    if (history.length > 10) history = history.slice(0, 10);
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  if (!silent) {
    showToast('💾 Calculation saved to history!');
  }
}

function loadHistory() { 
  renderHistory(); 
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const list    = document.getElementById('historyList');
  const empty   = document.getElementById('historyEmpty');
  const clearBtn = document.getElementById('clearHistBtn');
  
  if (!history.length) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  if (empty) empty.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'block';
  
  list.innerHTML = history.map((e, idx) => `
    <div class="hist-item" onclick="loadHistoryEntry(${idx})" title="Click to load this calculation">
      <div class="hist-emoji">${e.emoji}</div>
      <div class="hist-info">
        <div class="hist-title">${e.label} × ${e.animals} — ${e.people} people</div>
        <div class="hist-meta">${e.date} · Click to Load</div>
      </div>
      <div class="hist-cost">
        <span class="hist-cost-val">৳ ${fmt(e.totalCost)}</span>
        <span class="hist-cost-btn">Load 🔄</span>
      </div>
    </div>`).join('');
}

function loadHistoryEntry(index) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const entry = history[index];
  if (!entry) return;

  // Restore state variables
  selectedAnimal = entry.selectedAnimal || entry.animal;
  participantCount = entry.people;
  calcMode = entry.calcMode || 'share';
  weightMode = entry.weightMode || 'auto';
  yieldPct = entry.yieldPct || 38;
  participantNames = entry.names || [];

  // Update UI Elements
  // 1. Animal Buttons
  document.querySelectorAll('.animal-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.animal === selectedAnimal);
  });
  
  const step2b = document.getElementById('calcModeStep');
  if (selectedAnimal === 'goat') {
    step2b.style.display = 'none';
  } else {
    step2b.style.display = 'block';
  }

  // 2. Participant Counter
  document.getElementById('participantCount').textContent = participantCount;

  // 3. Calculation Mode Buttons
  setCalcMode(calcMode);

  // 4. Price and presets
  buildPricePresets(selectedAnimal);
  const customPriceInput = document.getElementById('customPrice');
  
  let matchedPreset = false;
  const presets = PRICE_PRESETS[selectedAnimal];
  const presetBtns = document.querySelectorAll('#pricePresets .preset-btn');
  for (let i = 0; i < presets.length; i++) {
    if (presets[i].val === entry.price) {
      if (presetBtns[i]) presetBtns[i].classList.add('active');
      selectedPrice = entry.price;
      customPriceInput.value = '';
      matchedPreset = true;
      break;
    }
  }
  if (!matchedPreset) {
    customPriceInput.value = entry.price;
    selectedPrice = null;
  }

  // 5. Weight Mode
  setWeightMode(weightMode);
  if (weightMode === 'manual') {
    document.getElementById('manualMeatKg').value = entry.manualMeatKg || '';
  } else if (weightMode === 'live') {
    document.getElementById('liveWeightKg').value = entry.liveWeightKg || '';
    document.getElementById('yieldPct').value = yieldPct;
    updateLiveResult();
  }

  // 6. Names
  renderNameTags();

  // 7. Calculate without re-saving as a duplicate
  calculate(true);

  showToast('📜 Loaded calculation from history!');
  
  setTimeout(() => {
    const card = document.getElementById('resultCard');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast('🗑️ History cleared.');
}

/* ── TOAST ── */
let toastTimer = null;
function showToast(msg) {
  let t = document.getElementById('appToast');
  if (!t) { t = document.createElement('div'); t.id = 'appToast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── HELPERS ── */
function fmt(n) { return Number(n).toLocaleString('en-IN'); }

/* ── DUAS TAB SWITCHER ── */
function switchDua(index) {
  document.querySelectorAll('.dua-tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  document.querySelectorAll('.dua-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
}

/* ── PWA: SERVICE WORKER ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

/* ── PWA: INSTALL PROMPT ── */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('installBtn');
  if (btn) btn.style.display = 'flex';
});
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('installBtn');
  if (btn) btn.addEventListener('click', () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => {
      deferredInstallPrompt = null;
      btn.style.display = 'none';
    });
  });
});

/* ── LANGUAGE TOGGLE ── */
let currentLang = localStorage.getItem('kurbani_lang') || 'en';
const LANG = {
  en: {
    calcTitle: 'Kurbani Share Calculator',
    calcSub: 'Calculate animals, shares and total cost',
    step1: 'Select Animal Type',
    step2: 'Number of Participants',
    step3: 'Estimated Price per Animal (BDT ৳)',
    step4: 'Animal Weight / Meat Yield (Optional)',
    step5: 'Participant Names',
    calcBtn: 'Calculate Kurbani',
    badge: 'Eid Mubarak 🌙',
  },
  bn: {
    calcTitle: 'কোরবানি ক্যালকুলেটর',
    calcSub: 'পশু, অংশ ও মোট খরচ হিসাব করুন',
    step1: 'পশুর ধরন নির্বাচন করুন',
    step2: 'অংশগ্রহণকারীর সংখ্যা',
    step3: 'পশুর আনুমানিক মূল্য (BDT ৳)',
    step4: 'পশুর ওজন / মাংসের পরিমাণ (ঐচ্ছিক)',
    step5: 'অংশগ্রহণকারীদের নাম',
    calcBtn: 'কোরবানি হিসাব করুন',
    badge: 'ঈদ মোবারক 🌙',
  }
};
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'bn' : 'en';
  localStorage.setItem('kurbani_lang', currentLang);
  const icon = document.getElementById('langToggleIcon');
  if (icon) icon.textContent = currentLang === 'en' ? 'বাং' : 'EN';
  applyLanguage();
  showToast(currentLang === 'bn' ? '🇧🇩 বাংলা সক্রিয়' : '🇬🇧 English activated');
}
function applyLanguage() {
  const L = LANG[currentLang];
  const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const setQ = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  setQ('.calc-card .card-header h2', L.calcTitle);
  setQ('.calc-card .card-header p', L.calcSub);
  const calcBtn = document.getElementById('calcBtn');
  if (calcBtn) calcBtn.textContent = '✦ ' + L.calcBtn + ' ✦';
  const badge = document.querySelector('.header-badge span:last-child');
  if (badge) badge.textContent = L.badge;
  // Apply lang icon
  const icon = document.getElementById('langToggleIcon');
  if (icon) icon.textContent = currentLang === 'en' ? 'বাং' : 'EN';
}

/* ── ANIMATED NUMBER COUNTER ── */
function animateValue(el, from, to, duration = 700) {
  if (!el) return;
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ── ZAKAT CALCULATOR ── */
function calcZakat() {
  const cash     = +( document.getElementById('zakatCash')?.value     || 0);
  const gold     = +( document.getElementById('zakatGold')?.value     || 0);
  const business = +( document.getElementById('zakatBusiness')?.value || 0);
  const debts    = +( document.getElementById('zakatDebts')?.value    || 0);
  const total = cash + gold + business + debts;
  const nisab = SILVER_NISAB_BDT;
  const due   = total >= nisab ? +(total * 0.025).toFixed(0) : 0;

  const resultBox = document.getElementById('zakatResult');
  if (!resultBox) return;
  resultBox.style.display = 'block';

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('zakatTotal',  '৳ ' + fmt(total));
  setEl('zakatNisab',  '৳ ' + fmt(nisab));
  setEl('zakatDue',    '৳ ' + fmt(due));

  const eligRow = document.getElementById('zakatEligRow');
  const eligStat = document.getElementById('zakatStatus');
  if (eligRow && eligStat) {
    if (total > 0) {
      eligRow.style.display = 'flex';
      eligStat.textContent = total >= nisab ? '✅ Zakat is obligatory' : '❌ Below Nisab – not yet obligatory';
    } else {
      eligRow.style.display = 'none';
    }
  }
}

/* ── KURBANI CHECKLIST ── */
const CHECKLIST_TASKS = [
  'Check Nisab eligibility (Zakat threshold)',
  'Choose your animal type (Cow / Goat / Camel)',
  'Find a reliable animal seller or farm',
  'Agree on price and book the animal',
  'Arrange for a certified butcher (কসাই)',
  'Confirm the sacrifice date (Eid Day)',
  'Distribute meat: ⅓ family · ⅓ neighbours · ⅓ poor',
  'Make Dua and offer Kurbani with intention (নিয়্যত)',
];
const CHECKLIST_KEY = 'kurbani_checklist_2026';

function initChecklist() {
  const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
  const container = document.getElementById('checklistItems');
  if (!container) return;
  container.innerHTML = '';
  CHECKLIST_TASKS.forEach((task, i) => {
    const done = saved.includes(i);
    const item = document.createElement('label');
    item.className = 'checklist-item' + (done ? ' done' : '');
    item.innerHTML = `
      <input type="checkbox" ${done ? 'checked' : ''} onchange="toggleCheck(${i}, this)" />
      <span class="checklist-icon">${done ? '✅' : '⬜'}</span>
      <span class="checklist-text">${task}</span>
    `;
    container.appendChild(item);
  });
  updateChecklistProgress(saved);
}

function toggleCheck(index, checkbox) {
  let saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
  if (checkbox.checked) {
    if (!saved.includes(index)) saved.push(index);
  } else {
    saved = saved.filter(i => i !== index);
  }
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(saved));
  const items = document.querySelectorAll('.checklist-item');
  if (items[index]) {
    items[index].classList.toggle('done', checkbox.checked);
    const icon = items[index].querySelector('.checklist-icon');
    if (icon) icon.textContent = checkbox.checked ? '✅' : '⬜';
  }
  updateChecklistProgress(saved);
}

function updateChecklistProgress(saved) {
  const done  = saved.length;
  const total = CHECKLIST_TASKS.length;
  const pct   = Math.round((done / total) * 100);
  const label = document.getElementById('checklistProgressLabel');
  const bar   = document.getElementById('checklistBarFill');
  if (label) label.textContent = `${done} of ${total} tasks completed`;
  if (bar) bar.style.width = pct + '%';
}

function resetChecklist() {
  localStorage.removeItem(CHECKLIST_KEY);
  initChecklist();
  showToast('✅ Checklist reset!');
}

/* ── EID GREETING CARD (Canvas) ── */
function generateCard() {
  const from   = (document.getElementById('greetFrom')?.value.trim() || 'You');
  const to     = (document.getElementById('greetTo')?.value.trim()   || 'Family & Friends');
  const canvas = document.getElementById('greetingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set high-resolution dimensions (2x standard size for crisp retina displays)
  const W = 1200, H = 680;
  canvas.width  = W;
  canvas.height = H;

  // 1. Premium Royal Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#02180f'); // Ultra dark emerald
  grad.addColorStop(0.4, '#062d1c'); // Deep rich green
  grad.addColorStop(1, '#1b0e00'); // Warm golden amber/chocolate tint
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Helper function for adding subtle glow
  const enableGlow = (color, blur) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  };
  const disableGlow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  // 2. Sparking Stars in Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 45; i++) {
    const starX = Math.random() * W;
    const starY = Math.random() * (H - 120);
    const starSize = Math.random() * 2 + 1;
    ctx.fillRect(starX, starY, starSize, starSize);
  }

  // 3. Ornate Double Gold Framing
  // Outer frame
  ctx.strokeStyle = '#d4a843';
  ctx.lineWidth   = 6;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Inner frame with corner accents
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.4)';
  ctx.lineWidth   = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Ornate corners
  const drawCornerAccent = (x, y, dx, dy) => {
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 30);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 30, y);
    ctx.stroke();
  };
  drawCornerAccent(36, 36, 1, 1);
  drawCornerAccent(W - 36, 36, -1, 1);
  drawCornerAccent(36, H - 36, 1, -1);
  drawCornerAccent(W - 36, H - 36, -1, -1);

  // 4. Glowing Islamic Mosque Arch/Dome outline in center-background
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 250, H - 36);
  ctx.lineTo(W / 2 - 250, H - 250);
  ctx.quadraticCurveTo(W / 2 - 250, H - 480, W / 2 - 120, H - 520);
  ctx.quadraticCurveTo(W / 2, H - 570, W / 2, H - 580); // Pointy tip of dome
  ctx.quadraticCurveTo(W / 2, H - 570, W / 2 + 120, H - 520);
  ctx.quadraticCurveTo(W / 2 + 250, H - 480, W / 2 + 250, H - 250);
  ctx.lineTo(W / 2 + 250, H - 36);
  ctx.stroke();

  // 5. Draw Hanging Mosque Lanterns (Fanoos)
  const drawLantern = (x, length) => {
    // String/Chain
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, length);
    ctx.stroke();

    // Lantern Cap
    ctx.fillStyle = '#b88d2d';
    ctx.beginPath();
    ctx.moveTo(x - 20, length);
    ctx.lineTo(x + 20, length);
    ctx.lineTo(x + 10, length + 15);
    ctx.lineTo(x - 10, length + 15);
    ctx.closePath();
    ctx.fill();

    // Lantern Body
    enableGlow('#f0c060', 15);
    ctx.fillStyle = 'rgba(240, 192, 96, 0.85)';
    ctx.beginPath();
    ctx.moveTo(x - 10, length + 15);
    ctx.lineTo(x + 10, length + 15);
    ctx.lineTo(x + 18, length + 50);
    ctx.lineTo(x + 10, length + 65);
    ctx.lineTo(x - 10, length + 65);
    ctx.lineTo(x - 18, length + 50);
    ctx.closePath();
    ctx.fill();
    disableGlow();

    // Ornate glass lines
    ctx.strokeStyle = '#6e5113';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, length + 15);
    ctx.lineTo(x, length + 65);
    ctx.moveTo(x - 10, length + 15);
    ctx.lineTo(x - 10, length + 65);
    ctx.moveTo(x + 10, length + 15);
    ctx.lineTo(x + 10, length + 65);
    ctx.stroke();

    // Lantern Bottom Ring
    ctx.fillStyle = '#b88d2d';
    ctx.fillRect(x - 8, length + 65, 16, 6);

    // Mini hanging tassel
    ctx.strokeStyle = '#d4a843';
    ctx.beginPath();
    ctx.moveTo(x, length + 71);
    ctx.lineTo(x, length + 82);
    ctx.stroke();
  };
  drawLantern(120, 120);
  drawLantern(W - 120, 120);
  drawLantern(220, 80);
  drawLantern(W - 220, 80);

  // 6. Huge Glowing Crescent Moon in the Center
  enableGlow('#f0c060', 25);
  ctx.fillStyle = '#f0c060';
  ctx.beginPath();
  // Outer circle arc
  ctx.arc(W / 2, 170, 75, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // Mask crescent inner circle to get realistic crescent moon
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(W / 2 + 25, 155, 75, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; // Reset operation
  disableGlow();

  // 7. Small star nestled inside the crescent
  enableGlow('#ffffff', 10);
  ctx.fillStyle = '#ffffff';
  const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let sx = cx;
    let sy = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      sx = cx + Math.cos(rot) * outerRadius;
      sy = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(sx, sy);
      rot += step;

      sx = cx + Math.cos(rot) * innerRadius;
      sy = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(sx, sy);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };
  drawStar(W / 2 - 20, 150, 5, 14, 6);
  disableGlow();

  // 8. Elegant Card Typography
  // Arabic Text: Eid Mubarak
  ctx.font = 'normal 32px Amiri, serif';
  ctx.textAlign = 'center';
  enableGlow('#d4a843', 8);
  ctx.fillStyle = 'rgba(212, 168, 67, 0.9)';
  ctx.fillText('تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ', W / 2, 300); // May Allah accept it from us and from you
  disableGlow();

  // Main Eid Mubarak text with gradient & drop shadow
  ctx.font = 'bold 64px "Inter", sans-serif';
  const titleGrad = ctx.createLinearGradient(W/2 - 250, 0, W/2 + 250, 0);
  titleGrad.addColorStop(0, '#ffe596'); // Brilliant gold
  titleGrad.addColorStop(0.5, '#d4a843'); // Classic gold
  titleGrad.addColorStop(1, '#82bca0'); // Rich mint
  
  // Text shadow for premium depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  
  ctx.fillStyle = titleGrad;
  ctx.fillText('EID MUBARAK', W / 2, 385);
  disableGlow(); // Clears offsets as well

  // English Tagline
  ctx.font = '500 22px "Inter", sans-serif';
  ctx.fillStyle = '#8aab97';
  ctx.fillText('EID AL-ADHA 2026', W / 2, 430);

  // Subtle separator line
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 460);
  ctx.lineTo(W / 2 + 150, 460);
  ctx.stroke();

  // To Field
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`To: ${to}`, W / 2, 510);

  // From Field
  ctx.font = 'italic 20px "Inter", sans-serif';
  ctx.fillStyle = '#ffe596';
  ctx.fillText(`With prayers from: ${from}`, W / 2, 545);

  // Closing barakah text
  ctx.font = 'normal 17px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('May this blessed occasion bring peace, joy, and endless barakah to your family. 🤲', W / 2, 595);

  // Branding watermark
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(212, 168, 67, 0.4)';
  ctx.fillText('kurbani-calculator • built for the ummah', W / 2, 640);

  // Reveal UI Elements
  canvas.style.display = 'block';
  const actions = document.getElementById('greetingActions');
  if (actions) actions.style.display = 'flex';
  showToast('🎉 High-Resolution Eid card generated!');
}

function downloadCard() {
  const canvas = document.getElementById('greetingCanvas');
  if (!canvas) return;
  const link    = document.createElement('a');
  link.download = 'eid-mubarak-card.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
  showToast('⬇️ Card downloaded!');
}

async function shareGreetingCard() {
  const canvas = document.getElementById('greetingCanvas');
  if (!canvas) return;
  canvas.toBlob(async (blob) => {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'eid-card.png', { type: 'image/png' })] })) {
      await navigator.share({
        title: 'Eid Mubarak! 🌙',
        text:  'Wishing you a blessed Eid al-Adha!',
        files: [new File([blob], 'eid-card.png', { type: 'image/png' })],
      }).catch(() => downloadCard());
    } else {
      downloadCard();
    }
  });
}

/* ── QR CODE ── */
function generateQR() {
  const qrEl = document.getElementById('qrCodeDisplay');
  const qrSec = document.getElementById('qrSection');
  if (!qrEl || !qrSec) return;
  qrEl.innerHTML = '';
  qrSec.style.display = 'block';
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrEl, {
      text:   'https://jarifovi.github.io/kurbani-calculator/',
      width:  160,
      height: 160,
      colorDark:  '#050d0a',
      colorLight: '#ffffff',
    });
  }
  qrSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


/* ── INIT CHECKLIST ON LOAD ── */
document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  applyLanguage();
  // Show QR section with a generate button in results
  const resultActions = document.querySelector('#resultCard .result-actions');
});
