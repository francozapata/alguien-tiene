# Fix amplio TypeScript para deploy

Este ZIP corrige varios errores de tipado que Vercel venía mostrando de a uno.

Incluye:
- `rejected_by_user1/rejected_by_user2` en la query de `rejectFiguMatch`.
- Tipado explícito de mapas (`Map<string, any>`, `Map<number, number>`).
- Cast controlado de resultados Supabase en funciones críticas:
  - aplicar intercambio cumplido
  - reputación
  - reportes
  - ocultar chat
- Reemplazo global de campos viejos:
  - `user1_gets_figus` → `figus_user1_gets`
  - `user2_gets_figus` → `figus_user2_gets`

Después:
git add .
git commit -m "fix amplio typescript deploy"
git push
