# Cómo se conectarán las partes en la nube

GitHub guarda el historial del código. Los proveedores de hosting ejecutan el frontend/backend; PostgreSQL conserva los registros aunque reiniciemos o despleguemos una versión nueva.

| Parte | Qué necesita el proveedor |
|---|---|
| Frontend estático | Node 24; instalar desde la raíz con `npm ci`; compilar con `npm run build`; publicar `frontend/dist`. |
| Backend Node | Node 24; instalar desde la raíz con `npm ci`; arrancar con `npm start`; configurar `PORT` si lo exige el servicio. |
| PostgreSQL | URL privada de conexión, TLS y credenciales de migración/ejecución. |
| Imágenes futuras | Almacenamiento persistente de archivos; no guardarlas en el disco temporal del backend. |

Variables del backend: `NODE_ENV=production`, `FRONTEND_ORIGIN` con el origen exacto del frontend (sin barra final), `DATABASE_URL` y configuración TLS. CORS no sustituye la autenticación de administradores.

El frontend tendrá `VITE_API_URL` apuntando al backend al implementar la integración. Las variables VITE_ son públicas y se fijan al compilar.

Se puede elegir cada proveedor por separado sin cambiar esta organización. La selección, las cuentas y el despliegue se harán después; esta entrega no configura ningún servicio de pago ni publica el sitio.
