# Fix checkpoint, porcentaje y distancia

Cambios:
- Se eliminó el bloque lateral de “Confirmación” del checkpoint.
- El checkpoint ahora muestra acciones directas:
  - Guardar y buscar
  - Encontrar figus
  - Home Figus
- En Intercambios ya no se muestra un porcentaje confuso como dato principal.
- Ahora se muestra:
  - Intercambio 1x1 / 2x2 / etc.
  - Recibís X
  - Entregás X
  - Distancia + etiqueta de cercanía
- En Descubrir también se reemplaza el porcentaje por una propuesta clara.
- Se agregó `syncStoredLocation()` para guardar en Supabase la ubicación que ya exista en el dispositivo antes de recalcular matches.

Importante para que la distancia aparezca:
1. Ejecutar `supabase/TODO_SUPABASE_COMPLETO.sql`.
2. Ambos usuarios deben tener `profiles.lat` y `profiles.lng` cargados.
3. Entrar a `/figus/matches` o `/figus/descubrir` y presionar recalcular si hace falta.
4. En celular por `http://192.168...` el navegador no permite geolocalización real. Para mobile real necesitás HTTPS/deploy.
