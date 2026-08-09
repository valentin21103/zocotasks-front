export type TipoInteraccion =
  | 'Llamada'
  | 'WhatsApp'
  | 'Reunion'
  | 'Email'
  | 'NotaInterna';

export interface InteraccionDto {
  id: number;
  comercioId: number;
  tipo: TipoInteraccion;
  tipoNombre: string;
  fecha: string;
  detalle: string;
  fechaCreacion: string;
}

export interface CrearInteraccionDto {
  tipo: TipoInteraccion;
  /** Opcional: si no se manda, el backend usa el momento actual. No puede ser futura. */
  fecha?: string;
  detalle: string;
}

/**
 * Los cinco tipos, con su icono y su color.
 *
 * Esta lista sí vive en el frontend, a diferencia de los rubros: el tipo de
 * interacción es un enum del dominio —agregar uno requiere tocar el backend y
 * desplegar—, así que no puede aparecer uno nuevo en caliente. Y el icono y el
 * color son decisiones de interfaz que el backend no tiene por qué conocer.
 */
export const TIPOS_INTERACCION: readonly {
  codigo: TipoInteraccion;
  nombre: string;
  icono: string;
}[] = [
  { codigo: 'Llamada', nombre: 'Llamada', icono: 'llamada' },
  { codigo: 'WhatsApp', nombre: 'WhatsApp', icono: 'whatsapp' },
  { codigo: 'Reunion', nombre: 'Reunión', icono: 'reunion' },
  { codigo: 'Email', nombre: 'Email', icono: 'email' },
  { codigo: 'NotaInterna', nombre: 'Nota interna', icono: 'nota' }
];
