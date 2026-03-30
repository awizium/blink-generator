/* =====================================================
   App Version & Console Logger
   ===================================================== */
const APP_VERSION = '1.2.0';

// Сохранённый контекст при переключении между image/text моделями
let savedTextCtx = null;
let savedImageCtx = null;

function logBlink(emoji, label, data) {
  const style = 'color:#5b9ef0;font-weight:bold';
  if (data !== undefined) {
    console.log(`%c[Blink] ${emoji} ${label}`, style, data);
  } else {
    console.log(`%c[Blink] ${emoji} ${label}`, style);
  }
}

function logBlinkSuccess(emoji, label, data) {
  const style = 'color:#4abe6a;font-weight:bold';
  if (data !== undefined) {
    console.log(`%c[Blink] ${emoji} ${label}`, style, data);
  } else {
    console.log(`%c[Blink] ${emoji} ${label}`, style);
  }
}

function logBlinkError(emoji, label, data) {
  const style = 'color:#e85454;font-weight:bold';
  if (data !== undefined) {
    console.error(`%c[Blink] ${emoji} ${label}`, style, data);
  } else {
    console.error(`%c[Blink] ${emoji} ${label}`, style);
  }
}

function logBlinkWarn(emoji, label, data) {
  const style = 'color:#d4a824;font-weight:bold';
  if (data !== undefined) {
    console.warn(`%c[Blink] ${emoji} ${label}`, style, data);
  } else {
    console.warn(`%c[Blink] ${emoji} ${label}`, style);
  }
}


/* =====================================================
   IndexedDB — Image Storage
   ===================================================== */
const DB_NAME = 'BlinkDB2';
let idb = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('img');
    };
    request.onsuccess = (e) => {
      idb = e.target.result;
      resolve();
    };
    request.onerror = reject;
  });
}

function dbPut(key, value) {
  return new Promise((resolve, reject) => {
    try {
      const tx = idb.transaction('img', 'readwrite');
      tx.objectStore('img').put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = (e) => {
        console.error('[Blink] IndexedDB put error:', e.target.error);
        reject(e.target.error);
      };
      tx.onabort = (e) => {
        console.error('[Blink] IndexedDB put aborted:', e.target.error);
        reject(e.target.error);
      };
    } catch (e) {
      console.error('[Blink] IndexedDB put exception:', e);
      reject(e);
    }
  });
}

function dbGet(key) {
  return new Promise((resolve, reject) => {
    try {
      const tx = idb.transaction('img', 'readonly');
      const req = tx.objectStore('img').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => {
        console.error('[Blink] IndexedDB get error:', e.target.error);
        reject(e.target.error);
      };
    } catch (e) {
      console.error('[Blink] IndexedDB get exception:', e);
      reject(e);
    }
  });
}

function generateImageKey() {
  return 'i' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

async function saveImage(dataUrl) {
  const key = generateImageKey();
  await dbPut(key, dataUrl);
  return key;
}

async function loadImage(key) {
  if (!key) return null;
  if (key.startsWith('data:') || key.startsWith('http')) return key;
  return await dbGet(key);
}


/* =====================================================
   Models Configuration
   ===================================================== */
const ALL_MODELS = [
  'google/gemini-2.5-flash-image', 'google/gemini-3-pro-image',
  'google/gemini-3.1-flash-image-preview',
  'google/gemini-2.0-flash', 'google/gemini-2.0-flash-lite',
  'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-pro', 'google/gemini-3-flash',
  'google/gemini-3-pro-preview', 'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3.1-pro-preview',
  'anthropic/claude-3-haiku', 'anthropic/claude-3-opus',
  'anthropic/claude-3.5-haiku', 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-sonnet-20240620', 'anthropic/claude-3.7-sonnet',
  'anthropic/claude-haiku-4.5', 'anthropic/claude-opus-4',
  'anthropic/claude-opus-4.1', 'anthropic/claude-opus-4.5',
  'anthropic/claude-opus-4.6', 'anthropic/claude-sonnet-4',
  'anthropic/claude-sonnet-4.5', 'anthropic/claude-sonnet-4.6',
  'openai/gpt-3.5-turbo', 'openai/gpt-4-turbo',
  'openai/gpt-4.1', 'openai/gpt-4.1-mini', 'openai/gpt-4.1-nano',
  'openai/gpt-4o', 'openai/gpt-4o-mini',
  'openai/gpt-5', 'openai/gpt-5-chat', 'openai/gpt-5-mini',
  'openai/gpt-5-nano', 'openai/gpt-5-pro',
  'openai/gpt-5.1-instant', 'openai/gpt-5.1-thinking',
  'openai/gpt-5.2', 'openai/gpt-5.2-chat', 'openai/gpt-5.2-pro',
  'openai/gpt-5.3-chat', 'openai/gpt-5.4', 'openai/gpt-5.4-mini',
  'openai/gpt-5.4-nano', 'openai/gpt-5.4-pro',
  'openai/o1', 'openai/o3', 'openai/o3-mini', 'openai/o3-pro', 'openai/o4-mini',
  'deepseek/deepseek-r1', 'deepseek/deepseek-v3',
  'deepseek/deepseek-v3.1', 'deepseek/deepseek-v3.1-terminus',
  'deepseek/deepseek-v3.2', 'deepseek/deepseek-v3.2-thinking',
  'xai/grok-2-vision', 'xai/grok-3', 'xai/grok-3-fast',
  'xai/grok-3-mini', 'xai/grok-3-mini-fast',
  'xai/grok-4', 'xai/grok-4-fast-non-reasoning',
  'xai/grok-4-fast-reasoning', 'xai/grok-4.1-fast-non-reasoning',
  'xai/grok-4.1-fast-reasoning',
  'meta/llama-3.1-70b', 'meta/llama-3.1-8b',
  'meta/llama-3.2-11b', 'meta/llama-3.2-1b',
  'meta/llama-3.2-3b', 'meta/llama-3.2-90b',
  'meta/llama-3.3-70b', 'meta/llama-4-maverick', 'meta/llama-4-scout',
  'alibaba/qwen-3-14b', 'alibaba/qwen-3-235b',
  'alibaba/qwen-3-30b', 'alibaba/qwen-3-32b',
  'alibaba/qwen-3-4b', 'alibaba/qwen-3-8b',
  'alibaba/qwen-3-coder', 'alibaba/qwq-32b'
];

const IMAGE_MODELS = new Set([
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image',
  'google/gemini-3.1-flash-image-preview'
]);

let modelFilter = 'image';

function formatModelTitle(model) {
  if (!model) return '—';
  if (model.startsWith('google/gemini-3.1')) return 'Nano banana 2';
  if (model.includes('pro')) return 'Nano banana pro';
  if (model.startsWith('google/gemini-2.5')) return 'Nano banana';
  if (model.startsWith('google/gemini-')) return 'Nano banana';
  return (model.split('/')[1] || model);
}

function formatModelOption(model) {
  if (!model) return '—';
  const short = (model.split('/')[1] || model);
  const title = formatModelTitle(model);

  let label = title;
  if (model.startsWith('google/gemini-') && short) label += ' (' + short + ')';
  else if (title !== short) label += ' (' + short + ')';

  if (IMAGE_MODELS.has(model)) label += ' 🖼️';
  return label;
}

function renderModels() {
  const container = document.getElementById('mC');
  container.innerHTML = '';

  const filters = [
    { id: 'image', label: '🖼️ Картинки' },
    { id: 'chat', label: '💬 Чат' },
    { id: 'all', label: 'Все' }
  ];

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'sb' + (modelFilter === f.id ? ' sba' : '');
    btn.textContent = f.label;
    btn.onclick = () => {
      modelFilter = f.id;
      renderModels();
    };
    container.appendChild(btn);
  });

  const select = document.getElementById('mS');
  const prev = select.value || lsGet('model') || 'google/gemini-3.1-flash-image-preview';
  select.innerHTML = '';

  const filtered = modelFilter === 'all'
    ? ALL_MODELS
    : ALL_MODELS.filter(m => modelFilter === 'image' ? IMAGE_MODELS.has(m) : !IMAGE_MODELS.has(m));

  const groups = new Map();
  filtered.forEach(m => {
    const vendor = m.split('/')[0];
    if (!groups.has(vendor)) groups.set(vendor, []);
    groups.get(vendor).push(m);
  });

  for (const [vendor, models] of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = vendor[0].toUpperCase() + vendor.slice(1);
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = formatModelOption(m);
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  }

  if ([...select.options].some(o => o.value === prev)) {
    select.value = prev;
  }

  onModelSelect();
}

function onModelSelect() {
  const model = document.getElementById('mS').value;
  const wasImage = IMAGE_MODELS.has(lsGet('model') || '');
  const isImage = IMAGE_MODELS.has(model);
  lsSet('model', model);
  document.getElementById('hM').textContent = model
    ? formatModelTitle(model) + (isImage ? ' 🖼️' : '')
    : '—';

  const warning = document.getElementById('mW');
  if (model && !isImage) {
    warning.textContent = 'ℹ️ Текстовая модель — не генерирует картинки.';
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }

  document.getElementById('iSS').style.display = isImage ? '' : 'none';

  // Автопереключение контекста: image-модели по умолчанию 0
  const curCtx = parseInt(document.getElementById('cI').value) || 0;
  if (isImage && !wasImage) {
    savedTextCtx = curCtx;
    const imgCtx = savedImageCtx !== null ? savedImageCtx : 0;
    document.getElementById('cI').value = imgCtx;
    document.getElementById('cR').value = Math.min(imgCtx, 100);
    updateContextHint(imgCtx);
  } else if (!isImage && wasImage) {
    savedImageCtx = curCtx;
    const txtCtx = savedTextCtx !== null ? savedTextCtx : 20;
    document.getElementById('cI').value = txtCtx;
    document.getElementById('cR').value = Math.min(txtCtx, 100);
    updateContextHint(txtCtx);
  } else {
    updateContextHint(curCtx);
  }

  updateHeader();
}

// Alias for HTML onchange
const onMS = onModelSelect;


/* =====================================================
   Themes
   ===================================================== */
const THEMES = [
  { id: 'default', n: 'Серая', c: '#1e1e22' },
  { id: 'dgray', n: 'Тёмно-серая', c: '#202028' },
  { id: 'dark', n: 'Тёмная', c: '#0a0a0c' },
  { id: 'coal', n: 'Уголь', c: '#16161c' },
  { id: 'graphite', n: 'Графит', c: '#1a1a20' },
  { id: 'midnight', n: 'Полночь', c: '#111827' },
  { id: 'abyss', n: 'Бездна', c: '#0a0f1e' },
  { id: 'dracula', n: 'Дракула', c: '#282a36' },
  { id: 'forest', n: 'Лес', c: '#0a150a' },
  { id: 'ocean', n: 'Океан', c: '#081a16' },
  { id: 'amethyst', n: 'Аметист', c: '#120e1a' },
  { id: 'rose', n: 'Роза', c: '#15090d' },
  { id: 'sunset', n: 'Закат', c: '#1a0f08' },
  { id: 'white', n: 'Белая', c: '#f5f6f8', ring: '#c9d1dd' },
];

function renderThemes() {
  const container = document.getElementById('thR');
  container.innerHTML = '';
  const current = lsGet('theme') || 'default';

  THEMES.forEach(t => {
    const wrap = document.createElement('div');
    wrap.className = 'th-item';

    const dot = document.createElement('div');
    dot.className = 'thp' + (current === t.id ? ' act' : '');
    dot.style.background = t.c;
    if (t.ring) dot.style.borderColor = t.ring;
    dot.title = t.n;
    dot.onclick = () => {
      lsSet('theme', t.id);
      applyTheme();
      renderThemes();
    };
    wrap.appendChild(dot);

    const label = document.createElement('div');
    label.className = 'thn';
    label.textContent = t.n;
    wrap.appendChild(label);

    container.appendChild(wrap);
  });
}

function applyTheme() {
  const theme = lsGet('theme') || 'default';
  document.body.setAttribute('data-theme', theme === 'default' ? '' : theme);
}


/* =====================================================
   LocalStorage Helpers
   ===================================================== */
function lsGet(key) {
  return localStorage.getItem('bg_' + key);
}

function lsSet(key, value) {
  localStorage.setItem('bg_' + key, value);
}

function keysPersistEnabled() {
  // Preference is always stored in localStorage, but keys may be stored in localStorage or sessionStorage.
  return lsGet('kPersist') !== '0';
}

function ksGet(key) {
  const store = keysPersistEnabled() ? localStorage : sessionStorage;
  return store.getItem('bg_' + key);
}

function ksSet(key, value) {
  const store = keysPersistEnabled() ? localStorage : sessionStorage;
  store.setItem('bg_' + key, value);
}


/* =====================================================
   Settings Save / Load
   ===================================================== */
let _saveTimer;

function debouncedSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveAllSettings, 400);
}

// Alias for HTML oninput
const svD = debouncedSave;

function saveAllSettings() {
  lsSet('sP', document.getElementById('sP').value);
  lsSet('nP', document.getElementById('nP').value);
  lsSet('aR', document.getElementById('aR').value);
  lsSet('ctx', document.getElementById('cI').value);
  lsSet('tmp', document.getElementById('tI').value);
}

function loadAllSettings() {
  document.getElementById('sP').value = lsGet('sP') || '';
  document.getElementById('nP').value = lsGet('nP') || '';
  document.getElementById('aR').value = lsGet('aR') || '';

  const ctx = parseInt(lsGet('ctx')) || 20;
  document.getElementById('cR').value = Math.min(ctx, 100);
  document.getElementById('cI').value = ctx;
  updateContextHint(ctx);

  const temp = parseFloat(lsGet('tmp'));
  if (!isNaN(temp)) {
    document.getElementById('tR').value = Math.round(temp * 100);
    document.getElementById('tI').value = temp.toFixed(1);
  }
}


/* =====================================================
   Context & Temperature Controls
   ===================================================== */
function onCR() {
  const val = +document.getElementById('cR').value;
  document.getElementById('cI').value = val;
  updateContextHint(val);
  debouncedSave();
  updateHeader();
}

function onCI() {
  let val = parseInt(document.getElementById('cI').value) || 0;
  if (val < 0) val = 0;
  document.getElementById('cR').value = Math.min(val, 100);
  updateContextHint(val);
  debouncedSave();
  updateHeader();
}

function updateContextHint(val) {
  const model = document.getElementById('mS') ? document.getElementById('mS').value : '';
  const isImg = IMAGE_MODELS.has(model);
  const mode = isImg ? 'режим картинок' : 'режим чата';
  if (isImg && val === 0) {
    document.getElementById('cH').textContent = '🖼️ Каждая генерация независима. Увеличьте для follow-up.';
  } else {
    document.getElementById('cH').textContent = val === 0
      ? 'Без памяти — каждый запрос отдельно.'
      : 'Последние ' + val + ' сообщ. как контекст.';
  }
  const cs = document.getElementById('cS');
  if (cs) cs.textContent = 'Общий контекст: ~' + estimateContextTokens() + ' ток. (' + mode + ')';
}

function onTR() {
  document.getElementById('tI').value = (+document.getElementById('tR').value / 100).toFixed(1);
  debouncedSave();
}

function onTI() {
  let val = parseFloat(document.getElementById('tI').value);
  if (isNaN(val)) val = 1;
  val = Math.max(0, Math.min(2, val));
  document.getElementById('tR').value = Math.round(val * 100);
  debouncedSave();
}


/* =====================================================
   API Keys
   ===================================================== */
function getKeys() {
  try { return JSON.parse(ksGet('keys') || '[]'); }
  catch { return []; }
}

function saveKeys(keys) {
  ksSet('keys', JSON.stringify(keys));
}

function renderKeySelect() {
  const select = document.getElementById('kS');
  const keys = getKeys();
  const saved = ksGet('selK') || '';

  select.innerHTML = '<option value="">— Выберите —</option>';
  keys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.name || '—';
    if (k.id === saved) opt.selected = true;
    select.appendChild(opt);
  });
}

function onKS() {
  ksSet('selK', document.getElementById('kS').value);
}

function activeKey() {
  const id = document.getElementById('kS').value;
  return (getKeys().find(k => k.id === id) || {}).key || '';
}

let editingKeyId = '';

function newKE() {
  editingKeyId = '';
  document.getElementById('kN').value = '';
  document.getElementById('kV').value = '';
  document.getElementById('kV').type = 'password';
  document.getElementById('kE').style.display = 'block';
}

function canKE() {
  document.getElementById('kE').style.display = 'none';
  editingKeyId = '';
}

function savK() {
  const name = document.getElementById('kN').value.trim();
  const value = document.getElementById('kV').value.trim();
  if (!value) { showToast('Введите ключ'); return; }

  let keys = getKeys();
  if (editingKeyId) {
    const idx = keys.findIndex(k => k.id === editingKeyId);
    if (idx !== -1) {
      keys[idx].name = name || 'Без имени';
      keys[idx].key = value;
    }
    saveKeys(keys);
    renderKeySelect();
    canKE();
    showToast('Обновлён');
  } else {
    const id = 'k' + Date.now() + Math.random().toString(36).slice(2, 5);
    keys.push({ id, name: name || 'Без имени', key: value });
    saveKeys(keys);
    ksSet('selK', id);
    renderKeySelect();
    canKE();
    showToast('Добавлен');
  }
}

function edK() {
  const id = document.getElementById('kS').value;
  if (!id) { showToast('Выберите ключ'); return; }
  const key = getKeys().find(x => x.id === id);
  if (!key) return;
  editingKeyId = id;
  document.getElementById('kN').value = key.name;
  document.getElementById('kV').value = key.key;
  document.getElementById('kV').type = 'password';
  document.getElementById('kE').style.display = 'block';
}

function delK() {
  const id = document.getElementById('kS').value;
  if (!id) { showToast('Выберите ключ'); return; }
  if (!confirm('Удалить?')) return;
  saveKeys(getKeys().filter(k => k.id !== id));
  ksSet('selK', '');
  renderKeySelect();
  canKE();
  showToast('Удалён');
}

function toggleKeyPersist() {
  const chk = document.getElementById('kPersist');
  if (!chk) return;

  const desiredPersist = !!chk.checked;
  const oldPersist = keysPersistEnabled();

  // Save preference (used by getKeys/saveKeys via keysPersistEnabled()).
  lsSet('kPersist', desiredPersist ? '1' : '0');

  if (oldPersist === desiredPersist) return;

  const fromStore = oldPersist ? localStorage : sessionStorage;
  const toStore = desiredPersist ? localStorage : sessionStorage;

  const parseArr = (raw) => {
    try {
      const v = JSON.parse(raw || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };

  const fromKeys = parseArr(fromStore.getItem('bg_keys'));
  const toKeys = parseArr(toStore.getItem('bg_keys'));

  // Merge by id; prefer incoming items from the source store.
  const map = new Map(toKeys.map(k => [k.id, k]));
  fromKeys.forEach(k => { if (k && k.id) map.set(k.id, k); });
  toStore.setItem('bg_keys', JSON.stringify([...map.values()]));

  const fromSel = fromStore.getItem('bg_selK') || '';
  const toSel = toStore.getItem('bg_selK') || '';
  const sel = fromSel || toSel;
  if (sel) toStore.setItem('bg_selK', sel);
  else toStore.removeItem('bg_selK');

  fromStore.removeItem('bg_keys');
  fromStore.removeItem('bg_selK');

  renderKeySelect();
  canKE();
  showToast('Хранилище ключей обновлено');
}

function togKV() {
  const input = document.getElementById('kV');
  input.type = input.type === 'password' ? 'text' : 'password';
}


/* =====================================================
   Chats Storage
   ===================================================== */
function getChats() {
  try { return JSON.parse(localStorage.getItem('bg_chats') || '[]'); }
  catch { return []; }
}

function saveChats(chats) {
  localStorage.setItem('bg_chats', JSON.stringify(chats));
}

let currentChat = null;
let messageEntries = [];
let messageCounter = 0;
let chatFullyLoaded = false;

function newChat() {
  const id = 'c' + Date.now();
  const chat = { id, name: 'Новый чат', created: Date.now(), messages: [] };
  const chats = getChats();
  chats.unshift(chat);
  saveChats(chats);
  switchChat(id);
  logBlink('💬', 'Новый чат создан', { id });
  showToast('Чат создан');
}

function switchChat(id) {
  saveCurrentChat();
  cancelEdit(); // cancel any in-progress edit
  chatFullyLoaded = false;
  
  const chats = getChats();
  currentChat = chats.find(c => c.id === id) || null;
  if (!currentChat) { newChat(); return; }
  lsSet('aCh', id);
  logBlink('🔄', 'Переключение на чат', { id, name: currentChat.name, messages: currentChat.messages.length });
  renderChatList();
  renderMessages();
  closePanel();
}

function saveCurrentChat() {
  if (!currentChat) return;
  if (!chatFullyLoaded) return;
  currentChat.messages = messageEntries.map(m => ({
    role: m.role,
    text: m.text,
    model: m.model || '',
    imageKeys: m.imageKeys || [],
    userImageKeys: m.userImageKeys || [],
    reasoning: m.reasoning || '',
    usage: m.usage || null,
    elapsed: m.elapsed || '',
    ts: m.ts || Date.now(),
    swipes: m.swipes || [],
    swipeIdx: m.swipeIdx || 0
  }));
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === currentChat.id);
  if (idx !== -1) chats[idx] = currentChat;
  else chats.unshift(currentChat);
  saveChats(chats);
}

function delChat(id) {
  if (!confirm('Удалить чат?')) return;
  logBlink('🗑️', 'Удаление чата', { id });
  let chats = getChats().filter(c => c.id !== id);
  saveChats(chats);
  if (currentChat && currentChat.id === id) {
    currentChat = null;
    messageEntries = [];
    if (chats.length) switchChat(chats[0].id);
    else newChat();
  } else {
    renderChatList();
  }
  showToast('Чат удалён');
}

function renChat(id) {
  const chats = getChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return;
  const name = prompt('Название:', chat.name);
  if (name === null) return;
  chat.name = name.trim() || 'Чат';
  if (currentChat && currentChat.id === id) currentChat.name = chat.name;
  saveChats(chats);
  renderChatList();
}

function renderChatList() {
  const list = document.getElementById('cl');
  const chats = getChats();
  const activeId = currentChat ? currentChat.id : '';
  const query = (document.getElementById('chatSearch').value || '').toLowerCase().trim();

  list.innerHTML = '';

  const filtered = query
    ? chats.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.messages || []).some(m => (m.text || '').toLowerCase().includes(query))
    )
    : chats;

  if (!filtered.length) {
    list.innerHTML = '<div style="color:var(--text4);font-size:11px;text-align:center;padding:20px">' +
      (query ? 'Ничего не найдено' : 'Нет чатов') + '</div>';
    return;
  }

  filtered.forEach(c => {
    const div = document.createElement('div');
    div.className = 'ci' + (c.id === activeId ? ' act' : '');
    const dt = new Date(c.created);
    div.innerHTML = `
      <div class="ci-i" onclick="switchChat('${c.id}')">
        <div class="ci-n">${escapeHtml(c.name)}</div>
        <div class="ci-m">${(c.messages || []).length} · ${dt.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })} ${dt.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="ci-a">
        <button class="cib" onclick="event.stopPropagation();exportSingleChat('${c.id}')" title="Экспорт чата">📥</button>
        <button class="cib" onclick="event.stopPropagation();renChat('${c.id}')" title="Переименовать">✏️</button>
        <button class="cib dng" onclick="event.stopPropagation();delChat('${c.id}')" title="Удалить">✕</button>
      </div>`;
    list.appendChild(div);
  });
}

function filterChats() {
  renderChatList();
}

async function renderMessages() {
  chatFullyLoaded = false;

  const box = document.getElementById('msgs');
  box.innerHTML = '';
  messageEntries = [];
  messageCounter = 0;

  if (!currentChat || !currentChat.messages.length) {
    box.innerHTML = '<div class="empty" id="emS"><div class="empty-i">🎨</div><div class="empty-t">Blink Generator</div></div>';
    updateHeader();
    chatFullyLoaded = true;
    return;
  }

  for (const m of currentChat.messages) {
    if (m.role === 'user') {
      await addUserMessage(m.text, m.ts, false, m.userImageKeys || []);
    } else if (m.role === 'assistant') {
      await addBotMessage(m.model, m.imageKeys || [], m.text, m.reasoning, m.usage, m.elapsed, null, m.ts, false, m.swipes || [], m.swipeIdx || 0);
    } else if (m.role === 'error') {
      addErrorMessage(m.model, m.text, null, m.ts, false);
    }
  }

  updateHeader();
  scrollToBottom();
  chatFullyLoaded = true;
}

function clrChat() {
  if (!currentChat || !messageEntries.length) return;
  if (!confirm('Очистить?')) return;
  currentChat.messages = [];
  messageEntries = [];
  saveCurrentChat();
  renderMessages();
  showToast('Очищен');
}

// Lightweight approximate token estimator for "context" UI display.
function estimateContextTokens() {
  const ctx = parseInt(document.getElementById('cI').value) || 0;
  if (ctx <= 0) return 0;

  const sys = (document.getElementById('sP').value || '').trim();
  let tokens = Math.ceil(sys.length / 4);

  // Estimate last `ctx` role-messages (user/assistant) by text length + rough image cost.
  let counted = 0;
  for (let i = messageEntries.length - 1; i >= 0 && counted < ctx; i--) {
    const m = messageEntries[i];
    if (m.role === 'user') {
      if (!(m.text || '').trim() && !(m.userImageKeys || []).length) continue;
      tokens += Math.ceil((m.text || '').length / 4);
      tokens += (m.userImageKeys || []).length * 256;
      counted++;
    } else if (m.role === 'assistant') {
      if (!(m.text || '').trim() && !(m.imageKeys || []).length) continue;
      tokens += Math.ceil((m.text || '').length / 4);
      tokens += (m.imageKeys || []).length * 256;
      counted++;
    }
  }

  return tokens;
}

function updateHeader() {
  const el = document.getElementById('hC');
  if (!el) return;

  const msgCount = messageEntries.length ? messageEntries.length + ' сообщ.' : '';
  const tokens = estimateContextTokens();
  const ctxVal = parseInt(document.getElementById('cI').value) || 0;
  updateContextHint(ctxVal);

  if (msgCount) {
    el.textContent = tokens > 0 ? msgCount + ' · ~' + tokens + ' ток.' : msgCount;
  } else {
    el.textContent = tokens > 0 ? '~' + tokens + ' ток.' : '';
  }
}

function formatTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}


/* =====================================================
   Undo System
   ===================================================== */
let undoStack = [];
let undoTimer = null;

function pushUndo(label, fn) {
  undoStack = [{ label, fn }];
  showUndoBar(label);
}

function showUndoBar(label) {
  clearTimeout(undoTimer);
  document.getElementById('uC').innerHTML = `
    <div class="ubar">
      <span>${escapeHtml(label)}</span>
      <button onclick="doUndo()">Отменить</button>
      <button class="ubx" onclick="dismissUndo()">✕</button>
    </div>`;
  undoTimer = setTimeout(dismissUndo, 8000);
}

function doUndo() {
  if (!undoStack.length) return;
  undoStack.pop().fn();
  dismissUndo();
  showToast('Отменено');
}

function dismissUndo() {
  clearTimeout(undoTimer);
  document.getElementById('uC').innerHTML = '';
  undoStack = [];
}


/* =====================================================
   Attachments — Drag & Drop, Paste, Clip Button
   ===================================================== */
let pendingAttachments = [];

function handleFileAttach(event) {
  for (const file of event.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingAttachments.push({ dataUrl: e.target.result, name: file.name });
      renderAttachPreview();
    };
    reader.readAsDataURL(file);
  }
  event.target.value = '';
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('cinp').classList.remove('drag-over');
  for (const file of e.dataTransfer.files) {
    if (!file.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingAttachments.push({ dataUrl: ev.target.result, name: file.name });
      renderAttachPreview();
    };
    reader.readAsDataURL(file);
  }
}

function handlePaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (ev) => {
        pendingAttachments.push({ dataUrl: ev.target.result, name: 'clipboard.png' });
        renderAttachPreview();
      };
      reader.readAsDataURL(file);
    }
  }
}

function removeAttachment(idx) {
  pendingAttachments.splice(idx, 1);
  renderAttachPreview();
}

function renderAttachPreview() {
  const container = document.getElementById('attachPreview');
  container.innerHTML = '';
  pendingAttachments.forEach((att, idx) => {
    const item = document.createElement('div');
    item.className = 'attach-item';
    item.innerHTML = `
      <img src="${escapeAttr(att.dataUrl)}" alt="${escapeAttr(att.name)}"
           title="${escapeAttr(att.name)}"/>
      <button class="attach-rm" onclick="removeAttachment(${idx})">✕</button>`;
    container.appendChild(item);
  });
}


/* =====================================================
   Edit Mode — Non-destructive editing
   ===================================================== */
let editingMessageId = null;
let editPrevPrompt = '';
let editPrevAttachments = [];

function startEdit(id) {
  const idx = messageEntries.findIndex(x => x.id === id);
  if (idx === -1) return;
  const entry = messageEntries[idx];
  if (entry.role !== 'user') return;

  // If already editing something else, cancel first
  if (editingMessageId) cancelEdit();

  editingMessageId = id;
  editPrevPrompt = document.getElementById('pr').value;
  editPrevAttachments = [...pendingAttachments];

  // Copy text to input
  document.getElementById('pr').value = entry.text;
  autoResize(document.getElementById('pr'));
  document.getElementById('pr').focus();

  // Mark message visually
  entry.el.classList.add('editing');

  // Show edit bar
  renderEditBar();
}

function cancelEdit() {
  if (!editingMessageId) return;

  const entry = messageEntries.find(m => m.id === editingMessageId);
  if (entry && entry.el) {
    entry.el.classList.remove('editing');
  }

  // Restore previous input
  document.getElementById('pr').value = editPrevPrompt;
  autoResize(document.getElementById('pr'));
  pendingAttachments = editPrevAttachments;
  renderAttachPreview();

  editingMessageId = null;
  editPrevPrompt = '';
  editPrevAttachments = [];

  document.getElementById('editBar').innerHTML = '';
}

function confirmEdit() {
  if (!editingMessageId) return;

  const newText = document.getElementById('pr').value.trim();
  if (!newText) {
    showToast('Введите текст');
    return;
  }

  const idx = messageEntries.findIndex(x => x.id === editingMessageId);
  if (idx === -1) { cancelEdit(); return; }

  const entry = messageEntries[idx];
  entry.el.classList.remove('editing');

  // Update the message text
  entry.text = newText;

  // Update the DOM
  const mtxEl = entry.el.querySelector('.mtx');
  if (mtxEl) mtxEl.innerHTML = escapeHtml(newText);

  // Clear edit state
  editingMessageId = null;
  editPrevPrompt = '';
  editPrevAttachments = [];
  document.getElementById('pr').value = newText;
  autoResize(document.getElementById('pr'));
  pendingAttachments = [];
  renderAttachPreview();
  document.getElementById('editBar').innerHTML = '';

  saveCurrentChat();
  showToast('Сообщение обновлено. Нажмите отправить');
}

function renderEditBar() {
  document.getElementById('editBar').innerHTML = `
    <div class="edit-bar">
      <span>✏️ Редактирование сообщения</span>
      <button onclick="cancelEdit()">✕ Отмена</button>
    </div>`;
}


/* =====================================================
   Message Rendering
   ===================================================== */
function removeEmpty() {
  const el = document.getElementById('emS');
  if (el) el.remove();
}

function findLastByRole(role) {
  for (let i = messageEntries.length - 1; i >= 0; i--) {
    if (messageEntries[i].role === role) return messageEntries[i].id;
  }
  return null;
}

async function addUserMessage(text, ts, save = true, userImageKeys = []) {
  removeEmpty();
  const box = document.getElementById('msgs');
  const id = 'm' + (++messageCounter);
  const div = document.createElement('div');
  div.className = 'm m-u';
  div.id = id;

  let imagesHtml = '';
  if (userImageKeys.length) {
    imagesHtml = '<div class="usr-imgs">';
    for (const k of userImageKeys) {
      const src = await loadImage(k);
      if (src) imagesHtml += `<img src="${escapeAttr(src)}" alt="attached" onclick="openOverlay(this.src)"/>`;
    }
    imagesHtml += '</div>';
  }

  div.innerHTML = `
    <div class="mt">
      <span class="ml">Вы</span>
      <div class="mm">
        <span class="mti">${formatTime(ts)}</span>
        <div class="macts" id="a_${id}"></div>
      </div>
    </div>
    ${imagesHtml}
    <div class="mtx">${escapeHtml(text)}</div>`;

  box.appendChild(div);

  messageEntries.push({
    id, role: 'user', text,
    ts: ts || Date.now(), el: div,
    imageKeys: [], userImageKeys: userImageKeys || [],
    swipes: [], swipeIdx: 0
  });

  refreshActions();
  if (save) { updateHeader(); saveCurrentChat(); }
  scrollToBottom();
}

async function addBotMessage(model, imageKeys, text, reasoning, usage, elapsed, rawData, ts, save = true, swipes = [], swipeIdx = 0) {
  removeEmpty();
  const box = document.getElementById('msgs');
  const id = 'm' + (++messageCounter);
  const div = document.createElement('div');
  div.className = 'm m-b';
  div.id = id;

  // Load images
  const loadedImages = [];
  for (const k of (imageKeys || [])) {
    const src = await loadImage(k);
    if (src) loadedImages.push({ key: k, src });
  }

  let html = `
    <div class="mt">
      <span class="ml">Ассистент<span class="mmtag">${escapeHtml((model || '').split('/')[1] || '')}</span></span>
      <div class="mm">
        <span class="mti">${formatTime(ts)}</span>
        <div class="macts" id="a_${id}"></div>
      </div>
    </div>`;

  // Reasoning
  if (reasoning) {
    html += `<details class="rsn"><summary>🧠 Рассуждение</summary><div class="rtx">${escapeHtml(reasoning)}</div></details>`;
  }

  // Images
  if (loadedImages.length) {
    loadedImages.forEach((img) => {
      html += `<img class="gi" src="${escapeAttr(img.src)}" alt="img" onclick="openOverlay(this.src)"/>`;
    });
    html += '<div class="dlr">';
    loadedImages.forEach((img, i) => {
      html += `<button class="sb" style="font-size:10px;padding:3px 7px" data-imgkey="${escapeAttr(img.key)}" onclick="downloadImageByKey(this,${i})">⬇️${loadedImages.length > 1 ? ' #' + (i + 1) : ' Скачать'}</button>`;
    });
    html += '</div>';
  }

  // Text
  if (text) {
    html += `<div class="mtx">${escapeHtml(text)}</div>`;
  }

  // Empty response
  if (!loadedImages.length && !text && !reasoning) {
    html += `<div class="mtx" style="color:var(--text4)">Пустой ответ. Возможно цензура заблокировала содержимое.</div>`;
  }

  // Swipe navigation
  if (swipes && swipes.length > 1) {
    html += `<div class="swn">
      <button onclick="swipeMessage('${id}',-1)"${swipeIdx <= 0 ? ' disabled' : ''}>◀</button>
      <span>${swipeIdx + 1} / ${swipes.length}</span>
      <button onclick="swipeMessage('${id}',1)"${swipeIdx >= swipes.length - 1 ? ' disabled' : ''}>▶</button>
    </div>`;
  }

  // Usage info — compact format
  const uParts = [];
  if (usage && usage.total_tokens != null) {
    let tokenStr = usage.total_tokens + ' токенов';
    if (usage.prompt_tokens != null && usage.completion_tokens != null) {
      tokenStr += ' (' + usage.prompt_tokens + ' → ' + usage.completion_tokens + ')';
    }
    uParts.push(tokenStr);
  }
  if (elapsed) uParts.push(elapsed + 'с');
  if (uParts.length) {
    html += `<div class="usg">${escapeHtml(uParts.join(' · '))}</div>`;
  }

  // Raw response
  if (rawData) {
    html += `<details class="rwb"><summary>📄 Ответ</summary><div class="rw">${escapeHtml(JSON.stringify(rawData, null, 2))}</div></details>`;
  }

  div.innerHTML = html;
  box.appendChild(div);

  messageEntries.push({
    id, role: 'assistant', text, model,
    imageKeys: imageKeys || [], userImageKeys: [],
    reasoning: reasoning || '', usage: usage || null,
    elapsed: elapsed || '', ts: ts || Date.now(), el: div,
    swipes: swipes || [], swipeIdx: swipeIdx || 0
  });

  refreshActions();
  if (save) { updateHeader(); saveCurrentChat(); updateStorageIndicator(); }
  scrollToBottom();
}

function addErrorMessage(model, errText, rawData, ts, save = true) {
  removeEmpty();
  const box = document.getElementById('msgs');
  const id = 'm' + (++messageCounter);
  const div = document.createElement('div');
  div.className = 'm m-e';
  div.id = id;

  let html = `
    <div class="mt">
      <span class="ml">Ошибка<span class="mmtag">${escapeHtml((model || '').split('/')[1] || '')}</span></span>
      <div class="mm">
        <span class="mti">${formatTime(ts)}</span>
        <div class="macts" id="a_${id}"></div>
      </div>
    </div>
    <div class="etx">${escapeHtml(errText)}</div>`;

  if (rawData) {
    html += `<details class="rwb"><summary>📄 Ответ</summary><div class="rw">${escapeHtml(JSON.stringify(rawData, null, 2))}</div></details>`;
  }

  div.innerHTML = html;
  box.appendChild(div);

  messageEntries.push({
    id, role: 'error', text: errText, model,
    ts: ts || Date.now(), el: div,
    imageKeys: [], userImageKeys: [],
    swipes: [], swipeIdx: 0
  });

  refreshActions();
  if (save) { updateHeader(); saveCurrentChat(); }
  scrollToBottom();
}

function addLoading() {
  const box = document.getElementById('msgs');
  const div = document.createElement('div');
  div.className = 'gi-ind';
  div.id = 'ldB';
  div.innerHTML = '<span class="spn"></span> Генерирую... <span id="gTm" style="color:var(--text3)">0.0с</span>';
  box.appendChild(div);
  scrollToBottom();
  startTimer();
}

function removeLoading() {
  stopTimer();
  const el = document.getElementById('ldB');
  if (el) el.remove();
}

let genTimerInterval = null;
let genTimerStart = 0;

function startTimer() {
  genTimerStart = Date.now();
  genTimerInterval = setInterval(() => {
    const el = document.getElementById('gTm');
    if (el) el.textContent = ((Date.now() - genTimerStart) / 1000).toFixed(1) + 'с';
  }, 100);
}

function stopTimer() {
  clearInterval(genTimerInterval);
}


/* =====================================================
   Message Actions
   ===================================================== */
function refreshActions() {
  const lastUser = findLastByRole('user');
  let lastBot = null;
  for (let i = messageEntries.length - 1; i >= 0; i--) {
    if (messageEntries[i].role === 'assistant' || messageEntries[i].role === 'error') {
      lastBot = messageEntries[i].id;
      break;
    }
  }

  messageEntries.forEach(m => {
    const actionsEl = document.getElementById('a_' + m.id);
    if (!actionsEl) return;

    let html = '';

    if (m.role === 'user') {
      html += `<button class="ma" onclick="copyText('${m.id}')" title="Копировать">📋</button>`;
      if (m.id === lastUser) {
        html += `<button class="ma" onclick="startEdit('${m.id}')" title="Редактировать">✏️</button>`;
      }
      html += `<button class="ma dng" onclick="deleteMessage('${m.id}')" title="Удалить">✕</button>`;
    } else if (m.role === 'assistant') {
      if (m.id === lastBot) {
        html += `<button class="ma" onclick="regenerateMessage('${m.id}')" title="Перегенерировать">🔄</button>`;
      }
      html += `<button class="ma" onclick="copyText('${m.id}')" title="Копировать">📋</button>`;
      html += `<button class="ma dng" onclick="deleteMessage('${m.id}')" title="Удалить">✕</button>`;
    } else {
      if (m.id === lastBot) {
        html += `<button class="ma" onclick="regenerateMessage('${m.id}')" title="Повторить">🔄</button>`;
      }
      html += `<button class="ma dng" onclick="deleteMessage('${m.id}')" title="Удалить">✕</button>`;
    }

    actionsEl.innerHTML = html;
  });
}

function copyText(id) {
  const m = messageEntries.find(x => x.id === id);
  if (!m || !m.text) { showToast('Нет текста'); return; }
  navigator.clipboard.writeText(m.text).then(() => showToast('Скопировано'));
}

function deleteMessage(id) {
  const idx = messageEntries.findIndex(x => x.id === id);
  if (idx === -1) return;
  const entry = messageEntries[idx];
  const savedHtml = entry.el.outerHTML;
  const savedIdx = idx;

  entry.el.remove();
  messageEntries.splice(idx, 1);
  refreshActions();
  updateHeader();
  saveCurrentChat();

  pushUndo('Сообщение удалено', () => {
    const box = document.getElementById('msgs');
    const template = document.createElement('template');
    template.innerHTML = savedHtml;
    const restored = template.content.firstChild;
    const ref = messageEntries[savedIdx] ? messageEntries[savedIdx].el : null;
    if (ref) box.insertBefore(restored, ref);
    else box.appendChild(restored);
    entry.el = restored;
    messageEntries.splice(savedIdx, 0, entry);
    refreshActions();
    updateHeader();
    saveCurrentChat();
  });
}

function regenerateMessage(id) {
  const key = activeKey();
  const model = document.getElementById('mS').value;
  if (!key) { showToast('Выберите API ключ'); return; }
  if (!model) { showToast('Выберите модель'); return; }

  const idx = messageEntries.findIndex(x => x.id === id);
  if (idx === -1) return;
  const entry = messageEntries[idx];

  // Find previous user message
  let userText = '';
  for (let j = idx - 1; j >= 0; j--) {
    if (messageEntries[j].role === 'user') {
      userText = messageEntries[j].text;
      break;
    }
  }
  if (!userText) { showToast('Нет предыдущего сообщения'); return; }

  // Collect swipes
  const existingSwipes = entry.swipes ? [...entry.swipes] : [];
  if (entry.role === 'assistant' && existingSwipes.length === 0) {
    existingSwipes.push({
      text: entry.text,
      imageKeys: entry.imageKeys || [],
      reasoning: entry.reasoning || '',
      usage: entry.usage,
      elapsed: entry.elapsed
    });
  }

  const savedHtml = entry.el.outerHTML;
  const savedIdx = idx;

  entry.el.remove();
  messageEntries.splice(idx, 1);
  refreshActions();
  updateHeader();
  saveCurrentChat();

  pushUndo('Перегенерация', () => {
    const box = document.getElementById('msgs');
    const template = document.createElement('template');
    template.innerHTML = savedHtml;
    const restored = template.content.firstChild;
    const ref = messageEntries[savedIdx] ? messageEntries[savedIdx].el : null;
    if (ref) box.insertBefore(restored, ref);
    else box.appendChild(restored);
    entry.el = restored;
    messageEntries.splice(savedIdx, 0, entry);
    refreshActions();
    updateHeader();
    saveCurrentChat();
  });

  // Сохраняем текст для восстановления при отмене/abort
  lastSentText = userText;
  lastSentAttachments = [];

  doGenerate(userText, false, existingSwipes);
}

async function swipeMessage(id, dir) {
  const idx = messageEntries.findIndex(x => x.id === id);
  if (idx === -1) return;
  const m = messageEntries[idx];
  if (!m.swipes || m.swipes.length <= 1) return;

  const newIdx = m.swipeIdx + dir;
  if (newIdx < 0 || newIdx >= m.swipes.length) return;

  m.swipeIdx = newIdx;
  const sw = m.swipes[newIdx];
  m.text = sw.text;
  m.imageKeys = sw.imageKeys || [];
  m.reasoning = sw.reasoning || '';
  m.usage = sw.usage;
  m.elapsed = sw.elapsed;

  m.el.remove();
  messageEntries.splice(idx, 1);
  messageCounter--;

  const after = messageEntries.splice(idx);
  await addBotMessage(m.model, m.imageKeys, m.text, m.reasoning, m.usage, m.elapsed, null, m.ts, false, m.swipes, m.swipeIdx);

  const box = document.getElementById('msgs');
  after.forEach(a => box.appendChild(a.el));
  messageEntries.push(...after);
  refreshActions();
  saveCurrentChat();
}


/* =====================================================
   Response Parsing
   ===================================================== */
function findImages(data) {
  const images = new Set();
  const seen = new Set();

  function addImg(src) {
    if (!src) return;
    const fp = src.substring(0, 200);
    if (seen.has(fp)) return;
    seen.add(fp);
    images.add(src);
  }

  function isAllowedImageUrl(u) {
    return typeof u === 'string' && (
      u.startsWith('data:image') ||
      u.startsWith('http://') ||
      u.startsWith('https://')
    );
  }

  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }

    if (obj.mime_type && typeof obj.mime_type === 'string' && obj.mime_type.startsWith('image/') && obj.data) {
      addImg('data:' + obj.mime_type + ';base64,' + obj.data);
      return;
    }
    if (obj.b64_json && typeof obj.b64_json === 'string') {
      addImg('data:image/png;base64,' + obj.b64_json);
      return;
    }
    if (obj.url && typeof obj.url === 'string') {
      const u = obj.url;
      if (isAllowedImageUrl(u) && (u.startsWith('data:image') || u.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i))) {
        addImg(u);
        return;
      }
    }
    if (obj.image_url && typeof obj.image_url === 'object' && obj.image_url.url) {
      const u = obj.image_url.url;
      if (isAllowedImageUrl(u)) addImg(u);
      return;
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }

  walk(data);
  return [...images];
}

function extractContent(data) {
  let text = '';
  let reasoning = '';

  try {
    for (const choice of (data.choices || [])) {
      const msg = choice.message || choice.delta || {};
      if (typeof msg.content === 'string') text += msg.content;
      else if (Array.isArray(msg.content)) {
        msg.content.forEach(part => {
          if (part.type === 'text' && part.text) text += part.text;
        });
      }
      if (msg.reasoning_content) reasoning += msg.reasoning_content;
      if (msg.reasoning) reasoning += (typeof msg.reasoning === 'string' ? msg.reasoning : JSON.stringify(msg.reasoning, null, 2));
      if (msg.thinking) reasoning += (typeof msg.thinking === 'string' ? msg.thinking : JSON.stringify(msg.thinking, null, 2));
    }
  } catch { }

  return { text: text.trim(), reasoning: reasoning.trim() };
}

async function buildMessages(userText, userImageDataUrls = []) {
  const ctx = Math.max(0, Math.min(parseInt(document.getElementById('cI').value) || 0, 100));
  const sys = document.getElementById('sP').value.trim();
  const neg = document.getElementById('nP').value.trim();
  const ar = document.getElementById('aR').value;
  const model = document.getElementById('mS').value;
  const isImageModel = IMAGE_MODELS.has(model);

  let finalText = userText;
  if (isImageModel) {
    const parts = [];
    if (ar) parts.push(`Aspect ratio: ${ar}.`);
    if (neg) parts.push(`Avoid: ${neg}.`);
    if (parts.length) finalText = userText + '\n\n' + parts.join(' ');
  } else if (neg) {
    finalText = userText + '\n\n[Avoid: ' + neg + ']';
  }

  const msgs = [];
  if (sys) msgs.push({ role: 'system', content: sys });

  function extractTextFromContent(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(p => p && p.type === 'text' && typeof p.text === 'string')
        .map(p => p.text)
        .join('');
    }
    return '';
  }

  // Context history
  if (ctx > 0) {
    const history = [];
    for (const m of messageEntries) {
      if (m.role === 'user') {
        if (m.text || (m.userImageKeys && m.userImageKeys.length)) {
          history.push({ role: 'user', m });
        }
      } else if (m.role === 'assistant') {
        if (!isImageModel && m.text) {
          history.push({ role: 'assistant', m });
        } else if (isImageModel && (m.imageKeys && m.imageKeys.length)) {
          history.push({ role: 'assistant', m });
        }
      }
    }

    const selected = history.slice(-ctx);
    for (const h of selected) {
      const m = h.m;

      if (!isImageModel) {
        // For text-only models, ignore images in history.
        if (m.text) msgs.push({ role: h.role, content: m.text });
        continue;
      }

      const parts = [];
      if (m.text) parts.push({ type: 'text', text: m.text });

      const keys = h.role === 'user'
        ? (m.userImageKeys || [])
        : (m.imageKeys || []);

      for (const k of keys) {
        const src = await loadImage(k);
        if (src) parts.push({ type: 'image_url', image_url: { url: src } });
      }

      if (parts.length) {
        msgs.push({ role: h.role, content: parts });
      } else if (m.text) {
        msgs.push({ role: h.role, content: m.text });
      }
    }
  }

  // Current message
  const last = msgs[msgs.length - 1];
  const lastUserText = last && last.role === 'user' ? extractTextFromContent(last.content) : '';
  if (!last || last.role !== 'user' || lastUserText !== finalText) {
    if (userImageDataUrls.length) {
      const contentParts = [{ type: 'text', text: finalText }];
      for (const du of userImageDataUrls) {
        contentParts.push({ type: 'image_url', image_url: { url: du } });
      }
      msgs.push({ role: 'user', content: contentParts });
    } else {
      msgs.push({ role: 'user', content: finalText });
    }
  }

  return msgs;
}


/* =====================================================
   Generation
   ===================================================== */
let isGenerating = false;
let abortController = null;

// Saved state for restoring after abort
let lastSentText = '';
let lastSentAttachments = [];

function onSend() {
  if (isGenerating) {
    stopGeneration();
  } else {
    // If in edit mode, confirm the edit instead of sending
    if (editingMessageId) {
      confirmEdit();
      return;
    }
    generate();
  }
}

function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

async function generate() {
  if (isGenerating) return;

  const text = document.getElementById('pr').value.trim();
  if (!text && !pendingAttachments.length) return;

  const key = activeKey();
  const model = document.getElementById('mS').value;
  if (!key) { showToast('Выберите API ключ в настройках →'); return; }
  if (!model) { showToast('Выберите модель'); return; }
  if (!currentChat) newChat();

  const userText = text || '(изображение)';

  // Save state for possible abort restore
  lastSentText = userText;
  lastSentAttachments = [...pendingAttachments];

  const attachments = [...pendingAttachments];
  pendingAttachments = [];
  renderAttachPreview();

  document.getElementById('pr').value = '';
  autoResize(document.getElementById('pr'));

  let reuseLastUser = false;
  let lastUserIdx = -1;
  for (let i = messageEntries.length - 1; i >= 0; i--) {
    if (messageEntries[i].role === 'user') {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx !== -1) {
    const lastUser = messageEntries[lastUserIdx];
    const hasAssistantAfter = messageEntries.slice(lastUserIdx + 1).some(m => m.role === 'assistant');
    reuseLastUser = !hasAssistantAfter && (lastUser.text || '') === userText;
  }

  // Save user-attached images to IndexedDB before adding user message
  const userImageKeysForMessage = [];
  for (const att of attachments) {
    const imgKey = await saveImage(att.dataUrl);
    userImageKeysForMessage.push(imgKey);
  }

  // Show user message immediately (except resend after abort/error when it's already the last one).
  if (!reuseLastUser) {
    await addUserMessage(userText, null, true, userImageKeysForMessage);
    if (currentChat && currentChat.name === 'Новый чат') {
      currentChat.name = userText.length > 40 ? userText.substring(0, 40) + '…' : userText;
    }
    renderChatList();
  }

  logBlink('📤', 'Отправка', {
    модель: model,
    текст: userText.length + ' симв.',
    вложения: attachments.length,
    контекст: (parseInt(document.getElementById('cI').value) || 0) + ' сообщ.'
  });

  doGenerate(userText, false, [], reuseLastUser ? [] : attachments);
}

async function doGenerate(userText, addUser, existingSwipes = [], attachments = []) {
  const key = activeKey();
  const model = document.getElementById('mS').value;
  if (!key) { showToast('Выберите API ключ'); return; }
  if (!model) { showToast('Выберите модель'); return; }

  isGenerating = true;
  const btn = document.getElementById('sBtn');
  btn.className = 'sbtn stp';
  btn.innerHTML = '⏹';

  // Save user-attached images to IndexedDB
  const userImageKeys = [];
  const userImageDataUrls = [];
  for (const att of attachments) {
    const imgKey = await saveImage(att.dataUrl);
    userImageKeys.push(imgKey);
    userImageDataUrls.push(att.dataUrl);
  }

  const apiMessages = await buildMessages(userText, userImageDataUrls);
  const temp = parseFloat(document.getElementById('tI').value);

  addLoading();
  abortController = new AbortController();

  try {
    const body = { model, messages: apiMessages };
    if (!isNaN(temp)) body.temperature = temp;
    logBlink('🌐', 'API запрос', {
      модель: model,
      сообщений: apiMessages.length,
      температура: isNaN(temp) ? 'авто' : temp
    });

    const resp = await fetch('https://core.blink.new/api/v1/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify(body),
      signal: abortController.signal
    });

    const elapsed = ((Date.now() - genTimerStart) / 1000).toFixed(1);
    removeLoading();

    let data;
    const rawText = await resp.text();
    try { data = JSON.parse(rawText); }
    catch {
      // Keep prompt ready for one-click retry.
      document.getElementById('pr').value = lastSentText;
      autoResize(document.getElementById('pr'));
      pendingAttachments = [...lastSentAttachments];
      renderAttachPreview();

      logBlinkError('❌', 'Ответ не JSON', { модель: model, статус: resp.status, длина: rawText.length });
      addErrorMessage(model, 'Ответ не JSON:\n' + rawText.substring(0, 600));
      return;
    }

    if (!resp.ok) {
      const errMsg = data.error?.message || data.message || 'HTTP ' + resp.status;
      const errCode = data.error?.code || '';

      document.getElementById('pr').value = lastSentText;
      autoResize(document.getElementById('pr'));
      pendingAttachments = [...lastSentAttachments];
      renderAttachPreview();

      logBlinkError('❌', `HTTP ошибка (${resp.status})`, { модель: model, код: errCode, время: elapsed + 'с', ошибка: errMsg });
      addErrorMessage(model, `Ошибка (${resp.status})${errCode ? ' [' + errCode + ']' : ''}:\n${errMsg}`, data);
      return;
    }

    const images = findImages(data);
    const { text, reasoning } = extractContent(data);

    const imageKeys = [];
    for (const src of images) {
      const k = await saveImage(src);
      imageKeys.push(k);
    }

    const usage = data.usage || null;
    logBlinkSuccess('✅', `Генерация завершена за ${elapsed}с`, {
      модель: model,
      картинок: images.length,
      текст: text ? text.length + ' симв.' : 'нет',
      токены: usage ? `${usage.total_tokens ?? '?'} (${usage.prompt_tokens ?? '?'} → ${usage.completion_tokens ?? '?'})` : 'н/д'
    });

    const newSwipe = { text, imageKeys, reasoning, usage, elapsed };
    const allSwipes = [...existingSwipes, newSwipe];

    await addBotMessage(model, imageKeys, text, reasoning, usage, elapsed, data, null, true, allSwipes, allSwipes.length - 1);

    // Clear saved state on success
    lastSentText = '';
    lastSentAttachments = [];

  } catch (e) {
    removeLoading();
    if (e.name === 'AbortError') {
      showToast('Остановлено');
      logBlinkWarn('⏹', 'Генерация отменена', { модель: model });

      // FIX #1: Restore text and attachments to input on abort
      if (lastSentText || lastSentAttachments.length) {
        document.getElementById('pr').value = lastSentText;
        autoResize(document.getElementById('pr'));
        pendingAttachments = lastSentAttachments;
        renderAttachPreview();
        lastSentText = '';
        lastSentAttachments = [];
      }
    } else {
      document.getElementById('pr').value = lastSentText;
      autoResize(document.getElementById('pr'));
      pendingAttachments = [...lastSentAttachments];
      renderAttachPreview();

      logBlinkError('🌐', 'Ошибка сети', { модель: model || '—', ошибка: e.message });
      addErrorMessage(model || '', 'Ошибка сети: ' + e.message);
    }
  } finally {
    isGenerating = false;
    abortController = null;
    const btn = document.getElementById('sBtn');
    btn.className = 'sbtn go';
    btn.innerHTML = '▶';
    btn.disabled = false;
  }
}


/* =====================================================
   Export / Import (all data)
   ===================================================== */
async function exportAllData() {
  showToast('Подготовка экспорта...');

  const includeKeys = lsGet('exKeys') === '1';
  if (includeKeys && !confirm('В экспорт попадут ваши API ключи. Это может быть небезопасно. Продолжить?')) {
    showToast('Экспорт отменён');
    return;
  }

  const exportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    chats: getChats(),
    keys: includeKeys ? getKeys() : [],
    settings: {
      theme: lsGet('theme'),
      model: lsGet('model'),
      kPersist: lsGet('kPersist'),
      exKeys: lsGet('exKeys'),
      selK: ksGet('selK'),
      sP: lsGet('sP'),
      nP: lsGet('nP'),
      aR: lsGet('aR'),
      ctx: lsGet('ctx'),
      tmp: lsGet('tmp'),
      presets: lsGet('presets')
    },
    images: {}
  };

  // Gather all image keys
  const allImageKeys = new Set();
  exportData.chats.forEach(chat => {
    (chat.messages || []).forEach(msg => {
      (msg.imageKeys || []).forEach(k => allImageKeys.add(k));
      (msg.userImageKeys || []).forEach(k => allImageKeys.add(k));
      (msg.swipes || []).forEach(sw => {
        (sw.imageKeys || []).forEach(k => allImageKeys.add(k));
      });
    });
  });

  for (const key of allImageKeys) {
    const data = await dbGet(key);
    if (data) exportData.images[key] = data;
  }

  const json = JSON.stringify(exportData);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blink_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Экспорт — ' + (json.length / 1024 / 1024).toFixed(1) + ' МБ');
}

// Экспорт одного чата
async function exportSingleChat(chatId) {
  const chats = getChats();
  const chat = chats.find(c => c.id === chatId);
  if (!chat) { showToast('Чат не найден'); return; }

  showToast('Экспорт чата...');

  const allImageKeys = new Set();
  (chat.messages || []).forEach(msg => {
    (msg.imageKeys || []).forEach(k => allImageKeys.add(k));
    (msg.userImageKeys || []).forEach(k => allImageKeys.add(k));
    (msg.swipes || []).forEach(sw => {
      (sw.imageKeys || []).forEach(k => allImageKeys.add(k));
    });
  });

  const images = {};
  for (const key of allImageKeys) {
    const data = await dbGet(key);
    if (data) images[key] = data;
  }

  const exportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    chats: [chat],
    keys: [],
    settings: {},
    images
  };

  const json = JSON.stringify(exportData);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (chat.name || 'chat').replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_').substring(0, 40);
  a.download = `blink_chat_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Экспорт чата — ' + (json.length / 1024 / 1024).toFixed(1) + ' МБ');
}

// Индикатор размера IndexedDB
async function estimateStorageSize() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usedMB = ((est.usage || 0) / 1024 / 1024).toFixed(1);
      const quotaMB = ((est.quota || 0) / 1024 / 1024).toFixed(0);
      return { usedMB, quotaMB, usage: est.usage || 0, quota: est.quota || 0 };
    } catch { }
  }
  return null;
}

async function updateStorageIndicator() {
  const el = document.getElementById('storageInfo');
  if (!el) return;
  const info = await estimateStorageSize();
  if (info) {
    const pct = info.quota > 0 ? ((info.usage / info.quota) * 100).toFixed(1) : '?';
    el.textContent = `💾 ${info.usedMB} МБ / ${info.quotaMB} МБ (${pct}%)`;
    el.title = `Использовано: ${info.usedMB} МБ из ${info.quotaMB} МБ`;
  } else {
    el.textContent = '💾 Размер недоступен';
  }
}

function importAllData() {
  document.getElementById('importFile').click();
}

async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';
  showToast('Импорт...');

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.version || !data.chats) {
      showToast('Неверный формат');
      return;
    }

    if (!confirm(`Импортировать ${data.chats.length} чатов и ${Object.keys(data.images || {}).length} картинок?\nСуществующие данные будут объединены.`)) {
      return;
    }

    // Import images
    const imgs = data.images || {};
    for (const [k, v] of Object.entries(imgs)) {
      await dbPut(k, v);
    }

    // Merge chats
    const existingChats = getChats();
    const existingIds = new Set(existingChats.map(c => c.id));
    const newChats = (data.chats || []).filter(c => !existingIds.has(c.id));
    saveChats([...newChats, ...existingChats]);

    // Merge keys
    const existingKeys = getKeys();
    const existingKeyIds = new Set(existingKeys.map(k => k.id));
    const newKeys = (data.keys || []).filter(k => !existingKeyIds.has(k.id));
    saveKeys([...existingKeys, ...newKeys]);

    // Import presets
    if (data.settings?.presets) {
      try {
        const existingPresets = getPresets();
        const importedPresets = JSON.parse(data.settings.presets || '[]');
        const existingNames = new Set(existingPresets.map(p => p.name));
        const newPresets = importedPresets.filter(p => !existingNames.has(p.name));
        savePresetsList([...existingPresets, ...newPresets]);
      } catch { }
    }

    renderKeySelect();
    renderChatList();
    renderPresets();
    if (getChats().length) switchChat(getChats()[0].id);

    showToast(`Импорт: ${newChats.length} чатов, ${Object.keys(imgs).length} картинок`);
    updateStorageIndicator();

  } catch (e) {
    showToast('Ошибка: ' + e.message);
  }
}


/* =====================================================
   Gallery
   ===================================================== */
let galleryData = [];
let galleryPage = 0;
const GALLERY_PAGE_SIZE = 30;
let galleryLoading = false;

async function openGallery() {
  const body = document.getElementById('galBody');
  body.innerHTML = '<div style="color:var(--text4);font-size:12px;padding:20px;grid-column:1/-1;text-align:center">Загрузка...</div>';
  document.getElementById('galOv').classList.add('act');
  document.getElementById('galSearch').value = '';

  galleryData = [];
  galleryPage = 0;

  getChats().forEach(chat => {
    const msgs = chat.messages || [];
    msgs.forEach((msg, msgIdx) => {
      // Для бот/error-сообщений ищем промпт в предыдущем user-сообщении
      let prompt = '';
      if (msg.role === 'user') {
        prompt = msg.text || '';
      } else {
        // assistant или error — ищем ближайший user выше
        for (let j = msgIdx - 1; j >= 0; j--) {
          if (msgs[j].role === 'user') {
            prompt = msgs[j].text || '';
            break;
          }
        }
      }

      const addKeys = (keys) => {
        (keys || []).forEach(k => {
          galleryData.push({
            key: k,
            chatName: chat.name,
            chatId: chat.id,
            ts: msg.ts,
            prompt: prompt
          });
        });
      };
      addKeys(msg.imageKeys);
      addKeys(msg.userImageKeys);
      (msg.swipes || []).forEach(sw => addKeys(sw.imageKeys));
    });
  });

  // Deduplicate
  const seen = new Set();
  galleryData = galleryData.filter(item => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
  galleryData.reverse();

  await renderGalleryPage(galleryData, false);
  setupGalleryScroll();
}

// Ленивая загрузка — рендерим по GALLERY_PAGE_SIZE
async function renderGalleryPage(items, append) {
  const body = document.getElementById('galBody');

  if (!items.length && !append) {
    body.innerHTML = '<div style="color:var(--text4);font-size:12px;padding:20px;grid-column:1/-1;text-align:center">Нет изображений</div>';
    return;
  }

  if (!append) {
    body.innerHTML = '';
    galleryPage = 0;
  }

  const start = galleryPage * GALLERY_PAGE_SIZE;
  const end = start + GALLERY_PAGE_SIZE;
  const page = items.slice(start, end);

  if (!page.length) return;

  for (const item of page) {
    const src = await loadImage(item.key);
    if (!src) continue;

    const div = document.createElement('div');
    div.className = 'gal-item';
    const shortPrompt = (item.prompt || '').length > 60 ? item.prompt.substring(0, 60) + '…' : (item.prompt || '');
    const displayText = shortPrompt || item.chatName;
    div.innerHTML = `
      <img src="${escapeAttr(src)}" alt="img" loading="lazy" onclick="event.stopPropagation();openOverlay(this.src)" />
      <div class="gal-prompt" title="${escapeAttr(item.prompt || '')}">${escapeHtml(displayText)}</div>
      <button class="gal-dl" data-imgkey="${escapeAttr(item.key)}" onclick="event.stopPropagation();galleryDownloadByKey(this)">⬇️</button>`;
    body.appendChild(div);
  }

  galleryPage++;
  galleryLoading = false;
}

function setupGalleryScroll() {
  const body = document.getElementById('galBody');
  body.onscroll = () => {
    if (galleryLoading) return;
    const threshold = body.scrollHeight - body.scrollTop - body.clientHeight;
    if (threshold < 200) {
      const query = (document.getElementById('galSearch').value || '').toLowerCase().trim();
      const items = query
        ? galleryData.filter(i => i.chatName.toLowerCase().includes(query) || (i.prompt || '').toLowerCase().includes(query))
        : galleryData;
      if (galleryPage * GALLERY_PAGE_SIZE < items.length) {
        galleryLoading = true;
        renderGalleryPage(items, true);
      }
    }
  };
}

function filterGallery() {
  const query = (document.getElementById('galSearch').value || '').toLowerCase().trim();
  galleryPage = 0;
  if (!query) {
    renderGalleryPage(galleryData, false);
    return;
  }
  const filtered = galleryData.filter(item =>
    item.chatName.toLowerCase().includes(query) ||
    (item.prompt || '').toLowerCase().includes(query)
  );
  renderGalleryPage(filtered, false);
}

function closeGallery() {
  document.getElementById('galOv').classList.remove('act');
  const body = document.getElementById('galBody');
  body.onscroll = null;
}

async function galleryDownloadByKey(btn) {
  const key = btn.dataset.imgkey;
  if (!key) return;
  const src = await loadImage(key);
  if (!src) { showToast('Изображение не найдено'); return; }
  triggerDownload(src, 0);
}


/* =====================================================
   Presets — Full CRUD with Active Tracking
   ===================================================== */

// Встроенные пресеты (можно перезаписывать и удалять)
const BUILTIN_PRESETS = [
  {
    name: '🚫 Без пресета',
    sysPrompt: '',
    negPrompt: '',
    builtin: true
  },
  {
    name: '🖼️ Высокое качество',
    sysPrompt: 'You are a professional AI artist. Generate high-quality, detailed images with excellent composition, lighting, and color. Always aim for photorealistic or highly polished artistic quality unless told otherwise.',
    negPrompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy, watermark, text, signature',
    builtin: true
  },
  {
    name: '🎌 Аниме',
    sysPrompt: 'You are an anime-style AI artist. Generate images in high-quality anime/manga art style with vibrant colors, clean lines, and expressive characters. Follow the style of modern anime productions.',
    negPrompt: 'photorealistic, 3d render, low quality, blurry, deformed',
    builtin: true
  },
  {
    name: '📸 Фотореализм',
    sysPrompt: 'Generate photorealistic images indistinguishable from real photographs. Use natural lighting, accurate shadows, realistic textures, and proper depth of field. Pay attention to fine details like skin pores, fabric weave, and environmental reflections.',
    negPrompt: 'cartoon, anime, drawing, painting, illustration, artificial, CGI, low quality, blurry',
    builtin: true
  },
  {
    name: '🎨 Цифровой арт',
    sysPrompt: 'Create digital art with rich colors, dynamic composition, and polished rendering. Style similar to professional concept art and digital illustrations found on ArtStation. Emphasize dramatic lighting and detailed environments.',
    negPrompt: 'low quality, blurry, amateur, sketch, unfinished',
    builtin: true
  },
  {
    name: '🖌️ Масляная живопись',
    sysPrompt: 'Generate images in the style of classical oil painting. Use visible brushstrokes, rich color palette, dramatic chiaroscuro lighting, and the texture of oil on canvas. Inspired by masters like Rembrandt, Vermeer, and the Impressionists.',
    negPrompt: 'digital art, photograph, anime, cartoon, flat colors, modern',
    builtin: true
  },
  {
    name: '✏️ Карандашный скетч',
    sysPrompt: 'Create images in pencil sketch style. Use clean linework, crosshatching for shading, and the natural texture of graphite on paper. The drawing should look hand-drawn with artistic skill.',
    negPrompt: 'color, painting, photograph, digital, blurry, messy',
    builtin: true
  },
  {
    name: '🌸 Акварель',
    sysPrompt: 'Generate images in watercolor painting style. Use soft, flowing colors that bleed into each other, visible paper texture, delicate washes, and the characteristic transparency of watercolor medium.',
    negPrompt: 'digital art, photograph, sharp edges, heavy outlines, dark, gritty',
    builtin: true
  },
  {
    name: '🕹️ Пиксель-арт',
    sysPrompt: 'Create pixel art images with a retro video game aesthetic. Use a limited color palette, visible pixels, clean pixel placement, and the charm of 16-bit or 32-bit era graphics.',
    negPrompt: 'realistic, photograph, smooth gradients, high resolution, blurry',
    builtin: true
  },
  {
    name: '🌆 Киберпанк',
    sysPrompt: 'Generate images in cyberpunk aesthetic. Use neon lights, rain-slicked streets, holographic displays, futuristic technology, dark atmosphere with vibrant neon accents in pink, blue, and purple. Inspired by Blade Runner and Ghost in the Shell.',
    negPrompt: 'nature, pastoral, bright daylight, medieval, cartoon, low quality',
    builtin: true
  },
  {
    name: '🏰 Фэнтези',
    sysPrompt: 'Create epic fantasy art with magical atmospheres, mythical creatures, enchanted landscapes, and heroic characters. Use dramatic lighting, rich details, and a sense of wonder. Inspired by classic fantasy illustrations and concept art.',
    negPrompt: 'modern, urban, technology, sci-fi, photograph, low quality',
    builtin: true
  },
  {
    name: '📰 Комикс',
    sysPrompt: 'Generate images in comic book / graphic novel style. Use bold outlines, cel shading, dynamic poses, halftone dots, speech bubble aesthetics, and vibrant flat colors. Inspired by Marvel/DC comics and manga.',
    negPrompt: 'photorealistic, painting, watercolor, blurry, low quality',
    builtin: true
  },
  {
    name: '🎭 Минимализм',
    sysPrompt: 'Create minimalist art with clean lines, simple shapes, limited color palette, and plenty of negative space. Focus on essential elements only, removing all unnecessary details. Modern and elegant aesthetic.',
    negPrompt: 'complex, detailed, busy, cluttered, realistic, photograph',
    builtin: true
  }
];

function getPresets() {
  try { return JSON.parse(lsGet('presets') || '[]'); }
  catch { return []; }
}

function getAllPresetsWithBuiltin() {
  const userPresets = getPresets();
  // Добавляем встроенные пресеты, которых нет в пользовательских (по имени)
  const userNames = new Set(userPresets.map(p => p.name));
  const missing = BUILTIN_PRESETS.filter(p => !userNames.has(p.name));
  return [...userPresets, ...missing];
}

function savePresetsList(presets) {
  lsSet('presets', JSON.stringify(presets));
}

let editingPresetIdx = -1;
let activePresetIdx = -1; // index of currently applied preset

function openPresetEditor(idx) {
  editingPresetIdx = idx;
  const presets = getAllPresetsWithBuiltin();

  if (idx >= 0 && idx < presets.length) {
    const p = presets[idx];
    document.getElementById('presetEditorTitle').textContent = 'Редактировать пресет';
    document.getElementById('presetNameInput').value = p.name || '';
    document.getElementById('presetSysInput').value = p.sysPrompt || '';
    document.getElementById('presetNegInput').value = p.negPrompt || '';
  } else {
    document.getElementById('presetEditorTitle').textContent = 'Новый пресет';
    document.getElementById('presetNameInput').value = '';
    document.getElementById('presetSysInput').value = '';
    document.getElementById('presetNegInput').value = '';
  }

  document.getElementById('presetOv').classList.add('act');
  document.getElementById('presetNameInput').focus();
}

function closePresetEditor() {
  document.getElementById('presetOv').classList.remove('act');
  editingPresetIdx = -1;
}

function savePresetFromEditor() {
  const name = document.getElementById('presetNameInput').value.trim();
  const sys = document.getElementById('presetSysInput').value.trim();
  const neg = document.getElementById('presetNegInput').value.trim();

  if (!name) { showToast('Введите название'); return; }

  const presets = getPresets();
  const allPresets = getAllPresetsWithBuiltin();

  if (editingPresetIdx >= 0 && editingPresetIdx < allPresets.length) {
    const editingPreset = allPresets[editingPresetIdx];
    // Ищем в пользовательских пресетах по имени оригинала
    const realIdx = presets.findIndex(p => p.name === editingPreset.name);

    if (realIdx !== -1) {
      // Обновляем существующий пользовательский пресет
      presets[realIdx].name = name;
      presets[realIdx].sysPrompt = sys;
      presets[realIdx].negPrompt = neg;
      showToast('Пресет обновлён');
    } else {
      // Перезаписываем встроенный — сохраняем как пользовательский с тем же именем
      presets.push({ name, sysPrompt: sys, negPrompt: neg, created: Date.now() });
      showToast('Пресет сохранён');
    }
  } else {
    // Создаём новый
    presets.push({ name, sysPrompt: sys, negPrompt: neg, created: Date.now() });
    showToast('Пресет создан');
  }

  savePresetsList(presets);
  renderPresets();
  closePresetEditor();
}

// Update the currently active preset with current prompts
function updateActivePreset() {
  if (activePresetIdx < 0) return;

  const allPresets = getAllPresetsWithBuiltin();
  if (activePresetIdx >= allPresets.length) return;

  const preset = allPresets[activePresetIdx];
  const sys = document.getElementById('sP').value.trim();
  const neg = document.getElementById('nP').value.trim();

  const presets = getPresets();
  const realIdx = presets.findIndex(p => p.name === preset.name);

  if (realIdx !== -1) {
    // Обновляем существующий пользовательский пресет
    presets[realIdx].sysPrompt = sys;
    presets[realIdx].negPrompt = neg;
  } else {
    // Встроенный — создаём пользовательскую перезапись
    presets.push({ name: preset.name, sysPrompt: sys, negPrompt: neg, created: Date.now() });
  }

  savePresetsList(presets);
  renderPresets();
  showToast('Пресет «' + preset.name + '» обновлён');
}

function applyPreset(idx) {
  const presets = getAllPresetsWithBuiltin();
  if (idx < 0 || idx >= presets.length) return;

  const p = presets[idx];
  document.getElementById('sP').value = p.sysPrompt || '';
  document.getElementById('nP').value = p.negPrompt || '';

  // «Без пресета» — сбрасываем активный индекс
  if (!p.sysPrompt && !p.negPrompt) {
    activePresetIdx = -1;
    showToast('Промпты очищены');
  } else {
    activePresetIdx = idx;
    showToast('Пресет «' + p.name + '» применён');
  }

  debouncedSave();
  renderPresets();
  updateSaveButton();
}

function deletePreset(idx) {
  const allPresets = getAllPresetsWithBuiltin();
  const preset = allPresets[idx];
  if (!preset) return;

  const isOverriddenBuiltin = preset.builtin && getPresets().some(p => p.name === preset.name);

  if (preset.builtin && !isOverriddenBuiltin) {
    // Чистый встроенный — нечего удалять
    showToast('Встроенный пресет нельзя удалить');
    return;
  }

  const label = isOverriddenBuiltin ? 'Сбросить пресет к встроенному?' : 'Удалить пресет?';
  if (!confirm(label)) return;

  const presets = getPresets();
  const realIdx = presets.findIndex(p => p.name === preset.name);
  if (realIdx !== -1) {
    presets.splice(realIdx, 1);
  }

  // Fix active index
  if (activePresetIdx === idx) activePresetIdx = -1;
  else if (activePresetIdx > idx) activePresetIdx--;

  savePresetsList(presets);
  renderPresets();
  updateSaveButton();
  showToast(isOverriddenBuiltin ? 'Сброшен к встроенному' : 'Удалён');
}

function updateSaveButton() {
  const btn = document.getElementById('presetSaveBtn');

  if (activePresetIdx >= 0) {
    const allPresets = getAllPresetsWithBuiltin();
    if (activePresetIdx < allPresets.length) {
      const name = allPresets[activePresetIdx].name;
      const shortName = name.length > 14 ? name.substring(0, 14) + '…' : name;
      btn.textContent = '💾 Обновить «' + shortName + '»';
      btn.style.display = '';
      return;
    }
  }

  btn.style.display = 'none';
}

function renderPresets() {
  const container = document.getElementById('presetList');
  const allPresets = getAllPresetsWithBuiltin();

  container.innerHTML = '';

  if (!allPresets.length) {
    container.innerHTML = '<div style="color:var(--text4);font-size:9px;padding:4px">Нет пресетов</div>';
    return;
  }

  const userPresets = getPresets();
  const userNames = new Set(userPresets.map(p => p.name));

  allPresets.forEach((preset, idx) => {
    const div = document.createElement('div');
    div.className = 'preset-item' + (idx === activePresetIdx ? ' preset-active' : '');
    div.onclick = () => applyPreset(idx);

    const hint = (preset.sysPrompt ? 'Sys: ' + preset.sysPrompt.substring(0, 60) : '') +
      (preset.negPrompt ? (preset.sysPrompt ? '\nNeg: ' : 'Neg: ') + preset.negPrompt.substring(0, 60) : '');

    const isBuiltin = preset.builtin;
    const isOverridden = isBuiltin && userNames.has(preset.name);

    div.innerHTML = `
      <span class="preset-name" title="${escapeAttr(hint)}">${escapeHtml(preset.name)}${isBuiltin && !isOverridden ? ' <span style="color:var(--text4);font-size:8px">встр.</span>' : ''}${isOverridden ? ' <span style="color:var(--accent);font-size:8px">изм.</span>' : ''}</span>
      <button class="preset-edit" onclick="event.stopPropagation();openPresetEditor(${idx})" title="Редактировать">✏️</button>
      <button class="preset-del" onclick="event.stopPropagation();deletePreset(${idx})" title="${isOverridden ? 'Сбросить' : 'Удалить'}">✕</button>`;

    container.appendChild(div);
  });

  updateSaveButton();
}


/* =====================================================
   Image Download
   ===================================================== */
function triggerDownload(src, idx) {
  const a = document.createElement('a');
  if (src.startsWith('data:')) {
    a.href = src;
    a.download = `blink_${Date.now()}_${idx + 1}.${(src.match(/image\/(\w+)/) || [, 'png'])[1]}`;
  } else {
    a.href = src;
    a.download = `blink_${Date.now()}.png`;
    a.target = '_blank';
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Скачивание');
}

async function downloadImageByKey(btn, idx) {
  const key = btn.dataset.imgkey;
  if (!key) return;
  const src = await loadImage(key);
  if (!src) { showToast('Изображение не найдено'); return; }
  triggerDownload(src, idx);
}


/* =====================================================
   Image Overlay
   ===================================================== */
function openOverlay(src) {
  document.getElementById('ovI').src = src;
  document.getElementById('ov').classList.add('act');
}

function clOv() {
  document.getElementById('ov').classList.remove('act');
  document.getElementById('ovI').src = '';
}


/* =====================================================
   Panel Toggles
   ===================================================== */
function togL() {
  document.getElementById('lp').classList.toggle('open');
  document.getElementById('pbd').classList.toggle('show');
}

function togR() {
  document.getElementById('rp').classList.toggle('open');
  document.getElementById('pbd').classList.toggle('show');
}

function closePanel() {
  document.getElementById('lp').classList.remove('open');
  document.getElementById('rp').classList.remove('open');
  document.getElementById('pbd').classList.remove('show');
}

const clP = closePanel;


/* =====================================================
   Utility Functions
   ===================================================== */
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showToast(msg) {
  const t = document.getElementById('tst');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

function scrollToBottom() {
  const container = document.getElementById('msgs');
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}


/* =====================================================
   Resize Panels
   ===================================================== */
function initResize() {
  setupResize('resL', 'lp', 'left');
  setupResize('resR', 'rp', 'right');
}

function setupResize(handleId, panelId, side) {
  const handle = document.getElementById(handleId);
  const panel = document.getElementById(panelId);
  if (!handle || !panel) return;

  let startX, startWidth;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = panel.offsetWidth;
    handle.classList.add('act');

    function onMove(e) {
      const dx = side === 'left' ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.max(160, Math.min(400, startWidth + dx));
      panel.style.width = newWidth + 'px';
      panel.style.minWidth = newWidth + 'px';
    }

    function onUp() {
      handle.classList.remove('act');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      lsSet(side + 'W', panel.offsetWidth);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  const saved = lsGet(side + 'W');
  if (saved) {
    panel.style.width = saved + 'px';
    panel.style.minWidth = saved + 'px';
  }
}


/* =====================================================
   Initialization
   ===================================================== */
async function init() {
  const startTime = performance.now();

  console.log(
    '%c🎨 Blink Generator v' + APP_VERSION + '%c\n' +
    '   Запуск: ' + new Date().toLocaleString('ru') + '\n' +
    '   Документация: README.md',
    'color:#5b9ef0;font-size:16px;font-weight:bold',
    'color:#a8a8b2;font-size:11px'
  );

  await openDatabase();
  logBlink('💾', 'IndexedDB подключена');

  applyTheme();
  renderThemes();
  // Defaults for new toggles (security/exports)
  if (lsGet('kPersist') === null) lsSet('kPersist', '1');
  if (lsGet('exKeys') === null) lsSet('exKeys', '0');
  const kPersistEl = document.getElementById('kPersist');
  if (kPersistEl) kPersistEl.checked = lsGet('kPersist') !== '0';
  const exKeysEl = document.getElementById('exKeys');
  if (exKeysEl) exKeysEl.checked = lsGet('exKeys') === '1';
  renderKeySelect();
  renderModels();
  loadAllSettings();
  renderPresets();
  initResize();

  const chats = getChats();
  const activeId = lsGet('aCh');
  const keys = getKeys();
  const model = lsGet('model') || '—';
  const theme = lsGet('theme') || 'default';

  logBlink('⚙️', 'Настройки загружены', {
    тема: theme,
    модель: model,
    чатов: chats.length,
    ключей: keys.length,
    пресетов: getAllPresetsWithBuiltin().length
  });

  if (!chats.length) {
    newChat();
  } else if (activeId && chats.find(c => c.id === activeId)) {
    switchChat(activeId);
  } else {
    switchChat(chats[0].id);
  }

  // Обновить индикатор хранилища
  updateStorageIndicator();

  const elapsed = (performance.now() - startTime).toFixed(0);
  logBlinkSuccess('✅', `Инициализация завершена за ${elapsed}мс`);
}

init();


/* =====================================================
   Event Listeners
   ===================================================== */

// Enter to send (Shift+Enter for newline)
document.getElementById('pr').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (editingMessageId) {
      confirmEdit();
    } else if (!isGenerating) {
      generate();
    }
  }
  // Escape to cancel edit
  if (e.key === 'Escape' && editingMessageId) {
    cancelEdit();
  }
});

// Auto-resize textarea
document.getElementById('pr').addEventListener('input', function () {
  autoResize(this);
});

// Paste images into textarea
document.getElementById('pr').addEventListener('paste', handlePaste);

// Drag & drop on input area
const cinpEl = document.getElementById('cinp');
cinpEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  cinpEl.classList.add('drag-over');
});
cinpEl.addEventListener('dragleave', () => {
  cinpEl.classList.remove('drag-over');
});
cinpEl.addEventListener('drop', handleDrop);

// Drag & drop on messages area too
const msgsEl = document.getElementById('msgs');
msgsEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  cinpEl.classList.add('drag-over');
});
msgsEl.addEventListener('dragleave', () => {
  cinpEl.classList.remove('drag-over');
});
msgsEl.addEventListener('drop', handleDrop);

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape — закрыть оверлеи
  if (e.key === 'Escape') {
    clOv();
    closeGallery();
    closePresetEditor();
    if (editingMessageId) cancelEdit();
  }

  // Ctrl+Z — отмена (не в текстовых полях)
  if (e.ctrlKey && e.key === 'z') {
    const tag = document.activeElement?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    e.preventDefault();
    doUndo();
  }

  // Ctrl+Enter — отправить из любого места
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (editingMessageId) {
      confirmEdit();
    } else if (!isGenerating) {
      generate();
    }
  }

  // Ctrl+Shift+N — новый чат
  if (e.ctrlKey && e.shiftKey && e.key === 'N') {
    e.preventDefault();
    newChat();
  }

  // Ctrl+G — галерея
  if (e.ctrlKey && e.key === 'g') {
    e.preventDefault();
    const galOv = document.getElementById('galOv');
    if (galOv.classList.contains('act')) closeGallery();
    else openGallery();
  }

  // Ctrl+/ — фокус на поле ввода
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    document.getElementById('pr').focus();
  }
});

// Save on unload
window.addEventListener('beforeunload', () => {
  saveCurrentChat();
  saveAllSettings();
});