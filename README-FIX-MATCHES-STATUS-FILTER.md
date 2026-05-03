# Fix deploy: statusFilter

Error Vercel:
`Cannot find name 'statusFilter'`

Causa:
La página `/figus/matches` usaba el filtro `statusFilter`, pero faltaba declarar su estado con `useState`.

Corrección:
- Se agregó:
  `const [statusFilter, setStatusFilter] = useState("ACTIVOS");`
- Se agregó selector visual para filtrar por estado.

Después:
git add .
git commit -m "fix matches status filter"
git push
