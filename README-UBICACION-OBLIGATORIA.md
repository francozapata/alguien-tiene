# Ubicación obligatoria

Cambios:
- `/figus/matches` e `/figus/descubrir` ahora exigen ubicación válida.
- Si no hay ubicación, se muestra una pantalla para activarla.
- Sin ubicación no se habilita la búsqueda de figus cercanas.
- Si el navegador bloquea ubicación por estar en `http://192.168...`, muestra el motivo.

IMPORTANTE:
En celular, Chrome/Android no permite geolocalización real en:
`http://192.168.x.x:3000`

Para que funcione sí o sí en mobile necesitás HTTPS.

Opciones:

## Opción A: Deploy
Subir a Vercel/Netlify/Render con HTTPS y probar desde el celular.

## Opción B: túnel HTTPS con ngrok
1. Instalar ngrok.
2. Correr tu app:
   npm run dev
3. En otra terminal:
   ngrok http 3000
4. Abrir en el celular la URL HTTPS que te da ngrok.
5. Agregar ese dominio en Firebase Authentication > Settings > Authorized domains.
   Ejemplo: si ngrok da `abc123.ngrok-free.app`, agregar:
   abc123.ngrok-free.app

## Opción C: Cloudflare Tunnel
1. Instalar cloudflared.
2. Correr:
   cloudflared tunnel --url http://localhost:3000
3. Abrir la URL HTTPS en el celular.
4. Agregar ese dominio en Firebase Authorized domains.

También ejecutar:
`supabase/TODO_SUPABASE_COMPLETO.sql`
para asegurar columnas lat/lng y distance_km.
