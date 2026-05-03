# Hydration fix

Cambio principal:
- `components/figus/PermissionsPanel.tsx` ahora usa `mounted`.
- El componente devuelve `null` hasta que el cliente monta.
- Esto evita que SSR y cliente rendericen HTML distinto por permisos de navegador, ubicación o notificaciones.

Qué hacer al actualizar:
1. Reemplazar el proyecto por este ZIP.
2. Ejecutar SQL si no estaba actualizado:
   `supabase/TODO_SUPABASE_COMPLETO.sql`
3. Frenar servidor:
   `Ctrl + C`
4. Opcional pero recomendado:
   borrar caché de Next:
   Windows:
   `rmdir /s /q .next`
5. Correr:
   `npm run dev`

Si probás desde celular:
- `http://192.168...` no permite ubicación real por seguridad del navegador.
- Para geolocalización mobile real necesitás HTTPS/deploy o túnel HTTPS.
