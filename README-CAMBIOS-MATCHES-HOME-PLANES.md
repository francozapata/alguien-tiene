# Cambios implementados

- Home reorganizado: permisos, plan, misión, completar álbum, búsqueda simple recomendada y modo rápido.
- Búsqueda simple directa: usa álbum y repetidas ya guardadas; no vuelve a pedir carga.
- Match justo 1 a 1: siempre se limita a la misma cantidad entregada/recibida.
- Contacto simple: abre chat y envía mensaje automático del moderador.
- Tinder: el chat se habilita solo con match mutuo.
- Confirmación bilateral: el álbum de ambos se actualiza recién cuando los dos confirman intercambio realizado.
- Mensajes/notificaciones: realtime + polling; botones para marcar leído todo.
- Planes: respeta radio, resultados, contactos, likes, deshacer y ver interesados.
- Nomenclatura: se usan códigos del catálogo FIFA, no números corridos visibles en las tarjetas.

## SQL necesario
Ejecutar este bloque en Supabase si todavía no existen las columnas:

```sql
alter table public.figu_matches add column if not exists user1_confirmed_trade boolean not null default false;
alter table public.figu_matches add column if not exists user2_confirmed_trade boolean not null default false;
create index if not exists idx_figu_matches_confirm_trade on public.figu_matches(user1_confirmed_trade, user2_confirmed_trade);
```
