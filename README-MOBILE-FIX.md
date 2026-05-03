# Mobile fix

Cambios:
- Navbar móvil compacta.
- El logo ya no ocupa varias líneas en celular.
- Botones reducidos en mobile.
- `next.config.ts` actualizado con `allowedDevOrigins` para `192.168.0.154`.

Importante:
Después de reemplazar archivos:
1. Frenar servidor con Ctrl+C.
2. Correr de nuevo `npm run dev`.
3. En celular abrir `http://192.168.0.154:3000/figus`.

Si cambia la IP de tu PC, actualizar `next.config.ts`.
