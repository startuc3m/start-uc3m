# Decisiones

Registro de las decisiones que no se deducen mirando el código. La más reciente, arriba. Si tomas una decisión así, añádela con fecha, qué se decidió y por qué.

## 2026-10-29 · Analítica con Vercel Web Analytics (#62, PR #75)
- **Qué:** Vercel Web Analytics en todas las páginas y eventos de clic en "Hazte socio" y "Reservar plaza", con un único listener en `Base.astro`.
- **Por qué:** no usa cookies (sin banner de consentimiento), no añade otro proveedor y ya estamos en Vercel. Un listener único mide también los botones que se añadan después.
- **Límite aceptado:** los eventos de clic solo cuentan en el plan Pro.

## 2026-10-29 · Podcast: solo episodios completos de YouTube (#27)
- **Qué:** los episodios de la web son los Start The Week completos del canal, con su número y fecha reales. Los clips y los cortos no cuentan como episodio.
- **Por qué:** del #1 al #11 había clips de 2024 numerados como episodios, y faltaban del #12 al #18.

## 2026-10-29 · Identidad y copy validados (#63)
- Comunicación valida el brand kit aplicado y los textos de la home. A partir de aquí, los cambios de tono se consultan con Comunicación.

## 2026-10-27 · Inscripciones en Neonpass, no en Luma (#34)
- **Qué:** todas las inscripciones a eventos van por Neonpass. El campo `external` del evento es el enlace de compra.
- **Por qué:** es la plataforma que usa Eventos (entradas de pago, descuentos para socios, QR).

## 2026-10-27 · Ficha de evento alimentada por datos (#44, PR #70)
- **Qué:** premios, mentores, jurado, precio e info práctica son campos del `.md` y la ficha pinta cada sección solo si el campo existe.
- **Por qué:** los datos de Start Camp se confirman poco a poco. Así se añade cada dato en cuanto Eventos lo confirma, sin tocar el diseño, y lo no confirmado sale como "Por anunciar" o no sale.

## 2026-10-26 · Brand kit de Marketing 26/27 (#63, PR #69)
- **Qué:** paleta `#333399` + lima `#d6ff4f` de resalto, Anton para titulares, Permanent Marker para frases a mano, garabatos del kit y más fotos de personas.
- **Sustituye a:** la dirección visual de septiembre (cobalto `#2b3a91` y solo Titillium Web).
- **Por qué:** en la reunión de IT del 25/10 se vio que la web estaba bien hecha pero no transmitía la energía de Start.

## 2026-10-26 · Vídeo de la historia servido desde la web (#65)
- **Qué:** el vídeo está en `public/video/`: un avance de 8 s en bucle y el vídeo completo al pulsar play.
- **Por qué:** sin YouTube no hay cookies de terceros ni recomendaciones de otros vídeos. Límite de Vercel: < 25 MB por archivo.

## 2026-10-18 · Corte a producción (#40, PR #57)
- La web nueva sustituye a la de CRA. La etiqueta `web-cra-final` marca el último commit de la anterior. Se mergeó con squash, así que `main` empieza en un único commit de la web nueva.

## 2026-10-16 · Socios: portar sin reescribir (#45)
- **Qué:** las páginas de socios (`src/socios/*.jsx`) y `api/` se trajeron de la web anterior tal cual, como islas React.
- **Por qué:** es la parte que cobra dinero y ya funcionaba. Reescribirla antes del lanzamiento era un riesgo sin beneficio. La prueba completa en modo test (#22) queda para después.

## 2026-10-16 · Dominio canónico con `www` (#53)
- **Qué:** `www.startuc3m.es` es el canónico y el apex redirige con un 308.
- **Consecuencia:** el webhook de Stripe tiene que apuntar a la URL con `www`, porque Stripe no sigue redirecciones.

## 2026-10-16 · Solo contenido verificado (#7, #8, #9, #10, #11)
- **Qué:** lo que la directiva no ha validado se marca `draft: true` o se quita: eventos históricos, promesas de la página de Recursos, media kit, posts.
- **Por qué:** la web anterior tenía datos inventados (por ejemplo, una fecha de Start Camp que no era). Más vale una web más corta que una que promete cosas que no hacemos.

## 2026-10-16 · Blog solo con posts propios, oculto con menos de 3 (#30)
- **Qué:** fuera las noticias ajenas. El blog no se enlaza hasta que haya 3 posts publicados (`BLOG_MIN`).
- **Por qué:** un blog con uno o dos posts da sensación de abandono.

## 2026-10-16 · Contacto y patrocinio por correo con Resend (#33)
- **Qué:** `api/contacto.mjs` manda un correo al buzón de Start y no guarda nada. Antes había un "backend falso" que guardaba en un JSON (#16).
- **Por qué:** sin base de datos de mensajes no hay datos personales que custodiar, y el buzón ya es donde se trabaja.

## 2026-10-16 · Sin newsletter (#35)
- Se quitó de toda la web: no había proveedor ni texto legal, y nadie la iba a mantener.

## 2026-09-17 · Stack: Astro estático + `api/` de Vercel
- **Qué:** Astro 7 + Tailwind v4 + GSAP/Lenis, con salida estática y sin adaptador. Los endpoints van en `api/` como funciones de Vercel, igual que en la web anterior.
- **Por qué:** la web es casi toda contenido. Lo estático es rápido, barato y no se cae. Las funciones de socios ya existían y así no hubo que tocarlas.

## 2026-09-17 · Sin CMS, de momento (#43)
- **Qué:** el "CMS" son los markdown de `src/content/` y `src/lib/site.ts`, editados con PR. Se descartó un panel (Payload, Keystatic, Decap).
- **Por qué:** el equipo que edita es pequeño y técnico, y un panel añade mantenimiento y otra superficie de ataque.
- **Revisar:** después del lanzamiento, con datos de cuántos cambios de contenido hubo y quién los pidió. Si la junta necesita editar sin git, se valora Keystatic (guarda en el propio repo).
