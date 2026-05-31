/* ============================
   SPUNTI — app.js
   Vanilla JS, no dependencies
   ============================ */

'use strict';

// ---- CONSTANTS ----

const STATUS_LABELS = {
  inbox:      'Inbox',
  attivo:     'Attivo',
  non_adesso: 'Non adesso',
  maturato:   'Maturato',
  archiviato: 'Archiviato'
};

const STATUS_EMOJI = {
  inbox:      '📥',
  attivo:     '🌱',
  non_adesso: '⏸',
  maturato:   '✨',
  archiviato: '📦'
};

const TYPE_LABELS = {
  vedere:              'Vedere',
  leggere:             'Leggere',
  fare:                'Fare',
  studiare:            'Studiare',
  creare:              'Creare',
  comprare_provare:    'Comprare/Provare',
  clinico_professionale: 'Clinico/Professionale',
  vita_personale:      'Vita personale',
  rilassamento:        'Rilassamento',
  altro:               'Altro'
};

const TYPE_EMOJI = {
  vedere:              '🎬',
  leggere:             '📚',
  fare:                '🛠',
  studiare:            '🔬',
  creare:              '🎨',
  comprare_provare:    '🛒',
  clinico_professionale: '🩺',
  vita_personale:      '🌿',
  rilassamento:        '☕',
  altro:               '💡'
};

const ENERGY_LABELS = {
  bassa: 'Bassa',
  media: 'Media',
  alta:  'Alta'
};

const AI_PROMPT = `Agisci come analista di pattern personali, coach strategico e assistente di sviluppo progettuale. Analizza questo diario di spunti. Non limitarti a riassumere. Individua temi ricorrenti, cluster di interessi, curiosità vive, accumulo dispersivo, aree energizzanti, aree drenanti, prospettive mature, spunti da attivare, spunti da incubare e spunti da archiviare. Proponi una strategia di selezione per i prossimi 30 giorni.`;

// ---- STORAGE ----

const DB = {
  KEY: 'spunti_data',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }
};

// ---- STATE ----

let state = {
  items: DB.load(),
  currentScreen: 'home',
  editingId: null,
  filters: {
    search: '',
    status: 'all',
    type: 'all'
  }
};

// ---- UTILS ----

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now() {
  return new Date().toISOString();
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseTags(str) {
  if (!str) return [];
  return str.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function joinTags(arr) {
  return (arr || []).join(', ');
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function showToast(msg, duration = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ---- NAVIGATION ----

function navigate(screen) {
  state.currentScreen = screen;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const screenEl = document.getElementById('screen-' + screen);
  if (screenEl) screenEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-screen="${screen}"]`);
  if (navBtn) navBtn.classList.add('active');

  // render on show
  if (screen === 'home')   renderHome();
  if (screen === 'lista')  renderLista();
  if (screen === 'trend')  renderTrend();
  if (screen === 'export') renderExport();
}

// ---- CRUD ----

function createSpunto(data) {
  const item = {
    id: uid(),
    title: data.title.trim(),
    type: data.type || 'altro',
    status: data.status || 'inbox',
    energy: data.energy || 'media',
    value: data.value || '',
    why: data.why || '',
    note: data.note || '',
    nextAction: data.nextAction || '',
    link: data.link || '',
    tags: parseTags(data.tags),
    createdAt: now(),
    updatedAt: now(),
    lastReviewedAt: null,
    reviewCount: 0
  };
  state.items.unshift(item);
  DB.save(state.items);
  return item;
}

function updateSpunto(id, data) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx === -1) return;
  const old = state.items[idx];
  state.items[idx] = {
    ...old,
    title: data.title.trim(),
    type: data.type || old.type,
    status: data.status || old.status,
    energy: data.energy || old.energy,
    value: data.value !== undefined ? data.value : old.value,
    why: data.why !== undefined ? data.why : old.why,
    note: data.note !== undefined ? data.note : old.note,
    nextAction: data.nextAction !== undefined ? data.nextAction : old.nextAction,
    link: data.link !== undefined ? data.link : old.link,
    tags: parseTags(data.tags),
    updatedAt: now()
  };
  DB.save(state.items);
}

function deleteSpunto(id) {
  state.items = state.items.filter(i => i.id !== id);
  DB.save(state.items);
}

function setStatus(id, status) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx === -1) return;
  state.items[idx].status = status;
  state.items[idx].updatedAt = now();
  state.items[idx].lastReviewedAt = now();
  state.items[idx].reviewCount = (state.items[idx].reviewCount || 0) + 1;
  DB.save(state.items);
}

// ---- RENDER HOME ----

function renderHome() {
  const items = state.items;
  const counts = {
    total:      items.length,
    inbox:      items.filter(i => i.status === 'inbox').length,
    attivo:     items.filter(i => i.status === 'attivo').length,
    non_adesso: items.filter(i => i.status === 'non_adesso').length,
    maturato:   items.filter(i => i.status === 'maturato').length,
    archiviato: items.filter(i => i.status === 'archiviato').length
  };

  document.getElementById('stat-total').textContent     = counts.total;
  document.getElementById('stat-inbox').textContent     = counts.inbox;
  document.getElementById('stat-attivo').textContent    = counts.attivo;
  document.getElementById('stat-non_adesso').textContent = counts.non_adesso;
  document.getElementById('stat-maturato').textContent  = counts.maturato;

  const actives = items.filter(i => i.status === 'attivo');
  const container = document.getElementById('home-actives');

  if (actives.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>Nessuno spunto attivo</h3>
        <p>Aggiungi il tuo primo spunto o attiva uno dalla lista.</p>
      </div>`;
    return;
  }

  container.innerHTML = actives.slice(0, 5).map(item => renderSpuntoCard(item, true)).join('');
}

// ---- RENDER LISTA ----

function renderLista() {
  const { search, status, type } = state.filters;
  let items = state.items;

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      (i.why || '').toLowerCase().includes(q) ||
      (i.note || '').toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.includes(q))
    );
  }

  if (status !== 'all') items = items.filter(i => i.status === status);
  if (type   !== 'all') items = items.filter(i => i.type === type);

  const container = document.getElementById('lista-items');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Nessun risultato</h3>
        <p>Prova a modificare i filtri o cerca qualcosa di diverso.</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => renderSpuntoCard(item, false)).join('');
}

// ---- SPUNTO CARD HTML ----

function renderSpuntoCard(item, compact) {
  const statusBadge = `<span class="badge badge-status-${item.status}">${STATUS_EMOJI[item.status]} ${STATUS_LABELS[item.status]}</span>`;
  const typeBadge   = `<span class="badge badge-type">${TYPE_EMOJI[item.type] || ''} ${TYPE_LABELS[item.type] || item.type}</span>`;
  const energyBadge = `<span class="badge badge-energy-${item.energy}">${ENERGY_LABELS[item.energy]}</span>`;

  const tags = (item.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('');

  const why = item.why
    ? `<p class="spunto-card-why">${esc(item.why)}</p>`
    : '';

  const next = item.nextAction
    ? `<p class="spunto-card-next">${esc(item.nextAction)}</p>`
    : '';

  const actions = compact ? buildQuickActions(item, true) : buildQuickActions(item, false);

  return `
  <div class="card spunto-card" data-id="${item.id}">
    <div class="spunto-card-header">
      <span class="spunto-card-title">${esc(item.title)}</span>
    </div>
    <div class="spunto-card-meta">
      ${statusBadge}${typeBadge}${energyBadge}
    </div>
    ${why}${next}
    ${tags ? `<div class="spunto-card-tags">${tags}</div>` : ''}
    <div class="spunto-card-actions">${actions}</div>
  </div>`;
}

function buildQuickActions(item, compact) {
  const s = item.status;
  const id = item.id;
  const btns = [];

  if (s !== 'attivo')     btns.push(`<button class="btn btn-sm btn-secondary" onclick="quickStatus('${id}','attivo')">🌱 Attiva</button>`);
  if (s !== 'non_adesso') btns.push(`<button class="btn btn-sm btn-ghost" onclick="quickStatus('${id}','non_adesso')">⏸ Non adesso</button>`);
  if (s !== 'maturato')   btns.push(`<button class="btn btn-sm btn-secondary" onclick="quickStatus('${id}','maturato')">✨ Matura</button>`);
  if (s !== 'archiviato') btns.push(`<button class="btn btn-sm btn-ghost" onclick="quickStatus('${id}','archiviato')">📦 Archivia</button>`);

  if (!compact) {
    btns.push(`<button class="btn btn-sm btn-secondary" onclick="openEdit('${id}')">✏️ Modifica</button>`);
    btns.push(`<button class="btn btn-sm btn-danger" onclick="confirmDelete('${id}')">🗑 Elimina</button>`);
  }

  return btns.join('');
}

// ---- QUICK STATUS ----

window.quickStatus = function(id, status) {
  setStatus(id, status);
  showToast(`Spunto → ${STATUS_LABELS[status]}`);
  if (state.currentScreen === 'home')  renderHome();
  if (state.currentScreen === 'lista') renderLista();
};

// ---- OPEN EDIT ----

window.openEdit = function(id) {
  state.editingId = id;
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  fillForm(item);
  navigate('form');
};

// ---- DELETE ----

window.confirmDelete = function(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  document.getElementById('confirm-title').textContent = item.title;
  document.getElementById('modal-confirm').classList.add('open');
  document.getElementById('btn-confirm-delete').onclick = () => {
    deleteSpunto(id);
    document.getElementById('modal-confirm').classList.remove('open');
    showToast('Spunto eliminato.');
    if (state.currentScreen === 'home')  renderHome();
    if (state.currentScreen === 'lista') renderLista();
  };
};

// ---- FORM ----

function openNewForm() {
  state.editingId = null;
  clearForm();
  navigate('form');
}

function fillForm(item) {
  document.getElementById('f-title').value      = item.title || '';
  document.getElementById('f-why').value        = item.why || '';
  document.getElementById('f-note').value       = item.note || '';
  document.getElementById('f-nextAction').value = item.nextAction || '';
  document.getElementById('f-link').value       = item.link || '';
  document.getElementById('f-tags').value       = joinTags(item.tags);

  setRadio('f-type',   item.type   || 'altro');
  setRadio('f-status', item.status || 'inbox');
  setRadio('f-energy', item.energy || 'media');
}

function clearForm() {
  document.getElementById('f-title').value      = '';
  document.getElementById('f-why').value        = '';
  document.getElementById('f-note').value       = '';
  document.getElementById('f-nextAction').value = '';
  document.getElementById('f-link').value       = '';
  document.getElementById('f-tags').value       = '';
  setRadio('f-type',   'altro');
  setRadio('f-status', 'inbox');
  setRadio('f-energy', 'media');
  document.getElementById('f-title-error').textContent = '';
  document.getElementById('f-title').classList.remove('error');
}

function setRadio(name, value) {
  const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function submitForm() {
  const title = document.getElementById('f-title').value.trim();
  const errEl = document.getElementById('f-title-error');

  if (!title) {
    errEl.textContent = 'Il titolo è obbligatorio.';
    document.getElementById('f-title').classList.add('error');
    document.getElementById('f-title').focus();
    return;
  }
  errEl.textContent = '';
  document.getElementById('f-title').classList.remove('error');

  const data = {
    title,
    type:       getRadio('f-type'),
    status:     getRadio('f-status'),
    energy:     getRadio('f-energy'),
    why:        document.getElementById('f-why').value,
    note:       document.getElementById('f-note').value,
    nextAction: document.getElementById('f-nextAction').value,
    link:       document.getElementById('f-link').value,
    tags:       document.getElementById('f-tags').value
  };

  if (state.editingId) {
    updateSpunto(state.editingId, data);
    showToast('Spunto aggiornato.');
  } else {
    createSpunto(data);
    showToast('Spunto aggiunto!');
  }

  state.editingId = null;
  navigate('lista');
}

// ---- RENDER TREND ----

function renderTrend() {
  const items = state.items;
  const total = items.length;

  function barHTML(count, max, color) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return `<div class="trend-bar-wrap"><div class="trend-bar" style="width:${pct}%;background:${color || 'var(--accent)'}"></div></div>`;
  }

  // By status
  const statusOrder = ['inbox','attivo','non_adesso','maturato','archiviato'];
  const statusColors = {
    inbox: 'var(--status-inbox)',
    attivo: 'var(--status-attivo)',
    non_adesso: 'var(--status-non_adesso)',
    maturato: 'var(--status-maturato)',
    archiviato: 'var(--status-archiviato)'
  };
  const maxStatus = Math.max(...statusOrder.map(s => items.filter(i => i.status === s).length), 1);
  document.getElementById('trend-status').innerHTML = statusOrder.map(s => {
    const c = items.filter(i => i.status === s).length;
    return `<div class="trend-row">
      <span class="trend-label">${STATUS_EMOJI[s]} ${STATUS_LABELS[s]}</span>
      ${barHTML(c, maxStatus, statusColors[s])}
      <span class="trend-count">${c}</span>
    </div>`;
  }).join('');

  // By type
  const typeOrder = Object.keys(TYPE_LABELS);
  const maxType = Math.max(...typeOrder.map(t => items.filter(i => i.type === t).length), 1);
  document.getElementById('trend-type').innerHTML = typeOrder.map(t => {
    const c = items.filter(i => i.type === t).length;
    if (c === 0) return '';
    return `<div class="trend-row">
      <span class="trend-label">${TYPE_EMOJI[t]} ${TYPE_LABELS[t]}</span>
      ${barHTML(c, maxType)}
      <span class="trend-count">${c}</span>
    </div>`;
  }).join('');

  // By energy
  const energyColors = {
    bassa: 'var(--energy-bassa)',
    media: 'var(--energy-media)',
    alta:  'var(--energy-alta)'
  };
  const maxEnergy = Math.max(...['bassa','media','alta'].map(e => items.filter(i => i.energy === e).length), 1);
  document.getElementById('trend-energy').innerHTML = ['bassa','media','alta'].map(e => {
    const c = items.filter(i => i.energy === e).length;
    return `<div class="trend-row">
      <span class="trend-label">${ENERGY_LABELS[e]}</span>
      ${barHTML(c, maxEnergy, energyColors[e])}
      <span class="trend-count">${c}</span>
    </div>`;
  }).join('');

  // Tags
  const tagCount = {};
  items.forEach(i => (i.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const topTags = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0, 20);
  const tagCloud = document.getElementById('trend-tags');
  if (topTags.length === 0) {
    tagCloud.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted)">Nessun tag ancora.</p>';
  } else {
    tagCloud.innerHTML = `<div class="tag-cloud">${topTags.map(([t,c]) =>
      `<span class="tag-cloud-item">#${esc(t)} <strong>${c}</strong></span>`
    ).join('')}</div>`;
  }

  // Last 30 days
  const thirtyAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = items.filter(i => new Date(i.createdAt).getTime() > thirtyAgo).length;
  document.getElementById('trend-recent').textContent = `${recent} spunto${recent !== 1 ? 'i' : ''} aggiunto${recent !== 1 ? 'i' : ''} negli ultimi 30 giorni. Totale: ${total}.`;
}

// ---- EXPORT ----

function renderExport() {
  // Nothing dynamic to render — buttons handle it
}

function buildMarkdown() {
  const items = state.items;
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const counts = {
    inbox:      items.filter(i => i.status === 'inbox').length,
    attivo:     items.filter(i => i.status === 'attivo').length,
    non_adesso: items.filter(i => i.status === 'non_adesso').length,
    maturato:   items.filter(i => i.status === 'maturato').length,
    archiviato: items.filter(i => i.status === 'archiviato').length
  };

  let md = `# Spunti — Export per analisi AI\n\n`;
  md += `**Data export:** ${today}\n`;
  md += `**Totale spunti:** ${items.length}\n\n`;
  md += `## Sintesi quantitativa\n\n`;
  md += `| Stato | N |\n|---|---|\n`;
  md += `| 📥 Inbox | ${counts.inbox} |\n`;
  md += `| 🌱 Attivo | ${counts.attivo} |\n`;
  md += `| ⏸ Non adesso | ${counts.non_adesso} |\n`;
  md += `| ✨ Maturato | ${counts.maturato} |\n`;
  md += `| 📦 Archiviato | ${counts.archiviato} |\n\n`;

  const tagCount = {};
  items.forEach(i => (i.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const topTags = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0, 15);
  if (topTags.length > 0) {
    md += `**Tag più frequenti:** ${topTags.map(([t,c]) => `#${t}(${c})`).join(', ')}\n\n`;
  }

  md += `---\n\n## Prompt per l'analisi AI\n\n> ${AI_PROMPT}\n\n---\n\n`;
  md += `## Lista completa degli spunti\n\n`;

  items.forEach((item, i) => {
    md += `### ${i + 1}. ${item.title}\n\n`;
    md += `- **Tipo:** ${TYPE_LABELS[item.type] || item.type}\n`;
    md += `- **Stato:** ${STATUS_LABELS[item.status] || item.status}\n`;
    md += `- **Energia richiesta:** ${ENERGY_LABELS[item.energy] || item.energy}\n`;
    if (item.why)        md += `- **Perché mi interessa:** ${item.why}\n`;
    if (item.nextAction) md += `- **Prossima azione:** ${item.nextAction}\n`;
    if (item.note)       md += `- **Note:** ${item.note}\n`;
    if (item.link)       md += `- **Link:** ${item.link}\n`;
    if (item.tags && item.tags.length) md += `- **Tag:** ${item.tags.map(t => '#' + t).join(' ')}\n`;
    md += `- **Creato:** ${fmtDate(item.createdAt)}\n`;
    md += `\n`;
  });

  return md;
}

function exportMarkdown() {
  const md = buildMarkdown();
  downloadFile('spunti-export.md', md, 'text/markdown');
  showToast('Markdown esportato.');
}

function copyMarkdown() {
  const md = buildMarkdown();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).then(() => {
      showToast('Copiato negli appunti!');
    }).catch(() => fallbackCopy(md));
  } else {
    fallbackCopy(md);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Copiato negli appunti!');
  } catch {
    showToast('Copia non supportata. Usa Esporta Markdown.');
  }
  document.body.removeChild(ta);
}

function exportJSON() {
  const data = {
    app: 'spunti',
    version: '0.1',
    exportedAt: now(),
    items: state.items
  };
  downloadFile('spunti-backup.json', JSON.stringify(data, null, 2), 'application/json');
  showToast('JSON esportato.');
}

function exportCSV() {
  const headers = ['id','title','type','status','energy','why','note','nextAction','link','tags','createdAt','updatedAt'];
  const rows = state.items.map(i => headers.map(h => {
    let v = h === 'tags' ? (i.tags || []).join('|') : (i[h] || '');
    v = String(v).replace(/"/g, '""');
    if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v}"`;
    return v;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile('spunti-export.csv', csv, 'text/csv');
  showToast('CSV esportato.');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const incoming = Array.isArray(data) ? data : (data.items || []);
      if (!Array.isArray(incoming)) throw new Error('Formato non valido');

      // Merge: add items whose id doesn't already exist
      const existingIds = new Set(state.items.map(i => i.id));
      let added = 0;
      incoming.forEach(item => {
        if (!item.id || !item.title) return;
        if (existingIds.has(item.id)) return;
        state.items.push(item);
        added++;
      });
      DB.save(state.items);
      showToast(`Importati ${added} spunti.`);
      renderExport();
    } catch (err) {
      showToast('Errore: file non valido.');
    }
  };
  reader.readAsText(file);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ---- SEED DATA ----

function seedIfEmpty() {
  if (state.items.length > 0) return;
  const seeds = [
    { title: 'Guardare "Past Lives"', type: 'vedere', status: 'inbox', energy: 'bassa', why: 'Film coreano molto lodato sul tema delle connessioni perdute', tags: 'film,cinema' },
    { title: 'Leggere "Pensieri lenti e veloci" di Kahneman', type: 'leggere', status: 'attivo', energy: 'alta', why: 'Capire meglio i bias cognitivi per il lavoro clinico', nextAction: 'Trovare il libro in biblioteca', tags: 'psicologia,lettura' },
    { title: 'Provare meditazione guidata mattutina', type: 'rilassamento', status: 'non_adesso', energy: 'bassa', why: 'Migliorare la qualità del sonno e ridurre lo stress', tags: 'benessere,routine' }
  ];
  seeds.forEach(s => createSpunto(s));
}

// ---- EVENT SETUP ----

function setupEvents() {
  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.screen));
  });

  // Home: new spunto button
  document.getElementById('btn-new-home').addEventListener('click', openNewForm);

  // Lista: new spunto button
  document.getElementById('btn-new-lista').addEventListener('click', openNewForm);

  // Lista: search
  document.getElementById('lista-search').addEventListener('input', e => {
    state.filters.search = e.target.value;
    renderLista();
  });

  // Lista: status chips
  document.querySelectorAll('.chip[data-filter-status]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter-status]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.status = chip.dataset.filterStatus;
      renderLista();
    });
  });

  // Lista: type chips
  document.querySelectorAll('.chip[data-filter-type]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter-type]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.type = chip.dataset.filterType;
      renderLista();
    });
  });

  // Form: submit
  document.getElementById('btn-form-save').addEventListener('click', submitForm);

  // Form: cancel
  document.getElementById('btn-form-cancel').addEventListener('click', () => {
    state.editingId = null;
    navigate('lista');
  });

  // Form: title enter
  document.getElementById('f-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitForm(); }
  });

  // Export buttons
  document.getElementById('btn-export-md').addEventListener('click', exportMarkdown);
  document.getElementById('btn-copy-md').addEventListener('click', copyMarkdown);
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-import-json').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  // Modal: close on overlay click
  document.getElementById('modal-confirm').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });

  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-confirm').classList.remove('open');
  });
}

// ---- SERVICE WORKER ----

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  setupEvents();
  registerSW();
  navigate('home');
});
