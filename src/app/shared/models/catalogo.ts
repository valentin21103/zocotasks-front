/**
 * Catálogos que sirven el backend. No se hardcodean en el front: si se agrega un
 * rubro en la base, tiene que aparecer solo.
 */

export interface EstadoCatalogoDto {
  id: number;
  codigo: string;
  nombre: string;
  /** Posición en el embudo. */
  orden: number;
  /** Aprobado y Rechazado son terminales. */
  esFinal: boolean;
}

export interface RubroDto {
  id: number;
  nombre: string;
}

export interface TipoInteraccionCatalogoDto {
  id: number;
  nombre: string;
}
