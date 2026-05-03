# Alguien tiene

Proyecto Next.js + Supabase + Firebase Auth.

## Fase 3 incluida

Se agregó:
- Sección `/emprendimientos`.
- Categoría `EMPRENDIMIENTOS`.
- Datos extra para emprendimientos: contacto, teléfono/WhatsApp, dirección/zona y link de Google Maps.
- Publicaciones destacadas para emprendimientos.
- Botón de admin para destacar/quitar destacado.
- Orden de publicaciones activas priorizando destacadas.

## Importante Supabase

Antes de probar la Fase 3, ejecutar en Supabase SQL Editor:

```sql
-- archivo: supabase/fase-3.sql
```

Ese script agrega las columnas nuevas y habilita la categoría `EMPRENDIMIENTOS`.

## Desarrollo

```bash
npm install
npm run dev
```
