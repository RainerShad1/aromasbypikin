# Aromas By Pikin

Base inicial de la tienda y catálogo de perfumes. Un único repositorio para frontend, backend y cambios de base de datos.

## Qué hemos acordado

Primera versión: catálogo, carrito, compra sin cuenta y pedido por WhatsApp. Guardaremos el cliente y el pedido en PostgreSQL antes de ofrecer abrir WhatsApp. Abrir WhatsApp no demuestra que el mensaje se haya enviado ni que el pedido esté confirmado: el negocio confirmará disponibilidad y entrega.

## Estado de esta entrega — fase 2

Catálogo real con categorías, presentaciones, precios y existencias; administración protegida en `/admin/` con Supabase Auth. La base inicia vacía, con cinco categorías. Ya no se muestran perfumes ficticios.

**Empieza por [la guía paso a paso de Supabase](docs/SUPABASE-PASO-A-PASO.md)**. El SQL para pegar en SQL Editor está en `database/INSTALAR-EN-SUPABASE.sql`.

Todavía faltan carrito, checkout, registro/gestión de pedidos y despliegue. Crear el proyecto de Supabase, aplicar el SQL y configurar las variables son pasos que debe completar el propietario. No hay secretos reales en el repositorio.

## Carpetas

| Ruta | Para qué sirve |
|---|---|
| `frontend/` | Página que ve el cliente: HTML, CSS y JavaScript, con Vite para trabajar y compilar. |
| `frontend/src/` | Estilos y comportamiento de la página. |
| `frontend/public/assets/` | Fotos, logo y fuentes locales; no dependen de servicios externos. |
| `backend/src/` | API en Node.js y Express; será la encargada de validar pedidos y consultar la base. |
| `database/migrations/` | Cambios versionados de la estructura PostgreSQL. |
| `docs/` | Acuerdos, próximos pasos y explicación del despliegue. |
| `.github/workflows/` | Comprobación automática al subir cambios a GitHub. |

Se usa JavaScript y Vite sin React en esta primera base, aprovechando el diseño ya aprobado y evitando una migración innecesaria. El backend está separado para poder desplegarlo de forma independiente.

## 1. Requisitos

Instala Node.js 24.x, Git y un editor como VS Code. El archivo `.nvmrc` registra la versión principal. Abre la carpeta `aromas-by-pikin` en VS Code y su terminal.

## 2. Instalar y ejecutar

Desde la carpeta principal:

```powershell
npm ci
npm run dev
```

- Página: http://localhost:5173
- API: http://localhost:3001/api/health

El diseño y la API básica arrancan sin base de datos, pero el catálogo necesita la conexión real y el panel necesita Supabase Auth. Para detener ambos, presiona Ctrl+C. No abras `frontend/index.html` con doble clic: esta versión de desarrollo usa Vite; el HTML independiente anterior sí puede abrirse directamente.

Opcionalmente, copia los ejemplos de configuración en PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Los ejemplos contienen instrucciones, no contraseñas reales. `VITE_API_URL=/api` usa el proxy de Vite al backend local. En la nube configura la URL HTTPS de la API.

## 3. Conectar PostgreSQL cuando lo configuremos

1. Crear la base de datos con el proveedor elegido.
2. Poner la conexión en `DATABASE_URL` dentro de `backend/.env`.
3. Mantener verificación de certificado TLS en conexiones de nube. Si el proveedor entrega una CA, configurar `DATABASE_CA_CERT`. Para una base local sin TLS únicamente, usar `DATABASE_SSL=false`.
4. Aplicar las migraciones:

```powershell
npm run db:migrate
```

El comando crea un esquema privado `aromas`, registra las migraciones y las ejecuta en una transacción. Una migración ya aplicada no se edita: se crea un nuevo archivo SQL. No añade datos de ejemplo. Las tablas no están expuestas directamente al navegador.

Para producción usaremos credenciales distintas para migraciones y ejecución, con permisos mínimos. La API consulta productos con una conexión de servidor; nunca se pone `DATABASE_URL` en el frontend.

Rutas iniciales:

| Ruta | Resultado |
|---|---|
| `GET /api/health` | Confirma que el servidor está encendido. |
| `GET /api/ready` | Comprueba conexión a la base. Devuelve 503 si falta configuración o conexión. |
| `GET /api/products` | Devuelve productos publicados con filtros y paginación. Requiere base y migraciones. |

No existen rutas para leer clientes o pedidos, ni para registrarlos todavía. El catálogo ya utiliza los productos de PostgreSQL.

## 4. Actualizar desde GitHub

Repositorio: https://github.com/RainerShad1/aromasbypikin

Después de integrar la propuesta de cambios en GitHub, actualiza tu copia local:

```powershell
git switch main
git pull --ff-only
npm ci
```

Si tienes cambios locales sin guardar, revísalos y haz un commit antes de actualizar. Para próximos cambios:

```powershell
git status
git add .
git commit -m "Describe el cambio realizado"
git push
```

Revisa `git status` antes de cada commit. `.gitignore` excluye `.env`, dependencias, compilados y archivos de claves. Mantén los ejemplos `.env.example` sin valores reales.

## 5. Comprobar y compilar

```powershell
npm run check
npm run build
```

La compilación genera `frontend/dist`. No se sube esa carpeta a GitHub: el proveedor la genera al desplegar. Conserva `package-lock.json`, que fija las versiones instaladas. `npm start` arranca solo el backend para un servicio de nube.

Ejecuta `npm test` para probar esquema, API y permisos en PostgreSQL embebido. El login contra tu proyecto de Supabase requiere configurar el entorno real. Ver `docs/ESTADO-Y-PROXIMOS-PASOS.md`.
