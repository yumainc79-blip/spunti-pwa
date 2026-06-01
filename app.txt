/* Spunti — app.js */
'use strict';

const STATUS_LABELS = { inbox:'Inbox', attivo:'Attivo', non_adesso:'Non adesso', maturato:'Maturato', archiviato:'Archiviato' };
const STATUS_EMOJI  = { inbox:'📥', attivo:'🌱', non_adesso:'⏸', maturato:'✨', archiviato:'📦' };

const TYPE_LABELS = {
  vedere:'Vedere',
  leggere:'Leggere',
  fare:'Fare',
  studiare:'Studiare',
  creare:'Creare',
  idea:'Idea',
  provare:'Provare',
  comprare:'Comprare',
  clinico_professionale:'Professionale',
  vita_personale:'Personale',
  rilassamento:'Relax',
  altro:'Altro'
};

const TYPE_EMOJI = {
  vedere:'🎬',
  leggere:'📚',
  fare:'🛠',
  studiare:'🔬',
  creare:'🎨',
  idea:'💭',
  provare:'🧪',
  comprare:'🛒',
  clinico_professionale:'💼',
  vita_personale:'🌿',
  rilassamento:'☕',
  altro:'💡'
};

const ENERGY_LABELS = { bassa:'Bassa', media:'Media', alta:'Alta' };

const AI_PROMPT = `Agisci come analista di pattern personali, coach strategico e assistente di sviluppo progettuale. Analizza questo diario di spunti. Non limitarti a riassumere. Individua temi ricorrenti, cluster di interessi, curiosità vive, accumulo dispersivo, aree energizzanti, aree drenanti, prospettive mature, spunti da attivare, spunti da incubare e spunti da archiviare. Proponi una strategia di selezione per i prossimi 30 giorni.`;

const DB = {
  KEY: 'spunti_data',
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }
};

let state = {
  items: DB.load(),
  currentScreen: 'home',
  editingId: null,
  filters: { search:'', status:'all', type:'all' }
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now() {
  return new Date().toISOString();
}

function esc(value) {
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function parseTags(str) {
  return (str || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function joinTags(tags) {
  return (tags || []).join(', ');
}

function showToast(message, duration = 2400) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function navigate(screen) {
  state.currentScreen = screen;

  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const screenEl = document.getElementById('screen-' + screen);
  if (screenEl) screenEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-screen="${screen}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (screen === 'home') renderHome();
  if (screen === 'lista') renderLista();
  if (screen === 'trend') renderTrend();
  if (screen === 'export') renderExport();
}

function createSpunto(data) {
  const item = {
    id: uid(),
    title: data.title.trim(),
    type: data.type || 'altro',
    status: data.status || 'inbox',
    energy: data.energy || 'media',
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
  const index = state.items.findIndex(i => i.id === id);
  if (index === -1) return;

  const old = state.items[index];

  state.items[index] = {
    ...old,
    title: data.title.trim(),
    type: data.type || old.type,
    status: data.status || old.status,
    energy: data.energy || old.energy,
    why: data.why ?? old.why,
    note: data.note ?? old.note,
    nextAction: data.nextAction ?? old.nextAction,
    link: data.link ?? old.link,
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
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  item.status = status;
  item.updatedAt = now();
  item.lastReviewedAt = now();
  item.reviewCount = (item.reviewCount || 0) + 1;

  DB.save(state.items);
}

function renderHome() {
  const items = state.items;

  const counts = {
    total: items.length,
    inbox: items.filter(i => i.status === 'inbox').length,
    attivo: items.filter(i => i.status === 'attivo').length,
    non_adesso: items.filter(i => i.status === 'non_adesso').length,
    maturato: items.filter(i => i.status === 'maturato').length
  };

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('stat-total', counts.total);
  setText('stat-inbox', counts.inbox);
  setText('stat-attivo', counts.attivo);
  setText('stat-non_adesso', counts.non_adesso);
  setText('stat-maturato', counts.maturato);

  const container = document.getElementById('home-actives');
  if (!container) return;

  const active = items.filter(i => i.status === 'attivo');

  if (active.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <h3>${items.length === 0 ? 'Tutto da iniziare' : 'Nessuno spunto attivo'}</h3>
        <p>${items.length === 0 ? 'Nessuno spunto ancora. Cattura il primo quando qualcosa ti interessa.' : 'Nessuno spunto attivo. Attivane uno dalla lista quando vuoi concentrarti.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = active.slice(0, 5).map(item => renderSpuntoCard(item, true)).join('');
}

function filteredItems() {
  let items = [...state.items];
  const { search, status, type } = state.filters;

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.why || '').toLowerCase().includes(q) ||
      (i.note || '').toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.includes(q))
    );
  }

  if (status !== 'all') items = items.filter(i => i.status === status);
  if (type !== 'all') items = items.filter(i => i.type === type);

  return items;
}

function renderLista() {
  const container = document.getElementById('lista-items');
  if (!container) return;

  const items = filteredItems();

  if (items.length === 0) {
    const noneAtAll = state.items.length === 0;
    container.innerHTML = noneAtAll
      ? `<div class="empty-state"><div class="empty-icon">🌱</div><h3>Tutto da iniziare</h3><p>Nessuno spunto ancora. Cattura il primo quando qualcosa ti interessa.</p></div>`
      : `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nessun risultato</h3><p>Prova a modificare i filtri o cerca qualcosa di diverso.</p></div>`;
    return;
  }

  container.innerHTML = items.map(item => renderSpuntoCard(item, false)).join('');
}

function renderSpuntoCard(item, compact) {
  const statusBadge = `<span class="badge badge-status-${item.status}">${STATUS_EMOJI[item.status] || ''} ${STATUS_LABELS[item.status] || item.status}</span>`;
  const typeBadge = `<span class="badge badge-type">${TYPE_EMOJI[item.type] || ''} ${TYPE_LABELS[item.type] || item.type}</span>`;
  const energyBadge = `<span class="badge badge-energy-${item.energy}">${ENERGY_LABELS[item.energy] || item.energy}</span>`;

  const tags = (item.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('');
  const why = item.why ? `<p class="spunto-card-why">${esc(item.why)}</p>` : '';
  const next = item.nextAction ? `<p class="spunto-card-next">${esc(item.nextAction)}</p>` : '';

  return `
    <div class="card spunto-card" data-id="${item.id}">
      <div class="spunto-card-header">
        <span class="spunto-card-title">${esc(item.title)}</span>
      </div>
      <div class="spunto-card-meta">${statusBadge}${typeBadge}${energyBadge}</div>
      ${why}
      ${next}
      ${tags ? `<div class="spunto-card-tags">${tags}</div>` : ''}
      <div class="spunto-card-actions">${buildQuickActions(item, compact)}</div>
    </div>`;
}

function buildQuickActions(item, compact) {
  const id = item.id;
  const status = item.status;
  const buttons = [];

  if (status !== 'attivo') buttons.push(`<button class="btn btn-sm btn-secondary" onclick="quickStatus('${id}','attivo')">🌱 Attiva</button>`);
  if (status !== 'non_adesso') buttons.push(`<button class="btn btn-sm btn-ghost" onclick="quickStatus('${id}','non_adesso')">⏸ Non adesso</button>`);
  if (status !== 'maturato') buttons.push(`<button class="btn btn-sm btn-secondary" onclick="quickStatus('${id}','maturato')">✨ Segna maturato</button>`);
  if (status !== 'archiviato') buttons.push(`<button class="btn btn-sm btn-ghost" onclick="quickStatus('${id}','archiviato')">📦 Archivia</button>`);

  if (!compact) {
    buttons.push(`<button class="btn btn-sm btn-secondary" onclick="openEdit('${id}')">✏️ Modifica</button>`);
    buttons.push(`<button class="btn btn-sm btn-danger" onclick="confirmDelete('${id}')">🗑 Elimina</button>`);
  }

  return buttons.join('');
}

window.quickStatus = function(id, status) {
  setStatus(id, status);
  showToast(`Spunto → ${STATUS_LABELS[status]}`);
  if (state.currentScreen === 'home') renderHome();
  if (state.currentScreen === 'lista') renderLista();
  if (state.currentScreen === 'trend') renderTrend();
};

window.openEdit = function(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  state.editingId = id;
  fillForm(item);
  navigate('form');
};

window.confirmDelete = function(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  document.getElementById('confirm-title').textContent = item.title;
  document.getElementById('modal-confirm').classList.add('open');

  document.getElementById('btn-confirm-delete').onclick = () => {
    deleteSpunto(id);
    document.getElementById('modal-confirm').classList.remove('open');
    showToast('Spunto eliminato.');
    if (state.currentScreen === 'home') renderHome();
    if (state.currentScreen === 'lista') renderLista();
    if (state.currentScreen === 'trend') renderTrend();
  };
};

function openNewForm() {
  state.editingId = null;
  clearForm();
  navigate('form');
}

function fillForm(item) {
  document.getElementById('f-title').value = item.title || '';
  document.getElementById('f-why').value = item.why || '';
  document.getElementById('f-note').value = item.note || '';
  document.getElementById('f-nextAction').value = item.nextAction || '';
  document.getElementById('f-link').value = item.link || '';
  document.getElementById('f-tags').value = joinTags(item.tags);

  setRadio('f-type', item.type || 'altro');
  setRadio('f-status', item.status || 'inbox');
  setRadio('f-energy', item.energy || 'media');
}

function clearForm() {
  document.getElementById('f-title').value = '';
  document.getElementById('f-why').value = '';
  document.getElementById('f-note').value = '';
  document.getElementById('f-nextAction').value = '';
  document.getElementById('f-link').value = '';
  document.getElementById('f-tags').value = '';

  setRadio('f-type', 'altro');
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
  const titleEl = document.getElementById('f-title');
  const title = titleEl.value.trim();
  const errorEl = document.getElementById('f-title-error');

  if (!title) {
    errorEl.textContent = 'Il titolo è obbligatorio.';
    titleEl.classList.add('error');
    titleEl.focus();
    return;
  }

  errorEl.textContent = '';
  titleEl.classList.remove('error');

  const data = {
    title,
    type: getRadio('f-type'),
    status: getRadio('f-status'),
    energy: getRadio('f-energy'),
    why: document.getElementById('f-why').value,
    note: document.getElementById('f-note').value,
    nextAction: document.getElementById('f-nextAction').value,
    link: document.getElementById('f-link').value,
    tags: document.getElementById('f-tags').value
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

function renderTrend() {
  const items = state.items;
  const total = items.length;

  function barHTML(count, max, color) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return `<div class="trend-bar-wrap"><div class="trend-bar" style="width:${pct}%;background:${color || 'var(--accent)'}"></div></div>`;
  }

  const statusOrder = ['inbox', 'attivo', 'non_adesso', 'maturato', 'archiviato'];
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
    return `<div class="trend-row"><span class="trend-label">${STATUS_EMOJI[s]} ${STATUS_LABELS[s]}</span>${barHTML(c, maxStatus, statusColors[s])}<span class="trend-count">${c}</span></div>`;
  }).join('');

  const typeOrder = Object.keys(TYPE_LABELS);
  const maxType = Math.max(...typeOrder.map(t => items.filter(i => i.type === t).length), 1);

  document.getElementById('trend-type').innerHTML = typeOrder.map(t => {
    const c = items.filter(i => i.type === t).length;
    if (c === 0) return '';
    return `<div class="trend-row"><span class="trend-label">${TYPE_EMOJI[t]} ${TYPE_LABELS[t]}</span>${barHTML(c, maxType)}<span class="trend-count">${c}</span></div>`;
  }).join('');

  const energyOrder = ['bassa', 'media', 'alta'];
  const energyColors = { bassa:'var(--energy-bassa)', media:'var(--energy-media)', alta:'var(--energy-alta)' };
  const maxEnergy = Math.max(...energyOrder.map(e => items.filter(i => i.energy === e).length), 1);

  document.getElementById('trend-energy').innerHTML = energyOrder.map(e => {
    const c = items.filter(i => i.energy === e).length;
    return `<div class="trend-row"><span class="trend-label">${ENERGY_LABELS[e]}</span>${barHTML(c, maxEnergy, energyColors[e])}<span class="trend-count">${c}</span></div>`;
  }).join('');

  const tagCount = {};
  items.forEach(item => (item.tags || []).forEach(tag => tagCount[tag] = (tagCount[tag] || 0) + 1));

  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const tagContainer = document.getElementById('trend-tags');

  if (topTags.length === 0) {
    tagContainer.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted)">Nessun tag ancora.</p>';
  } else {
    tagContainer.innerHTML = `<div class="tag-cloud">${topTags.map(([t, c]) => `<span class="tag-cloud-item">#${esc(t)} <strong>${c}</strong></span>`).join('')}</div>`;
  }

  const thirtyAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = items.filter(i => new Date(i.createdAt).getTime() > thirtyAgo).length;

  document.getElementById('trend-recent').textContent =
    `${recent} spunto${recent !== 1 ? 'i' : ''} aggiunto${recent !== 1 ? 'i' : ''} negli ultimi 30 giorni. Totale: ${total}.`;
}

function renderExport() {}

function buildMarkdown() {
  const items = state.items;
  const today = new Date().toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' });

  const counts = {
    inbox: items.filter(i => i.status === 'inbox').length,
    attivo: items.filter(i => i.status === 'attivo').length,
    non_adesso: items.filter(i => i.status === 'non_adesso').length,
    maturato: items.filter(i => i.status === 'maturato').length,
    archiviato: items.filter(i => i.status === 'archiviato').length
  };

  const tagCount = {};
  items.forEach(i => (i.tags || []).forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15);

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

  if (topTags.length > 0) {
    md += `**Tag più frequenti:** ${topTags.map(([t, c]) => `#${t}(${c})`).join(', ')}\n\n`;
  }

  md += `---\n\n## Prompt per l'analisi AI\n\n> ${AI_PROMPT}\n\n---\n\n`;
  md += `## Lista completa degli spunti\n\n`;

  items.forEach((item, index) => {
    md += `### ${index + 1}. ${item.title}\n\n`;
    md += `- **Tipo:** ${TYPE_LABELS[item.type] || item.type}\n`;
    md += `- **Stato:** ${STATUS_LABELS[item.status] || item.status}\n`;
    md += `- **Energia richiesta:** ${ENERGY_LABELS[item.energy] || item.energy}\n`;
    if (item.why) md += `- **Perché mi interessa:** ${item.why}\n`;
    if (item.nextAction) md += `- **Prossima azione / domanda / sviluppo possibile:** ${item.nextAction}\n`;
    if (item.note) md += `- **Note:** ${item.note}\n`;
    if (item.link) md += `- **Link:** ${item.link}\n`;
    if (item.tags && item.tags.length) md += `- **Tag:** ${item.tags.map(t => '#' + t).join(' ')}\n`;
    md += `- **Creato:** ${fmtDate(item.createdAt)}\n\n`;
  });

  return md;
}

function exportMarkdown() {
  downloadFile('spunti-export.md', buildMarkdown(), 'text/markdown');
  showToast('Markdown esportato.');
}

function copyMarkdown() {
  const md = buildMarkdown();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).then(() => showToast('Copiato negli appunti!')).catch(() => fallbackCopy(md));
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
  const data = { app:'spunti', version:'0.1', exportedAt:now(), items:state.items };
  downloadFile('spunti-backup.json', JSON.stringify(data, null, 2), 'application/json');
  showToast('JSON esportato.');
}

function exportCSV() {
  const headers = ['id', 'title', 'type', 'status', 'energy', 'why', 'note', 'nextAction', 'link', 'tags', 'createdAt', 'updatedAt'];

  const rows = state.items.map(item => headers.map(h => {
    let v = h === 'tags' ? (item.tags || []).join('|') : (item[h] || '');
    v = String(v).replace(/"/g, '""');
    if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v}"`;
    return v;
  }).join(','));

  downloadFile('spunti-export.csv', [headers.join(','), ...rows].join('\n'), 'text/csv');
  showToast('CSV esportato.');
}

function importJSON(file) {
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const incoming = Array.isArray(data) ? data : (data.items || []);
      if (!Array.isArray(incoming)) throw new Error('Formato non valido');

      const existingIds = new Set(state.items.map(i => i.id));
      let added = 0;

      incoming.forEach(item => {
        if (!item.id || !item.title || existingIds.has(item.id)) return;
        state.items.push(item);
        added++;
      });

      DB.save(state.items);
      showToast(`Importati ${added} spunti.`);
      renderExport();
    } catch {
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

function setupEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.screen));
  });

  document.getElementById('btn-new-home').addEventListener('click', openNewForm);
  document.getElementById('btn-new-lista').addEventListener('click', openNewForm);

  document.getElementById('lista-search').addEventListener('input', e => {
    state.filters.search = e.target.value;
    renderLista();
  });

  document.querySelectorAll('.chip[data-filter-status]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter-status]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.status = chip.dataset.filterStatus;
      renderLista();
    });
  });

  document.querySelectorAll('.chip[data-filter-type]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter-type]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.type = chip.dataset.filterType;
      renderLista();
    });
  });

  document.querySelectorAll('[data-home-status]').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.dataset.homeStatus || 'all';
      const searchInput = document.getElementById('lista-search');

      state.filters.search = '';
      state.filters.status = status;
      state.filters.type = 'all';

      if (searchInput) searchInput.value = '';

      document.querySelectorAll('.chip[data-filter-status]').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filterStatus === status);
      });

      document.querySelectorAll('.chip[data-filter-type]').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filterType === 'all');
      });

      navigate('lista');
    });
  });

  document.getElementById('btn-form-save').addEventListener('click', submitForm);

  document.getElementById('btn-form-cancel').addEventListener('click', () => {
    state.editingId = null;
    navigate('lista');
  });

  document.getElementById('f-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitForm();
    }
  });

  document.getElementById('btn-export-md').addEventListener('click', exportMarkdown);
  document.getElementById('btn-copy-md').addEventListener('click', copyMarkdown);
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  document.getElementById('btn-import-json').addEventListener('click', () => document.getElementById('import-file-input').click());

  document.getElementById('import-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  document.getElementById('modal-confirm').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });

  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-confirm').classList.remove('open');
  });
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  registerSW();
  navigate('home');
});
