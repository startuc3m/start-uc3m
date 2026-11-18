# Panel de socios de Start UC3M

PR de desarrollo del panel privado de socios y Starters de Start UC3M.

## Decisiones confirmadas (17/11/2026)

- Neon Pass y pagos permanecen independientes. No se migra Neon ni se cambia el webhook de Stripe.
- IT autorizado y Junta añaden usuarios, individualmente o pegando texto, revisan la lista y envían invitaciones personales.
- Junta e IT autorizado pueden conceder permisos y nombrar Responsables.
- Nombre, carrera, curso y foto son obligatorios. LinkedIn y CV son opcionales.
- Personalidad: uno de 16 códigos, o «No lo sé». Enlace al test oficial de 16Personalities y selección manual al volver. Sin IA.
- Solo perfiles completados aparecen en directorio y nodos.
- Junta y Responsables publican ofertas. «Me interesa» avisa por correo al autor; el autor consulta perfiles y CV de sus interesados.
- Se conservan Google y email/contraseña. Un email distinto del autorizado no se vincula automáticamente.

## Fases

1. Esquema aislado, acceso, perfiles e invitaciones con permisos y pruebas.
2. Prácticas, interesados y notificación al autor.
3. Directorio y mapa por personalidad.
4. Pruebas de integración, piloto y configuración de producción antes del lanzamiento.

No se habilita el panel en producción, se ejecutan migraciones remotas ni se envían correos reales desde esta tarea. La política de renovación/borrado y las líneas del mapa por departamento siguen pendientes: no se implementan automatismos de cuota ni afinidades.

## Primera entrega: acceso, perfil y administración

Implementado en `/panel/`: acceso con Google o contraseña, aceptación explícita del enlace de invitación, recuperación de contraseña, edición del perfil y subida privada de foto/CV. La configuración está desactivada por defecto. Todavía no hay directorio, mapa, ofertas ni notificaciones de «Me interesa»; corresponden a las fases siguientes.

Junta y miembros de IT con `manage_users=true` pueden pegar hasta 100 personas por lote, revisar errores/duplicados, guardar sin enviar o preparar invitaciones. También pueden modificar el tipo, departamento, cargo, autorización administrativa y acceso de otros usuarios. No pueden cambiar sus propios permisos: otro administrador debe hacerlo. Ser Responsable no concede administración.

Un lote admite `Nombre, correo`, `Nombre <correo>` o correos separados por líneas/comas/punto y coma. Normaliza mayúsculas y espacios, conserva puntos y alias `+`, y rechaza líneas ambiguas. Un usuario existente no se modifica, reactiva ni recibe una nueva invitación al importar. Su reenvío es explícito en su ficha. No se importan personas de Neon, pagos o formularios de la web.

## Arquitectura y jerarquía de confianza

- Astro publica la página y React gestiona la interfaz. El navegador solo contiene la URL y la clave pública de Supabase.
- `/api/panel?action=…` verifica el bearer token con Auth, exige un correo confirmado y vincula la cuenta exclusivamente al email autorizado. El cliente nunca decide su identidad ni permisos.
- Las tablas `panel_*` tienen RLS y no conceden acceso directo a `anon` o `authenticated`. El backend usa una clave privada y comprueba permisos en cada petición. Las funciones administrativas de Postgres vuelven a comprobar el actor y serializan las operaciones con un bloqueo transaccional.
- `panel_members` contiene autorizaciones y jerarquía; `panel_profiles` contiene el perfil; `panel_files` referencia archivos privados; `panel_batches` evita repetir importaciones; `panel_mail_jobs` persiste envíos; `panel_audit` registra creación, permisos e invitaciones.
- Las claves privadas solo usan variables `PANEL_*`, nunca `PUBLIC_*`. Un proyecto Supabase dedicado evita mezclar cuentas y políticas con otras aplicaciones.
- Las descargas tienen URL firmada de 60 segundos. Los archivos admitidos son JPEG/PNG/WebP para foto y PDF para CV, máximo 2 MB; se verifica firma de formato y tamaño. Esta comprobación no sustituye un antivirus. Los perfiles solo se guardan si ya existe foto. El backend ignora campos de privilegios enviados al actualizar un perfil.

## Configuración para un piloto

1. Crear un entorno de pruebas separado y aplicar la migración de `supabase/migrations` con la CLI. No aplicar contra producción sin revisar el SQL y el destino. El proyecto debe disponer de Auth y Storage de Supabase.
2. Configurar las variables de `.env.example`. Para mostrar la página, `PUBLIC_PANEL_ENABLED=true`, URL y clave pública; para la API, `PANEL_ENABLED=true`, URL y clave secreta del mismo proyecto. Las variables públicas se fijan en el build.
3. Configurar Google en Auth, las URLs de redirección `/panel/` del entorno y un SMTP para recuperación de contraseña. Activar confirmación de correo y una política de contraseñas coherente con el mínimo de 12 caracteres de la interfaz. No ofrecer registro público en la interfaz; disponer de una cuenta Auth no autoriza acceso al panel.
4. Crear manualmente la primera autorización de Junta en `panel_members`, con su correo verificado, `kind=starter`, `department=Junta`, `position=junta`. No incluir credenciales ni usuarios reales en migraciones. A partir de ese acceso, Junta puede autorizar IT y añadir personas desde la pantalla.
5. Probar primero con cuentas sintéticas. Mantener `PANEL_SEND_EMAILS=false` permite guardar autorizaciones sin correo. Para el piloto de envío configurar Resend, remitente verificado, `PANEL_SITE_URL` y `PANEL_MAIL_ENCRYPTION_KEY` (32 bytes aleatorios representados como 64 caracteres hexadecimales). Nunca compartir esta clave con el navegador.
6. Crear un lote pequeño, revisar destinatarios, preparar invitaciones y pulsar «Procesar cola». Cada destinatario recibe un correo individual. El enlace pide confirmación antes de verificarlo; el token viaja en el fragmento URL, se retira de la barra al cargar y no se devuelve al administrador.
7. Comprobar entrada por enlace, contraseña y Google con el mismo correo, perfil incompleto/completo y revocación de acceso. Un correo diferente requiere revisión manual, no se enlaza automáticamente.

## Operación de la cola

La cola persiste al cerrar la pestaña; el administrador puede retomarla. Cada petición procesa un correo. La UI procesa hasta 100 y permite parar tras el actual. No hay un cron de envío automático. «Enviada» significa que Resend aceptó el mensaje, no que haya llegado a la bandeja de entrada.

Los mensajes se cifran con AES-256-GCM antes de enviarse y usan una clave de idempotencia derivada del trabajo. Si el proveedor responde y se registra el éxito, se elimina el contenido cifrado. Un fallo previo al envío queda en `failed`; una respuesta perdida o un proceso interrumpido queda en `uncertain`. No se reenvía automáticamente para evitar duplicados. Un proceso `sending` abandonado pasa a incierto al reclamar trabajo tras cinco minutos.

Para resolver un estado incierto, IT debe consultar los registros del proveedor con la clave `panel-invitation/<job-id>` y fecha/destinatario, sin publicar el enlace. Si el proveedor confirma aceptación, registrar `sent` y su identificador y limpiar `encrypted_payload`; si confirma que no hubo envío, registrar `failed` y limpiar el contenido antes del reenvío explícito. Sin evidencia, mantener `uncertain`. Rotar la clave de cifrado requiere resolver primero los trabajos pendientes que la usen.

Desactivar un miembro cancela sus envíos en cola y bloquea las siguientes peticiones; una petición externa ya en curso puede haber enviado el mensaje. Sustituir archivos intenta borrar la versión anterior; fallos o cargas simultáneas pueden dejar objetos huérfanos que requieren limpieza operativa posterior. No se implementa todavía una política automática de retención. La lista administrativa muestra hasta 500 miembros y 1.000 trabajos recientes; ampliar con paginación antes de superar ese volumen.

## Verificación

`npm test` cubre importación, campos, permisos, autenticación, API, cifrado, estados de envío e interacción de la interfaz con dobles sintéticos. `npm run build` comprueba Astro. `npm run test:panel-db` prueba la migración y funciones sobre Postgres local desechable: solo admite host localhost y nombre de base terminado en `_test`, y revierte toda la transacción. La CI lo ejecuta después de las pruebas existentes de socios. El test simula las tablas base de Auth/Storage; antes de lanzar sigue siendo necesario probar Auth, Storage, Google y correo en un proyecto Supabase de staging.
