# Publicar Aromas By Pikin sin localhost

Frontend y backend se ejecutan en un único servicio Render. La base existente permanece en Supabase. No vuelvas a ejecutar el SQL ni crees otra base.

## 1. Actualizar el repositorio

Añade los archivos de esta entrega a tu carpeta actual y sube el cambio a GitHub. Deben aparecer `render.yaml` en la raíz y `scripts/build-cloud.mjs`. Conserva tus archivos `.env` locales; no los subas.

## 2. Obtener la conexión correcta

En tu proyecto **aromas-by-pikin** de Supabase, pulsa **Connect** y selecciona **Session pooler**. Copia la cadena que empieza por `postgresql://`. Sustituye `[YOUR-PASSWORD]` por la contraseña de BASE DE DATOS, que no es la contraseña del administrador de la tienda. Los caracteres reservados de la contraseña deben estar codificados para URL. Copia el host y usuario exactos del diálogo.

`https://isfyxzgvysmjjcgxniei.supabase.co` es SUPABASE_URL, NO DATABASE_URL. Ese valor HTTPS figuraba en el ejemplo subido y no sirve para conectar con PostgreSQL.

## 3. Crear el servicio

1. Entra en https://dashboard.render.com/ y conecta tu cuenta de GitHub.
2. Selecciona **New → Blueprint** y el repositorio `RainerShad1/aromasbypikin`, rama `main`.
3. Render leerá `render.yaml`. Revisa que propone un único Web Service llamado `aromas-by-pikin`, plan **Free**.
4. Cuando solicite `DATABASE_URL`, pega la conexión privada del paso anterior. No la guardes en el repositorio.
5. Confirma el despliegue. El resto de variables públicas está preparado para tu proyecto; no se crea otra base de datos.

El plan Free permite probar y se suspende tras inactividad; el primer acceso puede tardar. Antes de lanzar el negocio de forma estable puedes elegir un plan adecuado desde Render, revisando su precio.

### Si eliges New → Web Service en lugar de Blueprint

Deja Root Directory vacío; runtime Node; rama main.

- Build Command: `npm ci --include=dev && npm run build:cloud`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Copia en Environment las variables de `render.yaml`. `DATABASE_URL` es el único valor privado pendiente. Node 24, SERVE_FRONTEND=true y DATABASE_SSL=true. No configures PORT ni FRONTEND_ORIGIN: Render proporciona PORT y RENDER_EXTERNAL_URL. Si añades un dominio propio después, configura FRONTEND_ORIGIN con ese origen HTTPS exacto.

## 4. Verificar

Render asignará una dirección HTTPS: usa la que aparezca en el panel, no supongas que un nombre está disponible.

- `/api/health`: confirma que el servidor está encendido.
- `/api/ready`: debe devolver `{"status":"ready"}` si conecta a PostgreSQL.
- `/api/categories`: debe mostrar las cinco categorías.
- `/inicio/`, `/catalogo/` y `/admin/`: las tres páginas.

En Supabase Authentication → URL Configuration, configura Site URL con tu URL publicada. El login actual usa correo y contraseña y no necesita callback OAuth. Inicia sesión con tu administrador existente y añade un perfume. El catálogo empieza vacío porque todavía no hay productos.

## Si falla

- `DATABASE_URL debe empezar por postgresql://`: pegaste la URL HTTPS de la API.
- `ENETUNREACH` o error IPv6: confirma que copiaste **Session pooler**, no Direct connection.
- `28P01`: contraseña de base de datos incorrecta o sin codificar.
- Error de certificado: configura DATABASE_CA_CERT con la CA indicada por Supabase, con saltos de línea reales o `\n`. No desactives TLS.
- Servidor healthy pero catálogo sin cargar: abre `/api/ready` y revisa los logs de Render. Health solo verifica el proceso.

Para pedir ayuda comparte la URL y el mensaje de error, sin contraseñas ni la conexión completa. Las variables privadas se introducen directamente en Environment de Render.

Referencias: https://render.com/docs/deploy-node-express-app y https://supabase.com/docs/guides/database/connecting-to-postgres
