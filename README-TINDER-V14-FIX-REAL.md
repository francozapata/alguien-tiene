# Tinder v14 - fix real

Cambio puntual:

- El modo Tinder ya no oculta tarjetas por `status = HABLANDO` o `ACORDADO`.
- Solo oculta intercambios cerrados (`INTERCAMBIADO`, `CANCELADO`, `trade_applied`) o Tinder ya mutuo (`mutual_interest`).
- Agrega fallback para no dejar vacía la cola cuando en testing la única tarjeta ya tenía like/rechazo previo.
- Oculta el diagnóstico visual salvo que se active manualmente en navegador con:

```js
localStorage.setItem("figus_tinder_debug", "1")
```

No modifica el modo normal.
