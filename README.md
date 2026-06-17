# MotoAuto38 — Sitio Web

## Estructura de archivos

```
motoauto38/
├── index.html          ← Sitio público (catálogo, nosotros, contacto)
├── css/
│   └── style.css       ← Design system completo
├── js/
│   ├── app.js          ← Lógica del catálogo público + datos
│   └── admin.js        ← Lógica del panel de administración
├── admin/
│   ├── login.html      ← Pantalla de login
│   └── index.html      ← Panel ABM (protegido)
└── img/
    └── logo.jpg        ← Logo de la agencia
```

## Cómo usar

### Sitio público
Abrir `index.html` en el navegador. Los clientes ven el catálogo, pueden filtrar por tipo de vehículo y consultar por WhatsApp.

### Panel de administración
1. Abrir `admin/login.html`
2. Usuario: `admin` / Contraseña: `motoauto38`
3. Desde el panel podés:
   - Ver el dashboard con estadísticas
   - Listar, buscar y filtrar todos los vehículos
   - Crear nuevos vehículos con fotos y video
   - Editar vehículos existentes
   - Cambiar el estado (Disponible / Reservado / Vendido)
   - Eliminar vehículos

## Datos que personalizar

En `js/app.js` cambiá:
- `ADMIN_USER` y `ADMIN_PASS` → credenciales del admin
- El número de WhatsApp (buscar `5491100000000`)
- El usuario de Instagram (`motoauto38`)
- Las estadísticas del hero en `index.html`

## Hosting recomendado (gratis)

### Netlify (más fácil)
1. Ir a netlify.com → New site from upload
2. Arrastrar la carpeta `motoauto38` completa
3. El sitio queda en línea con URL propia

### GitHub Pages
1. Subir los archivos a un repositorio público de GitHub
2. Settings → Pages → Deploy from main branch

## Nota sobre los datos
Los vehículos se guardan en el `localStorage` del navegador.
Esto significa que si el padre carga vehículos desde su computadora,
los clientes los verán cuando se visite el sitio en el mismo dispositivo.

Para una versión con base de datos real (accesible desde cualquier dispositivo),
el siguiente paso es conectar con **Supabase** (gratis) para sincronizar los datos
en la nube. Consultá para dar ese paso cuando estés listo.
