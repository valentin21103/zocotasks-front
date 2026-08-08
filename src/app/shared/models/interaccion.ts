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
