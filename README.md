# Aromas By Pikin

Base inicial de la tienda y catálogo de perfumes. Un único repositorio para frontend, backend y cambios de base de datos.

## Qué hemos acordado

Primera versión: catálogo, carrito, compra sin cuenta y pedido por WhatsApp. Guardaremos el cliente y el pedido en PostgreSQL antes de ofrecer abrir WhatsApp. Abrir WhatsApp no demuestra que el mensaje se haya enviado ni que el pedido esté confirmado: el negocio confirmará disponibilidad y entrega.

## Estado de esta entrega — base 0.1

**Ya incluido:** diseño aprobado con logo, retrato y fondo de perfumes desenfocado; HTML, CSS, JavaScript, imágenes y fuentes separados para trabajar cómodamente; buscador y filtros sobre perfumes ilustrativos; fichas visuales; servidor API; conexión PostgreSQL configurable; migración inicial; archivos de ejemplo de configuración; comandos de desarrollo y compilación; revisión automática en GitHub.

**Todavía no implementado:** conexión del catálogo visual a los productos reales, carrito, checkout, guardado de clientes/pedidos, enlace WhatsApp del pedido, autenticación del administrador, panel de gestión, control transaccional de existencias y despliegue. El esquema prepara esas funciones; no las activa. La lista de productos del frontend es ilustrativa y no viene de la base de datos.

No se creó una cuenta de nube, una base remota ni un repositorio GitHub. No hay credenciales reales en esta carpeta.

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

El diseño y la API básica arrancan sin base de datos. Para detener ambos, presiona Ctrl+C. No abras `frontend/index.html` con doble clic: esta versión de desarrollo usa Vite; el HTML independiente anterior sí puede abrirse directamente.

Opcionalmente, copia los ejemplos de configuración en PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Los ejemplos contienen instrucciones, no contraseñas reales. La variable `VITE_API_URL` queda reservada para la integración del catálogo; todavía no se usa en el prototipo visual.

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
| `GET /api/products` | Devuelve hasta 100 productos publicados. Requiere base y migración. |

No existen rutas para leer clientes o pedidos, ni para registrarlos todavía. No cambies el frontend a datos reales hasta completar esa integración.

## 4. Preparar Git y GitHub

El ZIP no incluye una carpeta `.git`; inicializa el repositorio en tu computadora, dentro de `aromas-by-pikin`:

```powershell
git init -b main
git add .
git commit -m "Base inicial de Aromas By Pikin"
```

Crea un repositorio vacío en GitHub, preferiblemente privado mientras lo desarrollamos. No añadas un README desde GitHub porque ya viene uno. Usa la URL que GitHub te muestre:

```powershell
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

Sustituye `URL_DE_TU_REPOSITORIO` por la URL real. Si Git pide nombre/correo, configúralos con tus propios datos.

Para próximos cambios:

```powershell
git status
git add .
git commit -m "Describe el cambio realizado"
git push
```

Revisa `git status` antes de cada commit. `.gitignore` excluye `.env`, dependencias, compilados y archivos de claves. Mantén los ejemplos `.env.example` sin valores reales. Si una contraseña se publica accidentalmente, eliminarla del archivo no la elimina del historial: hay que revocarla.

## 5. Comprobar y compilar

```powershell
npm run check
npm run build
```

La compilación genera `frontend/dist`. No se sube esa carpeta a GitHub: el proveedor la genera al desplegar. Conserva `package-lock.json`, que fija las versiones instaladas. `npm start` arranca solo el backend para un servicio de nube.

La comprobación inicial revisa sintaxis y compilación; no es una prueba completa de una tienda ni de la base remota. Ver `docs/ESTADO-Y-PROXIMOS-PASOS.md`.
