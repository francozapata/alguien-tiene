# Rediseño de matches + planes semanales

Cambios implementados:

## Match real 1x1

- El sistema solo genera match si hay compatibilidad mutua:
  - el usuario A necesita una figurita que B tiene repetida;
  - el usuario B necesita una figurita que A tiene repetida.
- Todo intercambio queda balanceado mano a mano.
- La cantidad posible se calcula como:

```txt
min(figus que yo recibo, figus que la otra persona recibe)
```

Ejemplo: si la otra persona tiene 3 que me sirven, pero yo solo tengo 1 que le sirve, el match queda en 1x1.

## Ubicación real

- Ya no se usa ciudad/barrio escrito manualmente para decidir matches.
- El generador exige lat/lng reales de ambos perfiles, obtenidos por permiso de ubicación.
- Ciudad/barrio quedan solo como dato visual/sugerencia.

## Modo simple/manual

- Muestra una lista de combinaciones reales 1x1.
- Permite ordenar por cercanía o por cantidad de intercambios posibles.
- Respeta el radio y la cantidad visible del plan activo.
- Ya no muestra “usuarios cercanos” sin match real.

## Modo Tinder

- Usa los mismos matches reales 1x1.
- Muestra una tarjeta por vez.
- Ordena automáticamente por mejor oportunidad:
  - cantidad de intercambios posibles;
  - cercanía;
  - urgencia;
  - prioridad del plan.
- Respeta límite de tarjetas y “me interesa” diario según plan.

## Planes semanales

Planes nuevos:

- Gratis
- Básico
- Plus
- Premium

Límites:

| Plan | Manual | Usuarios visibles | Contactos | Radio | Tinder | Likes | Deshacer | Extras |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Gratis | 5/día | 3 | 1/día | 3 km | 10/día | 3/día | 0 | básico |
| Básico | 20/día | 10 | 5/día | 8 km | 40/día | 15/día | 1/día | prioridad baja |
| Plus | ilimitado | 30 | 20/día | 20 km | 150/día | 60/día | 5/día | ver interesados + prioridad media |
| Premium | ilimitado | ilimitado | ilimitado | 50 km | ilimitado | ilimitado | ilimitado | prioridad máxima |

## Admin

- El admin ahora puede otorgar Básico, Plus o Premium.
- Todos los planes pagos son semanales por defecto.

## Mercado Pago

Quedan listas las variables nuevas para cuando se definan valores y links:

```env
NEXT_PUBLIC_MP_LINK_BASICO=
NEXT_PUBLIC_MP_LINK_PLUS=
NEXT_PUBLIC_MP_LINK_PREMIUM=
MP_PRICE_BASICO=0
MP_PRICE_PLUS=0
MP_PRICE_PREMIUM=0
```

Al definir precios, actualizar esas variables y revisar los links de pago.
