# Instalar Aromas By Pikin en Supabase

Esta fase deja el catálogo conectado al backend y un panel para administrar perfumes, presentaciones y categorías. No crea automáticamente un proyecto de nube ni contrata un plan. No hay productos ni clientes ficticios en el SQL.

## 1. Crear el proyecto

1. Entra a https://supabase.com/dashboard y crea tu cuenta si aún no la tienes.
2. Crea un proyecto llamado `aromas-by-pikin` en tu organización. Revisa el plan y los costos que muestre Supabase antes de confirmar.
3. Elige PostgreSQL estándar y una región próxima a tus clientes/servidor.
4. Crea una contraseña fuerte para la base y guárdala en tu gestor de contraseñas. No la compartas por chat ni la subas a GitHub.
5. Espera a que el proyecto esté listo.

## 2. Crear las tablas

1. Abre **SQL Editor** → nueva consulta.
2. Abre en VS Code `database/INSTALAR-EN-SUPABASE.sql` y copia TODO su contenido.
3. Pégalo en el editor y pulsa **Run**.
4. Ejecuta esta consulta para verificar:

```sql
select name, slug from aromas.categories order by sort_order;
```

Deben aparecer Mujer, Hombre, Unisex, Sets y regalos y Decants. En Table Editor selecciona el esquema `aromas` si quieres revisar las tablas.

El SQL es reejecutable: registra las migraciones y no vuelve a crear datos aplicados. Si informa que una migración cambió, detente y compara la versión instalada. No borres tablas para resolverlo. También funciona si ya aplicaste `001_initial.sql` con el comando de migraciones de este proyecto.

No añadas `aromas` a los esquemas expuestos del Data API. La página se comunica con Express; Express accede a PostgreSQL. RLS está activado y los roles públicos no tienen acceso al esquema. Esto protege las tablas de clientes, pedidos y administradores del acceso directo desde el navegador.

## 3. Crear tu cuenta de administrador

En Supabase abre **Authentication → Users → Add user / Create user**. Crea tu usuario con correo y contraseña; confirma el correo desde esa herramienta si corresponde. No habilites registro público para el panel. Para una cuenta nueva, puedes desactivar el alta de nuevos usuarios en la configuración de Auth; este proyecto no tiene formulario de registro.

Copia el UUID del usuario creado. En SQL Editor ejecuta, reemplazando el texto entre comillas:

```sql
insert into aromas.admin_users (user_id, active)
values ('UUID-DEL-USUARIO-DE-AUTH', true)
on conflict (user_id) do update set active = true;
```

El UUID no es el correo. Estar registrado en Auth no otorga acceso por sí solo: hay que añadirlo a `admin_users`. Para retirar acceso:

```sql
update aromas.admin_users set active = false
where user_id = 'UUID-DEL-USUARIO-DE-AUTH';
```

El backend consulta esa autorización en cada solicitud. No se usan atributos editables por el usuario para conceder permisos.

## 4. Configurar el backend

Copia `backend/.env.example` a `backend/.env`. Completa:

```dotenv
NODE_ENV=development
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=CONEXION-POSTGRES-DEL-PROYECTO
DATABASE_SSL=true
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=TU-PUBLISHABLE-KEY
```

- En **Connect** encontrarás las conexiones de PostgreSQL. Para un servidor persistente Express y redes sin IPv6, usa el **Session pooler** (normalmente puerto 5432), con el usuario y host EXACTOS que muestre Supabase. No confundas esta URL con la URL HTTPS del proyecto.
- Sustituye la contraseña de ejemplo en la conexión; si tiene símbolos reservados, codifícala para una URL.
- En la configuración de API copia **Project URL** y **Publishable key**. La misma clave pública se usa en frontend y backend para Supabase Auth. No necesitas una service_role key para esta implementación.
- La conexión debe validar el certificado TLS. Si tu proveedor entrega una CA y Node la requiere, ponla en `DATABASE_CA_CERT` con saltos `\n`. No desactives `rejectUnauthorized` para solucionar certificados.
- En desarrollo no necesitas aplicar `npm run db:migrate` si ya ejecutaste el SQL completo: ambos mecanismos registran las mismas migraciones.

## 5. Configurar el frontend

Copia `frontend/.env.example` a `frontend/.env`:

```dotenv
VITE_API_URL=/api
VITE_WHATSAPP_NUMBER=18296651314
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU-PUBLISHABLE-KEY
```

Las variables VITE_ son públicas. Nunca pongas DATABASE_URL, contraseñas de usuarios o claves service_role en ellas.

Desde la raíz del proyecto:

```powershell
npm ci
npm run dev
```

Abre:
- http://localhost:5173/inicio/
- http://localhost:5173/catalogo/
- http://localhost:5173/admin/

El proxy de Vite conecta `/api` con el backend de puerto 3001. Si cambias una variable, reinicia el comando.

## 6. Añadir tu primer perfume

1. Inicia sesión en `/admin/` con la cuenta autorizada.
2. Pulsa **Añadir perfume**.
3. Completa nombre, marca, categoría, descripción, familia y concentración.
4. Añade las URLs HTTPS de sus fotos, una por línea. La primera se usa en las tarjetas.
5. Crea presentaciones: por ejemplo, 50 ml y 100 ml, cada una con su precio en RD$ y existencias.
6. Marca **Publicado** para mostrarlo; deja desmarcado para guardar un borrador.
7. Marca **Destacado en inicio** si quieres incluirlo en la portada.
8. Guarda y abre el catálogo. El inicio muestra hasta tres destacados.

El panel guarda precios como centavos enteros. Un perfume publicado necesita al menos una foto y una presentación activa. No borres presentaciones que ya usaste: desmárcalas como activas. Ocultar una categoría oculta sus productos al público sin borrarlos.

Por ahora las fotografías se añaden por URL; no hay carga de archivos dentro del panel. Una forma de obtener URLs estables es crear un bucket público `product-images` en Supabase Storage, subir desde el dashboard fotos autorizadas y copiar sus URLs públicas. No añadas políticas que permitan subir archivos a usuarios anónimos. El bucket público debe contener únicamente imágenes de productos, nunca documentos de clientes.

## 7. Subir a la nube

La guía `docs/DESPLIEGUE.md` explica las dos aplicaciones. Resumen:
- Frontend: `npm ci`, `npm run build`, publicar TODO `frontend/dist`.
- Backend: `npm ci`, `npm start`, Node.js 24.
- Frontend en nube: `VITE_API_URL=https://TU-BACKEND/api` y las dos variables públicas de Supabase.
- Backend en nube: `FRONTEND_ORIGIN=https://TU-FRONTEND`, `NODE_ENV=production` y sus variables privadas.
- Si el backend está detrás de un proxy, configura `TRUST_PROXY_HOPS` según la topología documentada de tu hosting. No uses un valor arbitrario para saltarte los límites de solicitudes.
- No publiques `.env`. GitHub conserva el código; Supabase conserva los registros.

La conexión de base del backend es privilegiada. Guárdala solo en el servicio backend y restringe el acceso a sus variables. Para producción con varios operadores, crea un rol dedicado con los permisos mínimos y las políticas correspondientes antes de sustituir el usuario de conexión; los roles anónimos del navegador nunca deben recibir esos permisos.

## Qué está incluido y qué queda pendiente

Incluido: base de datos, categorías, productos, presentaciones, precios/stock, filtros y paginación, destacados, consulta WhatsApp con presentación, autenticación administrativa, edición y publicación, control de versión para evitar sobrescribir ediciones simultáneas.

Pendiente: carrito, checkout, registro de pedidos/clientes, gestión de pedidos, cobros, carga de imágenes dentro del panel y despliegue. Las tablas iniciales de clientes y pedidos existen, pero no hay rutas públicas para consultarlas o modificarlas.

Validación realizada en PostgreSQL embebido PGlite: SQL completo dos veces, permisos del esquema, RLS, categorías, publicación/ocultación, presentaciones, rollback, rechazo de cuentas no administradoras y conflictos de edición. No equivale a probar tu proyecto alojado: tras configurarlo, verifica login real, guardado y lectura del primer producto.
