/** Forma que devuelve el backend en todos los listados paginados. */
export interface PagedResult<T> {
  items: T[];
  /** Total de resultados, no de la página. */
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  hayAnterior: boolean;
  haySiguiente: boolean;
}

export const TAMANO_PAGINA_DEFECTO = 20;
