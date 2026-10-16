# StartUC3M · Investigación previa al rediseño (17 sep 2026)

## 1. Qué es Start UC3M

- Asociación de emprendedores de la Universidad Carlos III de Madrid. Nace en primavera de 2013 (alumnos de ADE: Javier Sánchez, Pablo Lorenzo, Aníbal Vera, Alejandro Luengo, David Arnedo, Carlos Delgado).
- Claim actual: **"Piensa diferente, actúa con propósito"**. Meta description: "Eventos, comunidad y proyectos para pasar de la idea a algo real".
- Cita de prensa (EFE Emprende): "una organización estudiantil que pretende acercar la innovación, el emprendimiento y el inconformismo a otros jóvenes".
- Concepto propio: **"starter"** — "Un starter no es solo alguien que forma parte de Start… alguien que aporta ideas, energía y actitud a la comunidad".
- Contacto: info@startuc3m.org · Instagram @startuc3m (~3k seguidores) · LinkedIn /company/start-uc3m · TikTok @startuc3m · YouTube @StartUC3MG.
- Sede de eventos: Campus Puerta de Toledo (UC3M); también TeamLabs (Plaza de San Martín, 1) y Madrid Startup Bar.

## 2. Estructura y contenido de la web actual (startuc3m.es)

Stack actual: Create React App (SPA) + react-router. Rutas: `/`, `/eventos`, `/equipo`, `/patrocinadores`, `/recursos`.
**`/patrocinadores` y `/recursos` están "Página en construcción"** → oportunidad clara.

### Eventos (marcas propias)
| Evento | Qué es |
|---|---|
| **Buildathon** (Pitchless × NomuLabs) | Arranque de temporada. "Construye tu primer prototipo con IA en una tarde". Equipos de 3, MVP con Lovable, mentores, demos, sangriada. Es la **puerta de entrada** a Start. Jueves 17 sep · 18:00 · Puerta de Toledo. Reserva vía luma.com |
| **Lovable Hackathon** | Hackathon no-code, "en colaboración con Racks", créditos de Lovable incluidos |
| **StartXperience** | Evento presencial de un día: startups pre-seed, empresas, inversores, lanzaderas, incubadoras del ecosistema madrileño |
| **Start Camp** | Formato campamento 2 días (nov), sold out en ediciones previas |
| Histórico | Alternativa Emprender (3 ediciones), Hack On Business |

### Equipo — 8 departamentos (con descripción ya escrita en la web)
Junta directiva · Eventos · Comunicación · Marketing · RRHH · Partnerships · Legal · IT.
Cargos: Presidenta, Vicepresidenta, Responsable, Asociado/a. ~14 miembros con foto + LinkedIn. Enlace a "viejas glorias" (alumni).

### Patrocinadores / partners detectados
NomuLabs, Pitchless, Lovable, Racks, TeamLabs, Madrid Startup Bar, Opinión20, ULVMAND (ticker de logos en home).

### Formularios / inscripción
- "Apuntarme a Start" → actualmente Tally (tally.so/r/5BAxX6).
- "Reservar plaza" en eventos → luma.com.
- Badge "Inscripciones abiertas · Curso 2026/27".

## 3. Auditoría visual de la marca actual

- **Logo**: wordmark `start_` en minúsculas con **guion bajo tipo cursor de terminal** + "EMPRENDEDORES | UC3M". Es el activo más fuerte y está infrautilizado.
- **Color**: azul cobalto `#2B3A91` (fondo casi omnipresente), navy `#152270` / `#0E1A52` / `#070D22`, cian `#4CC9F0`, amarillo `#F6C700`, rosa `#FF1493`, violeta `#7B61FF`… paleta sin sistema (25+ hex).
- **Tipografía**: Josefin Sans (títulos y cuerpo), Canicule Display en el hero. Legibilidad floja en párrafos.
- **Layout**: todo centrado, tarjetas con borde redondeado repetidas, hero con foto muy oscurecida. Sin ritmo entre secciones; no hay blog ni page de links; formularios externos.
- **Conclusión**: la marca tiene 2 ideas potentes (cobalto + cursor `_`) y ninguna se explota.

## 4. Requisitos del nuevo sitio (100 % funcional en local)

1. Home (hero, próximo evento, qué es Start, starter, patrocinadores, CTA inscripción).
2. Eventos (listado + ficha con agenda, inscripción integrada).
3. Blog / noticias (CMS).
4. Equipo (departamentos, filtros, alumni).
5. **Patrocinadores** (página pública de logos por tier) + **"Patrocina" / media kit** para captar empresas (tiers, qué obtienen, audiencia, formulario de contacto empresa).
6. Recursos.
7. Links (estilo linktree, para bio de Instagram/TikTok).
8. Formularios propios: inscripción a Start, inscripción a evento, contacto patrocinio, newsletter.
9. CMS con panel para editar todo lo anterior.

Stack candidato (decidir después del diseño): **Payload CMS 3 + Next.js + SQLite** (panel, colecciones, form submissions, todo local sin servicios externos) o Astro + Keystatic (git-based, más ligero, pero forms requieren backend aparte).

## 5. Direcciones visuales propuestas

Ver style tiles en `design/startuc3m.pen`.

### A · `terminal_` — "Solo build"
Explota el cursor del logo. Fondo navy profundo, cobalto como color de marca, un único acento ácido. Mono (Geist Mono) para etiquetas/datos, grotesk grande para titulares. Retículas técnicas, líneas de blueprint, ticker, cursor parpadeante, contadores. Sensación: hacker house / build tool. Encaja con Buildathon, "sin presentaciones interminables: solo build".
Riesgo: cliché tech si se abusa del neón.

### B · Editorial cobalto — "Revista de la comunidad"
Papel claro (off-white) como base y el cobalto como **tinta**, no como fondo. Titulares monumentales (Anton / grotesk condensada), cifras gigantes (2013, nº eventos, nº starters), fotografía grande con duotono cobalto, tipografía como protagonista. El cursor `_` se mantiene en etiquetas mono. La página de patrocinio se lee como un media kit impreso.
Riesgo: necesita fotos buenas; hay que producirlas.

### C · Póster cobalto — "Campus"
Bloques de color a sangre (cobalto / negro / blanco / amarillo `#F6C700`), retícula suiza, marquesinas, tags tipo pegatina, tipografía bold. Muy juvenil, lenguaje de cartel de evento universitario.
Riesgo: menos "premium" para el pitch a empresas.

**Recomendación**: **B como base con el sistema mono/cursor de A** (etiquetas, contadores, secciones "de datos" en dark). Es lo que más distingue a Start del resto de asociaciones (todas van a dark + neón), mantiene continuidad de marca (cobalto + `_`) y da una página de patrocinio con aspecto de media kit serio.
