/* ── RealProduct · API Client ── */
const API = 'http://localhost:3000/api';

const rp = {
  /* ── Auth helpers ── */
  getToken: () => localStorage.getItem('rp_token'),
  getUser:  () => JSON.parse(localStorage.getItem('rp_user') || 'null'),
  isLogged: () => !!localStorage.getItem('rp_token'),

  setSession(token, user) {
    localStorage.setItem('rp_token', token);
    localStorage.setItem('rp_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('rp_token');
    localStorage.removeItem('rp_user');
  },

  /* ── HTTP ── */
  async request(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.getToken()) headers['Authorization'] = `Bearer ${this.getToken()}`;
    const res = await fetch(`${API}${path}`, { headers, ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
  },

  get:    (path)         => rp.request(path),
  post:   (path, body)   => rp.request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => rp.request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)         => rp.request(path, { method: 'DELETE' }),

  /* ── Auth ── */
  register: (data) => rp.post('/auth/register', data),
  login:    (data) => rp.post('/auth/login',    data),
  me:       ()     => rp.get('/auth/me'),

  /* ── Products ── */
  searchProducts: (q, cat)  => rp.get(`/products?q=${encodeURIComponent(q||'')}&category_id=${cat||''}&limit=30`),
  getProduct:     (id)       => rp.get(`/products/${id}`),
  getCategories:  ()         => rp.get('/products/categories/all'),
  createProduct:  (data)     => rp.post('/products', data),
  createCategory: (name)     => rp.post('/products/categories', { name }),

  /* ── Prices ── */
  getRecent:     (limit=20) => rp.get(`/prices/recent?limit=${limit}`),
  getHistory:    (pid, sid) => rp.get(`/prices/history/${pid}${sid?`?store_id=${sid}`:''}`),
  addPrice:      (data)     => rp.post('/prices', data),
  deletePrice:   (id)       => rp.delete(`/prices/${id}`),
  votePrice:     (id, vote) => rp.post(`/prices/${id}/vote`, { vote }),

  /* ── Stores ── */
  getStores: (type) => rp.get(`/stores${type?`?type=${type}`:''}`),
  addStore:  (data) => rp.post('/stores', data),
};

/* ── Theme ── */
function initTheme() {
  const theme = localStorage.getItem('rp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('rp-theme', next);
  renderToggleIcon(next);
}
function renderToggleIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg viewBox="0 0 24 24" fill="none" style="width:15px;height:15px;stroke:var(--text2);stroke-width:2;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" style="width:15px;height:15px;stroke:var(--text2);stroke-width:2;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}

/* ── Nav user state ── */
function renderNav() {
  const user = rp.getUser();
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  if (!navAuth || !navUser) return;
  if (user) {
    navAuth.style.display = 'none';
    navUser.style.display = 'flex';
    const nameEl = document.getElementById('navUserName');
    const ptsEl  = document.getElementById('navUserPoints');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];
    if (ptsEl)  ptsEl.textContent  = `${user.points} pts`;
  } else {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
  }
}

/* ── Toast notifications ── */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px;stroke:currentColor;stroke-width:2;flex-shrink:0;">
      ${type === 'success'
        ? '<polyline points="20 6 9 17 4 12"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

/* ── Format time ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h/24)}j`;
}

/* ── Price color ── */
function priceClass(prices, current) {
  if (!prices || prices.length < 2) return '';
  const min = Math.min(...prices.map(p => p.price));
  const max = Math.max(...prices.map(p => p.price));
  if (current === min) return 'price-low';
  if (current === max) return 'price-high';
  return 'price-mid';
}

/* ── Modal ── */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderToggleIcon(localStorage.getItem('rp-theme') || 'dark');
  renderNav();
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    rp.clearSession(); window.location.href = '/';
  });
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});
