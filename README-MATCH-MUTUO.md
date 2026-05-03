# Match mutuo y estado oculto

Cambios:
- Se quitó el selector de Estado del chat.
- Se quitó el selector de estado por card en Intercambios.
- En el listado manual, el botón Chat/Contactar sigue disponible.
- En Descubrir, “Quiero este” ya no abre chat automáticamente:
  - Guarda el interés del usuario.
  - Si la otra persona también da “Quiero este”, se marca match mutuo y se abre chat.
- Se agregan columnas:
  - liked_by_user1
  - liked_by_user2
  - mutual_interest

Importante:
Ejecutar nuevamente:
supabase/TODO_SUPABASE_COMPLETO.sql
