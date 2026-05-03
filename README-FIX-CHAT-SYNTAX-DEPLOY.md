# Fix deploy: chat syntax

Error de Vercel:
`Return statement is not allowed here`
en:
`app/figus/chat/[matchId]/page.tsx`

Causa:
Había una llave `}` extra después de la función `handleSend`.

Corrección:
Se eliminó esa llave extra y se dejó el componente bien cerrado.

Después de copiar este ZIP al proyecto:
git add .
git commit -m "fix chat syntax deploy"
git push
