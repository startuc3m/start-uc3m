import { z } from 'zod';

// Un esquema por formulario, reflejando los campos que ya envían las páginas (ver <Form name="…">).
const email = z.string().trim().min(1, 'Falta el email').email('Email no válido');
const required = (msg: string) => z.string().trim().min(1, msg);
const optional = z.string().trim().optional();

export const formSchemas = {
  unete: z.object({
    nombre: required('Falta el nombre'),
    apellidos: required('Faltan los apellidos'),
    email,
    linkedin: optional,
    cv: optional,
    estudios: optional,
    curso: optional,
    uc3m: optional,
    modalidad: optional,
    motivacion: optional,
    aprender: optional,
    intereses: optional,
    aportar: optional,
    experiencia: optional,
    video_link: optional,
    dept1: optional,
    dept2: optional,
    bienvenida: optional,
    canal: optional,
    newsletter: optional,
    rgpd: optional,
  }),
  evento: z.object({
    nombre: required('Falta el nombre'),
    email,
    grado: required('Falta el grado y curso'),
    equipo: optional,
    evento: required('Falta el evento'),
    slug: required('Falta el evento'),
    tipo: optional,
  }),
  patrocinio: z.object({
    empresa: required('Falta el nombre de la empresa'),
    nombre: required('Falta la persona de contacto'),
    email,
    interes: optional,
    mensaje: optional,
  }),
  contacto: z.object({
    nombre: required('Falta el nombre'),
    email,
    asunto: required('Falta el asunto'),
    mensaje: required('Falta el mensaje'),
  }),
  newsletter: z.object({ email }),
} as const;

export type FormName = keyof typeof formSchemas;
