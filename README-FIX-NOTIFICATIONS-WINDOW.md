# Fix deploy: notifications localStorage

Error Vercel:
`Property 'localStorage' does not exist on type 'never'`

Causa:
TypeScript/Turbopack infería mal `window` dentro de la rama donde no existe Notification.

Corrección:
Se reemplazó el uso directo de `window.localStorage` por helpers seguros con `globalThis.localStorage`.

Después:
git add .
git commit -m "fix notifications localStorage typing"
git push
