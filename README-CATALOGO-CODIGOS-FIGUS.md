# Catálogo definitivo de figuritas Mundial 2026

## Cambios incluidos

- Se reemplaza la nomenclatura numérica visible por códigos reales:
  - FWC0 a FWC19
  - Equipos por grupo, cada uno 1 a 20
  - CC1 a CC14

## Total nuevo
- 994 figuritas.

## Orden
1. Especiales: FWC0–FWC19
2. Grupo A a Grupo L, según imagen confirmada:
   - A: MEX, RSA, KOR, CZE
   - B: CAN, BIH, QAT, SUI
   - C: BRA, MAR, HAI, SCO
   - D: USA, PAR, AUS, TUR
   - E: GER, CUW, CIV, ECU
   - F: NED, JPN, SWE, TUN
   - G: BEL, EGY, IRN, NZL
   - H: ESP, CPV, KSA, URU
   - I: FRA, SEN, IRQ, NOR
   - J: ARG, ALG, AUT, JOR
   - K: POR, COD, UZB, COL
   - L: ENG, CRO, GHA, PAN
3. CC1–CC14

## Cómo se guarda internamente
Para no romper toda la lógica de matches existente, la app guarda internamente ordinales 1..994.
La UI muestra los códigos reales.

Ejemplos:
- ordinal 1 = FWC0
- ordinal 20 = FWC19
- ordinal 21 = MEX1
- último ordinal = CC14

## Archivos nuevos/importantes
- `lib/figus/catalog.ts`

## SQL
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega tabla:
- `figu_sticker_catalog`

Y actualiza el total a 994.
