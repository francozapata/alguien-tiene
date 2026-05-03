# Fix deploy: progressRows type

Error Vercel:
`Property 'owned_figus' does not exist on type '{}'`

Causa:
TypeScript infirió algunos `Map` como `Map<any, {}>` dentro de `services/figus.ts`.

Corrección:
Se tiparon explícitamente:
- `progressByUser = new Map<string, any>(...)`
- `reputationByUser = new Map<string, any>(...)`
- `percentByUser = new Map<string, number>(...)`

Después:
git add .
git commit -m "fix services progress types"
git push
