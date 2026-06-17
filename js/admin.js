/* ============================================
   MOTOAUTO38 — Admin Panel Logic (Supabase)
   ============================================ */

MA38.requireAuth();

let formImageFiles  = [];  // File objects nuevos
let formImageUrls   = [];  // URLs ya subidas (edición)
let formVideoFile   = null;
let formVideoUrl    = '';
let deletingId      = null;

// ---- SECTION ROUTING ----
function showSection(name, extra) {
  ['dashboard','vehicles','new'].forEach(s => {
    document.getElementById('section-' + s).style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === name);
  });
  const titles = { dashboard: 'Dashboard', vehicles: 'Vehículos', new: 'Nuevo vehículo' };
  document.getElementById('topbar-title').textContent = titles[name] || name;

  if (name === 'dashboard') renderDashboard();
  if (name === 'vehicles')  renderVehicleTable();
  if (name === 'new' && !extra) resetForm();
}

document.querySelectorAll('.sidebar-nav-item').forEach(item => {
  item.addEventListener('click', () => showSection(item.dataset.section));
});
document.getElementById('new-vehicle-btn').addEventListener('click', () => showSection('new'));
document.getElementById('logout-btn').addEventListener('click', () => {
  MA38.logout();
  window.location.href = 'login.html';
});

// ---- DASHBOARD ----
async function renderDashboard() {
  document.getElementById('stats-grid').innerHTML = `<div style="color:var(--gray-muted);font-size:14px">Cargando...</div>`;
  try {
    const vehicles  = await DB.getVehicles();
    const available = vehicles.filter(v => v.status === 'available').length;
    const reserved  = vehicles.filter(v => v.status === 'reserved').length;
    const sold      = vehicles.filter(v => v.status === 'sold').length;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card"><div class="stat-card-num">${vehicles.length}</div><div class="stat-card-label">Total en sistema</div></div>
      <div class="stat-card"><div class="stat-card-num" style="color:#2ecc71">${available}</div><div class="stat-card-label">Disponibles</div></div>
      <div class="stat-card"><div class="stat-card-num" style="color:var(--yellow)">${reserved}</div><div class="stat-card-label">Reservados</div></div>
      <div class="stat-card"><div class="stat-card-num" style="color:#e74c3c">${sold}</div><div class="stat-card-label">Vendidos</div></div>
    `;

    document.getElementById('dashboard-table').innerHTML = buildTableHTML(vehicles.slice(0, 5));
    attachTableEvents(document.getElementById('dashboard-table'));
  } catch(e) {
    document.getElementById('stats-grid').innerHTML = `<div style="color:#e74c3c">Error al cargar datos.</div>`;
  }
}

// ---- VEHICLE TABLE ----
async function renderVehicleTable() {
  document.getElementById('vehicles-table').innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-muted)">Cargando...</td></tr>`;
  try {
    let vehicles = await DB.getVehicles();

    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
    const typeVal   = document.getElementById('filter-type')?.value || '';
    const statusVal = document.getElementById('filter-status')?.value || '';

    if (searchVal) vehicles = vehicles.filter(v =>
      `${v.brand} ${v.model} ${v.version || ''} ${v.year}`.toLowerCase().includes(searchVal)
    );
    if (typeVal)   vehicles = vehicles.filter(v => v.type === typeVal);
    if (statusVal) vehicles = vehicles.filter(v => v.status === statusVal);

    document.getElementById('vehicle-count-label').textContent =
      `${vehicles.length} vehículo${vehicles.length !== 1 ? 's' : ''}`;

    document.getElementById('vehicles-table').innerHTML = buildTableHTML(vehicles);
    attachTableEvents(document.getElementById('vehicles-table'));
  } catch(e) {
    document.getElementById('vehicles-table').innerHTML =
      `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#e74c3c">Error al cargar vehículos.</td></tr>`;
  }
}

['search-input','filter-type','filter-status'].forEach(id => {
  document.getElementById(id)?.addEventListener('input',  renderVehicleTable);
  document.getElementById(id)?.addEventListener('change', renderVehicleTable);
});

function buildTableHTML(vehicles) {
  if (!vehicles.length) return `
    <tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--gray-muted)">
      No hay vehículos para mostrar.
    </td></tr>`;

  const statusLabel = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' };
  const statusClass = { available: 'badge-available', reserved: 'badge-reserved', sold: 'badge-sold' };
  const typeClass   = { auto: 'badge-auto', moto: 'badge-moto', camioneta: 'badge-camioneta', otro: '' };

  const rows = vehicles.map(v => {
    const thumb = v.images && v.images.length
      ? `<img class="table-thumb" src="${v.images[0]}" alt="">`
      : `<div class="table-thumb-placeholder">${MA38.vehicleEmoji(v.type)}</div>`;

    return `<tr>
      <td>${thumb}</td>
      <td>
        <div class="table-vehicle-name">${v.brand} ${v.model}</div>
        <div class="table-vehicle-sub">${v.version || ''} · ${v.year}</div>
      </td>
      <td><span class="badge ${typeClass[v.type] || ''}">${MA38.typeLabel(v.type)}</span></td>
      <td>${Number(v.km).toLocaleString('es-AR')} km</td>
      <td style="font-weight:700;color:var(--yellow)">${MA38.formatPrice(v.price)}</td>
      <td><span class="badge ${statusClass[v.status] || ''}">${statusLabel[v.status] || v.status}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm edit-btn" data-id="${v.id}">Editar</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${v.id}">Eliminar</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<thead><tr>
    <th style="width:70px">Foto</th>
    <th>Vehículo</th><th>Tipo</th><th>Km</th><th>Precio</th><th>Estado</th>
    <th style="width:160px">Acciones</th>
  </tr></thead><tbody>${rows}</tbody>`;
}

function attachTableEvents(table) {
  table.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editVehicle(btn.dataset.id));
  });
  table.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

// ---- FORM ----
function resetForm() {
  ['f-type','f-status','f-brand','f-model','f-version','f-year',
   'f-km','f-color','f-doors','f-fuel','f-trans','f-service',
   'f-service-detail','f-price','f-currency','f-description'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
  document.getElementById('f-featured').checked = false;
  document.getElementById('f-editing-id').value = '';
  document.getElementById('form-eyebrow').textContent = 'Nuevo vehículo';
  document.getElementById('form-title').textContent   = 'Cargar vehículo';

  formImageFiles = [];
  formImageUrls  = [];
  formVideoFile  = null;
  formVideoUrl   = '';
  renderImagePreviews();
  renderVideoPreview();
}

async function editVehicle(id) {
  showSection('new', true);
  document.getElementById('form-eyebrow').textContent = 'Cargando...';
  document.getElementById('form-title').textContent   = '';

  try {
    const v = await DB.getVehicleById(id);
    if (!v) { showToast('No se encontró el vehículo.'); showSection('vehicles'); return; }

    document.getElementById('form-eyebrow').textContent = 'Editando vehículo';
    document.getElementById('form-title').textContent   = `${v.brand} ${v.model}`;
    document.getElementById('f-editing-id').value = id;

    setVal('f-type',           v.type);
    setVal('f-status',         v.status);
    setVal('f-brand',          v.brand);
    setVal('f-model',          v.model);
    setVal('f-version',        v.version || '');
    setVal('f-year',           v.year);
    setVal('f-km',             v.km);
    setVal('f-color',          v.color || '');
    setVal('f-doors',          v.doors || '');
    setVal('f-fuel',           v.fuel || 'Nafta');
    setVal('f-trans',          v.transmission || 'Manual');
    setVal('f-service',        String(v.service));
    setVal('f-service-detail', v.service_detail || '');
    setVal('f-price',          v.price);
    setVal('f-currency',       v.currency || 'ARS');
    setVal('f-description',    v.description || '');
    document.getElementById('f-featured').checked = !!v.featured;

    formImageFiles = [];
    formImageUrls  = v.images || [];
    formVideoFile  = null;
    formVideoUrl   = v.video || '';
    renderImagePreviews();
    renderVideoPreview();
  } catch(e) {
    showToast('Error al cargar el vehículo.');
    showSection('vehicles');
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

function getFormData() {
  const errors = [];
  const get = id => document.getElementById(id)?.value?.trim() || '';

  const brand = get('f-brand');
  const model = get('f-model');
  const year  = parseInt(get('f-year'));
  const km    = parseInt(get('f-km'));
  const price = parseFloat(get('f-price'));

  if (!brand)       errors.push('Marca');
  if (!model)       errors.push('Modelo');
  if (!year)        errors.push('Año');
  if (isNaN(km))    errors.push('Kilómetros');
  if (isNaN(price)) errors.push('Precio');

  if (errors.length) { showToast('Completá los campos: ' + errors.join(', ')); return null; }

  return {
    type:           get('f-type'),
    status:         get('f-status'),
    brand,
    model,
    version:        get('f-version') || null,
    year,
    km,
    color:          get('f-color')   || null,
    doors:          get('f-doors')   ? parseInt(get('f-doors')) : null,
    fuel:           get('f-fuel')    || null,
    transmission:   get('f-trans')   || null,
    service:        document.getElementById('f-service').value === 'true',
    service_detail: get('f-service-detail') || null,
    price,
    currency:       get('f-currency'),
    description:    get('f-description') || null,
    featured:       document.getElementById('f-featured').checked,
  };
}

document.getElementById('save-vehicle-btn').addEventListener('click', async () => {
  const data = getFormData();
  if (!data) return;

  const btn = document.getElementById('save-vehicle-btn');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  try {
    const editingId = document.getElementById('f-editing-id').value;

    // Determinar ID del vehículo (nuevo o existente)
    const vehicleId = editingId || crypto.randomUUID();

    // Subir imágenes nuevas
    const newImageUrls = [];
    for (let i = 0; i < formImageFiles.length; i++) {
      const file = formImageFiles[i];
      if (!file) continue;
      const ext  = file.name.split('.').pop();
      const path = `${vehicleId}/img_${Date.now()}_${i}.${ext}`;
      const url  = await DB.uploadFile(file, path);
      newImageUrls.push(url);
    }
    data.images = [...formImageUrls, ...newImageUrls];

    // Subir video nuevo si hay
    if (formVideoFile) {
      const ext  = formVideoFile.name.split('.').pop();
      const path = `${vehicleId}/video_${Date.now()}.${ext}`;
      data.video = await DB.uploadFile(formVideoFile, path);
    } else {
      data.video = formVideoUrl || null;
    }

    if (editingId) {
      await DB.updateVehicle(editingId, data);
      showToast('✓ Vehículo actualizado');
    } else {
      await DB.createVehicle({ ...data, id: vehicleId });
      showToast('✓ Vehículo cargado correctamente');
    }

    setTimeout(() => showSection('vehicles'), 800);
  } catch(e) {
    showToast('Error al guardar: ' + e.message);
  } finally {
    btn.textContent = 'Guardar vehículo';
    btn.disabled = false;
  }
});

document.getElementById('cancel-form-btn').addEventListener('click', () => showSection('vehicles'));

// ---- IMAGE UPLOAD ----
const uploadZone = document.getElementById('upload-zone');
const imageInput = document.getElementById('f-images');

uploadZone.addEventListener('click', () => imageInput.click());
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleImageFiles([...e.dataTransfer.files]);
});
imageInput.addEventListener('change', () => { handleImageFiles([...imageInput.files]); imageInput.value = ''; });

function handleImageFiles(files) {
  const imgs = files.filter(f => f.type.startsWith('image/'));
  const total = formImageUrls.length + formImageFiles.length + imgs.length;
  if (total > 10) { showToast('Máximo 10 fotos por vehículo.'); return; }
  formImageFiles.push(...imgs);
  renderImagePreviews();
}

function renderImagePreviews() {
  const grid = document.getElementById('image-preview-grid');
  const allPreviews = [
    ...formImageUrls.map((url, i) => ({ src: url, isUrl: true, i })),
    ...formImageFiles.map((file, i) => ({ src: URL.createObjectURL(file), isUrl: false, i })),
  ];

  if (!allPreviews.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = allPreviews.map((p, idx) => `
    <div class="preview-item">
      <img src="${p.src}" alt="">
      ${idx === 0 ? '<span class="preview-main-badge">Portada</span>' : ''}
      <button class="preview-remove" data-is-url="${p.isUrl}" data-i="${p.i}" title="Quitar">✕</button>
    </div>
  `).join('');

  grid.querySelectorAll('.preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const isUrl = btn.dataset.isUrl === 'true';
      const i     = parseInt(btn.dataset.i);
      if (isUrl) formImageUrls.splice(i, 1);
      else       formImageFiles.splice(i, 1);
      renderImagePreviews();
    });
  });
}

// ---- VIDEO UPLOAD ----
const videoZone  = document.getElementById('video-zone');
const videoInput = document.getElementById('f-video');

videoZone.addEventListener('click', () => videoInput.click());
videoZone.addEventListener('dragover',  e => { e.preventDefault(); videoZone.classList.add('dragover'); });
videoZone.addEventListener('dragleave', () => videoZone.classList.remove('dragover'));
videoZone.addEventListener('drop', e => {
  e.preventDefault(); videoZone.classList.remove('dragover');
  const f = [...e.dataTransfer.files].find(f => f.type.startsWith('video/'));
  if (f) handleVideoFile(f);
});
videoInput.addEventListener('change', () => { if (videoInput.files[0]) handleVideoFile(videoInput.files[0]); videoInput.value = ''; });

function handleVideoFile(file) {
  if (file.size > 100 * 1024 * 1024) { showToast('El video supera 100MB.'); return; }
  formVideoFile = file;
  formVideoUrl  = '';
  renderVideoPreview();
}

function renderVideoPreview() {
  const wrap   = document.getElementById('video-preview');
  const player = document.getElementById('video-preview-player');
  const src    = formVideoFile ? URL.createObjectURL(formVideoFile) : formVideoUrl;

  if (src) {
    player.src = src;
    wrap.style.display      = 'block';
    videoZone.style.display = 'none';
  } else {
    player.src = '';
    wrap.style.display      = 'none';
    videoZone.style.display = 'block';
  }
}

document.getElementById('remove-video-btn').addEventListener('click', () => {
  formVideoFile = null;
  formVideoUrl  = '';
  renderVideoPreview();
});

// ---- DELETE ----
function confirmDelete(id) {
  deletingId = id;
  document.getElementById('delete-modal').classList.add('open');
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  if (!deletingId) return;
  try {
    await DB.deleteVehicle(deletingId);
    showToast('Vehículo eliminado.');
    renderVehicleTable();
    renderDashboard();
  } catch(e) {
    showToast('Error al eliminar: ' + e.message);
  } finally {
    deletingId = null;
    document.getElementById('delete-modal').classList.remove('open');
  }
});

document.getElementById('cancel-delete-btn').addEventListener('click', () => {
  deletingId = null;
  document.getElementById('delete-modal').classList.remove('open');
});
document.getElementById('delete-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('delete-modal')) {
    deletingId = null;
    document.getElementById('delete-modal').classList.remove('open');
  }
});

// ---- INIT ----
renderDashboard();
