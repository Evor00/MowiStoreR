# Despliegue de MowiStore

## Antes de publicar

1. Sube este repositorio a GitHub y protege `main` con el workflow **Quality checks**.
2. Crea dos proyectos en Vercel, con directorios raíz `apps/storefront` y `apps/admin-dashboard`.
3. En Render crea una base PostgreSQL y dos Web Services desde `services/core-api` y `services/intelligence-payments`.
4. Configura los dominios de Vercel en `DJANGO_CORS_ALLOWED_ORIGINS` y `CORS_ALLOWED_ORIGINS`.

## Vercel

Las dos aplicaciones son Vite estáticas. En cada proyecto selecciona el directorio raíz correspondiente y configura:

| Proyecto | Root directory | Build command | Output directory |
| --- | --- | --- | --- |
| Tienda | `apps/storefront` | `npm run build` | `dist` |
| Administración | `apps/admin-dashboard` | `npm run build` | `dist` |

Variables para la tienda: `VITE_CORE_API_URL`, `VITE_PAYMENTS_API_URL` y `VITE_STRIPE_PUBLISHABLE_KEY`. Para el panel: `VITE_CORE_API_URL`.

## Render

El Core API requiere `DATABASE_URL`, `DJANGO_ENV=production`, `DJANGO_DEBUG=False`, `DJANGO_SECRET_KEY`, `INTERNAL_SERVICE_TOKEN`, `DJANGO_ALLOWED_HOSTS` y `DJANGO_CORS_ALLOWED_ORIGINS`.

El servicio Spring requiere `CORE_API_URL`, `CORE_SERVICE_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY` y `CORS_ALLOWED_ORIGINS`.

Los valores `CORE_SERVICE_TOKEN` e `INTERNAL_SERVICE_TOKEN` deben ser idénticos y mantenerse secretos. Una vez exista el remoto GitHub, genera y valida el Blueprint `render.yaml` antes de aplicar recursos en Render.
