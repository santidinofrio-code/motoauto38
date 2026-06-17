/* ============================================
   MOTOAUTO38 — Catalog Logic (Supabase)
   ============================================ */

const MA38 = {

  // ---- AUTH (session only) ----
  AUTH_KEY:   'ma38_auth',
  ADMIN_USER: 'admin',
  ADMIN_PASS: '46111705Lobo!',

  login(user, pass) {
    if (user === this.ADMIN_USER && pass === this.ADMIN_PASS) {
      sessionStorage.setItem(this.AUTH_KEY, '1');
      return true;
    }
    return false;
  },
  logout()     { sessionStorage.removeItem(this.AUTH_KEY); },
  isLoggedIn() { return sessionStorage.getItem(this.AUTH_KEY) === '1'; },
  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = 'login.html';
  },

  // ---- UTILS ----
  formatPrice(p) {
    if (!p) return '—';
    return '$' + Number(p).toLocaleString('es-AR');
  },
  vehicleEmoji(type) {
    return { auto: '🚗', moto: '🏍️', camioneta: '🛻', otro: '🚙' }[type] || '🚙';
  },
  typeLabel(type) {
    return { auto: 'Automóvil', moto: 'Motocicleta', camioneta: 'Camioneta', otro: 'Otro' }[type] || type;
  },
};

// ---- CATALOG UI ----
async function initCatalog() {
  const grid = document.getElementById('vehicle-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⏳</div><h3>Cargando vehículos...</h3></div>`;

  let allVehicles = [];
  try {
    allVehicles = await DB.getVehicles();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error al cargar</h3><p>Revisá tu conexión e intentá de nuevo.</p></div>`;
    return;
  }

  function render(filter) {
    const list = filter === 'todos'
      ? allVehicles
      : allVehicles.filter(v => v.type === filter);

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Sin resultados</h3><p>No hay vehículos en esta categoría por el momento.</p></div>`;
      return;
    }

    grid.innerHTML = list.map(v => buildCard(v)).join('');
    grid.querySelectorAll('.vehicle-card').forEach(card => {
      card.addEventListener('click', async () => {
        const v = allVehicles.find(x => x.id === card.dataset.id);
        if (v) openModal(v);
      });
    });
  }

  function buildCard(v) {
    const thumb = v.images && v.images.length
      ? `<img src="${v.images[0]}" alt="${v.brand} ${v.model}" loading="lazy">`
      : `<div class="card-thumb-placeholder">${MA38.vehicleEmoji(v.type)}</div>`;

    const badge = v.featured
      ? `<span class="card-badge">Destacado</span>`
      : v.status === 'sold'
      ? `<span class="card-badge card-badge-sold">Vendido</span>`
      : v.status === 'reserved'
      ? `<span class="card-badge" style="background:#C8920A">Reservado</span>`
      : '';

    const imgCount = v.images && v.images.length > 1
      ? `<span class="card-img-count">📷 ${v.images.length}</span>` : '';

    const waMsg = encodeURIComponent(`Hola! Me interesa el ${v.brand} ${v.model} ${v.year}`);

    return `
      <div class="vehicle-card" data-id="${v.id}">
        <div class="card-thumb">
          ${thumb}
          ${badge}
          ${imgCount}
        </div>
        <div class="card-body">
          <div class="card-type">${MA38.typeLabel(v.type)}</div>
          <div class="card-name">${v.brand} ${v.model}</div>
          <div class="card-year">${v.version || ''} · ${v.year}</div>
          <div class="card-price">
            ${MA38.formatPrice(v.price)}
            <span class="card-price-currency">${v.currency}</span>
          </div>
          <div class="card-specs">
            <div class="spec-item">
              <div class="spec-label">Kilómetros</div>
              <div class="spec-val">${Number(v.km).toLocaleString('es-AR')} km</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">Color</div>
              <div class="spec-val">${v.color || '—'}</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">Combustible</div>
              <div class="spec-val">${v.fuel || '—'}</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">Caja</div>
              <div class="spec-val">${v.transmission || '—'}</div>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <a href="https://wa.me/542214816242?text=${waMsg}"
             target="_blank" class="btn btn-yellow btn-sm" style="flex:1" onclick="event.stopPropagation()">
            Consultar
          </a>
        </div>
      </div>`;
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.filter);
    });
  });

  render('todos');
}

// ---- MODAL ----
let galleryIdx = 0;
let galleryImages = [];

function openModal(v) {
  const overlay = document.getElementById('vehicle-modal');
  galleryImages = v.images && v.images.length ? v.images : [];
  galleryIdx = 0;

  overlay.querySelector('.modal-type').textContent = MA38.typeLabel(v.type);
  overlay.querySelector('.modal-name').textContent = `${v.brand} ${v.model}`;
  overlay.querySelector('.modal-year').textContent = `${v.version || ''} · ${v.year}`;
  overlay.querySelector('.modal-price').textContent = MA38.formatPrice(v.price);
  overlay.querySelector('.modal-currency').textContent = v.currency;

  overlay.querySelector('#ms-km').textContent    = Number(v.km).toLocaleString('es-AR') + ' km';
  overlay.querySelector('#ms-color').textContent = v.color || '—';
  overlay.querySelector('#ms-fuel').textContent  = v.fuel || '—';
  overlay.querySelector('#ms-trans').textContent = v.transmission || '—';
  overlay.querySelector('#ms-doors').textContent = v.doors ? v.doors + ' puertas' : '—';
  overlay.querySelector('#ms-service').textContent = v.service ? '✓ Al día' : 'No especificado';

  overlay.querySelector('.modal-desc').textContent = v.description || 'Sin descripción.';

  renderModalGallery(overlay, galleryImages, 0);

  const waMsg = encodeURIComponent(`Hola! Me interesa el ${v.brand} ${v.model} ${v.year}`);
  overlay.querySelector('.modal-wa-btn').href = `https://wa.me/542214816242?text=${waMsg}`;

  const videoWrap = overlay.querySelector('.modal-video');
  if (v.video) {
    videoWrap.style.display = 'block';
    videoWrap.querySelector('video').src = v.video;
  } else {
    videoWrap.style.display = 'none';
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderModalGallery(overlay, images, idx) {
  const mainImg     = overlay.querySelector('.modal-main-img');
  const placeholder = overlay.querySelector('.modal-gallery-placeholder');
  const thumbs      = overlay.querySelector('.gallery-thumbs');
  const counter     = overlay.querySelector('.gallery-counter');
  const nav         = overlay.querySelectorAll('.gallery-nav');

  if (images.length) {
    mainImg.src = images[idx];
    mainImg.style.display = 'block';
    placeholder.style.display = 'none';
    counter.textContent = `${idx + 1} / ${images.length}`;
    counter.style.display = 'block';
    nav.forEach(n => n.style.display = images.length > 1 ? 'flex' : 'none');
    thumbs.innerHTML = images.map((src, i) =>
      `<img class="gallery-thumb ${i === idx ? 'active' : ''}" src="${src}" data-i="${i}" alt="">`
    ).join('');
    thumbs.style.display = 'flex';
    thumbs.querySelectorAll('.gallery-thumb').forEach(t => {
      t.addEventListener('click', () => {
        galleryIdx = parseInt(t.dataset.i);
        renderModalGallery(overlay, images, galleryIdx);
      });
    });
  } else {
    mainImg.style.display = 'none';
    placeholder.style.display = 'flex';
    counter.style.display = 'none';
    thumbs.style.display = 'none';
    nav.forEach(n => n.style.display = 'none');
  }
}

function initModal() {
  const overlay = document.getElementById('vehicle-modal');
  if (!overlay) return;

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  overlay.querySelector('.gallery-prev').addEventListener('click', () => {
    if (!galleryImages.length) return;
    galleryIdx = (galleryIdx - 1 + galleryImages.length) % galleryImages.length;
    renderModalGallery(overlay, galleryImages, galleryIdx);
  });
  overlay.querySelector('.gallery-next').addEventListener('click', () => {
    if (!galleryImages.length) return;
    galleryIdx = (galleryIdx + 1) % galleryImages.length;
    renderModalGallery(overlay, galleryImages, galleryIdx);
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   overlay.querySelector('.gallery-prev').click();
    if (e.key === 'ArrowRight')  overlay.querySelector('.gallery-next').click();
  });
}

function closeModal() {
  const overlay = document.getElementById('vehicle-modal');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ---- TOAST ----
function showToast(msg, duration = 3500) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
  initModal();
});
