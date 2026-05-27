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

  // Grid
  document.getElementById('resultGrid').innerHTML = `
    <div class="result-item"><div class="result-num">${r.animal.emoji} ${r.totalAnimals}</div><div class="result-label">${animalsLabel}</div></div>
    <div class="result-item"><div class="result-num">${r.people}</div><div class="result-label">Participants</div></div>
    <div class="result-item"><div class="result-num">৳ ${fmt(r.yourCost)}</div><div class="result-label">Cost per Person</div></div>
    <div class="result-item"><div class="result-num">৳ ${fmt(r.totalCost)}</div><div class="result-label">${totalCostLabel}</div></div>
  `;

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
