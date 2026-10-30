export type HackathonRole = 'Tecnología' | 'Diseño' | 'Negocio' | 'Otro';
export type GroupStatus = 'Busco grupo' | 'Abierto a sumar gente' | 'Tengo grupo';

export interface HackathonParticipant {
  user_id: string;
  nombre: string;
  rol: HackathonRole;
  estado_grupo: GroupStatus;
  intereses: string[];
  descripcion: string | null;
  linkedin_url: string | null;
  group_id: string | null;
  group_nombre?: string | null;
  foto_path?: string | null;
  foto_url?: string | null;
}
