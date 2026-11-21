# 12 · Start Skills

> Parte de la [documentación de la web](README.md). Si cambias cómo se sincroniza esta sección con Notion, actualiza este documento en el mismo PR.

Start Skills es el programa de liderazgo de cinco sábados que compartimos con **Start Comillas**, **BIC** y **Business Club Zaragoza**. La web tiene una página general del programa y una página por bloque, con tema, fecha, formador, participantes y fotos.

## Qué es y dónde está

| Ruta | Qué muestra |
|---|---|
| `/eventos/start-skills` | Resumen del programa: los cinco bloques, cuál está celebrado y cuál es el próximo |
| `/eventos/start-skills/<slug>` | Una página por bloque (ver tabla de abajo) |

Se llega desde el desplegable **Eventos** del menú superior, opción *Start Skills*.

| Bloque | Slug (URL) |
|---|---|
| 1 · Conócete | `/eventos/start-skills/conocete` |
| 2 · Conecta | `/eventos/start-skills/conecta` |
| 3 · Gestiona | `/eventos/start-skills/gestiona` |
| 4 · Lidera | `/eventos/start-skills/lidera` |
| 5 · Proyéctate | `/eventos/start-skills/proyectate` |

Cada página de bloque enseña:

- **Tema** del bloque, fecha, hora y lugar.
- **Formador**, con foto, cargo y LinkedIn.
- **Participantes**, en cuadrícula, con asociación y LinkedIn.
- **Galería de fotos**. Cada foto se puede descargar por separado y todas juntas en un `.zip`.

El estado de cada bloque (*Celebrado*, *Próximo* o *Por llegar*) se calcula en el momento del build a partir de la fecha. Por eso hace falta un despliegue al día (ver más abajo).

## Cómo llega el contenido a la web

La web es estática. El contenido **no se edita en el código**: sale de Notion.

1. En cada build de Vercel se ejecuta `scripts/sync-startskills.mjs`.
2. El script lee Notion con el token `NOTION_STARTSKILLS_API_KEY` (la integración propia de Start Skills) o, si no existe, con `NOTION_API_KEY` (el de socios), y las bases de datos de Start Skills.
3. Descarga las fotos y las copia dentro de la web. Las URLs de las fotos de Notion caducan a la hora, por eso no se enlazan directamente.
4. Genera un `.zip` por bloque con todas sus fotos.
5. Escribe `src/data/startskills.generated.json`, que es lo que lee la web.

Si no hay token (ni `NOTION_STARTSKILLS_API_KEY` ni `NOTION_API_KEY`) o falta `NOTION_STARTSKILLS_DATABASE_ID`, el build usa sin avisar el archivo de respaldo `src/data/startskills.seed.json`. Ese archivo es una copia de ejemplo versionada en git. **No es la fuente de verdad.**

Un cambio en Notion aparece en la web **en el siguiente build**. Hay dos formas de provocarlo:

- **Automática:** un GitHub Action (`.github/workflows/start-skills-rebuild.yml`) lanza un build cada día a las 05:00 UTC (6:00 o 7:00 en Madrid) mediante un *Deploy Hook* de Vercel.
- **Manual:** en GitHub, pestaña *Actions* → *Start Skills rebuild* → *Run workflow*. Úsalo justo después de subir fotos si no quieres esperar a mañana.

---

## Para RRHH: después de cada sesión

Sigue estos pasos en orden tras cada sábado. No hace falta tocar código.

1. **Añade los participantes** en la base *Start Skills / Participantes* de Notion. Un registro por persona, con nombre, asociación y LinkedIn, y en la columna **Bloques** marca los bloques a los que vino. Quien no tenga ningún bloque marcado no sale en la web. La foto es opcional.
2. **Sube las fotos del bloque** al cuerpo de la página del bloque en Notion, como bloques de imagen (no como enlace ni como archivo adjunto).
3. **Completa el tema del bloque y los datos del formador** (cargo y LinkedIn) en la fila del bloque. En Notion la columna se llama *Ponente*; en la web aparece como «Formador».
4. **Lanza la actualización:** en GitHub, *Actions* → *Start Skills rebuild* → *Run workflow*. Si no tienes acceso o no hay prisa, espera a la actualización de la mañana siguiente.
5. **Comprueba la página del bloque** en `/eventos/start-skills/<slug>` cuando termine el build (1 a 3 minutos).

> **Solo fotos con permiso.** Las fotos se publican tal cual están, sin revisión. Sube únicamente las de personas que han aceptado aparecer en la web.
>
> **Para retirar una foto:** bórrala de la página de Notion. Desaparece de la web en el siguiente build (el manual o el de la mañana). Si además quieres que no quede en ningún sitio, avisa a IT para revisar el repositorio.

---

## Notion: estructura de las bases de datos

Hay dos bases de datos dentro de la página *Start Skills*: **Bloques** (una fila por sesión) y **Participantes** (una fila por persona). Están unidas por una relación: la columna *Bloques* de Participantes y la columna *Participantes* de Bloques son las dos caras de la misma relación. El script encuentra la base de Participantes siguiendo esa relación, así que solo hace falta el ID de Bloques.

El script casa las columnas por nombre de forma flexible: **no importan las mayúsculas, los espacios ni las tildes** (`Fecha`, `fecha` y `FECHA` son la misma columna). Lo que sí importa es el **tipo** de cada columna. Si una columna tiene el tipo equivocado, el dato no se publica aunque el nombre sea correcto.

### Base *Bloques*

| Columna | Tipo | Obligatoria | Qué es |
|---|---|---|---|
| Nombre | Título | Sí | Nombre del bloque, por ejemplo `Bloque 1: Conócete`. De aquí sale el título y el slug de la URL |
| Número | Número | No | Orden del bloque (1 a 5). Si falta, se deduce del nombre |
| Fecha | Fecha | Sí | Día de la sesión. Decide si el bloque está *Celebrado*, *Próximo* o *Por llegar*. Sin fecha, el bloque no se publica |
| Tema | Texto | No | Descripción del tema que se muestra en la página |
| Hora | Texto | No | Por ejemplo `10:00 - 14:00` |
| Lugar | Texto | No | Dónde se celebra |
| Ponente | Texto | No | Nombre del formador |
| Cargo | Texto | No | Cargo del formador |
| LinkedIn | URL | No | Perfil del formador |
| Foto ponente | Archivo | No | Foto del formador (imagen) |
| Participantes | Relación con *Participantes* | No | La crea Notion sola al relacionar las bases |
| Oculto | Casilla | No | Si está marcada, el bloque no se publica. También vale una casilla llamada *Borrador* |

### Base *Participantes*

| Columna | Tipo | Obligatoria | Qué es |
|---|---|---|---|
| Nombre | Título | Sí | Nombre completo |
| Bloques | Relación con *Bloques* | Sí | Bloques a los que asistió. Sin bloque, no se publica |
| Asociación | Selección | No | Start UC3M, Start Comillas, BIC, Business Club Zaragoza u otra. Una asociación nueva aparece sola como filtro y suma en el recuento |
| LinkedIn | URL | No | Perfil de la persona |
| Foto | Archivo | No | Foto de la persona. Si falta, se muestran sus iniciales |
| Oculto | Casilla | No | Si está marcada, la persona no se publica |

También funciona una base *Participantes* en línea dentro de cada página de bloque (sin relación): el script la lee si no encuentra la relación.

Las fotos del evento son las **imágenes** del cuerpo de la página de cada bloque (sueltas o en columnas). Los vídeos no se publican.

---

## Configuración inicial (IT, una sola vez)

Esto se hace una vez por entorno. Después, solo hay que tocarlo si cambian las bases de datos o el token.

### 1. Notion

1. Conecta la integración de Notion de Start a la página **Start Skills** (*··· → Conexiones → Añadir conexión*). Así llega a las dos bases. Si no lo haces, el build no ve nada.
2. Copia el **ID de la base Bloques**. Es la parte de 32 caracteres de la URL de la base, antes del `?v=`.
3. El token tiene que ser **el de la integración que conectaste en el paso 1**. Si es la de socios, basta con `NOTION_API_KEY`. Si Start Skills tiene su propia integración (otro token `ntn_…`), ponlo en `NOTION_STARTSKILLS_API_KEY`: tiene prioridad sobre `NOTION_API_KEY` solo para Start Skills.

### 2. Variables de entorno en Vercel

En Vercel → *Settings → Environment Variables*, crea las siguientes variables. Ponlas en **Production y en Preview**.

| Variable | Valor | Obligatoria |
|---|---|---|
| `NOTION_API_KEY` | Token de la integración de Notion de socios | Sí |
| `NOTION_STARTSKILLS_API_KEY` | Token de la integración propia de Start Skills. Si existe, se usa en lugar de `NOTION_API_KEY` para Start Skills | No |
| `NOTION_STARTSKILLS_DATABASE_ID` | ID de la base *Bloques* | Sí |
| `NOTION_STARTSKILLS_PARTICIPANTES_DATABASE_ID` | ID de la base *Participantes*. Solo si el script no la encuentra por la relación | No |

Después de añadirlas, **haz un redeploy** (Vercel → *Deployments* → *Redeploy*). Las variables nuevas no se aplican a builds ya hechos.

Ver también [08 · Despliegue](08-despliegue.md#variables-de-entorno).

### 3. Deploy Hook de Vercel

Es lo que permite que el GitHub Action dispare el build.

1. En Vercel → *Settings → Git → Deploy Hooks*.
2. Crea un hook con nombre `start-skills`, rama `main`.
3. Copia la URL que te da Vercel.
4. En GitHub → *Settings → Secrets and variables → Actions*, crea el secreto **`VERCEL_DEPLOY_HOOK_START_SKILLS`** con esa URL.

> La URL del hook es un secreto: cualquiera que la tenga puede disparar un build. No la pegues en un chat ni en un PR.

### 4. Probar en local

```bash
npm run sync:startskills   # lee Notion, baja fotos y genera src/data/startskills.generated.json
npm run dev                # http://localhost:4321/eventos/start-skills
```

Para probar en local, pon el token (`NOTION_STARTSKILLS_API_KEY` o `NOTION_API_KEY`) y `NOTION_STARTSKILLS_DATABASE_ID` en tu `.env` (la de Participantes es opcional) (nunca en git). Si `npm run sync:startskills` termina sin error y `src/data/startskills.generated.json` tiene tus bloques, la sincronización funciona.

---

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El build falla con «Notion respondió 401» o «404» | Token mal copiado, ID de base mal copiado, base no compartida con la integración o token de **otra** integración | El mensaje dice qué variable de token se usó. Revisa ese token y los IDs. Si las bases están conectadas a una integración distinta de la de socios, pon su token en `NOTION_STARTSKILLS_API_KEY`. Comprueba en Notion que las dos bases están conectadas a la integración (*··· → Conexiones*) |
| Falta una foto en la web | No es un bloque de imagen (es un enlace, un adjunto o un vídeo) o no es una foto en JPG, PNG, GIF, WebP o AVIF (los SVG y otros formatos se descartan por seguridad; el log lo avisa) | Súbela como imagen JPG o PNG en el cuerpo de la página y lanza la actualización manual |
| El build falla con «no se pudo descargar…» | Notion o la red fallaron, la imagen pesa más de 25 MB o es un enlace externo que no es https | Si es puntual, vuelve a lanzar el build. Si no, sube la foto a Notion como imagen (JPG o PNG, menos de 25 MB). La web sigue con las fotos anteriores mientras tanto |
| El build falla con «Notion no devolvió ningún bloque publicable» | Todos los bloques están ocultos, sin fecha o con el título mal | Revisa la base Bloques. Para no publicar una página vacía, el build no cambia nada |
| Un LinkedIn no sale | No es un enlace web (por ejemplo, texto suelto) | Pega la URL completa del perfil |
| Un cambio de Notion no aparece | Aún no se ha hecho el build | Lanza *Run workflow* en GitHub Actions. Si ya se hizo, mira en Vercel → *Deployments* que el último build sea posterior al cambio |
| Un participante no sale | Falta el nombre, no tiene ningún bloque marcado en *Bloques* o tiene *Oculto* marcado | Revisa esas tres columnas |
| La página muestra datos de ejemplo (de la semilla) | Faltan las variables de Notion en ese entorno | Revisa las variables en Vercel para Production y Preview, y haz un redeploy |
| Un bloque no aparece | *Oculto* marcado, sin *Fecha*, o el nombre no tiene formato `Bloque N: …` (el log del build dice cuál) | Corrige esa columna |

Si algo de esto te ha costado encontrar, añádelo a [11 · Problemas frecuentes](11-problemas.md).
