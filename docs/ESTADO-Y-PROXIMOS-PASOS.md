# Acuerdos y próximos pasos

## Objetivo
Una tienda para un solo negocio: Aromas By Pikin. Identidad clara con Cormorant Garamond, Inter, azul #386587 y blanco cálido. Mantener el retrato en un marco iluminado y los perfumes desenfocados de la portada.

## Flujo previsto
1. El cliente consulta perfumes reales y añade cantidades al carrito.
2. Completa nombre, teléfono y entrega o recogida. Dirección solo si necesita delivery; no pedir cédula por defecto.
3. El backend valida datos y cantidades, consulta precios y existencias reales, calcula el total y guarda pedido y cliente en una misma transacción.
4. Devuelve una referencia de pedido y el texto para WhatsApp. El cliente decide enviarlo.
5. El negocio confirma el pedido desde su panel. Hasta entonces queda pendiente; abrir WhatsApp no confirma nada.

No confiar en precios o totales enviados por el navegador. Evitar pedidos duplicados mediante una clave de idempotencia y comprobar que una misma clave corresponda al mismo contenido. El teléfono sin verificación no sirve para recuperar pedidos, identificar con certeza a una persona ni fusionar automáticamente clientes. No publicar un listado de clientes ni permitir consultar pedidos por número consecutivo.

## Orden de implementación

### 1. Productos y catálogo real
- Campos, categorías y fotografías reales; definir si hay variaciones por mililitros.
- Conectar el catálogo visual con la API y manejar estados de carga, vacío y error.
- Paginación si el catálogo supera la primera lista de 100.

### 2. Carrito y pedido
- Carrito persistente en el dispositivo, cantidades y validación.
- Checkout sin cuenta, con datos mínimos.
- Reglas de entrega, recogida, tarifas y stock.
- Guardado atómico, idempotencia, límites de solicitudes, controles de abuso y consulta segura de confirmación.
- WhatsApp con número real confirmado; no envío automático.
- Resolver reserva de existencias y vencimiento de pedidos pendientes.

### 3. Administración
- Autenticación real, sesiones seguras y autorización verificada en servidor.
- Crear/editar perfumes, subir imágenes, stock y precios.
- Ver pedidos/clientes con acceso restringido; cambios de estado permitidos.
- Registro de cambios importantes y control de cancelaciones.

### 4. Nube y operación
- Entornos de prueba y producción separados.
- Variables privadas, TLS, usuarios de base con permisos mínimos, copias de seguridad y prueba de restauración.
- Dominio, monitoreo de errores, política de tratamiento de datos ajustada al funcionamiento real.
- Pruebas de pedidos duplicados, stock simultáneo, errores de red y autorización.

## Datos que necesitaremos
- Número oficial de WhatsApp, redes, dirección y horarios.
- Productos, precios en RD$, tamaños y existencias.
- Áreas y costos de entrega, recogida y formas de pago acordadas por WhatsApp.
- Persona(s) autorizada(s) para administrar.

## Decisiones técnicas iniciales
- Un repositorio con dos aplicaciones separadas, npm workspaces y un lockfile.
- Frontend HTML/CSS/JavaScript con Vite; no se requiere React para esta primera etapa.
- Backend Node.js + Express; PostgreSQL con esquema privado `aromas`.
- Importes enteros en centavos: RD$ 1,500.00 = 150000 centavos.
- El pedido guarda una copia de nombre/precio del producto para conservar su historial.
- El frontend actual usa productos conceptuales. No está conectado a los registros de PostgreSQL.

## Validación de esta base
Se comprobaron instalación, sintaxis, compilación, arranque conjunto de frontend/API y respuestas cuando no hay base configurada. El navegador cargó el diseño, las imágenes, las fuentes y las tres fichas de muestra; no hubo desbordamiento horizontal a 390 px. La migración se entrega para ejecutarla al crear la base: todavía no se ha aplicado contra PostgreSQL real. No hay tienda desplegada ni datos de clientes guardados.
