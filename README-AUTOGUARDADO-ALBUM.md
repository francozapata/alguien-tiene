# Autoguardado de álbum

## Cambios

- Se eliminó el botón "Guardar álbum".
- Cada cambio de cantidad se guarda automáticamente.
- El guardado usa debounce de 650 ms para no hacer una petición por cada click inmediato.
- Se muestra estado:
  - "Autoguardado activo"
  - "Guardando..."
  - "Cambios guardados automáticamente."
- Aplica a:
  - seleccionar una figurita sin cantidad
  - sumar cantidad
  - restar cantidad
  - cargar por búsqueda/selección

## Archivo modificado

- `app/figus/mi-album/page.tsx`
