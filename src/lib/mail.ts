// Simula el envío del email de confirmación tras un formulario: en local, sin SMTP, se registra
// en consola (opción explícita del issue #9 mientras no haya Mailpit/MailHog en docker compose).
export function confirmationEmail(form: string, data: Record<string, string>): { subject: string; body: string } | null {
  switch (form) {
    case 'unete':
      return {
        subject: 'Recibimos tu solicitud para entrar en Start_',
        body: `Hola ${data.nombre ?? ''},\n\nHemos recibido tu solicitud para unirte a Start UC3M (${data.dept1 || data.departamento || 'departamento por decidir'}). Te contactamos pronto por email o LinkedIn.\n\n— Start UC3M`,
      };
    case 'evento':
      return data.tipo === 'lista-espera'
        ? {
            subject: `Estás en la lista de espera · ${data.evento ?? 'evento'}`,
            body: `Hola ${data.nombre ?? ''},\n\nLas plazas de "${data.evento ?? ''}" están completas, pero te hemos apuntado a la lista de espera. Si se libera una plaza, te avisamos por orden de inscripción.\n\n— Start UC3M`,
          }
        : {
            subject: `Plaza reservada · ${data.evento ?? 'evento'}`,
            body: `Hola ${data.nombre ?? ''},\n\nTu plaza en "${data.evento ?? ''}" está reservada. Nos vemos allí.\n\n— Start UC3M`,
          };
    case 'patrocinio':
      return {
        subject: 'Recibimos tu solicitud de patrocinio',
        body: `Hola ${data.nombre ?? ''},\n\nHemos recibido el interés de ${data.empresa ?? 'tu empresa'} en patrocinar Start UC3M. Partnerships te contacta en breve con el media kit.\n\n— Start UC3M`,
      };
    case 'contacto':
      return {
        subject: 'Hemos recibido tu mensaje',
        body: `Hola ${data.nombre ?? ''},\n\nGracias por escribirnos. Te respondemos en cuanto podamos a este email.\n\n— Start UC3M`,
      };
    case 'newsletter':
      return {
        subject: 'Bienvenido a la newsletter de Start_',
        body: `Ya estás dentro. Te escribimos con los próximos eventos y novedades de Start UC3M.\n\n— Start UC3M`,
      };
    default:
      return null;
  }
}

export function logConfirmationEmail(to: string, form: string, data: Record<string, string>) {
  const mail = confirmationEmail(form, data);
  if (!mail) return;
  console.log(`\n— Email de confirmación (dev, no enviado) —\nPara: ${to}\nAsunto: ${mail.subject}\n\n${mail.body}\n—\n`);
}
