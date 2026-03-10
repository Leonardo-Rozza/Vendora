PRD — E-commerce MVP Argentina

1. Visión del producto

Desarrollar una plataforma de e-commerce simple y escalable para vender productos físicos en Argentina (electrónica ligera, gadgets, artículos para el hogar, accesorios, etc.).

El sistema permitirá:

publicar productos con imágenes

gestionar inventario

vender online

procesar pagos con Mercado Pago

gestionar pedidos

El objetivo inicial es lanzar un MVP funcional rápidamente, con arquitectura preparada para crecer.

2. Objetivos del MVP
   Objetivos principales

permitir publicar productos

permitir comprar productos

procesar pagos online

gestionar pedidos

administrar catálogo

Objetivos secundarios

tener código profesional

aplicar buenas prácticas

preparar el sistema para crecer

3. Alcance del MVP
   Incluido

Catálogo de productos
Carrito de compras
Checkout con Mercado Pago
Gestión de pedidos
Panel admin simple
Gestión de imágenes
Inventario básico

No incluido (por ahora)

Marketplace multi vendedor
Cupones
Reviews de usuarios
Sistema de envíos automatizado
Analytics complejos
Promociones avanzadas

4. Usuarios del sistema
   Cliente

Puede:

navegar productos

ver categorías

ver detalle de producto

agregar al carrito

comprar

pagar con Mercado Pago

Administrador

Puede:

crear productos

editar productos

subir imágenes

ver pedidos

actualizar estado de pedidos

5. Flujo de compra
   usuario entra a la web
   ↓
   ve productos
   ↓
   agrega al carrito
   ↓
   checkout
   ↓
   redirección a MercadoPago
   ↓
   pago realizado
   ↓
   MercadoPago envía webhook
   ↓
   backend confirma pago
   ↓
   orden pasa a estado PAGADA
6. Arquitectura del sistema
   Arquitectura general
   Frontend (Next.js)
   ↓
   API Backend (Node / NestJS)
   ↓
   PostgreSQL
   ↓
   Cloudinary (imágenes)
   ↓
   MercadoPago (pagos)
   Infraestructura

Frontend

Next.js
Vercel

Backend

Node.js
NestJS o Express
Railway

Base de datos

PostgreSQL
Supabase / Railway

Imágenes

Cloudinary

Pagos

Mercado Pago
Checkout Pro

CI/CD

GitHub Actions 7. Modelo de dominio

El modelo debe ser flexible para vender distintos tipos de productos.

Category

Representa categorías del catálogo.

Ejemplo:

Electrónica
Gadgets
Hogar
Accesorios

Campos

id
name
slug
parent_id
created_at
Product

Producto conceptual.

Ejemplo:

Auriculares Logitech G435

Campos

id
name
slug
description
category_id
brand
status
created_at
updated_at
ProductVariant

Variante vendible.

Ejemplo

Auriculares Logitech G435 Negro
Auriculares Logitech G435 Azul

Campos

id
product_id
sku
price
stock
weight
created_at
ProductImage

Imágenes del producto.

Campos

id
product_id
url
position
created_at
Attribute

Atributos flexibles.

Ejemplo

color
potencia
material
capacidad

Campos

id
name
AttributeValue

Valores de atributos.

Ejemplo

negro
600W
vidrio

Campos

id
attribute_id
value
ProductAttributeValue

Relación producto-atributo.

Campos

id
product_id
attribute_value_id
Inventory

Inventario por variante.

Campos

variant_id
stock
reserved_stock
Cart

Carrito de compra.

Campos

id
user_id
created_at
CartItem

Producto dentro del carrito.

Campos

id
cart_id
variant_id
quantity
Order

Orden de compra.

Campos

id
user_id
status
total
payment_status
created_at

Estados:

PENDING
PAID
SHIPPED
DELIVERED
CANCELLED
OrderItem

Productos de una orden.

Campos

id
order_id
variant_id
price
quantity
Payment

Pago asociado a una orden.

Campos

id
order_id
provider
provider_payment_id
status
created_at 8. API endpoints principales
Catálogo
GET /products
GET /products/:id
GET /categories
Carrito
POST /cart/add
POST /cart/remove
GET /cart
Checkout
POST /checkout

Crea preferencia de pago en Mercado Pago.

Webhook Mercado Pago
POST /payments/webhook

Actualiza estado del pago.

Admin
POST /admin/products
PUT /admin/products/:id
DELETE /admin/products/:id
GET /admin/orders 9. Integración Mercado Pago

Se usará:

Checkout Pro

Flujo

backend crea preferencia

frontend redirige a Mercado Pago

usuario paga

Mercado Pago envía webhook

backend confirma pago

10. Gestión de imágenes

Las imágenes se almacenarán en:

Cloudinary

Flujo

admin sube imagen
↓
backend sube a Cloudinary
↓
se guarda URL en DB 11. Seguridad

Medidas mínimas:

validación de inputs

sanitización de datos

autenticación admin

manejo seguro de webhooks

protección contra SQL injection

protección contra XSS

12. Logging

Usar:

Pino

Logs importantes

pagos
errores
ordenes
webhooks 13. Tests

Para el MVP:

Tests unitarios

servicios
pagos
ordenes

Tests de integración

checkout
webhook

Framework sugerido

Jest 14. CI/CD

Pipeline básico

push
↓
tests
↓
build
↓
deploy

GitHub Actions.

15. Performance

Estrategias iniciales

caching en frontend

paginación en catálogo

optimización de imágenes

16. Roadmap después del MVP

Versión 2

cupones

envíos automáticos

analytics

Versión 3

sistema multi vendedor

marketplace

17. Métricas clave

conversion rate

ticket promedio

productos más vendidos

pedidos diarios

18. Riesgos

Competencia fuerte
problemas de logística
problemas de stock
problemas con pagos

19. Estrategia de lanzamiento

lanzar MVP

cargar catálogo inicial

probar ventas

mejorar producto

20. Resultado esperado

Una plataforma de e-commerce:

funcional

profesional

escalable

con bajo costo de infraestructura
