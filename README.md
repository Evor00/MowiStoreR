# MowiStore

Remake de comercio electrónico orientado a producción. Este repositorio agrupa la tienda, el panel administrativo y los servicios de negocio sin duplicar responsabilidades.

## Estado inicial

Están implementados el núcleo `services/core-api` (Django REST Framework, autenticación JWT, catálogo, carrito, pedidos y PostgreSQL) y `services/intelligence-payments` (Spring Boot, Stripe y Gemini). Las interfaces React se añadirán como módulos independientes.

## Arquitectura

- `services/core-api`: fuente de verdad de cuentas, catálogo, inventario, carrito y pedidos.
- `services/intelligence-payments`: servicio Spring Boot para Payment Intents de Stripe, webhooks firmados y recomendaciones Gemini.
- `apps/storefront` y `apps/admin-dashboard`: futuras aplicaciones React + Vite.
- PostgreSQL: almacén relacional único del dominio de comercio.

## Desarrollo local

1. Copia `.env.example` como `.env`.
2. Ejecuta `docker compose up --build`.
3. Consulta el estado del Core API en `http://localhost:8000/api/v1/health/`, su contrato OpenAPI en `http://localhost:8000/api/schema/` y el del servicio Spring Boot en `http://localhost:8080/actuator/health`.

## Integraciones externas

Configura los secretos en `.env` antes de usar los endpoints de integración:

- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` habilitan `POST /api/v1/payments/payment-intents` y el webhook `POST /api/v1/payments/webhooks/stripe` en el puerto `8080`.
- `GEMINI_API_KEY` habilita `POST /api/v1/ai/recommendations` en el puerto `8080`.
- `CORE_SERVICE_TOKEN` e `INTERNAL_SERVICE_TOKEN` deben tener exactamente el mismo valor para autorizar únicamente la comunicación Spring Boot → Django.

Para la futura publicación, los frontends se desplegarán en Vercel y los dos servicios de backend en Render. PostgreSQL se conectará mediante `DATABASE_URL` y SSL en producción.

## Storefront

El frontend público está en `apps/storefront`. Copia `apps/storefront/.env.example` como `apps/storefront/.env`, instala dependencias y ejecútalo:

```powershell
cd apps/storefront
npm install
npm run dev
```

`VITE_STRIPE_PUBLISHABLE_KEY` puede publicarse en Vercel; las claves secretas de Stripe, Gemini y el token entre servicios se mantienen exclusivamente en Render.

## Panel administrativo

El panel de operaciones está en `apps/admin-dashboard`. Para ejecutar la aplicación localmente:

```powershell
cd apps/admin-dashboard
npm install
npm run dev
```

El acceso requiere un usuario Django con rol de operador/administrador y el flag `is_staff`. Para crear el primer administrador local, con Docker Compose iniciado, ejecuta:

```powershell
docker compose exec api python manage.py createsuperuser
```
