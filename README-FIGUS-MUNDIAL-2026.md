# Figus Mundial 2026 - módulo completo

## Qué trae esta versión

- Menú principal: **Figus Mundial 2026**.
- Álbum de **980 figuritas**.
- Mi álbum con grilla paginada, porcentaje, faltantes, buscador rápido y carga por rangos.
- Botón **“Me faltan todas menos estas”**: genera solicitud automática con todas las faltantes.
- Repetidas con carga masiva inteligente:
  - `25, 25, 25` se interpreta como 25 x3.
  - `25x3` también funciona.
- Solicitudes por ciudad, barrio/zona, urgente y observaciones.
- Match doble y simple.
- Match con puntaje de utilidad de 1 a 100.
- Match múltiple sugerido: combina hasta 3 personas para conseguir más figus distintas.
- Estado del intercambio: pendiente, hablando, acordado, intercambiado, cancelado.
- Chat interno por match.
- Reputación básica desde el chat: cumplió / no apareció.
- Ranking viral: top álbumes, figus más buscadas y más ofrecidas.
- Sugerencias de encuentro seguro por zona.

## Archivo único para Supabase

Ejecutar este archivo completo en Supabase SQL Editor:

```txt
supabase/TODO_SUPABASE_COMPLETO.sql
```

Ese archivo incluye las tablas del proyecto y todo el módulo Figus.

## Pasos para correr

1. Descomprimir el ZIP.
2. Abrir la carpeta en VS Code.
3. Crear o revisar `.env.local` con Firebase y Supabase.
4. Ejecutar en Supabase SQL Editor:
   - `supabase/TODO_SUPABASE_COMPLETO.sql`
5. Instalar dependencias:

```bash
npm install
```

6. Correr local:

```bash
npm run dev
```

7. Abrir:

```txt
http://localhost:3000/figus
```

## Rutas principales

- `/figus`
- `/figus/mi-album`
- `/figus/repetidas`
- `/figus/solicitud`
- `/figus/matches`
- `/figus/chat/[matchId]`

## Recomendación de prueba

Para probar matches, necesitás al menos dos usuarios distintos:

Usuario A:
- Necesita: 10, 20, 30
- Repetidas: 80x2, 90

Usuario B:
- Necesita: 80, 90
- Repetidas: 10, 20, 30

Con eso debería aparecer match doble.
