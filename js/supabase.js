/* ============================================
   MOTOAUTO38 — Supabase Client & Data Layer
   ============================================ */

const SUPABASE_URL = 'https://zldtdmotfetrvggsvbqp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZHRkbW90ZmV0cnZnZ3N2YnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTcwNTgsImV4cCI6MjA5NzI5MzA1OH0.jYyB_AyUFhQZfobq84iR273W69KcoMQnre5G6Sw9m1o';

const DB = {

  // ---- HEADERS ----
  _headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    };
  },

  // ---- VEHICLES CRUD ----
  async getVehicles() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?order=created_at.desc`,
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error('Error al obtener vehículos');
    return res.json();
  },

  async getVehicleById(id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?id=eq.${id}&limit=1`,
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error('Error al obtener vehículo');
    const data = await res.json();
    return data[0] || null;
  },

  async createVehicle(vehicle) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles`,
      {
        method: 'POST',
        headers: { ...this._headers(), 'Prefer': 'return=representation' },
        body: JSON.stringify(vehicle),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear vehículo');
    }
    const data = await res.json();
    return data[0];
  },

  async updateVehicle(id, vehicle) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: { ...this._headers(), 'Prefer': 'return=representation' },
        body: JSON.stringify(vehicle),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar vehículo');
    }
    const data = await res.json();
    return data[0];
  },

  async deleteVehicle(id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?id=eq.${id}`,
      { method: 'DELETE', headers: this._headers() }
    );
    if (!res.ok) throw new Error('Error al eliminar vehículo');
    return true;
  },

  // ---- STORAGE (fotos y videos) ----
  async uploadFile(file, path) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/vehicles/${path}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: file,
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al subir archivo');
    }
    return this.getPublicUrl(path);
  },

  getPublicUrl(path) {
    return `${SUPABASE_URL}/storage/v1/object/public/vehicles/${path}`;
  },

  async deleteFile(path) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/vehicles/${path}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      }
    );
    return res.ok;
  },

  // Sube múltiples imágenes y devuelve array de URLs públicas
  async uploadImages(files, vehicleId) {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const ext = file.name.split('.').pop();
      const path = `${vehicleId}/img_${i}_${Date.now()}.${ext}`;
      const url = await this.uploadFile(file, path);
      urls.push(url);
    }
    return urls;
  },

  async uploadVideo(file, vehicleId) {
    const ext = file.name.split('.').pop();
    const path = `${vehicleId}/video_${Date.now()}.${ext}`;
    return this.uploadFile(file, path);
  },
};
