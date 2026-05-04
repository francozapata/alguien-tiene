# FIX Tinder V6

Corrección aplicada:

- El modo simple mostraba matches reales, pero Tinder podía quedar vacío porque ocultaba permanentemente tarjetas ya descartadas en pruebas anteriores (`rejected_by_userX = true`).
- Con pocos usuarios de testing, si descartabas una tarjeta una vez, Tinder no volvía a mostrarla aunque el intercambio real siguiera existiendo.
- Ahora Tinder usa una cola estricta primero, pero si no queda ninguna tarjeta fresca, reofrece intercambios reales descartados. Los likes ya enviados no se repiten.

No requiere SQL nuevo si ya ejecutaste el SQL de la V4.
