# Panel de socios: roles, jerarquía y permisos

Quién es quién en el panel y qué puede hacer cada uno. Si cambia una regla,
se actualiza este documento **en el mismo PR** que el código.

Estado de cada regla:

- **Hecho**: implementado en el PR #87 (`codex/panel-socios`).
- **Pendiente**: acordado, pero todavía sin implementar.
- **Por decidir**: falta que el equipo lo cierre.

## 1. Cómo se describe a una persona

Cada persona autorizada es una fila de `panel_members` y se describe con cuatro
datos independientes:

| Dato | Valores | Para qué sirve |
|---|---|---|
| `kind` (tipo) | `socio`, `starter` | Si forma parte del equipo de Start (starter) o es socio de la comunidad |
| `department` | Solo starters: Junta, IT, Marketing, Eventos… | Departamento del equipo. Los socios no tienen |
| `position` (cargo) | `miembro`, `responsable`, `junta` | Nivel dentro del equipo |
| `manage_users` | `true` / `false` | Permiso extra para gestionar usuarios. Solo IT o Junta |

Además, `active = false` le quita el acceso sin borrarla.

Reglas fijas de la base de datos (**hecho**):

- Un **socio** no tiene departamento, siempre es `miembro` y nunca tiene `manage_users`.
- Un **starter** tiene departamento obligatoriamente.
- `manage_users` solo puede activarse a alguien de **IT** o a la **Junta**.

> **Hecho:** hoy `department` es texto libre, así que «it» o «Informática»
> no cuentan como IT. Va a pasar a una lista cerrada (tabla `panel_departments`).
> La lista definitiva de departamentos está **por decidir** con Alejandro.

## 2. Jerarquía

De más a menos permisos:

1. **Junta** (`position = junta`): administra todo. Cuenta siempre como si tuviera `manage_users`.
2. **IT autorizado** (`department = IT` + `manage_users = true`): administra usuarios y permisos, salvo los cargos de Junta (ver regla 4.3).
3. **Responsable** de departamento (`position = responsable`): publica ofertas y suma puntos a su departamento. **No administra usuarios.**
4. **Starter** (`miembro` de un departamento): usa el panel y tiene perfil.
5. **Socio**: usa el panel y tiene perfil, con la etiqueta «Socio».

**Las empresas no tienen acceso ni perfil.** Sus ofertas las publica alguien de
Junta o un Responsable.

## 3. Qué puede hacer cada uno

| Acción | Socio | Starter | Responsable | IT autorizado | Junta | Estado |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Entrar (Google o email/contraseña) y editar su perfil | ✓ | ✓ | ✓ | ✓ | ✓ | Hecho |
| Subir foto y CV privados | ✓ | ✓ | ✓ | ✓ | ✓ | Hecho |
| Ver el directorio y el mapa de personalidades | ✓ | ✓ | ✓ | ✓ | ✓ | Pendiente (fase 3) |
| Marcar «Me interesa» en una oferta | ✓ | ✓ | ✓ | ✓ | ✓ | Pendiente (fase 2) |
| Fichar en un evento con QR | ✓ | ✓ | ✓ | ✓ | ✓ | Pendiente |
| Publicar ofertas y ver a sus interesados (perfil + CV) | | | ✓ | | ✓ | Pendiente (fase 2) |
| Sumar puntos manuales | | | Solo a su departamento | | A cualquiera | Pendiente |
| Invitar personas (una a una o en lote de hasta 100) | | | | ✓ | ✓ | Hecho |
| Cambiar tipo, departamento, cargo o acceso de otros | | | | ✓ (salvo Junta) | ✓ | Hecho (falta la restricción de Junta) |
| Dar o quitar permisos de edición de secciones de la web | | | | ✓ | ✓ | Hecho |
| Dar o quitar el cargo de Junta | | | | | ✓ | Hecho |
| Editar contenido de la web (Start Skills, eventos, blog) | Con el permiso de esa sección ||||| Pendiente |

Los permisos de edición de la web (`panel_permissions`) van **aparte del
cargo**: un miembro de Recursos Humanos puede tener `startskills` sin ser
Responsable. Por ahora ese contenido se edita desde Notion. El editor dentro del
panel llegará más adelante.

## 4. Reglas de seguridad

1. **Nadie cambia sus propios permisos.** Tiene que hacerlo otro administrador (`PANEL_SELF_CHANGE`). *Hecho.*
2. **Ser Responsable no da permisos de administración.** *Hecho.*
3. **Solo la Junta crea, quita o modifica cargos de Junta.** Evita que dos miembros de IT se asciendan el uno al otro. *Hecho.*
4. **Los permisos se comprueban siempre en el servidor**, en la API y otra vez en las funciones de Postgres. El navegador no tiene acceso directo a las tablas `panel_*` (RLS cerrada). *Hecho.*
5. **Una cuenta solo se vincula al email autorizado y verificado.** Si alguien entra con otro correo, no se enlaza automáticamente: hay que revisarlo a mano. *Hecho.*
6. **Pagar no da acceso al panel.** Hace falta que IT o Junta lo autoricen. Pagos y Neon Pass funcionan por separado. *Hecho (decisión del 18/11).*
7. **Desactivar a alguien** cancela sus invitaciones en cola y bloquea sus siguientes peticiones. *Hecho.*
8. **Todo cambio de usuarios, permisos e invitaciones** queda registrado en `panel_audit`. *Hecho.*
9. **La primera persona de Junta se crea a mano** en la base de datos. Nunca va en una migración. *Hecho.*

## 5. Quién ve qué

| Dato | Quién lo ve | Estado |
|---|---|---|
| Perfil completo (nombre, carrera, curso, foto, LinkedIn, personalidad) | Todos los miembros, pero **solo si el perfil está completado** | Pendiente (directorio) |
| CV | La propia persona y el autor de una oferta a la que se haya apuntado | Hecho (almacenamiento); pendiente (ofertas) |
| Aparecer en la portada de la web (p. ej. «Starter del mes») | Público, **solo con `public_consent`** | Pendiente |
| Lista de usuarios e invitaciones | IT autorizado y Junta | Hecho |

Los datos nuevos que se hagan visibles, como los sellos o la portada, hay que
añadirlos también a `/privacidad`.

## 6. Dónde está cada regla en el código

- `src/panel/model.js`: `canManage`, `canPublish` y `validateClassification`, que usan tanto el front como la API.
- `api/_lib/panel.mjs`: `requireManager` y la comprobación por acción.
- `supabase/migrations/`: los `check` de `panel_members` y las funciones `panel_create_batch`, `panel_change_member` y `panel_queue_invitation`, que vuelven a comprobar al actor.

Si una regla cambia, hay que tocar **las tres capas** y añadir un test en
`db/test-panel.mjs`.

## 7. Por decidir

- La lista definitiva de departamentos.
- Si los socios que pagan se importan al panel desde Neon con un botón, o se siguen invitando a mano.
- Cuántos puntos vale cada cosa (propuesta: asistencia = 10, más los puntos manuales del mes) y si el «Starter del mes» se elige solo por ranking o lo valida la Junta.
- La renovación anual: qué pasa con el acceso de un socio que no renueva.
