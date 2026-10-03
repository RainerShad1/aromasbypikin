# Estado: fase 2 — catálogo y administración

## Implementado
- URLs `/inicio/`, `/catalogo/` y `/admin/`.
- Diseño y enlaces sociales aprobados, incluida la imagen difuminada de Nuestra esencia.
- PostgreSQL: categorías, productos, presentaciones y autorización administrativa.
- Catálogo real con búsqueda por nombre/marca, categoría, familia, marca, orden y paginación.
- Solo productos publicados de categorías activas y con presentaciones activas.
- Destacados en inicio, detalles y WhatsApp con perfume/presentación/precio.
- Panel: login Supabase, alta/edición, borradores, fotos por URL, precios, existencias y categorías.
- Comprobación administrativa en cada petición del servidor; no basta con ocultar botones.
- SQL de instalación reejecutable y pruebas locales de base/API.

## Requiere configurar el proyecto de Supabase
Seguir `SUPABASE-PASO-A-PASO.md`. No se ha creado ni desplegado un proyecto remoto. Sin configuración, el catálogo muestra un error recuperable y el panel indica qué falta; nunca sustituye datos reales por perfumes inventados.

## Siguiente fase
Carrito, checkout sin registro, validación y guardado atómico del pedido, idempotencia, reserva y vencimiento de stock, y envío voluntario por WhatsApp. Luego gestión de pedidos y clientes desde el panel. Un teléfono sin verificar no debe usarse como prueba de identidad ni para exponer el historial de otras personas.
