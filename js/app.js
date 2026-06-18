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
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions')) return;
        window.location.href = `vehiculo.html?id=${card.dataset.id}`;
      });
    });

    updateClearBtn();
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
          <a href="vehiculo.html?id=${v.id}" class="btn btn-outline btn-sm" style="flex:1;justify-content:center" onclick="event.stopPropagation()">
            Ver detalle
          </a>
          <a href="https://wa.me/542214816242?text=${waMsg}"
             target="_blank" class="btn btn-yellow btn-sm" style="flex:1;justify-content:center" onclick="event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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

  // Search input
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchVal = searchInput.value.toLowerCase().trim();
      render();
    });
  }

  // Price filters
  const priceMinInput = document.getElementById('price-min');
  const priceMaxInput = document.getElementById('price-max');
  if (priceMinInput) {
    priceMinInput.addEventListener('input', () => {
      priceMin = priceMinInput.value ? parseFloat(priceMinInput.value) : null;
      render();
    });
  }
  if (priceMaxInput) {
    priceMaxInput.addEventListener('input', () => {
      priceMax = priceMaxInput.value ? parseFloat(priceMaxInput.value) : null;
      render();
    });
  }

  // Clear filters
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchVal = '';
      priceMin = null;
      priceMax = null;
      activeFilter = 'todos';
      if (searchInput) searchInput.value = '';
      if (priceMinInput) priceMinInput.value = '';
      if (priceMaxInput) priceMaxInput.value = '';
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.filter-btn[data-filter="todos"]').classList.add('active');
      render();
    });
  }

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
