# Fix deploy: rawCurrentUserGets unknown[]

Error Vercel:
`Argument of type 'unknown[]' is not assignable to parameter of type 'number[]'`

Causa:
TypeScript infirió `new Set(...)` como `Set<unknown>` en `services/figus.ts`.

Corrección:
Se tiparon explícitamente:
- `new Set<number>(...)`
- `rawCurrentUserGets: number[]`
- `rawOtherUserGets: number[]`
- `profileById: Map<string, any>`

Después:
git add .
git commit -m "fix raw gets types"
git push
