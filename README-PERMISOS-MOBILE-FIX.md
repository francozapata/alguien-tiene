# Fix permisos mobile

Cambios:
- El banner de permisos desaparece si ya se resolvió ubicación/notificaciones.
- Si el navegador bloquea ubicación o notificaciones, no queda molestando.
- En mobile por `http://192.168.x.x` se muestra/gestiona como no disponible porque Chrome exige HTTPS para geolocation.
- Para probar ubicación real en celular:
  - usar deploy HTTPS, o
  - túnel HTTPS tipo ngrok/cloudflare tunnel.
- En PC `localhost` puede seguir funcionando.

Después de reemplazar:
1. Ctrl+C
2. npm run dev
