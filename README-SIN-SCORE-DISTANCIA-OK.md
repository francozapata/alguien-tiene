# Sin porcentaje + distancia saneada

Cambios:
- Se eliminó el porcentaje de Descubrir.
- La propuesta ahora muestra: Intercambio 1x1, 2x2, etc.
- Si la distancia calculada da más de 100 km, se descarta como ubicación inválida para este MVP local.
- En vez de mostrar distancias falsas como 7583 km, ahora muestra “Ubicación por confirmar”.
- Intercambios, Descubrir y Chat usan etiquetas de distancia más claras.

Por qué pasaba:
- Algún perfil tenía coordenadas viejas, malas o de otro contexto.
- En mobile con `http://192.168...` el navegador no permite geolocalización real, entonces puede quedar una coordenada previa o incompleta.

Para probar distancia real:
- Ambos usuarios deben aceptar ubicación desde un contexto seguro.
- En celular necesitás HTTPS/deploy o túnel HTTPS.
- Después entrar a Intercambios/Descubrir para recalcular.
