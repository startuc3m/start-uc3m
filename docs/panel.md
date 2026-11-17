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
