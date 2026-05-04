# Tinder v9 corregido

Cambios aplicados:

1. El modo normal NO fue modificado.
2. El modo Tinder ya no arma la cola solo con los IDs que acaba de crear.
3. Ahora Tinder lee todos los `figu_matches` activos reales del usuario, que son los mismos intercambios reales que ve el modo simple.
4. Si no encuentra ninguno, recién ahí ejecuta `generateMatchesForUser` como fallback.
5. Se quitó el bloqueo de ubicación obligatoria dentro de `/figus/descubrir`; la ubicación sirve para ordenar/mostrar distancia, pero no debe dejar el Tinder vacío.
6. Si una tarjeta fue descartada durante pruebas, puede volver como fallback; y si el usuario toca “Me interesa”, se limpia su descarte previo.
7. Se agregó un `<details>` de diagnóstico en la pantalla vacía para ver conteos internos de Tinder.

No requiere SQL nuevo si ya ejecutaste `supabase/FIX_MATCHES_REALES_V4.sql`.
