import { InteraccionDto } from './interaccion';

/**
 * Los enums viajan como texto en el JSON, no como número.
 * Ojo: el valor es `Documentacion` (sin tilde) y el nombre para mostrar es
 * `Documentación`. Para la interfaz usar siempre `estadoNombre`.
 */
export type EstadoComercio =
  | 'Nuevo'
  | 'Contactado'
  | 'Interesado'
  | 'Documentacion'
  | 'Aprobado'
  | 'Rechazado';

/** Fila del listado. No trae las notas: para eso hay que ir al detalle. */
export interface ComercioListItemDto {
  id: number;
  nombreComercial: string;
  cuit: string;
  nombreContacto: string;
  telefono: string | null;
  email: string | null;
  rubroId: number;
  rubro: string;
  estado: EstadoComercio;
  estadoNombre: string;
  fechaCreacion: string;
  cantidadInteracciones: number;
}

export interface ComercioDetalleDto {
  id: number;
  nombreComercial: string;
  cuit: string;
  nombreContacto: string;
  telefono: string | null;
  email: string | null;
  rubroId: number;
  rubro: string;
  estado: EstadoComercio;
  estadoNombre: string;
  /** Calculadas por el backend según el estado actual: con esto se arma el combo. */
  transicionesPosibles: EstadoComercio[];
  notas: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  /** Mismo valor que el header ETag. El servicio usa el header; esto es respaldo. */
  version: number;
  interacciones: InteraccionDto[];
}

/** El comercio se crea siempre en estado `Nuevo`: el estado no se manda. */
export interface CrearComercioDto {
  nombreComercial: string;
  cuit: string;
  nombreContacto: string;
  telefono: string | null;
  email: string | null;
  rubroId: number;
  notas: string | null;
}

/** El estado tampoco se manda en la edición: tiene su propio endpoint. */
export type ActualizarComercioDto = CrearComercioDto;

export interface CambiarEstadoDto {
  nuevoEstado: EstadoComercio;
}

/** Parámetros del listado. Todos opcionales; viajan como query params. */
export interface ComercioFiltro {
  busqueda?: string;
  estado?: EstadoComercio;
  rubroId?: number;
  ordenarPor?: OrdenComercio;
  descendente?: boolean;
  pagina?: number;
  tamanoPagina?: number;
}

export type OrdenComercio = 'nombre' | 'estado' | 'rubro' | 'contacto';
