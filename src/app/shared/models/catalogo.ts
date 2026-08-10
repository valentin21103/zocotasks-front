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

/** Lo que alimenta el combo: solo los rubros activos. */
export interface RubroDto {
  id: number;
  nombre: string;
}

/** Lo que ve la pantalla de administración: incluye los dados de baja. */
export interface RubroAbmDto {
  id: number;
  nombre: string;
  activo: boolean;
  /** Cuántos comercios lo usan. Decide si la baja es física o lógica. */
  cantidadComercios: number;
}

export interface GuardarRubroDto {
  nombre: string;
  activo: boolean;
}

export interface ResultadoBajaRubroDto {
  /** `true` se borró de la base; `false` quedó desactivado. */
  eliminado: boolean;
  comerciosAsociados: number;
}
