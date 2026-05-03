# Fix deploy TypeScript

Se corrigió el error de Vercel:

`Cannot find name 'FiguMatchStatus'`

Archivo corregido:
`app/figus/chat/[matchId]/page.tsx`

Causa:
Quedó una función vieja `changeStatus(nextStatus: FiguMatchStatus)` que ya no se usa.
El flujo actual de chat/intercambio ya maneja el estado desde reputación/intercambio cumplido, por eso esa función se eliminó.

Después de copiar este ZIP:
git add .
git commit -m "fix deploy typescript chat status"
git push
