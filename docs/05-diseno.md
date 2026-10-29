# 05 · Diseño

La web sigue el **brand kit de Marketing 26/27** (en Canva; pide el enlace a Marketing). Validado por Comunicación el 29/10/2026 (#63): la web tiene que sentirse como un grupo de jóvenes emprendedores con energía, no como una web institucional.

## Colores

Definidos una sola vez como *tokens* en `src/styles/global.css` (bloque `@theme`). En el código se usan como clases de Tailwind: `bg-cobalt`, `text-lime`, `border-line`…

| Token | Hex | Uso |
|---|---|---|
| `cobalt` | `#333399` | **Color principal**: cabeceras, fondos de sección, botones primarios |
| `cobalt-deep` | `#24246f` | Degradados y bordes sobre cobalto |
| `navy` | `#13133d` | Bloques oscuros (inscripción, tarjetas de eventos) |
| `ink` | `#12123a` | Texto sobre fondo claro |
| `paper` | `#f8f8fc` | Fondo de lectura |
| `paper-2` | `#efeff8` | Fondo alternativo de sección |
| `line` | `#dedeee` | Bordes y separadores |
| `lavender` | `#b6b8e7` | Texto secundario sobre cobalto o navy |
| `lime` | `#d6ff4f` | **Resalto**: el botón de acción principal ("Hazte socio", "Reservar plaza") y premios |
| `accent` | `#f5e443` | Amarillo de la estrella del brand kit |
| `cyan` | `#8ee1e6` | Subrayado tipo rotulador (`.hl`) |

Reglas:
- El **lima solo para la acción más importante** de cada pantalla. Si todo es lima, nada destaca.
- Texto sobre cobalto: blanco o `lavender`. Nunca `lavender` con opacidad: no llega al contraste mínimo.
- No añadas colores nuevos sin hablarlo con Marketing.

## Tipografías

Cargadas desde Google Fonts en `src/layouts/Base.astro`.

| Fuente | Token | Clase | Uso |
|---|---|---|---|
| **Anton** | `font-display` | `.display` | Titulares grandes, siempre en mayúsculas |
| **Titillium Web** | `font-sans` | (por defecto) | Todo el texto |
| **JetBrains Mono** | `font-mono` | `.eyebrow`, `.mono` | Etiquetas pequeñas en mayúsculas. `.eyebrow` añade el cursor `_` de la marca |
| **Permanent Marker** | `font-marker` | `.marker` | Frases "a mano" del brand kit, con moderación |

El `_` al final de los titulares (`Premios_`, `Info práctica_`) es parte de la marca: imita el cursor del logo `start_`.

## Clases propias

En `src/styles/global.css`:

| Clase | Qué hace |
|---|---|
| `.container-x` | Ancho máximo (1312 px) y márgenes laterales. Envuelve el contenido de cada sección |
| `.display` | Titular Anton en mayúsculas |
| `.eyebrow` / `.mono` | Etiqueta mono en mayúsculas (`.eyebrow` con `_`) |
| `.btn` + `.btn-primary` / `.btn-lime` / `.btn-on-blue` / `.btn-outline` | Botones. `btn-on-blue` = blanco sobre fondo cobalto |
| `.hl`, `.hl-lime` | Subrayado de rotulador detrás del texto |
| `.ph` | Hueco de marca (degradado cobalto con el logo) cuando no hay foto |
| `.ticker` | Marquesina de logos |
| `rounded-brand` | Radio de esquina de la marca (4 px) |

## Componentes de marca

- **`<Doodle name="star|arrow|underline|burst" />`**: garabatos del brand kit para acompañar titulares. Decorativos (`aria-hidden`).
- **`<Logo tone="white|cobalt" full />`**: el wordmark oficial, desde `public/brand/`.
- **`<PageHead eyebrow title intro />`**: cabecera estándar de las páginas interiores.
- **`<Photo name alt sizes eager position />`**: foto optimizada. Sin `alt` es decorativa. `eager` solo para la foto de cabecera (la primera que se ve).
- **Momentos** (polaroids giradas con cinta): el estilo collage de la portada del kit.

## Animaciones

Todo está en `src/lib/motion.ts` y se activa con atributos en el HTML:

| Atributo | Efecto |
|---|---|
| `data-reveal` | Aparece con un fundido y un ligero desplazamiento al entrar en pantalla |
| `data-stagger` | Sus hijos con `data-reveal` aparecen uno detrás de otro |
| `data-split` | El titular entra palabra a palabra. Se aplica solo a los `h1.display` y `h2.display` de hasta 12 palabras |
| `data-parallax` | Desplazamiento suave de la imagen con el scroll |
| `data-img-reveal` | La imagen se descubre con una cortina |

Además: scroll suave con **Lenis**, la pista horizontal del podcast con **ScrollTrigger** y una cortina con el logo la primera vez que se entra en cada sesión (se salta con `?noloader`).

**`prefers-reduced-motion`**: si la persona tiene activado "reducir movimiento" en su sistema, no hay cortina, ni scroll suave, ni reveals, ni marquesina: todo aparece directamente. Cualquier animación nueva tiene que respetarlo.

## Accesibilidad

Mínimos que comprobamos en cada PR (ver [09 · Calidad](09-calidad.md)):

- Contraste AA: 4,5:1 en texto normal y 3:1 en texto grande.
- Toda imagen con contenido lleva `alt`. Las decorativas, `alt=""` o `aria-hidden`.
- Los botones que alternan algo llevan `aria-pressed`; las cuentas atrás, `role="timer"` en un `<span>`.
- Foco visible al navegar con teclado.
- Formularios con `<label>`.
- Lighthouse de accesibilidad ≥ 95 en las páginas principales.

## Móvil

- Se diseña para **~400 px** primero y después escritorio.
- Ninguna página puede tener scroll horizontal a 360 px.
- Los avisos de Start Camp cambian según el ancho: lanyard en escritorio (≥ 1024 px), banner y barra en móvil y tablet.
