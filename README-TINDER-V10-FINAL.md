# Tinder v10 - cola de tarjetas corregida

Cambios aplicados:

- No se modificó el modo normal/simple.
- Tinder ya no descarta tarjetas por radio/distancia: la distancia solo ordena.
- Tinder ya no depende de un estado exacto tipo ACTIVO/PENDIENTE para mostrar tarjetas.
- Si existe una propuesta real con figuritas para mostrar, se convierte en tarjeta.
- Se mantiene la esencia Tinder:
  - primero aparecen usuarios que te dieron like;
  - después tarjetas nuevas;
  - si en testing descartaste todo, las descartadas vuelven como fallback;
  - si ya diste like y el otro no respondió, no se repite como tarjeta principal;
  - el chat sigue abriéndose solo con match mutuo.

No requiere SQL nuevo si ya ejecutaste el SQL de la v4.
