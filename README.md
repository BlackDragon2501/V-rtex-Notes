# Vórtex Notes

**Tus ideas, sin límites.** App de notas con tres módulos en uno, de Vortex Company.

## Módulos

1. **Notas** — Editor markdown con vista previa en vivo, etiquetas de colores, fijar favoritas, búsqueda instantánea y exportación .md por nota.
2. **Diario / Journaling** — Calendario mensual con una entrada por día, estados de ánimo (muy mal a genial), racha de escritura, estadísticas del mes y búsqueda en todas las entradas.
3. **Enlaces rápidos** — Mini gestor de marcadores para tus sitios de cada día: nombre, URL, categoría y color, con apertura a un clic y copia de URL.

## Características

- Búsqueda global en los tres módulos.
- Exportación e importación de copia completa (.json) con fusión inteligente.
- Autosave en cada cambio; todo en `localStorage`.
- Renderizado markdown seguro (el HTML crudo se escapa siempre).

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · lucide-react.

## Privacidad

100% local: no hay backend, no hay cuentas, no hay rastreadores. Tus datos nunca salen de tu navegador. Exporta una copia de vez en cuando desde la barra superior.

## Desarrollo

```bash
bun install
bun run dev     # http://localhost:3000
bun run build   # producción
bun run lint    # eslint
```

## Despliegue

Despliega directo en Vercel: no requiere variables de entorno.

---

Derechos Reservados © 2026 Vortex Company · soporte: vortexmusic.soporte.app@gmail.com · Gratis · Sin anuncios
