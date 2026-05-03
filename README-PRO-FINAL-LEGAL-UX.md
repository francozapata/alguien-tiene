# ZIP PRO final - Legal + UX

Cambios incluidos:

## Mi álbum
- Se simplificó la carga:
  - tocar una figurita gris = la tenés
  - tocar una figurita ya marcada = suma repetida
  - aparece contador `x1`, `x2`, etc.
- Se eliminó el bloque separado “Figuritas que tenés / Repetidas que podés entregar”.
- Se mantiene la grilla de números, que era lo más útil.
- Se puede ajustar la repetida seleccionada con + / - o quitarla del álbum.

## Legal
- Footer legal en toda la app.
- Páginas:
  - `/legal/terminos`
  - `/legal/privacidad`
  - `/legal/seguridad`
- Texto +18 y aclaración de que la app es intermediaria.
- Recomendaciones de seguridad y deslinde por acuerdos entre usuarios.

## Registro / login
- Antes de entrar con Google se exige:
  - aceptar TyC y Privacidad
  - declarar ser mayor de 18 años
- Se agregan campos a `profiles`:
  - `terms_accepted`
  - `terms_accepted_at`
  - `is_adult_confirmed`

## Perfil
- Se eliminó la posibilidad de cambiar foto de perfil desde la app.
- La foto se toma directamente de Google.
- Solo se permite editar nombre visible.

## SQL
- Usar el archivo único:
  `supabase/TODO_SUPABASE_COMPLETO.sql`
