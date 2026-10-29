# Documentación de la web de Start UC3M

Todo lo que hace falta para entender, cambiar y mantener [startuc3m.es](https://www.startuc3m.es). Está escrita para el equipo de IT de ahora y para quien entre después: si algo no está aquí, es un fallo de la documentación, así que añádelo.

## Por dónde empezar

| Si eres… | Lee primero |
|---|---|
| **Nuevo en IT** y quieres arrancar la web | [01 · Empezar](01-empezar.md) → [10 · Cómo trabajamos](10-como-trabajamos.md) |
| De otro departamento y quieres **cambiar un texto, un evento o una foto** | [04 · Contenido](04-contenido.md) |
| Quien va a tocar **pagos de socios** | [socios.md](socios.md) (y no toques nada sin leerlo entero) |
| Quien va a **desplegar** o algo se ha roto en producción | [08 · Despliegue](08-despliegue.md) → [11 · Problemas frecuentes](11-problemas.md) |

## Índice

| # | Documento | De qué va |
|---|---|---|
| 01 | [Empezar](01-empezar.md) | Requisitos, instalar, arrancar en local, accesos que necesitas y tu primer cambio |
| 02 | [Arquitectura](02-arquitectura.md) | Cómo está montada la web: Astro estático + funciones de Vercel, y cómo encaja todo |
| 03 | [Mapa del repo](03-mapa-del-repo.md) | Qué hay en cada carpeta y en cada archivo importante |
| 04 | [Contenido](04-contenido.md) | Cómo añadir y cambiar eventos, posts, episodios, equipo, fotos y textos |
| 05 | [Diseño](05-diseno.md) | Brand kit, colores, tipografías, componentes, animaciones y accesibilidad |
| 06 | [Start Camp](06-start-camp.md) | Ficha, lanyard, banner, barra y cuenta atrás; qué hacer cuando acabe |
| 07 | [Formularios](07-formularios.md) | Contacto y patrocinio (Resend), y qué pasa con "Únete" |
| — | [Socios](socios.md) | Alta y pago de socios: Stripe, Neon, Resend y Notion |
| 08 | [Despliegue](08-despliegue.md) | Vercel, entornos, variables, dominios, analítica y cómo volver atrás |
| 09 | [Calidad](09-calidad.md) | Tests, CI, checklist de QA, Lighthouse y enlaces rotos |
| 10 | [Cómo trabajamos](10-como-trabajamos.md) | Ramas, commits, PRs, issues, etiquetas y reglas de Start |
| 11 | [Problemas frecuentes](11-problemas.md) | Errores que ya nos han pasado y cómo se arreglan |
| — | [Decisiones](decisiones.md) | Registro de decisiones técnicas y de producto, con fecha y porqué |
| — | [Investigación inicial](web/research.md) | Análisis de la web anterior antes de la migración (histórico) |

## Reglas que no se negocian

1. **No se publica nada que no esté confirmado**: cifras, eventos, premios, promesas a empresas. Si no está confirmado, va con `draft: true` o no va.
2. **Los datos del Notion de Start son de solo lectura**, y nunca se publican correos ni teléfonos de miembros.
3. **`main` es producción.** Todo entra por PR y lo revisa Alejandro Ausina (responsable de IT).
4. **Nada que toque `api/` o `db/` se mergea sin probarlo con Stripe en modo test.**

## Mantener esta documentación

- Si cambias cómo funciona algo, cambia su documento **en el mismo PR**.
- Si tomas una decisión que no es obvia mirando el código, apúntala en [decisiones.md](decisiones.md).
- Si arreglas un error que te ha costado encontrar, añádelo a [11 · Problemas frecuentes](11-problemas.md).
