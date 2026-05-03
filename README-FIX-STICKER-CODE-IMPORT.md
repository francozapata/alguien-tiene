# Fix deploy: stickerCode import

Error Vercel:
`Cannot find name 'stickerCode'`

Causa:
`app/figus/solicitud/page.tsx` usaba `stickerCode()` pero faltaba importarlo.

Corrección:
Se agregó:
`import { stickerCode } from "@/lib/figus/catalog";`

Después:
git add .
git commit -m "fix stickerCode import"
git push
