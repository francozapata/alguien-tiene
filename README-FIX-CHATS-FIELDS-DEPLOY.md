# Fix deploy: campos de FiguMatch

Error de Vercel:
`Property 'user1_gets_figus' does not exist on type 'FiguMatch'`

Causa:
En algunos componentes quedó el nombre viejo:
- user1_gets_figus
- user2_gets_figus

Pero el tipo correcto y la tabla usan:
- figus_user1_gets
- figus_user2_gets

Corrección:
Se reemplazaron todas las referencias viejas por las correctas.

Después:
git add .
git commit -m "fix figu match field names"
git push
